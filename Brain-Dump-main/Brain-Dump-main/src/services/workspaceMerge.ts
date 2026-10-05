import { WorkspaceData, CanvasItem, BoardData, CanvasSettings } from '../types';
import { INITIAL_WORKSPACE } from '../data/initialWorkspace';

const PRE_LOGIN_BACKUP_KEY = 'visual_canvas_pre_login_backup';
const LOCAL_BACKUP_HISTORY_KEY = 'visual_canvas_local_backup_history';

export interface MergeResult {
  merged: WorkspaceData;
  localItemsAdded: number;
  remoteItemsAdded: number;
  conflictsResolved: number;
  hasLocalOfflineWork: boolean;
}

/**
 * Saves a safety snapshot of the workspace before logging in or syncing remote data.
 * This guarantees the user NEVER loses any offline work.
 */
export function savePreLoginBackup(workspace: WorkspaceData): void {
  try {
    const itemCount = Object.keys(workspace.items || {}).length;
    // Don't overwrite backup if local workspace is completely empty
    if (itemCount === 0 && Object.keys(workspace.boards || {}).length <= 1) {
      return;
    }

    const backupPayload = {
      timestamp: Date.now(),
      itemCount,
      workspace: JSON.parse(JSON.stringify(workspace)),
    };

    localStorage.setItem(PRE_LOGIN_BACKUP_KEY, JSON.stringify(backupPayload));

    // Also keep in rolling history (last 5 backups)
    const historyRaw = localStorage.getItem(LOCAL_BACKUP_HISTORY_KEY);
    let history: any[] = [];
    if (historyRaw) {
      try {
        history = JSON.parse(historyRaw);
        if (!Array.isArray(history)) history = [];
      } catch {}
    }
    history.unshift(backupPayload);
    history = history.slice(0, 5);
    localStorage.setItem(LOCAL_BACKUP_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save pre-login backup:', err);
  }
}

/**
 * Retrieves the most recent pre-login safety backup.
 */
export function getPreLoginBackup(): { timestamp: number; itemCount: number; workspace: WorkspaceData } | null {
  try {
    const raw = localStorage.getItem(PRE_LOGIN_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.workspace) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to retrieve pre-login backup:', err);
  }
  return null;
}

/**
 * Checks whether the local workspace contains user-created work that might be lost
 * if replaced with remote cloud data.
 */
export function hasUserOfflineWork(local: WorkspaceData, remote?: WorkspaceData): boolean {
  if (!local) return false;
  const localItems = Object.keys(local.items || {});
  if (localItems.length === 0) {
    // Check if user added new boards
    const localBoards = Object.keys(local.boards || {});
    return localBoards.some((bId) => bId !== 'board-home');
  }

  if (!remote || !remote.items) {
    return localItems.length > 0;
  }

  // Check if any local item does not exist in remote, or has a newer timestamp
  for (const id of localItems) {
    const localItem = local.items[id];
    const remoteItem = remote.items[id];
    if (!remoteItem) return true; // Brand new item created offline!
    if ((localItem.updatedAt || 0) > (remoteItem.updatedAt || 0)) {
      return true; // Item modified offline!
    }
  }

  // Check boards
  for (const bId of Object.keys(local.boards || {})) {
    if (!remote.boards || !remote.boards[bId]) return true;
  }

  return false;
}

/**
 * Intelligently merges a local workspace with a remote workspace.
 * Non-destructive:
 * - All unique local items are retained.
 * - All unique remote items are retained.
 * - Items present in both keep the version with the newest updatedAt timestamp.
 * - All boards and tabs are merged cleanly.
 * - Time logs and trash are preserved.
 */
export function mergeWorkspaces(
  localData: WorkspaceData,
  remoteData: WorkspaceData
): MergeResult {
  const mergedBoards: Record<string, BoardData> = {};
  const mergedItems: Record<string, CanvasItem> = {};

  let localItemsAdded = 0;
  let remoteItemsAdded = 0;
  let conflictsResolved = 0;

  // 1. Merge Boards (union of local and remote)
  const allBoardIds = new Set([
    ...Object.keys(remoteData.boards || {}),
    ...Object.keys(localData.boards || {}),
  ]);

  allBoardIds.forEach((boardId) => {
    const localBoard = localData.boards?.[boardId];
    const remoteBoard = remoteData.boards?.[boardId];

    if (localBoard && !remoteBoard) {
      mergedBoards[boardId] = localBoard;
    } else if (!localBoard && remoteBoard) {
      mergedBoards[boardId] = remoteBoard;
    } else if (localBoard && remoteBoard) {
      // Both exist: if local has newer strokes or properties, merge them
      const localUpdated = (localBoard as any).updatedAt || 0;
      const remoteUpdated = (remoteBoard as any).updatedAt || 0;
      if (localUpdated >= remoteUpdated) {
        mergedBoards[boardId] = {
          ...remoteBoard,
          ...localBoard,
          strokes: (localBoard.strokes && localBoard.strokes.length > 0)
            ? localBoard.strokes
            : remoteBoard.strokes || [],
        };
      } else {
        mergedBoards[boardId] = {
          ...localBoard,
          ...remoteBoard,
          strokes: (remoteBoard.strokes && remoteBoard.strokes.length > 0)
            ? remoteBoard.strokes
            : localBoard.strokes || [],
        };
      }
    }
  });

  // Ensure root home board exists
  if (!mergedBoards['board-home']) {
    mergedBoards['board-home'] = {
      id: 'board-home',
      parentId: null,
      title: 'Home',
      icon: 'Home',
      viewState: { panX: 100, panY: 100, zoom: 1 },
      strokes: [],
    };
  }

  // 2. Merge Items (union of local and remote)
  const allItemIds = new Set([
    ...Object.keys(remoteData.items || {}),
    ...Object.keys(localData.items || {}),
  ]);

  allItemIds.forEach((itemId) => {
    const localItem = localData.items?.[itemId];
    const remoteItem = remoteData.items?.[itemId];

    if (localItem && !remoteItem) {
      // Created locally while offline!
      mergedItems[itemId] = localItem;
      localItemsAdded++;
    } else if (!localItem && remoteItem) {
      // Cloud item not yet in local session
      mergedItems[itemId] = remoteItem;
      remoteItemsAdded++;
    } else if (localItem && remoteItem) {
      // Exists in both: compare updatedAt
      const localTime = localItem.updatedAt || 0;
      const remoteTime = remoteItem.updatedAt || 0;

      // When local is at least as fresh as remote, local is primary
      const isLocalNewerOrEqual = localTime >= remoteTime;
      const primary = isLocalNewerOrEqual ? localItem : remoteItem;
      const secondary = isLocalNewerOrEqual ? remoteItem : localItem;

      // Smart merge: preserve isCollapsed state if explicitly set on either side,
      // favoring the newer side if it explicitly changed it.
      const primaryCollapsed = (primary as any).isCollapsed;
      const secondaryCollapsed = (secondary as any).isCollapsed;
      let resolvedCollapsed = primaryCollapsed;
      if (resolvedCollapsed === undefined && secondaryCollapsed !== undefined) {
        resolvedCollapsed = secondaryCollapsed;
      }

      mergedItems[itemId] = {
        ...secondary,
        ...primary,
        ...(resolvedCollapsed !== undefined ? { isCollapsed: resolvedCollapsed } : {}),
      } as CanvasItem;

      if (isLocalNewerOrEqual && localTime > remoteTime) {
        conflictsResolved++;
      } else if (primaryCollapsed !== secondaryCollapsed) {
        conflictsResolved++;
      }
    }
  });

  // 3. Merge Tabs
  const existingTabIds = new Set<string>();
  const mergedTabs: any[] = [];

  const addTabs = (tabList: any[]) => {
    if (!Array.isArray(tabList)) return;
    tabList.forEach((tab) => {
      if (tab && tab.id && !existingTabIds.has(tab.id)) {
        existingTabIds.add(tab.id);
        mergedTabs.push({
          ...tab,
          boardId: mergedBoards[tab.boardId] ? tab.boardId : 'board-home',
        });
      }
    });
  };

  // Add local tabs first (current user workspace tabs), then remote tabs
  addTabs(localData.tabs || []);
  addTabs(remoteData.tabs || []);

  if (mergedTabs.length === 0) {
    mergedTabs.push({
      id: 'tab-1',
      title: 'Room 1',
      boardId: 'board-home',
    });
  }

  // 4. Active Tab & Current Board
  let activeTabId = localData.activeTabId || remoteData.activeTabId || mergedTabs[0].id;
  if (!mergedTabs.some((t) => t.id === activeTabId)) {
    activeTabId = mergedTabs[0].id;
  }
  const activeTab = mergedTabs.find((t) => t.id === activeTabId);
  const currentBoardId = activeTab?.boardId || 'board-home';

  // 5. Merge Time Logs (deduplicate by log id)
  const timeLogMap = new Map<string, any>();
  [...(remoteData.timeLogs || []), ...(localData.timeLogs || [])].forEach((log) => {
    if (log && log.id) {
      timeLogMap.set(log.id, log);
    }
  });

  // 6. Merge Trash (union)
  const mergedTrash = {
    items: {
      ...(remoteData.trash?.items || {}),
      ...(localData.trash?.items || {}),
    },
    boards: {
      ...(remoteData.trash?.boards || {}),
      ...(localData.trash?.boards || {}),
    },
  };

  // 7. Settings (prefer local custom theme/settings if modified)
  const mergedSettings: CanvasSettings = {
    backgroundStyle: localData.settings?.backgroundStyle || remoteData.settings?.backgroundStyle || 'dots',
    theme: localData.settings?.theme || remoteData.settings?.theme || 'light',
    ...INITIAL_WORKSPACE.settings,
    ...(remoteData.settings || {}),
    ...(localData.settings || {}),
  };

  const hasLocalOfflineWork = localItemsAdded > 0 || conflictsResolved > 0;

  const merged: WorkspaceData = {
    version: 2,
    currentBoardId,
    boards: mergedBoards,
    items: mergedItems,
    settings: mergedSettings,
    tabs: mergedTabs,
    activeTabId,
    trash: mergedTrash,
    timeLogs: Array.from(timeLogMap.values()),
    updatedAt: Math.max(localData.updatedAt || 0, remoteData.updatedAt || 0, Date.now()),
  };

  return {
    merged,
    localItemsAdded,
    remoteItemsAdded,
    conflictsResolved,
    hasLocalOfflineWork,
  };
}
