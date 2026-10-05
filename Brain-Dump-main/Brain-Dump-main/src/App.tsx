import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  WorkspaceData,
  BoardData,
  CanvasItem,
  BoardItem,
  ItemType,
  ItemColor,
  DrawStroke,
  DriveSyncStatus,
  LineConnectorItem,
  TimerCardItem,
  TimeLogEntry,
  CanvasSettings,
  WorkspaceTab,
  FileCardItem,
  CalendarCardItem,
  FolderCardItem,
  TodoCardItem,
} from './types';
import { INITIAL_WORKSPACE } from './data/initialWorkspace';
import {
  loadLocalWorkspace,
  saveLocalWorkspace,
  resetLocalWorkspace,
  exportWorkspaceJSON,
  exportWorkspaceMarkdown,
} from './services/localStorage';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getCachedAccessToken,
  setCachedAccessToken,
} from './services/firebaseAuth';
import {
  auth,
  saveWorkspaceToFirestore,
  loadWorkspaceFromFirestore,
  saveUserProfile,
} from './services/firebase';
import {
  getOrCreateWorkspaceFolder,
  saveWorkspaceToDrive,
  loadWorkspaceFromDrive,
  listWorkspaceFiles,
  uploadFileAttachmentToDrive,
} from './services/googleDrive';
import { saveFileBlob, categorizeFile, isMarkdownFile } from './services/fileStorage';
import {
  mergeWorkspaces,
  savePreLoginBackup,
  getPreLoginBackup,
} from './services/workspaceMerge';
import { TabBar } from './components/TabBar';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { BottomBar } from './components/BottomBar';
import { Canvas } from './components/Canvas';
import { WindowsGuideModal } from './components/WindowsGuideModal';
import { TimeManagementModal } from './components/TimeManagementModal';
import { TrashModal } from './components/TrashModal';
import { CanvasSettingsModal } from './components/CanvasSettingsModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { MarkdownOpenerModal } from './components/MarkdownOpenerModal';
import { AppLibraryModal } from './components/AppLibraryModal';
import { CalendarModal } from './components/CalendarModal';
import { FolderModal } from './components/folders/FolderModal';
import { NotificationCenter } from './components/NotificationCenter';
import { computeWorkspaceNotifications } from './utils/notifications';
import { playChime } from './utils/sound';

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadLocalWorkspace());
  const workspaceRef = useRef<WorkspaceData>(workspace);
  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  const [history, setHistory] = useState<WorkspaceData[]>([]);
  const [redoStack, setRedoStack] = useState<WorkspaceData[]>([]);

  // Sync notification banner state (e.g. informing user when offline work is safely merged)
  const [syncNotification, setSyncNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'merged';
    itemsMergedCount?: number;
  } | null>(null);

  const [hasPreLoginBackup, setHasPreLoginBackup] = useState<boolean>(() => {
    return Boolean(getPreLoginBackup());
  });

  // Selected item
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Freehand draw mode
  const [isDrawMode, setIsDrawMode] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isWindowsGuideOpen, setIsWindowsGuideOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isCanvasSettingsOpen, setIsCanvasSettingsOpen] = useState(false);
  const [previewFileItem, setPreviewFileItem] = useState<FileCardItem | null>(null);
  const [markdownOpenerItem, setMarkdownOpenerItem] = useState<FileCardItem | null>(null);
  const [isAppLibraryOpen, setIsAppLibraryOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [activeFolderModalId, setActiveFolderModalId] = useState<string | null>(null);

  const activeFolderItem = useMemo(() => {
    if (!activeFolderModalId) return null;
    const item = workspace.items[activeFolderModalId];
    return item && item.type === 'folder' ? (item as FolderCardItem) : null;
  }, [workspace.items, activeFolderModalId]);

  // Google Drive Sync State
  const [driveStatus, setDriveStatus] = useState<DriveSyncStatus>({
    isSignedIn: false,
    userEmail: null,
    userName: null,
    userPhoto: null,
    isSyncing: false,
    lastSyncedAt: null,
    driveFileId: null,
    folderId: null,
    error: null,
    autoSync: true,
  });

  const syncTimerRef = useRef<any>(null);

  // Identify root home board
  const homeBoardId = useMemo(() => {
    if (workspace.boards['board-home']) return 'board-home';
    const root = Object.values(workspace.boards).find((b) => b.parentId === null);
    return root?.id || Object.keys(workspace.boards)[0] || 'board-home';
  }, [workspace.boards]);

  // Synchronized Room Tabs (each tab functions as a room viewing a specific board)
  const tabs: WorkspaceTab[] = useMemo(() => {
    if (workspace.tabs && workspace.tabs.length > 0) {
      return workspace.tabs.map((tab, idx) => ({
        id: tab.id,
        title: tab.title || `Room ${idx + 1}`,
        boardId: workspace.boards[tab.boardId] ? tab.boardId : homeBoardId,
      }));
    }
    return [
      {
        id: 'tab-1',
        title: 'Room 1',
        boardId: workspace.boards[workspace.currentBoardId] ? workspace.currentBoardId : homeBoardId,
      },
    ];
  }, [workspace.tabs, workspace.boards, workspace.currentBoardId, homeBoardId]);

  const activeTabId = useMemo(() => {
    if (workspace.activeTabId && tabs.some((t) => t.id === workspace.activeTabId)) {
      return workspace.activeTabId;
    }
    return tabs[0]?.id || 'tab-1';
  }, [workspace.activeTabId, tabs]);

  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  // Active board is driven by the currently active room tab
  const currentBoardId = useMemo(() => {
    if (activeTab?.boardId && workspace.boards[activeTab.boardId]) {
      return activeTab.boardId;
    }
    if (workspace.boards[workspace.currentBoardId]) {
      return workspace.currentBoardId;
    }
    return homeBoardId;
  }, [activeTab?.boardId, workspace.boards, workspace.currentBoardId, homeBoardId]);

  const currentBoard = workspace.boards[currentBoardId] || {
    id: currentBoardId,
    parentId: null,
    title: 'Home',
    viewState: { panX: 80, panY: 80, zoom: 1 },
  };

  // Compute breadcrumb trail from root to current board
  const breadcrumbTrail: BoardData[] = [];
  let curr: BoardData | undefined = currentBoard;
  const visited = new Set<string>();
  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    breadcrumbTrail.unshift(curr);
    if (curr.parentId && workspace.boards[curr.parentId]) {
      curr = workspace.boards[curr.parentId];
    } else {
      break;
    }
  }

  // Viewport
  const pan = useMemo(
    () => ({
      x: currentBoard.viewState?.panX ?? 80,
      y: currentBoard.viewState?.panY ?? 80,
    }),
    [currentBoard.viewState?.panX, currentBoard.viewState?.panY]
  );
  const zoom = currentBoard.viewState?.zoom || 1;

  // Record history for Undo/Redo
  const updateWorkspaceWithHistory = useCallback((updater: (prev: WorkspaceData) => WorkspaceData) => {
    setHistory((h) => [...h.slice(-25), workspaceRef.current]);
    setRedoStack([]);
    setWorkspace((prev) => {
      const updated = updater(prev);
      saveLocalWorkspace(updated);
      return updated;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;
      const previous = prevHistory[prevHistory.length - 1];
      setRedoStack((r) => [...r, workspaceRef.current]);
      setWorkspace(previous);
      saveLocalWorkspace(previous);
      return prevHistory.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const next = prevRedo[prevRedo.length - 1];
      setHistory((h) => [...h, workspaceRef.current]);
      setWorkspace(next);
      saveLocalWorkspace(next);
      return prevRedo.slice(0, -1);
    });
  }, []);

  // Viewport update (Pan & Zoom)
  const handleUpdateViewport = useCallback((newPan: { x: number; y: number }, newZoom: number) => {
    setWorkspace((prev) => {
      const activeBoardId = prev.currentBoardId;
      const board = prev.boards[activeBoardId];
      if (!board) return prev;
      const updated = {
        ...prev,
        boards: {
          ...prev.boards,
          [activeBoardId]: {
            ...board,
            viewState: {
              panX: Math.round(newPan.x),
              panY: Math.round(newPan.y),
              zoom: parseFloat(newZoom.toFixed(2)),
            },
          },
        },
      };
      saveLocalWorkspace(updated);
      return updated;
    });
  }, []);

  // Update canvas & workspace settings
  const handleUpdateSettings = useCallback((updates: Partial<CanvasSettings>) => {
    updateWorkspaceWithHistory((prev) => ({
      ...prev,
      settings: {
        ...(prev.settings || INITIAL_WORKSPACE.settings || {
          backgroundStyle: 'dots',
          theme: 'light',
          snapToGrid: false,
          gridSize: 24,
          dotSize: 0.9,
        }),
        ...updates,
      },
    }));
  }, [updateWorkspaceWithHistory]);

  // Sync dark theme to <html> element so all modals, popovers, and portals inherit theme
  useEffect(() => {
    const isDark = (workspace.settings?.theme || 'light') === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [workspace.settings?.theme]);

  // Listen to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(async (user) => {
      if (user) {
        setDriveStatus((prev) => ({
          ...prev,
          isSignedIn: true,
          userEmail: user.email,
          userName: user.displayName,
          userPhoto: user.photoURL,
          isSyncing: true,
          error: null,
        }));

        // Snapshot local offline data first
        const currentLocal = workspaceRef.current;
        savePreLoginBackup(currentLocal);
        setHasPreLoginBackup(true);

        let activeWorkspace = currentLocal;

        // 1. Sync with Firebase Firestore
        try {
          await saveUserProfile(user);
          const firestoreData = await loadWorkspaceFromFirestore(user.uid);
          if (firestoreData && firestoreData.boards) {
            const fsMerge = mergeWorkspaces(currentLocal, firestoreData);
            activeWorkspace = fsMerge.merged;
            setWorkspace(activeWorkspace);
            saveLocalWorkspace(activeWorkspace);
            await saveWorkspaceToFirestore(user.uid, activeWorkspace);
          } else {
            // First time in Firestore: save current workspace
            await saveWorkspaceToFirestore(user.uid, currentLocal);
          }
        } catch (fsErr) {
          console.warn('Initial Firestore sync check:', fsErr);
        }

        // 2. Sync with Google Drive if token is available
        const token = getCachedAccessToken();
        let fileId: string | null = null;
        let folderId: string | null = null;

        if (token) {
          try {
            folderId = await getOrCreateWorkspaceFolder(token);
            const files = await listWorkspaceFiles(token, folderId);

            if (files && files.length > 0) {
              fileId = files[0].id;
              const remoteData = await loadWorkspaceFromDrive(token, fileId);
              if (remoteData && remoteData.boards) {
                const driveMerge = mergeWorkspaces(activeWorkspace, remoteData);
                activeWorkspace = driveMerge.merged;
                setWorkspace(activeWorkspace);
                saveLocalWorkspace(activeWorkspace);

                // Save back to both Drive and Firestore
                await saveWorkspaceToDrive(token, folderId, activeWorkspace, fileId);
                await saveWorkspaceToFirestore(user.uid, activeWorkspace);

                if (driveMerge.hasLocalOfflineWork) {
                  setSyncNotification({
                    message: `Merged ${driveMerge.localItemsAdded} offline item(s) with your cloud data.`,
                    type: 'merged',
                    itemsMergedCount: driveMerge.localItemsAdded,
                  });
                }
              }
            } else {
              const saveResult = await saveWorkspaceToDrive(token, folderId, activeWorkspace);
              fileId = saveResult.fileId;
            }
          } catch (e: any) {
            console.error('Failed checking Drive workspace on start:', e);
          }
        }

        setDriveStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: Date.now(),
          driveFileId: fileId,
          folderId,
        }));
      } else {
        setDriveStatus((prev) => ({
          ...prev,
          isSignedIn: false,
          userEmail: null,
          userName: null,
          userPhoto: null,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Connect Cloud Storage (Firebase + Google Drive)
  const handleConnectDrive = async () => {
    try {
      setDriveStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

      // 1. Snapshot current offline workspace FIRST so user NEVER loses data
      const currentLocal = workspaceRef.current;
      savePreLoginBackup(currentLocal);
      setHasPreLoginBackup(true);

      const authResult = await googleSignIn();
      if (!authResult) throw new Error('Google sign-in was not completed');
      const { user, accessToken } = authResult;

      let mergedCurrent = currentLocal;

      // 2. Synchronize with Firebase Firestore
      try {
        await saveUserProfile(user);
        const firestoreData = await loadWorkspaceFromFirestore(user.uid);
        if (firestoreData && firestoreData.boards) {
          const fsMerge = mergeWorkspaces(currentLocal, firestoreData);
          mergedCurrent = fsMerge.merged;
          setWorkspace(mergedCurrent);
          saveLocalWorkspace(mergedCurrent);
          await saveWorkspaceToFirestore(user.uid, mergedCurrent);
        } else {
          await saveWorkspaceToFirestore(user.uid, currentLocal);
        }
      } catch (fsErr) {
        console.warn('Firebase Firestore sync on connect:', fsErr);
      }

      // 3. Find or create AppData folder on Google Drive
      const folderId = await getOrCreateWorkspaceFolder(accessToken);
      const files = await listWorkspaceFiles(accessToken, folderId);
      let fileId: string | null = null;

      if (files && files.length > 0) {
        fileId = files[0].id;
        const remoteData = await loadWorkspaceFromDrive(accessToken, fileId);
        if (remoteData && remoteData.boards) {
          const mergeResult = mergeWorkspaces(mergedCurrent, remoteData);
          mergedCurrent = mergeResult.merged;
          setWorkspace(mergedCurrent);
          saveLocalWorkspace(mergedCurrent);

          // Save unified workspace to Google Drive & Firestore
          await saveWorkspaceToDrive(accessToken, folderId, mergedCurrent, fileId);
          await saveWorkspaceToFirestore(user.uid, mergedCurrent);

          if (mergeResult.hasLocalOfflineWork || mergeResult.localItemsAdded > 0) {
            setSyncNotification({
              message: `Preserved and merged ${mergeResult.localItemsAdded} item(s) you created before logging in with your Cloud workspace!`,
              type: 'merged',
              itemsMergedCount: mergeResult.localItemsAdded,
            });
          } else {
            setSyncNotification({
              message: 'Connected to Firebase Cloud & Google Drive! Workspace synchronized.',
              type: 'success',
            });
          }
        }
      } else {
        const saveResult = await saveWorkspaceToDrive(accessToken, folderId, mergedCurrent);
        fileId = saveResult.fileId;
        setSyncNotification({
          message: 'Connected to Firebase Cloud & Google Drive! All local items backed up.',
          type: 'success',
        });
      }

      setDriveStatus({
        isSignedIn: true,
        userEmail: user.email,
        userName: user.displayName,
        userPhoto: user.photoURL,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        driveFileId: fileId,
        folderId,
        error: null,
        autoSync: true,
      });
    } catch (err: any) {
      console.error('Cloud connection failed:', err);
      setDriveStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Failed to connect Cloud storage',
      }));
    }
  };

  // Restore Pre-Login Offline Backup (if user ever wants to revert)
  const handleRestorePreLoginBackup = () => {
    const backup = getPreLoginBackup();
    if (backup && backup.workspace) {
      updateWorkspaceWithHistory(() => backup.workspace);
      setSyncNotification({
        message: `Restored pre-login snapshot with ${backup.itemCount} items from ${new Date(backup.timestamp).toLocaleTimeString()}.`,
        type: 'info',
      });
      setTimeout(() => setSyncNotification(null), 4000);
    }
  };

  // Disconnect Cloud Storage
  const handleDisconnectDrive = async () => {
    // 1. Immediately flush all latest workspace data to Firestore & Drive before signing out
    if (auth.currentUser) {
      try {
        await saveWorkspaceToFirestore(auth.currentUser.uid, workspaceRef.current);
      } catch (err) {
        console.warn('Could not save to Firestore before disconnect:', err);
      }
    }

    const token = getCachedAccessToken();
    if (token && driveStatus.folderId && driveStatus.isSignedIn) {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      try {
        setDriveStatus((prev) => ({ ...prev, isSyncing: true }));
        await saveWorkspaceToDrive(
          token,
          driveStatus.folderId,
          workspaceRef.current,
          driveStatus.driveFileId
        );
      } catch (err) {
        console.warn('Could not save workspace before disconnect:', err);
      }
    }

    // 2. Ensure local storage has the pristine current snapshot
    saveLocalWorkspace(workspaceRef.current);

    // 3. Complete sign-out
    await logoutGoogle();
    setDriveStatus({
      isSignedIn: false,
      userEmail: null,
      userName: null,
      userPhoto: null,
      isSyncing: false,
      lastSyncedAt: null,
      driveFileId: null,
      folderId: null,
      error: null,
      autoSync: false,
    });
  };

  // Manual Sync to Firebase Firestore & Google Drive
  const handleManualSyncDrive = async () => {
    if (!driveStatus.isSignedIn) {
      handleConnectDrive();
      return;
    }

    try {
      setDriveStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

      // 1. Sync to Firebase Firestore
      if (auth.currentUser) {
        await saveWorkspaceToFirestore(auth.currentUser.uid, workspace);
      }

      // 2. Sync to Google Drive if connected
      const token = getCachedAccessToken();
      let fileId = driveStatus.driveFileId;
      if (token && driveStatus.folderId) {
        const result = await saveWorkspaceToDrive(
          token,
          driveStatus.folderId,
          workspace,
          driveStatus.driveFileId
        );
        fileId = result.fileId;
      }

      setDriveStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        driveFileId: fileId,
      }));
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      setDriveStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Sync failed',
      }));
    }
  };

  // Auto-sync debounced to Firebase Firestore & Google Drive on workspace changes
  useEffect(() => {
    if (!driveStatus.isSignedIn || !driveStatus.autoSync) {
      return;
    }

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(async () => {
      try {
        setDriveStatus((prev) => ({ ...prev, isSyncing: true }));

        // 1. Save to Firebase Firestore
        if (auth.currentUser) {
          await saveWorkspaceToFirestore(auth.currentUser.uid, workspace);
        }

        // 2. Save to Google Drive if token available
        const token = getCachedAccessToken();
        let fileId = driveStatus.driveFileId;
        if (token && driveStatus.folderId) {
          const result = await saveWorkspaceToDrive(
            token,
            driveStatus.folderId,
            workspace,
            driveStatus.driveFileId
          );
          fileId = result.fileId;
        }

        setDriveStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: Date.now(),
          driveFileId: fileId,
        }));
      } catch (err) {
        console.error('Background auto-sync to Cloud failed:', err);
        setDriveStatus((prev) => ({ ...prev, isSyncing: false }));
      }
    }, 1200);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [workspace, driveStatus.isSignedIn, driveStatus.folderId, driveStatus.driveFileId, driveStatus.autoSync]);

  // Persist current snapshot to local storage on page unload or visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveLocalWorkspace(workspaceRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  // Tab Operations: Select / Switch Tab
  const handleSelectTab = useCallback(
    (tabId: string) => {
      const targetTab = tabs.find((t) => t.id === tabId);
      if (!targetTab) return;
      const targetBoardId = workspace.boards[targetTab.boardId] ? targetTab.boardId : homeBoardId;
      setWorkspace((prev) => {
        const next = {
          ...prev,
          activeTabId: tabId,
          currentBoardId: targetBoardId,
        };
        saveLocalWorkspace(next);
        return next;
      });
      setSelectedItemId(null);
    },
    [tabs, workspace.boards, homeBoardId]
  );

  // Tab Operations: Add New Tab (Starts at Home page)
  const handleAddTab = useCallback(() => {
    const currentTabs = workspace.tabs && workspace.tabs.length > 0 ? workspace.tabs : tabs;
    const newTabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newTabNumber = currentTabs.length + 1;
    const newTab: WorkspaceTab = {
      id: newTabId,
      title: `Room ${newTabNumber}`,
      boardId: homeBoardId, // Starts at home page as requested
    };

    setWorkspace((prev) => {
      const existing = prev.tabs && prev.tabs.length > 0 ? prev.tabs : tabs;
      const nextTabs = [...existing, newTab];
      const next = {
        ...prev,
        tabs: nextTabs,
        activeTabId: newTabId,
        currentBoardId: homeBoardId,
      };
      saveLocalWorkspace(next);
      return next;
    });
    setSelectedItemId(null);
  }, [workspace.tabs, tabs, homeBoardId]);

  // Tab Operations: Close Tab
  const handleCloseTab = useCallback(
    (tabIdToClose: string) => {
      const currentTabs = workspace.tabs && workspace.tabs.length > 0 ? workspace.tabs : tabs;
      if (currentTabs.length <= 1) return;

      const closeIdx = currentTabs.findIndex((t) => t.id === tabIdToClose);
      const nextTabs = currentTabs.filter((t) => t.id !== tabIdToClose);

      let nextActiveTabId = activeTabId;
      let nextBoardId = currentBoardId;

      if (activeTabId === tabIdToClose) {
        const fallbackTab = nextTabs[Math.min(closeIdx, nextTabs.length - 1)];
        nextActiveTabId = fallbackTab.id;
        nextBoardId = workspace.boards[fallbackTab.boardId] ? fallbackTab.boardId : homeBoardId;
      }

      setWorkspace((prev) => {
        const next = {
          ...prev,
          tabs: nextTabs,
          activeTabId: nextActiveTabId,
          currentBoardId: nextBoardId,
        };
        saveLocalWorkspace(next);
        return next;
      });
      setSelectedItemId(null);
    },
    [workspace.tabs, tabs, activeTabId, currentBoardId, workspace.boards, homeBoardId]
  );

  // Tab Operations: Rename Tab
  const handleRenameTab = useCallback(
    (tabId: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      setWorkspace((prev) => {
        const currentTabs = prev.tabs && prev.tabs.length > 0 ? prev.tabs : tabs;
        const nextTabs = currentTabs.map((t) => (t.id === tabId ? { ...t, title: newTitle.trim() } : t));
        const next = {
          ...prev,
          tabs: nextTabs,
        };
        saveLocalWorkspace(next);
        return next;
      });
    },
    [tabs, workspace.tabs]
  );

  // Navigate to another board (updates current tab to point to this board)
  const handleNavigateBoard = (boardId: string) => {
    if (workspace.boards[boardId]) {
      updateWorkspaceWithHistory((prev) => {
        const currentTabs = prev.tabs && prev.tabs.length > 0 ? prev.tabs : tabs;
        const nextTabs = currentTabs.map((t) => (t.id === activeTabId ? { ...t, boardId } : t));
        return {
          ...prev,
          currentBoardId: boardId,
          tabs: nextTabs,
          activeTabId,
        };
      });
      setSelectedItemId(null);
    }
  };

  // Rename Current Board
  const handleRenameBoard = (boardId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const trimmed = newTitle.trim();
    updateWorkspaceWithHistory((prev) => {
      const nextItems = { ...prev.items };
      // Keep any board card launcher targeting this board synchronized with the new name
      for (const k in nextItems) {
        if (
          nextItems[k].type === 'board' &&
          ((nextItems[k] as BoardItem).targetBoardId === boardId || nextItems[k].id === boardId)
        ) {
          nextItems[k] = {
            ...nextItems[k],
            title: trimmed,
            updatedAt: Date.now(),
          } as BoardItem;
        }
      }

      return {
        ...prev,
        boards: {
          ...prev.boards,
          [boardId]: {
            ...prev.boards[boardId],
            title: trimmed,
          },
        },
        items: nextItems,
      };
    });
  };

  // Update Board Color
  const handleUpdateBoardColor = (boardId: string, color: ItemColor, customColor?: string) => {
    updateWorkspaceWithHistory((prev) => ({
      ...prev,
      boards: {
        ...prev.boards,
        [boardId]: {
          ...prev.boards[boardId],
          color,
          customColor,
        },
      },
    }));
  };

  // Open / Drill down into a board by id or title
  const handleOpenBoard = (boardIdOrTitle: string, title?: string, targetBoardId?: string) => {
    // 0. If explicit targetBoardId provided and exists:
    if (targetBoardId && workspace.boards[targetBoardId]) {
      handleNavigateBoard(targetBoardId);
      return;
    }

    // 1. Direct ID match in boards
    if (workspace.boards[boardIdOrTitle]) {
      handleNavigateBoard(boardIdOrTitle);
      return;
    }

    // 2. Check if an item in items has this id and has targetBoardId
    const item = workspace.items[boardIdOrTitle];
    if (item && item.type === 'board') {
      const targetId = (item as BoardItem).targetBoardId;
      if (targetId && workspace.boards[targetId]) {
        handleNavigateBoard(targetId);
        return;
      }
    }

    // 3. Fallback: match by title if available
    const searchTitle = title || (item && 'title' in item ? (item as any).title : '') || boardIdOrTitle;
    const existing = Object.values(workspace.boards).find(
      (b) => b.title.toLowerCase() === searchTitle.toLowerCase()
    );

    if (existing) {
      handleNavigateBoard(existing.id);
      return;
    }

    // 4. Create a fresh sub-board with unique ID inside current board
    const newBoardId = targetBoardId || ('board-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
    const newBoard: BoardData = {
      id: newBoardId,
      parentId: currentBoardId,
      title: searchTitle || 'Untitled Board',
      icon: (item && item.type === 'board' ? (item as BoardItem).iconName : undefined) || 'Folder',
      viewState: { panX: 100, panY: 80, zoom: 1 },
      strokes: [],
    };

    updateWorkspaceWithHistory((prev) => {
      const nextItems = { ...prev.items };
      if (item && item.type === 'board') {
        nextItems[boardIdOrTitle] = {
          ...item,
          targetBoardId: newBoardId,
        } as BoardItem;
      }
      const currentTabs = prev.tabs && prev.tabs.length > 0 ? prev.tabs : tabs;
      const nextTabs = currentTabs.map((t) => (t.id === activeTabId ? { ...t, boardId: newBoardId } : t));
      return {
        ...prev,
        boards: {
          ...prev.boards,
          [newBoardId]: newBoard,
        },
        items: nextItems,
        currentBoardId: newBoardId,
        tabs: nextTabs,
        activeTabId,
      };
    });
    setSelectedItemId(null);
  };

  // Connect two items with an arrow line
  const handleConnectItems = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const lineId = 'line-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newLine: LineConnectorItem = {
      id: lineId,
      boardId: currentBoardId,
      type: 'line',
      x: 0,
      y: 0,
      fromId,
      toId,
      arrowEnd: true,
      style: 'solid',
      color: 'default',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    updateWorkspaceWithHistory((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [lineId]: newLine,
      },
    }));
    setSelectedItemId(lineId);
  };

  // Log time entry
  const handleLogTime = (entry: {
    cardId?: string;
    cardTitle: string;
    durationSeconds: number;
    category: 'Design' | 'Development' | 'Planning' | 'Review' | 'Storyboard' | 'Meeting' | 'Writing' | 'Other';
    notes?: string;
  }) => {
    const now = Date.now();
    const newEntry: TimeLogEntry = {
      id: 'log-' + now + '-' + Math.random().toString(36).substring(2, 6),
      boardId: currentBoardId,
      boardTitle: currentBoard.title,
      cardId: entry.cardId,
      cardTitle: entry.cardTitle,
      durationSeconds: entry.durationSeconds,
      startedAt: now - entry.durationSeconds * 1000,
      endedAt: now,
      category: entry.category,
      notes: entry.notes,
    };
    updateWorkspaceWithHistory((prev) => ({
      ...prev,
      timeLogs: [newEntry, ...(prev.timeLogs || [])],
    }));
  };

  // Delete time log entry
  const handleDeleteTimeLog = (id: string) => {
    updateWorkspaceWithHistory((prev) => ({
      ...prev,
      timeLogs: (prev.timeLogs || []).filter((log) => log.id !== id),
    }));
  };

  // Add Item to Board (or Column)
  // Handle uploading files of all types (docx, xlsx, zip, pdf, videos, audio, code, etc.)
  const handleUploadFiles = useCallback(
    async (files: File[], pos?: { x: number; y: number }, columnId?: string) => {
      if (!files || files.length === 0) return;

      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const baseDefaultX = Math.round((-pan.x + viewportW / 2 - 145) / zoom);
      const baseDefaultY = Math.round((-pan.y + viewportH / 2 - 100) / zoom);

      const newItemsMap: Record<string, CanvasItem> = {};
      const filesToSync: { cardId: string; file: File; fileName: string; mime: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cardId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`;
        const blobKey = `blob-${cardId}`;

        // Save binary blob into IndexedDB for unlimited local storage
        await saveFileBlob(blobKey, file).catch((err) => {
          console.error('Failed to store file blob in IndexedDB:', err);
        });

        // Small file fallback dataUrl (< 400KB)
        let dataUrl: string | undefined = undefined;
        if (file.size < 400 * 1024) {
          dataUrl = await new Promise<string | undefined>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(undefined);
            reader.readAsDataURL(file);
          });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const category = categorizeFile(file.name, file.type);
        const targetX = (pos?.x ?? baseDefaultX) + i * 28;
        const targetY = (pos?.y ?? baseDefaultY) + i * 28;

        const fileItem: FileCardItem = {
          id: cardId,
          boardId: currentBoardId,
          columnId,
          type: 'file',
          x: targetX,
          y: targetY,
          width: 210,
          fileName: file.name,
          fileSize: file.size,
          fileMime: file.type || 'application/octet-stream',
          fileExtension: ext,
          fileCategory: category,
          fileDataUrl: dataUrl,
          blobKey,
          driveSyncStatus: driveStatus.isSignedIn ? 'uploading' : 'local',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        newItemsMap[cardId] = fileItem;

        if (driveStatus.isSignedIn && driveStatus.folderId) {
          filesToSync.push({ cardId, file, fileName: file.name, mime: file.type });
        }
      }

      updateWorkspaceWithHistory((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          ...newItemsMap,
        },
      }));

      // Background cloud sync to Google Drive
      if (filesToSync.length > 0 && driveStatus.folderId) {
        const token = getCachedAccessToken();
        if (token) {
          for (const itemToSync of filesToSync) {
            uploadFileAttachmentToDrive(
              token,
              driveStatus.folderId,
              itemToSync.file,
              itemToSync.fileName,
              itemToSync.mime
            )
              .then((result) => {
                setWorkspace((prev) => {
                  const existing = prev.items[itemToSync.cardId];
                  if (!existing || existing.type !== 'file') return prev;
                  return {
                    ...prev,
                    items: {
                      ...prev.items,
                      [itemToSync.cardId]: {
                        ...existing,
                        driveFileId: result.fileId,
                        driveWebViewLink: result.webViewLink,
                        driveSyncStatus: 'synced',
                        updatedAt: Date.now(),
                      } as CanvasItem,
                    },
                  };
                });
              })
              .catch((err) => {
                console.error(`Failed to sync file ${itemToSync.fileName} to Google Drive:`, err);
                setWorkspace((prev) => {
                  const existing = prev.items[itemToSync.cardId];
                  if (!existing || existing.type !== 'file') return prev;
                  return {
                    ...prev,
                    items: {
                      ...prev.items,
                      [itemToSync.cardId]: {
                        ...existing,
                        driveSyncStatus: 'error',
                      } as CanvasItem,
                    },
                  };
                });
              });
          }
        }
      }
    },
    [currentBoardId, pan.x, pan.y, zoom, driveStatus.isSignedIn, driveStatus.folderId, updateWorkspaceWithHistory]
  );

  // Move a canvas file into a folder
  const handleMoveFileToFolder = useCallback(
    (fileItem: FileCardItem, folderId: string) => {
      const folder = workspace.items[folderId];
      if (!folder || folder.type !== 'folder') return;
      const folderItem = folder as FolderCardItem;

      const existingFiles = folderItem.files || [];
      if (existingFiles.some((f) => f.id === fileItem.id)) return;

      const updatedFiles = [...existingFiles, fileItem];

      updateWorkspaceWithHistory((prev) => {
        const nextItems = { ...prev.items };
        delete nextItems[fileItem.id];
        nextItems[folderId] = {
          ...folderItem,
          files: updatedFiles,
          updatedAt: Date.now(),
        };
        return {
          ...prev,
          items: nextItems,
        };
      });

      setSyncNotification({
        message: `Stored "${fileItem.fileName}" in folder "${folderItem.title || 'Folder'}"`,
        type: 'success',
      });
      setTimeout(() => setSyncNotification(null), 3500);
    },
    [workspace.items, updateWorkspaceWithHistory]
  );

  // Upload external files directly into a folder
  const handleUploadFilesToFolder = useCallback(
    async (folderId: string, files: File[]) => {
      const folder = workspace.items[folderId];
      if (!folder || folder.type !== 'folder' || !files.length) return;
      const folderItem = folder as FolderCardItem;

      const newFolderFiles: FileCardItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cardId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`;
        const blobKey = `blob-${cardId}`;

        await saveFileBlob(blobKey, file).catch((err) => {
          console.error('Failed to store file blob in IndexedDB:', err);
        });

        let dataUrl: string | undefined = undefined;
        if (file.size < 400 * 1024) {
          dataUrl = await new Promise<string | undefined>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(undefined);
            reader.readAsDataURL(file);
          });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const category = categorizeFile(file.name, file.type);

        const newFileItem: FileCardItem = {
          id: cardId,
          boardId: currentBoardId,
          type: 'file',
          x: 0,
          y: 0,
          width: 210,
          fileName: file.name,
          fileSize: file.size,
          fileMime: file.type || 'application/octet-stream',
          fileExtension: ext,
          fileCategory: category,
          fileDataUrl: dataUrl,
          blobKey,
          driveSyncStatus: driveStatus.isSignedIn ? 'uploading' : 'local',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        newFolderFiles.push(newFileItem);
      }

      const updatedFiles = [...(folderItem.files || []), ...newFolderFiles];

      updateWorkspaceWithHistory((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [folderId]: {
            ...folderItem,
            files: updatedFiles,
            updatedAt: Date.now(),
          },
        },
      }));

      setSyncNotification({
        message: `Added ${newFolderFiles.length} file(s) to "${folderItem.title || 'Folder'}"`,
        type: 'success',
      });
      setTimeout(() => setSyncNotification(null), 3500);
    },
    [workspace.items, currentBoardId, driveStatus.isSignedIn, updateWorkspaceWithHistory]
  );

  // Extract single file from folder onto canvas
  const handleExtractFileFromFolder = useCallback(
    (folderId: string, fileItem: FileCardItem) => {
      const folder = workspace.items[folderId];
      if (!folder || folder.type !== 'folder') return;
      const folderItem = folder as FolderCardItem;

      const updatedFiles = (folderItem.files || []).filter((f) => f.id !== fileItem.id);

      const newCanvasFile: FileCardItem = {
        ...fileItem,
        boardId: currentBoardId,
        x: (folderItem.x || 100) + (folderItem.width || 170) + 24,
        y: folderItem.y || 100,
        columnId: undefined,
      };

      updateWorkspaceWithHistory((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [folderId]: {
            ...folderItem,
            files: updatedFiles,
            updatedAt: Date.now(),
          },
          [newCanvasFile.id]: newCanvasFile,
        },
      }));

      setSyncNotification({
        message: `Extracted "${fileItem.fileName}" to canvas`,
        type: 'info',
      });
      setTimeout(() => setSyncNotification(null), 3000);
    },
    [workspace.items, currentBoardId, updateWorkspaceWithHistory]
  );

  // Extract all files from folder onto canvas
  const handleExtractAllFilesFromFolder = useCallback(
    (folderId: string) => {
      const folder = workspace.items[folderId];
      if (!folder || folder.type !== 'folder') return;
      const folderItem = folder as FolderCardItem;
      const filesToExtract = folderItem.files || [];
      if (filesToExtract.length === 0) return;

      const newItemsMap: Record<string, CanvasItem> = {};
      filesToExtract.forEach((fileItem, idx) => {
        newItemsMap[fileItem.id] = {
          ...fileItem,
          boardId: currentBoardId,
          x: (folderItem.x || 100) + (folderItem.width || 170) + 24 + (idx % 3) * 230,
          y: (folderItem.y || 100) + Math.floor(idx / 3) * 120,
          columnId: undefined,
        };
      });

      updateWorkspaceWithHistory((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [folderId]: {
            ...folderItem,
            files: [],
            updatedAt: Date.now(),
          },
          ...newItemsMap,
        },
      }));

      setSyncNotification({
        message: `Extracted all ${filesToExtract.length} files to canvas`,
        type: 'info',
      });
      setTimeout(() => setSyncNotification(null), 3000);
    },
    [workspace.items, currentBoardId, updateWorkspaceWithHistory]
  );

  // Delete file from folder
  const handleDeleteFileFromFolder = useCallback(
    (folderId: string, fileId: string) => {
      updateWorkspaceWithHistory((prev) => {
        const folder = prev.items[folderId];
        if (!folder || folder.type !== 'folder') return prev;
        const folderItem = folder as FolderCardItem;
        const updatedFiles = (folderItem.files || []).filter((f) => f.id !== fileId);
        return {
          ...prev,
          items: {
            ...prev.items,
            [folderId]: {
              ...folderItem,
              files: updatedFiles,
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    [updateWorkspaceWithHistory]
  );

  const handleAddItem = useCallback(
    (
      type: ItemType,
      pos?: { x: number; y: number },
      columnId?: string
    ) => {
    // Ignore deprecated line or comment additions
    if (type === 'line') {
      return;
    }

    if (type === 'file') {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.multiple = true;
      inp.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          handleUploadFiles(Array.from(files), pos, columnId);
        }
      };
      inp.click();
      return;
    }

    const id = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const defaultX = pos?.x ?? Math.round((-pan.x + 360) / zoom);
    const defaultY = pos?.y ?? Math.round((-pan.y + 180) / zoom);

    let newItem: CanvasItem;

    switch (type) {
      case 'markdown': {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const sampleMarkdown = `# Welcome to Markdown Document

This document editor makes **bold**, *italic*, and markdown syntax commands completely invisible while you write.

## Features
- **Visual Editing**: See your formatting live without distracting symbols
- **Task Lists**: Clickable interactive checkboxes for your to-dos
- **Tables & Blocks**: Organized tables, code blocks, and quotes
- **Export & Sync**: Saves as standard \`.md\` compatible with Obsidian, GitHub, and Google Drive

### Quick Checklist
- [ ] Try writing in the visual editor
- [ ] Check off this task item
- [ ] Press Ctrl+S to save changes

| Column 1 | Column 2 | Status |
| :--- | :--- | :--- |
| Project Plan | Drafted | Ready |
| Milestones | Scheduled | In Progress |

> "Clean documents help clear minds."
`;
        const blobKey = `blob-${fileId}`;
        const blob = new Blob([sampleMarkdown], { type: 'text/markdown;charset=utf-8' });
        saveFileBlob(blobKey, blob).catch((err) => console.error('Failed to save starter markdown blob:', err));

        const newFileItem: FileCardItem = {
          id: fileId,
          boardId: currentBoardId,
          columnId,
          type: 'file',
          x: defaultX,
          y: defaultY,
          width: 240,
          fileName: 'Document.md',
          fileSize: blob.size,
          fileMime: 'text/markdown',
          fileExtension: 'md',
          fileCategory: 'document',
          blobKey,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        newItem = newFileItem;

        // Auto-open into the upgraded Markdown Opener Modal
        setTimeout(() => {
          setMarkdownOpenerItem(newFileItem);
        }, 100);
        break;
      }

      case 'note':
        newItem = {
          id,
          boardId: currentBoardId,
          columnId,
          type: 'note',
          x: defaultX,
          y: defaultY,
          width: 280,
          title: 'New Note',
          content: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        break;

      case 'link':
        newItem = {
          id,
          boardId: currentBoardId,
          columnId,
          type: 'link',
          x: defaultX,
          y: defaultY,
          width: 280,
          url: '',
          title: '',
          description: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        break;

      case 'todo':
        newItem = {
          id,
          boardId: currentBoardId,
          columnId,
          type: 'todo',
          x: defaultX,
          y: defaultY,
          width: 280,
          title: 'To-do List',
          todos: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        break;

      case 'timer':
        newItem = {
          id,
          boardId: currentBoardId,
          columnId,
          type: 'timer',
          x: defaultX,
          y: defaultY,
          width: 190,
          title: 'Basic Time',
          mode: 'visual_disk',
          diskColor: 'coral',
          showDigitalNumbers: true,
          totalDurationSeconds: 10 * 60,
          remainingSeconds: 10 * 60,
          elapsedSeconds: 0,
          isRunning: false,
          simpleMode: true,
          clockPurpose: 'task',
          category: 'Storyboard',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as TimerCardItem;
        break;

      case 'board': {
        const targetBoardId = `board-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newBoardData: BoardData = {
          id: targetBoardId,
          parentId: currentBoardId,
          title: 'Untitled Board',
          icon: 'Folder',
          viewState: { panX: 100, panY: 80, zoom: 1 },
          strokes: [],
        };
        newItem = {
          id,
          boardId: currentBoardId,
          columnId,
          type: 'board',
          x: defaultX,
          y: defaultY,
          width: 120,
          height: 125,
          title: 'Untitled Board',
          targetBoardId,
          description: 'Double-click to open',
          iconName: 'Folder',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as BoardItem;

        updateWorkspaceWithHistory((prev) => ({
          ...prev,
          boards: {
            ...prev.boards,
            [targetBoardId]: newBoardData,
          },
          items: {
            ...prev.items,
            [id]: newItem,
          },
        }));

        setSelectedItemId(id);
        return;
      }

      case 'folder':
        newItem = {
          id,
          boardId: currentBoardId,
          columnId,
          type: 'folder',
          x: defaultX,
          y: defaultY,
          width: 170,
          height: 160,
          title: 'New Folder',
          files: [],
          color: 'amber',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as FolderCardItem;
        break;

      case 'column':
        newItem = {
          id,
          boardId: currentBoardId,
          type: 'column',
          x: defaultX,
          y: defaultY,
          width: 260,
          title: 'New Column',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        break;

      case 'table':
        newItem = {
          id,
          boardId: currentBoardId,
          type: 'table',
          x: defaultX,
          y: defaultY,
          width: 380,
          table: {
            title: 'Project table',
            columns: [
              { id: 'c1', name: 'Item', type: 'text', width: 140 },
              { id: 'c2', name: 'Qty', type: 'number', width: 60 },
              { id: 'c3', name: 'Done', type: 'checkbox', width: 50 },
            ],
            rows: [
              { id: 'r1', cells: { c1: 'Concept wireframe', c2: 1, c3: true } },
              { id: 'r2', cells: { c1: 'Final review', c2: 1, c3: false } },
            ],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        break;

      case 'image':
        newItem = {
          id,
          boardId: currentBoardId,
          columnId,
          type: 'image',
          x: defaultX,
          y: defaultY,
          width: 260,
          url: '',
          caption: 'Add a caption',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        break;

      case 'comment':
        newItem = {
          id,
          boardId: currentBoardId,
          type: 'comment',
          x: defaultX,
          y: defaultY,
          width: 300,
          author: driveStatus.userName || 'You',
          text: '',
          resolved: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        break;

      case 'title':
        newItem = {
          id,
          boardId: currentBoardId,
          columnId,
          type: 'title',
          x: defaultX,
          y: defaultY,
          width: undefined,
          text: 'Heading Title',
          level: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        break;

      case 'calendar': {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayIso = `${y}-${m}-${day}`;

        newItem = {
          id,
          boardId: currentBoardId,
          columnId,
          type: 'calendar',
          x: defaultX,
          y: defaultY,
          width: 440,
          title: 'Calendar',
          viewMode: 'month',
          currentDate: todayIso,
          events: [],
          showConnectedDeadlines: true,
          includeAllBoardTasks: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as CalendarCardItem;
        break;
      }

      default:
        return;
    }

    updateWorkspaceWithHistory((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [id]: newItem,
      },
    }));

    setSelectedItemId(id);
  }, [currentBoardId, pan.x, pan.y, zoom, updateWorkspaceWithHistory]);

  // Update item
  const handleUpdateItem = useCallback((id: string, updates: Partial<CanvasItem>) => {
    updateWorkspaceWithHistory((prev) => {
      const existing = prev.items[id];
      if (!existing) return prev;
      const updatedItem = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      } as CanvasItem;

      const nextBoards = { ...prev.boards };
      // If this is a board card item and its title, color, or icon was modified, keep the target board in sync
      if (existing.type === 'board') {
        const boardCard = existing as BoardItem;
        const targetId = boardCard.targetBoardId || boardCard.id;
        if (nextBoards[targetId]) {
          nextBoards[targetId] = {
            ...nextBoards[targetId],
            title: (updates as Partial<BoardItem>).title ?? nextBoards[targetId].title,
            color: updates.color ?? nextBoards[targetId].color,
            customColor: updates.customColor ?? nextBoards[targetId].customColor,
            icon: (updates as Partial<BoardItem>).iconName ?? nextBoards[targetId].icon,
          };
        }
      }

      return {
        ...prev,
        boards: nextBoards,
        items: {
          ...prev.items,
          [id]: updatedItem,
        },
      };
    });
  }, [updateWorkspaceWithHistory]);

  // Batch update multiple items in one transaction (prevents race conditions & multiple re-renders)
  const handleUpdateItems = useCallback((updates: Record<string, Partial<CanvasItem>>) => {
    updateWorkspaceWithHistory((prev) => {
      let hasChanges = false;
      const updatedItems = { ...prev.items };
      const nextBoards = { ...prev.boards };
      const now = Date.now();

      Object.entries(updates).forEach(([id, itemUpdates]) => {
        const existing = updatedItems[id];
        if (!existing) return;
        hasChanges = true;
        updatedItems[id] = {
          ...existing,
          ...itemUpdates,
          updatedAt: now,
        } as CanvasItem;

        if (existing.type === 'board') {
          const boardCard = existing as BoardItem;
          const targetId = boardCard.targetBoardId || boardCard.id;
          if (nextBoards[targetId]) {
            nextBoards[targetId] = {
              ...nextBoards[targetId],
              title: (itemUpdates as Partial<BoardItem>).title ?? nextBoards[targetId].title,
              color: itemUpdates.color ?? nextBoards[targetId].color,
              customColor: itemUpdates.customColor ?? nextBoards[targetId].customColor,
              icon: (itemUpdates as Partial<BoardItem>).iconName ?? nextBoards[targetId].icon,
            };
          }
        }
      });

      if (!hasChanges) return prev;

      return {
        ...prev,
        boards: nextBoards,
        items: updatedItems,
        updatedAt: now,
      };
    });
  }, [updateWorkspaceWithHistory]);

  // Delete item (moves to trash so it can be restored anytime)
  const handleDeleteItem = useCallback((id: string) => {
    updateWorkspaceWithHistory((prev) => {
      const itemToDelete = prev.items[id];
      if (!itemToDelete) return prev;

      const now = Date.now();
      const newTrash = {
        items: { ...(prev.trash?.items || {}) },
        boards: { ...(prev.trash?.boards || {}) },
      };
      const newItems = { ...prev.items };
      const newBoards = { ...prev.boards };
      const parentBoard = prev.boards[itemToDelete.boardId];

      if (itemToDelete.type === 'board') {
        const boardCard = itemToDelete as BoardItem;
        const targetId = boardCard.targetBoardId || boardCard.id;
        const boardData = prev.boards[targetId];

        // Find and gather all child items belonging to this deleted board
        const childItems: CanvasItem[] = [];
        for (const k in newItems) {
          if (newItems[k].boardId === targetId) {
            childItems.push(newItems[k]);
            delete newItems[k];
          }
        }

        if (boardData) {
          newTrash.boards[targetId] = {
            id: targetId,
            board: boardData,
            boardCardItem: boardCard,
            deletedAt: now,
            childItems,
            originalParentId: boardData.parentId,
          };
          delete newBoards[targetId];
        }

        // Also put the board card launcher in trash items
        newTrash.items[id] = {
          id,
          item: itemToDelete,
          deletedAt: now,
          originalBoardId: itemToDelete.boardId,
          originalBoardTitle: parentBoard?.title,
        };
        delete newItems[id];
      } else {
        // Regular canvas item (note, todo, timer, etc.)
        newTrash.items[id] = {
          id,
          item: itemToDelete,
          deletedAt: now,
          originalBoardId: itemToDelete.boardId,
          originalBoardTitle: parentBoard?.title,
        };
        delete newItems[id];
      }

      // Also clean up any line connectors referencing this item
      for (const k in newItems) {
        if (newItems[k].type === 'line') {
          const l = newItems[k] as LineConnectorItem;
          if (l.fromId === id || l.toId === id) {
            delete newItems[k];
          }
        }
      }

      // If user is currently viewing the board being deleted, navigate back
      let nextCurrentBoardId = prev.currentBoardId;
      if (itemToDelete.type === 'board') {
        const targetId = (itemToDelete as BoardItem).targetBoardId || itemToDelete.id;
        if (prev.currentBoardId === targetId) {
          nextCurrentBoardId = itemToDelete.boardId || 'board-home';
        }
      }

      return {
        ...prev,
        currentBoardId: nextCurrentBoardId,
        items: newItems,
        boards: newBoards,
        trash: newTrash,
      };
    });

    setSelectedItemId((cur) => (cur === id ? null : cur));
  }, [updateWorkspaceWithHistory]);

  // Restore trashed item
  const handleRestoreItem = (itemId: string) => {
    updateWorkspaceWithHistory((prev) => {
      const trashed = prev.trash?.items?.[itemId];
      if (!trashed) return prev;

      const newTrashItems = { ...(prev.trash?.items || {}) };
      delete newTrashItems[itemId];

      return {
        ...prev,
        items: {
          ...prev.items,
          [itemId]: trashed.item,
        },
        trash: {
          items: newTrashItems,
          boards: prev.trash?.boards || {},
        },
      };
    });
  };

  // Restore trashed board and all its nested cards
  const handleRestoreBoard = (boardId: string) => {
    updateWorkspaceWithHistory((prev) => {
      const trashed = prev.trash?.boards?.[boardId];
      if (!trashed) return prev;

      const newTrashBoards = { ...(prev.trash?.boards || {}) };
      delete newTrashBoards[boardId];

      const newTrashItems = { ...(prev.trash?.items || {}) };
      const newItems = { ...prev.items };

      // Restore child items
      trashed.childItems.forEach((child) => {
        newItems[child.id] = child;
      });

      // Restore board launcher card
      if (trashed.boardCardItem) {
        newItems[trashed.boardCardItem.id] = trashed.boardCardItem;
        delete newTrashItems[trashed.boardCardItem.id];
      }

      return {
        ...prev,
        boards: {
          ...prev.boards,
          [boardId]: trashed.board,
        },
        items: newItems,
        trash: {
          items: newTrashItems,
          boards: newTrashBoards,
        },
      };
    });
  };

  // Permanently delete single item from trash
  const handlePermanentDeleteItem = (itemId: string) => {
    updateWorkspaceWithHistory((prev) => {
      const newTrashItems = { ...(prev.trash?.items || {}) };
      delete newTrashItems[itemId];
      return {
        ...prev,
        trash: {
          items: newTrashItems,
          boards: prev.trash?.boards || {},
        },
      };
    });
  };

  // Permanently delete board from trash
  const handlePermanentDeleteBoard = (boardId: string) => {
    updateWorkspaceWithHistory((prev) => {
      const newTrashBoards = { ...(prev.trash?.boards || {}) };
      delete newTrashBoards[boardId];
      return {
        ...prev,
        trash: {
          items: prev.trash?.items || {},
          boards: newTrashBoards,
        },
      };
    });
  };

  // Empty all trash
  const handleEmptyTrash = () => {
    updateWorkspaceWithHistory((prev) => ({
      ...prev,
      trash: {
        items: {},
        boards: {},
      },
    }));
  };

  // Clear current board
  const handleClearBoard = () => {
    updateWorkspaceWithHistory((prev) => {
      const remainingItems = { ...prev.items };
      for (const k in remainingItems) {
        if (remainingItems[k].boardId === currentBoardId) {
          delete remainingItems[k];
        }
      }
      return {
        ...prev,
        boards: {
          ...prev.boards,
          [currentBoardId]: {
            ...prev.boards[currentBoardId],
            strokes: [],
          },
        },
        items: remainingItems,
      };
    });
    setSelectedItemId(null);
  };

  // Reset entire workspace to pristine blank slate
  const handleResetWorkspace = useCallback(() => {
    const clean = resetLocalWorkspace();
    setWorkspace(clean);
    setHistory([]);
    setRedoStack([]);
    setSelectedItemId(null);
    setSyncNotification({
      message: 'Workspace reset to blank canvas.',
      type: 'info',
    });
    setTimeout(() => setSyncNotification(null), 3500);
  }, []);

  // Add drawing stroke
  const handleAddStroke = useCallback((stroke: DrawStroke) => {
    updateWorkspaceWithHistory((prev) => {
      const activeBoardId = prev.currentBoardId;
      const board = prev.boards[activeBoardId];
      if (!board) return prev;
      return {
        ...prev,
        boards: {
          ...prev.boards,
          [activeBoardId]: {
            ...board,
            strokes: [...(board.strokes || []), stroke],
          },
        },
      };
    });
  }, [updateWorkspaceWithHistory]);

  // Undo last drawing stroke on current board
  const handleUndoStroke = useCallback(() => {
    updateWorkspaceWithHistory((prev) => {
      const activeBoardId = prev.currentBoardId;
      const board = prev.boards[activeBoardId];
      if (!board || !board.strokes || board.strokes.length === 0) return prev;
      return {
        ...prev,
        boards: {
          ...prev.boards,
          [activeBoardId]: {
            ...board,
            strokes: board.strokes.slice(0, -1),
          },
        },
      };
    });
  }, [updateWorkspaceWithHistory]);

  // Clear all drawing strokes on current board
  const handleClearStrokes = useCallback(() => {
    updateWorkspaceWithHistory((prev) => {
      const activeBoardId = prev.currentBoardId;
      const board = prev.boards[activeBoardId];
      if (!board) return prev;
      return {
        ...prev,
        boards: {
          ...prev.boards,
          [activeBoardId]: {
            ...board,
            strokes: [],
          },
        },
      };
    });
  }, [updateWorkspaceWithHistory]);

  // Update a drawing stroke
  const handleUpdateStroke = useCallback((strokeId: string, updates: Partial<DrawStroke>) => {
    setWorkspace((prev) => {
      const activeBoardId = prev.currentBoardId;
      const board = prev.boards[activeBoardId];
      if (!board || !board.strokes) return prev;
      return {
        ...prev,
        boards: {
          ...prev.boards,
          [activeBoardId]: {
            ...board,
            strokes: board.strokes.map((s) => (s.id === strokeId ? { ...s, ...updates } : s)),
          },
        },
      };
    });
  }, []);

  // Delete a specific stroke
  const handleDeleteStroke = useCallback((strokeId: string) => {
    updateWorkspaceWithHistory((prev) => {
      const activeBoardId = prev.currentBoardId;
      const board = prev.boards[activeBoardId];
      if (!board || !board.strokes) return prev;
      return {
        ...prev,
        boards: {
          ...prev.boards,
          [activeBoardId]: {
            ...board,
            strokes: board.strokes.filter((s) => s.id !== strokeId),
          },
        },
      };
    });
  }, [updateWorkspaceWithHistory]);

  // Duplicate an item
  const handleDuplicateItem = useCallback((item: CanvasItem) => {
    updateWorkspaceWithHistory((prev) => {
      const newId = `${item.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const duplicated: CanvasItem = {
        ...item,
        id: newId,
        x: item.x + 24,
        y: item.y + 24,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return {
        ...prev,
        items: {
          ...prev.items,
          [newId]: duplicated,
        },
      };
    });
  }, [updateWorkspaceWithHistory]);

  // Duplicate a stroke
  const handleDuplicateStroke = useCallback((strokeId: string) => {
    updateWorkspaceWithHistory((prev) => {
      const activeBoardId = prev.currentBoardId;
      const board = prev.boards[activeBoardId];
      if (!board || !board.strokes) return prev;
      const target = board.strokes.find((s) => s.id === strokeId);
      if (!target) return prev;
      const duplicated: DrawStroke = {
        ...target,
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        points: target.points.map((p) => ({ x: p.x + 25, y: p.y + 25 })),
      };
      return {
        ...prev,
        boards: {
          ...prev.boards,
          [activeBoardId]: {
            ...board,
            strokes: [...board.strokes, duplicated],
          },
        },
      };
    });
  }, [updateWorkspaceWithHistory]);

  // Fit view to all elements on current board (or reset view)
  const handleFitToContent = useCallback(() => {
    const activeWorkspace = workspaceRef.current;
    const activeBoardId = activeWorkspace.currentBoardId;
    const activeBoard = activeWorkspace.boards[activeBoardId];
    if (!activeBoard) return;
    const boardItems = Object.values(activeWorkspace.items).filter(
      (item) => item.boardId === activeBoardId && item.type !== 'line'
    );
    const strokes = activeBoard.strokes || [];

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let hasContent = false;

    boardItems.forEach((item) => {
      hasContent = true;
      const w = item.width || (item.type === 'column' ? 260 : item.type === 'board' ? 160 : item.type === 'calendar' ? 440 : 280);
      const h = item.height || (item.type === 'column' ? 300 : item.type === 'board' ? 140 : item.type === 'calendar' ? 360 : 160);
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + w);
      maxY = Math.max(maxY, item.y + h);
    });

    strokes.forEach((s) => {
      s.points.forEach((p) => {
        hasContent = true;
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });

    if (!hasContent) {
      handleUpdateViewport({ x: 80, y: 80 }, 1);
      return;
    }

    const contentW = Math.max(maxX - minX, 100);
    const contentH = Math.max(maxY - minY, 100);

    const windowW = window.innerWidth || 1200;
    const windowH = window.innerHeight || 800;

    const availableW = Math.max(windowW - 180, 200);
    const availableH = Math.max(windowH - 160, 200);

    const fitZoom = Math.min(
      Math.max(0.35, Math.min(availableW / contentW, availableH / contentH)),
      1.15
    );

    const contentCenterX = minX + contentW / 2;
    const contentCenterY = minY + contentH / 2;

    const targetPanX = Math.round(windowW / 2 - contentCenterX * fitZoom + 25);
    const targetPanY = Math.round(windowH / 2 - contentCenterY * fitZoom);

    // Smooth camera transition
    const curPan = {
      x: activeBoard.viewState?.panX ?? 80,
      y: activeBoard.viewState?.panY ?? 80,
    };
    const curZoom = activeBoard.viewState?.zoom || 1;
    const startPan = { ...curPan };
    const startZoom = curZoom;
    const duration = 280;
    const startTime = performance.now();

    const animationStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const curX = startPan.x + (targetPanX - startPan.x) * ease;
      const curY = startPan.y + (targetPanY - startPan.y) * ease;
      const curZ = startZoom + (fitZoom - startZoom) * ease;

      handleUpdateViewport({ x: Math.round(curX), y: Math.round(curY) }, parseFloat(curZ.toFixed(2)));

      if (progress < 1) {
        requestAnimationFrame(animationStep);
      }
    };
    requestAnimationFrame(animationStep);
  }, [handleUpdateViewport]);

  // Change selected card color
  const handleUpdateSelectedColor = (color: ItemColor, customHex?: string) => {
    if (selectedItemId && workspace.items[selectedItemId]) {
      const item = workspace.items[selectedItemId];
      if (item.type === 'line') {
        const hex = customHex || (color === 'default' ? '#64748b' : undefined);
        handleUpdateItem(selectedItemId, {
          color,
          customColor: customHex,
          colorHex: hex,
        } as any);
      } else {
        handleUpdateItem(selectedItemId, { color, customColor: customHex });
      }
    }
  };

  // Import JSON file
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.boards && parsed.items) {
          updateWorkspaceWithHistory(() => parsed);
          setSyncNotification({
            message: `Successfully loaded workspace from "${file.name}"!`,
            type: 'success',
          });
          setTimeout(() => setSyncNotification(null), 3500);
        } else {
          setSyncNotification({
            message: 'Invalid workspace file: missing boards or items.',
            type: 'info',
          });
          setTimeout(() => setSyncNotification(null), 4000);
        }
      } catch (err) {
        console.error('Could not parse JSON file:', err);
        setSyncNotification({
          message: 'Error reading JSON backup file.',
          type: 'info',
        });
        setTimeout(() => setSyncNotification(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  // Keyboard Shortcuts (Ctrl+Z, Delete, Alt+T, Alt+W)
  const shortcutsRef = useRef({
    handleUndo,
    handleRedo,
    handleDeleteItem,
    handleFitToContent,
    selectedItemId,
    handleAddTab,
    handleCloseTab,
    activeTabId,
    handleAddItem,
    openAppLibrary: () => {},
  });
  useEffect(() => {
    shortcutsRef.current = {
      handleUndo,
      handleRedo,
      handleDeleteItem,
      handleFitToContent,
      selectedItemId,
      handleAddTab,
      handleCloseTab,
      activeTabId,
      handleAddItem,
      openAppLibrary: () => setIsAppLibraryOpen(true),
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const {
        handleUndo: undo,
        handleRedo: redo,
        handleDeleteItem: deleteItem,
        handleFitToContent: fitContent,
        selectedItemId: curSelectedId,
        handleAddTab: addTab,
        handleCloseTab: closeTab,
        activeTabId: curActiveTabId,
        handleAddItem: addItem,
        openAppLibrary,
      } = shortcutsRef.current;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (curSelectedId) {
          e.preventDefault();
          deleteItem(curSelectedId);
        }
      } else if (e.key === 'Home' || ((e.ctrlKey || e.metaKey) && e.key === '1')) {
        e.preventDefault();
        fitContent();
      } else if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        addTab();
      } else if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        closeTab(curActiveTabId);
      } else if (e.key === 'Escape') {
        if (curSelectedId) {
          setSelectedItemId(null);
        }
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'a' || e.key === 'A' || e.key === '/')) {
        e.preventDefault();
        openAppLibrary();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        addItem('note');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedItem = selectedItemId ? workspace.items[selectedItemId] : undefined;

  const { notifications, stats, activeTimers } = useMemo(() => {
    return computeWorkspaceNotifications(workspace);
  }, [workspace]);

  const activeTimerCount = stats.activeTimersCount;

  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayTrackedSeconds = (workspace.timeLogs || [])
    .filter((log) => log.startedAt >= todayStart)
    .reduce((acc, log) => acc + log.durationSeconds, 0);

  const trashedCount =
    Object.keys(workspace.trash?.boards || {}).length +
    Object.keys(workspace.trash?.items || {}).length;

  const activeSettings = workspace.settings || INITIAL_WORKSPACE.settings || {
    backgroundStyle: 'dots',
    theme: 'light',
    snapToGrid: false,
    gridSize: 24,
  };

  // Navigate to specific item across boards and center on canvas
  const handleNavigateToItem = useCallback(
    (boardId: string, itemId: string) => {
      if (boardId !== currentBoardId) {
        handleNavigateBoard(boardId);
      }
      setSelectedItemId(itemId);
      const item = workspaceRef.current.items[itemId];
      if (item && workspaceRef.current.boards[boardId]) {
        const b = workspaceRef.current.boards[boardId];
        const zoomLevel = b.viewState?.zoom || 1;
        const targetPanX = window.innerWidth / 2 - (item.x + (item.width || 200) / 2) * zoomLevel;
        const targetPanY = window.innerHeight / 2 - (item.y + (item.height || 200) / 2) * zoomLevel;
        setWorkspace((prev) => ({
          ...prev,
          boards: {
            ...prev.boards,
            [boardId]: {
              ...prev.boards[boardId],
              viewState: {
                ...prev.boards[boardId].viewState,
                panX: targetPanX,
                panY: targetPanY,
              },
            },
          },
        }));
      }
    },
    [currentBoardId, handleNavigateBoard]
  );

  // Quick Add Focus / Pomodoro Timer preset
  const handleAddTimerPreset = useCallback(
    (preset: 'pomodoro_25' | 'deep_work_50' | 'short_break_5' | 'long_break_15' | 'stopwatch') => {
      const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const currBoard = workspaceRef.current.boards[currentBoardId];
      const zoomLevel = currBoard?.viewState?.zoom || 1;
      const defaultX = currBoard ? (-currBoard.viewState.panX + window.innerWidth / 2 - 130) / zoomLevel : 200;
      const defaultY = currBoard ? (-currBoard.viewState.panY + window.innerHeight / 2 - 120) / zoomLevel : 200;

      let title = 'Focus Sprint';
      let duration = 25 * 60;
      let mode: 'visual_disk' | 'digital' | 'stopwatch' = 'visual_disk';
      let diskColor: any = 'coral';

      if (preset === 'pomodoro_25') {
        title = '25m Pomodoro Sprint';
        duration = 25 * 60;
        diskColor = 'coral';
      } else if (preset === 'deep_work_50') {
        title = '50m Deep Work';
        duration = 50 * 60;
        diskColor = 'purple';
      } else if (preset === 'short_break_5') {
        title = '5m Short Break';
        duration = 5 * 60;
        diskColor = 'emerald';
      } else if (preset === 'long_break_15') {
        title = '15m Rest & Recharge';
        duration = 15 * 60;
        diskColor = 'cyan';
      } else if (preset === 'stopwatch') {
        title = 'Task Stopwatch';
        mode = 'stopwatch';
        duration = 0;
        diskColor = 'blue';
      }

      const newTimer: TimerCardItem = {
        id,
        boardId: currentBoardId,
        type: 'timer',
        x: defaultX,
        y: defaultY,
        width: 250,
        height: 240,
        title,
        mode,
        diskColor,
        showDigitalNumbers: true,
        totalDurationSeconds: duration,
        remainingSeconds: duration,
        elapsedSeconds: 0,
        isRunning: true,
        lastStartedAt: Date.now(),
        clockPurpose: 'task',
        category: 'Development',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      updateWorkspaceWithHistory((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [id]: newTimer,
        },
      }));

      setSelectedItemId(id);
      if (workspaceRef.current.settings?.soundEnabled !== false) {
        playChime('click');
      }
    },
    [currentBoardId, updateWorkspaceWithHistory]
  );

  // Complete a task directly from notifications
  const handleCompleteTask = useCallback(
    (cardId: string, todoId: string) => {
      updateWorkspaceWithHistory((prev) => {
        const card = prev.items[cardId];
        if (!card || card.type !== 'todo') return prev;
        const todoCard = card as TodoCardItem;
        const updatedTodos = (todoCard.todos || []).map((t) =>
          t.id === todoId ? { ...t, completed: true, completedAt: Date.now() } : t
        );
        return {
          ...prev,
          items: {
            ...prev.items,
            [cardId]: {
              ...todoCard,
              todos: updatedTodos,
              updatedAt: Date.now(),
            },
          },
        };
      });
      if (workspaceRef.current.settings?.soundEnabled !== false) {
        playChime('complete');
      }
    },
    [updateWorkspaceWithHistory]
  );

  // Complete a calendar event directly from notifications
  const handleCompleteEvent = useCallback(
    (cardId: string, eventId: string) => {
      updateWorkspaceWithHistory((prev) => {
        const card = prev.items[cardId];
        if (!card || card.type !== 'calendar') return prev;
        const calCard = card as CalendarCardItem;
        const updatedEvents = (calCard.events || []).map((e) =>
          e.id === eventId ? { ...e, completed: true } : e
        );
        return {
          ...prev,
          items: {
            ...prev.items,
            [cardId]: {
              ...calCard,
              events: updatedEvents,
              updatedAt: Date.now(),
            },
          },
        };
      });
      if (workspaceRef.current.settings?.soundEnabled !== false) {
        playChime('complete');
      }
    },
    [updateWorkspaceWithHistory]
  );

  // Snooze a task by +1 or +3 days
  const handleSnoozeTask = useCallback(
    (cardId: string, todoId: string, daysToAdd: number) => {
      updateWorkspaceWithHistory((prev) => {
        const card = prev.items[cardId];
        if (!card || card.type !== 'todo') return prev;
        const todoCard = card as TodoCardItem;
        const targetTodo = (todoCard.todos || []).find((t) => t.id === todoId);
        if (!targetTodo) return prev;

        const baseDate = targetTodo.dueDate ? new Date(targetTodo.dueDate + 'T00:00:00') : new Date();
        baseDate.setDate(baseDate.getDate() + daysToAdd);
        const y = baseDate.getFullYear();
        const m = String(baseDate.getMonth() + 1).padStart(2, '0');
        const d = String(baseDate.getDate()).padStart(2, '0');
        const newDueDate = `${y}-${m}-${d}`;

        const updatedTodos = (todoCard.todos || []).map((t) =>
          t.id === todoId ? { ...t, dueDate: newDueDate } : t
        );
        return {
          ...prev,
          items: {
            ...prev.items,
            [cardId]: {
              ...todoCard,
              todos: updatedTodos,
              updatedAt: Date.now(),
            },
          },
        };
      });
      if (workspaceRef.current.settings?.soundEnabled !== false) {
        playChime('click');
      }
    },
    [updateWorkspaceWithHistory]
  );

  // Dismiss a notification
  const handleDismissNotification = useCallback(
    (notifId: string) => {
      updateWorkspaceWithHistory((prev) => {
        const currentDismissed = prev.settings?.dismissedNotificationIds || [];
        if (currentDismissed.includes(notifId)) return prev;
        return {
          ...prev,
          settings: {
            ...(prev.settings || (INITIAL_WORKSPACE.settings as any)),
            dismissedNotificationIds: [...currentDismissed, notifId],
          },
        };
      });
    },
    [updateWorkspaceWithHistory]
  );

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    updateWorkspaceWithHistory((prev) => {
      const currentRead = new Set(prev.settings?.readNotificationIds || []);
      allIds.forEach((id) => currentRead.add(id));
      return {
        ...prev,
        settings: {
          ...(prev.settings || (INITIAL_WORKSPACE.settings as any)),
          readNotificationIds: Array.from(currentRead),
        },
      };
    });
  }, [notifications, updateWorkspaceWithHistory]);

  // Toggle chime sound
  const handleToggleSound = useCallback(() => {
    updateWorkspaceWithHistory((prev) => {
      const currentEnabled = prev.settings?.soundEnabled !== false;
      return {
        ...prev,
        settings: {
          ...(prev.settings || (INITIAL_WORKSPACE.settings as any)),
          soundEnabled: !currentEnabled,
        },
      };
    });
  }, [updateWorkspaceWithHistory]);

  // Open file in appropriate viewer (Markdown Opener for .md, inspector preview for others)
  const handleOpenFileItem = useCallback((item: FileCardItem) => {
    if (isMarkdownFile(item)) {
      setMarkdownOpenerItem(item);
    } else {
      setPreviewFileItem(item);
    }
  }, []);

  // Save updated Markdown content back to IndexedDB and Google Drive
  const handleSaveMarkdownContent = useCallback(
    async (updatedItem: FileCardItem, newText: string) => {
      handleUpdateItem(updatedItem.id, {
        fileSize: updatedItem.fileSize,
        updatedAt: updatedItem.updatedAt,
      });

      // Background cloud sync to Google Drive if signed in
      if (driveStatus.isSignedIn && driveStatus.folderId) {
        const token = getCachedAccessToken();
        if (token) {
          try {
            const blob = new Blob([newText], { type: 'text/markdown;charset=utf-8' });
            const result = await uploadFileAttachmentToDrive(
              token,
              driveStatus.folderId,
              blob as any,
              updatedItem.fileName,
              'text/markdown'
            );
            if (result) {
              handleUpdateItem(updatedItem.id, {
                driveFileId: result.fileId,
                driveWebViewLink: result.webViewLink,
                driveSyncStatus: 'synced',
                updatedAt: Date.now(),
              });
            }
          } catch (err) {
            console.error('Failed to sync updated markdown file to Google Drive:', err);
          }
        }
      }
    },
    [driveStatus.isSignedIn, driveStatus.folderId, handleUpdateItem]
  );

  return (
    <div
      id="milanote-workspace-root"
      className={`relative w-screen h-screen overflow-hidden flex flex-col font-sans transition-colors duration-200 ${
        activeSettings.theme === 'dark' ? 'dark bg-[#121316] text-[#e4e4e7]' : 'bg-[#f6f7f9] text-[#18181b]'
      }`}
    >
      {/* Room Tabs Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        boards={workspace.boards}
        onSelectTab={handleSelectTab}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        onRenameTab={handleRenameTab}
        isDark={activeSettings.theme === 'dark'}
      />

      {/* Top Header */}
      <TopBar
        currentBoard={currentBoard}
        breadcrumbTrail={breadcrumbTrail}
        onNavigateBoard={handleNavigateBoard}
        onNavigateToItem={handleNavigateToItem}
        onRenameBoard={handleRenameBoard}
        onUpdateBoardColor={handleUpdateBoardColor}
        activeTimerCount={activeTimerCount}
        activeTimersList={activeTimers}
        todayEventCount={stats.todayCount}
        unreadNotificationCount={stats.unreadCount}
        urgentNotificationCount={stats.urgentCount}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        todayTrackedSeconds={todayTrackedSeconds}
        onOpenTrash={() => setIsTrashOpen(true)}
        trashedCount={trashedCount}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        driveStatus={driveStatus}
        onConnectDrive={handleConnectDrive}
        onDisconnectDrive={handleDisconnectDrive}
        onManualSyncDrive={handleManualSyncDrive}
        hasPreLoginBackup={hasPreLoginBackup}
        onRestoreBackup={handleRestorePreLoginBackup}
        onOpenWindowsGuide={() => setIsWindowsGuideOpen(true)}
        onOpenTimeManagement={() => setIsTimeModalOpen(true)}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        onExportJSON={() => {
          exportWorkspaceJSON(workspace);
          setSyncNotification({
            message: 'Saved workspace backup to my-visual-boards.json',
            type: 'success',
          });
          setTimeout(() => setSyncNotification(null), 3500);
        }}
        onExportMarkdown={() => {
          exportWorkspaceMarkdown(workspace, currentBoardId);
          setSyncNotification({
            message: 'Exported board content to Markdown file',
            type: 'success',
          });
          setTimeout(() => setSyncNotification(null), 3500);
        }}
        onImportJSON={handleImportJSON}
        onResetWorkspace={handleResetWorkspace}
        zoom={zoom}
        onZoomIn={() => handleUpdateViewport(pan, Math.min(zoom * 1.15, 2.5))}
        onZoomOut={() => handleUpdateViewport(pan, Math.max(zoom * 0.85, 0.3))}
        onResetZoom={() => handleUpdateViewport(pan, 1)}
        onFitToContent={handleFitToContent}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        settings={activeSettings}
        onOpenCanvasSettings={() => setIsCanvasSettingsOpen(true)}
        onOpenAppLibrary={() => setIsAppLibraryOpen(true)}
      />

      {/* Non-destructive Sync Notification Banner */}
      {syncNotification && (
        <div
          className={`flex items-center justify-between px-4 py-2 text-xs font-medium border-b transition-all z-20 ${
            syncNotification.type === 'merged'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : syncNotification.type === 'info'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-800 dark:text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse" />
            <span>{syncNotification.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasPreLoginBackup && (
              <button
                type="button"
                onClick={handleRestorePreLoginBackup}
                className="underline hover:no-underline font-semibold cursor-pointer"
              >
                View / Restore Backup
              </button>
            )}
            <button
              type="button"
              onClick={() => setSyncNotification(null)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer transition-colors"
              title="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas, Left Palette & Bottom Dock */}
      <div className="relative flex-1 w-full overflow-hidden min-h-0">
        <Toolbar
          onAddItem={(type) => handleAddItem(type)}
          settings={activeSettings}
          onOpenAppLibrary={() => setIsAppLibraryOpen(true)}
        />

        <BottomBar
          onAddItem={(type) => handleAddItem(type)}
          onUploadFiles={(files) => handleUploadFiles(files)}
          isDrawMode={isDrawMode}
          onToggleDrawMode={() => setIsDrawMode(!isDrawMode)}
          onOpenTrash={() => setIsTrashOpen(true)}
          trashedCount={trashedCount}
          settings={activeSettings}
          onOpenSettings={() => setIsCanvasSettingsOpen(true)}
        />

        <Canvas
          currentBoard={currentBoard}
          items={workspace.items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onUpdateItem={handleUpdateItem}
          onUpdateItems={handleUpdateItems}
          onDeleteItem={handleDeleteItem}
          onDuplicateItem={handleDuplicateItem}
          onAddItem={handleAddItem}
          onUploadFiles={(files, pos, colId) => handleUploadFiles(files, pos, colId)}
          onOpenPreview={handleOpenFileItem}
          onOpenBoard={handleOpenBoard}
          isDrawMode={isDrawMode}
          onToggleDrawMode={() => setIsDrawMode(!isDrawMode)}
          onAddStroke={handleAddStroke}
          onUpdateStroke={handleUpdateStroke}
          onDeleteStroke={handleDeleteStroke}
          onDuplicateStroke={handleDuplicateStroke}
          onUndoStroke={handleUndoStroke}
          onClearStrokes={handleClearStrokes}
          pan={pan}
          zoom={zoom}
          onUpdateViewport={handleUpdateViewport}
          onFitToContent={handleFitToContent}
          searchQuery={searchQuery}
          onConnectItems={handleConnectItems}
          onLogTime={handleLogTime}
          onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          onOpenFolderModal={(folder) => setActiveFolderModalId(folder.id)}
          onMoveFileToFolder={handleMoveFileToFolder}
          onFilesDroppedOnFolder={handleUploadFilesToFolder}
          settings={activeSettings}
        />
      </div>

      {/* Trash Bin Modal */}
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        trash={workspace.trash}
        onRestoreItem={handleRestoreItem}
        onRestoreBoard={handleRestoreBoard}
        onPermanentDeleteItem={handlePermanentDeleteItem}
        onPermanentDeleteBoard={handlePermanentDeleteBoard}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* Advanced Time Management & Analytics Dashboard */}
      <TimeManagementModal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        workspace={workspace}
        onAddLog={(entry) => {
          const now = Date.now();
          const newEntry: TimeLogEntry = {
            ...entry,
            id: 'log-' + now + '-' + Math.random().toString(36).substring(2, 6),
          };
          updateWorkspaceWithHistory((prev) => ({
            ...prev,
            timeLogs: [newEntry, ...(prev.timeLogs || [])],
          }));
        }}
        onDeleteLog={handleDeleteTimeLog}
        onClearLogs={() => {
          updateWorkspaceWithHistory((prev) => ({
            ...prev,
            timeLogs: [],
          }));
        }}
        onNavigateBoard={handleNavigateBoard}
        onNavigateToItem={handleNavigateToItem}
        onAddTimerPreset={handleAddTimerPreset}
        onUpdateTimerItem={(itemId, updates) => handleUpdateItem(itemId, updates)}
      />

      {/* Windows 10 Pro Setup & Offline Persistence Guide Modal */}
      <WindowsGuideModal
        isOpen={isWindowsGuideOpen}
        onClose={() => setIsWindowsGuideOpen(false)}
      />

      {/* Canvas Settings & Theme Modal */}
      <CanvasSettingsModal
        isOpen={isCanvasSettingsOpen}
        onClose={() => setIsCanvasSettingsOpen(false)}
        settings={activeSettings}
        onUpdateSettings={handleUpdateSettings}
        onResetZoom={() => handleUpdateViewport(pan, 1)}
        onFitToContent={handleFitToContent}
        onClearStrokes={handleClearStrokes}
        hasStrokes={(currentBoard.strokes?.length || 0) > 0}
        onOpenWindowsGuide={() => {
          setIsCanvasSettingsOpen(false);
          setIsWindowsGuideOpen(true);
        }}
      />

      {/* Second Computer File Preview Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewFileItem)}
        onClose={() => setPreviewFileItem(null)}
        item={previewFileItem}
      />

      {/* Typedown-Inspired Markdown Opener & Editor Modal */}
      <MarkdownOpenerModal
        isOpen={Boolean(markdownOpenerItem)}
        onClose={() => setMarkdownOpenerItem(null)}
        item={markdownOpenerItem}
        onSaveContent={handleSaveMarkdownContent}
      />

      {/* Apps Library Modal */}
      <AppLibraryModal
        isOpen={isAppLibraryOpen}
        onClose={() => setIsAppLibraryOpen(false)}
        onSelectApp={(type) => handleAddItem(type)}
        onToggleDrawMode={() => setIsDrawMode(!isDrawMode)}
        isDark={activeSettings.theme === 'dark'}
      />

      {/* Unified Workspace Calendar & Deadline Planner Modal */}
      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        workspace={workspace}
        onAddCalendarCardToBoard={() => handleAddItem('calendar')}
        onNavigateBoard={handleNavigateBoard}
        onNavigateToItem={handleNavigateToItem}
        onUpdateWorkspace={updateWorkspaceWithHistory}
      />

      {/* Unified Notifications & "What's Happening" Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        workspace={workspace}
        notifications={notifications}
        unreadCount={stats.unreadCount}
        onNavigateToItem={handleNavigateToItem}
        onCompleteTask={handleCompleteTask}
        onCompleteEvent={handleCompleteEvent}
        onSnoozeTask={handleSnoozeTask}
        onUpdateTimer={(timerId, updates) => handleUpdateItem(timerId, updates)}
        onDismissNotification={handleDismissNotification}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onToggleSound={handleToggleSound}
        onOpenCalendar={() => {
          setIsNotificationCenterOpen(false);
          setIsCalendarModalOpen(true);
        }}
        onOpenTimeTracker={() => {
          setIsNotificationCenterOpen(false);
          setIsTimeModalOpen(true);
        }}
      />

      {/* Folder Tool - Organization Box Pop-up Modal */}
      <FolderModal
        folder={activeFolderItem}
        isOpen={Boolean(activeFolderModalId && activeFolderItem)}
        onClose={() => setActiveFolderModalId(null)}
        onUpdateFolder={handleUpdateItem}
        onExtractFile={handleExtractFileFromFolder}
        onExtractAllFiles={handleExtractAllFilesFromFolder}
        onDeleteFile={handleDeleteFileFromFolder}
        onUploadFilesToFolder={handleUploadFilesToFolder}
        onOpenMarkdownPreview={(fileItem) => {
          setActiveFolderModalId(null);
          setMarkdownOpenerItem(fileItem);
        }}
        isDark={activeSettings.theme === 'dark'}
      />
    </div>
  );
}
