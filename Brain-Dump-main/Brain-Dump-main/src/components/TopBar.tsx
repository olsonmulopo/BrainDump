import React, { useState, useEffect, useRef } from 'react';
import { BoardData, DriveSyncStatus, ItemColor, CanvasSettings, TimerCardItem } from '../types';
import { ColorPickerPopover } from './ColorPickerPopover';
import {
  ChevronRight,
  RotateCcw,
  RotateCw,
  Search,
  Cloud,
  RefreshCw,
  Download,
  Upload,
  FileCode,
  LogOut,
  Check,
  AlertCircle,
  Edit2,
  Clock,
  Settings2,
  Trash2,
  History,
  Plus,
  LayoutGrid,
  Calendar as CalendarIcon,
  Bell,
  Play,
  Pause,
} from 'lucide-react';

interface TopBarProps {
  currentBoard: BoardData;
  breadcrumbTrail: BoardData[];
  onNavigateBoard: (boardId: string) => void;
  onNavigateToItem?: (boardId: string, cardId: string) => void;
  onRenameBoard?: (boardId: string, newTitle: string) => void;
  onUpdateBoardColor?: (boardId: string, color: ItemColor, customColor?: string) => void;
  onOpenTimeManagement?: () => void;
  onOpenCalendar?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  urgentNotificationCount?: number;
  activeTimersList?: TimerCardItem[];
  todayEventCount?: number;
  onOpenTrash?: () => void;
  trashedCount?: number;
  activeTimerCount?: number;
  todayTrackedSeconds?: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  driveStatus: DriveSyncStatus;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  onManualSyncDrive: () => void;
  hasPreLoginBackup?: boolean;
  onRestoreBackup?: () => void;
  onOpenWindowsGuide: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onImportJSON: (file: File) => void;
  onResetWorkspace?: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  settings?: CanvasSettings;
  onOpenCanvasSettings?: () => void;
  onOpenAppLibrary?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentBoard,
  breadcrumbTrail,
  onNavigateBoard,
  onNavigateToItem,
  onRenameBoard,
  onUpdateBoardColor,
  onOpenTimeManagement,
  onOpenCalendar,
  onOpenNotifications,
  unreadNotificationCount = 0,
  urgentNotificationCount = 0,
  activeTimersList = [],
  todayEventCount = 0,
  onOpenTrash,
  trashedCount = 0,
  activeTimerCount = 0,
  todayTrackedSeconds = 0,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  driveStatus,
  onConnectDrive,
  onDisconnectDrive,
  onManualSyncDrive,
  hasPreLoginBackup = false,
  onRestoreBackup,
  onOpenWindowsGuide,
  onExportJSON,
  onExportMarkdown,
  onImportJSON,
  onResetWorkspace,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  searchQuery,
  onSearchChange,
  settings,
  onOpenCanvasSettings,
  onOpenAppLibrary,
}) => {
  const isDark = settings?.theme === 'dark';
  const [showDriveMenu, setShowDriveMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(currentBoard.title);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleInput(currentBoard.title);
  }, [currentBoard.title]);

  // Close board color/settings popover when switching boards
  useEffect(() => {
    setShowBoardSettings(false);
  }, [currentBoard.id]);

  // Click outside listener for Drive menu and Export menu (without capture so child buttons receive click)
  useEffect(() => {
    if (!showDriveMenu && !showExportMenu) return;
    const handleOutsideClick = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement;
      if (showDriveMenu && !target.closest('#btn-drive-menu') && !target.closest('.drive-menu-popup')) {
        setShowDriveMenu(false);
      }
      if (showExportMenu && !target.closest('#btn-export-menu') && !target.closest('.export-menu-popup')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [showDriveMenu, showExportMenu]);

  const handleSaveTitle = () => {
    if (titleInput.trim() && titleInput.trim() !== currentBoard.title) {
      onRenameBoard?.(currentBoard.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitleInput(currentBoard.title);
      setIsEditingTitle(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
  };

  const formatTrackedTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <header
      id="milanote-topbar"
      className={`h-14 w-full backdrop-blur-xs border-b px-4 flex items-center justify-between z-30 select-none transition-colors duration-150 ${
        isDark
          ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100'
          : 'bg-white/95 border-neutral-200/90 text-neutral-900'
      }`}
    >
      {/* Left: Breadcrumbs & Board History with Editable Title */}
      <div className="flex items-center gap-2 shrink-0 min-w-0 max-w-[45%]">
        <nav className="flex items-center gap-1.5 text-xs font-medium min-w-0 overflow-hidden">
          {breadcrumbTrail.map((board, index) => {
            const isLast = index === breadcrumbTrail.length - 1;

            if (isLast) {
              return (
                <React.Fragment key={board.id}>
                  {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                  <div
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-colors relative shrink-0 ${
                      isDark ? 'bg-neutral-800/80 hover:bg-neutral-800' : 'bg-neutral-100/80 hover:bg-neutral-100'
                    }`}
                  >
                    {/* Board Color Dot / Swatch - Clickable to open color palette */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBoardSettings((prev) => !prev);
                      }}
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15 shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                      style={{
                        backgroundColor:
                          board.customColor ||
                          (board.color === 'peach'
                            ? '#f97316'
                            : board.color === 'purple'
                            ? '#a855f7'
                            : board.color === 'mint'
                            ? '#10b981'
                            : '#6366f1'),
                      }}
                      title="Change board accent color"
                    />

                    {isEditingTitle ? (
                      <input
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className={`font-serif font-bold text-sm rounded px-1.5 py-0.5 outline-hidden shadow-xs min-w-[120px] max-w-[200px] ${
                          isDark
                            ? 'bg-neutral-900 border border-indigo-500 text-white'
                            : 'bg-white border border-indigo-500 text-neutral-900'
                        }`}
                      />
                    ) : (
                      <div className="flex items-center gap-1 group/title cursor-pointer min-w-0">
                        <span
                          onClick={() => setIsEditingTitle(true)}
                          className={`font-serif font-bold text-sm truncate max-w-[120px] sm:max-w-[160px] md:max-w-[200px] hover:underline ${
                            isDark ? 'text-neutral-100' : 'text-neutral-900'
                          }`}
                          title="Click to rename board"
                        >
                          {board.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingTitle(true)}
                          className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
                          title="Rename board"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Board Color Palette button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBoardSettings((prev) => !prev);
                        }}
                        className={`p-0.5 rounded transition-colors cursor-pointer ${
                          showBoardSettings
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                            : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                        }`}
                        title="Board color palette"
                      >
                        <Settings2 className="w-3 h-3" />
                      </button>

                      {showBoardSettings && (
                        <ColorPickerPopover
                          currentColor={currentBoard.color}
                          customColor={currentBoard.customColor}
                          onChangeColor={(color, customHex) => {
                            onUpdateBoardColor?.(currentBoard.id, color, customHex);
                          }}
                          onClose={() => setShowBoardSettings(false)}
                          isDark={isDark}
                        />
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={board.id}>
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                <button
                  type="button"
                  onClick={() => onNavigateBoard(board.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                    isDark
                      ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  <span className="truncate max-w-[100px] sm:max-w-[130px]">{board.title}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Undo / Redo */}
        <div className={`h-4 w-px mx-1 hidden sm:block shrink-0 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
        <div className="hidden sm:flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors ${
              isDark
                ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors ${
              isDark
                ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Search / Filter cards (Compact, Centered & Balanced) */}
      <div className="hidden md:flex items-center justify-center flex-1 min-w-0 px-2 max-w-xs">
        <div className="relative w-full max-w-xs transition-all duration-200">
          <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cards, tasks..."
            className={`w-full text-xs pl-8 pr-6 py-1.5 rounded-lg border transition-all outline-none ${
              isDark
                ? 'bg-neutral-800/80 hover:bg-neutral-800 focus:bg-neutral-800 text-neutral-100 placeholder-neutral-500 border-neutral-700/70 focus:border-indigo-500'
                : 'bg-neutral-100/80 hover:bg-neutral-100 focus:bg-white text-neutral-800 placeholder-neutral-400 border-transparent focus:border-neutral-300'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs px-1 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right: Workspace Actions (Streamlined & Clean - No Duplicates) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
        {/* Quick Add App Button */}
        {onOpenAppLibrary && (
          <button
            id="btn-topbar-add-app"
            type="button"
            onClick={onOpenAppLibrary}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer transition-colors"
            title="Browse and add Apps (Notes, Tasks, Boards, Tables, etc.)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xl:inline">Add App</span>
          </button>
        )}

        {/* Advanced Time Management Button */}
        <button
          id="btn-time-management"
          type="button"
          onClick={onOpenTimeManagement}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-2xs cursor-pointer ${
            activeTimerCount > 0
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 ring-2 ring-indigo-500/20'
              : isDark
              ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
          }`}
          title="Open Advanced Time Management System, Clocks & Work Logs"
        >
          <Clock
            className={`w-3.5 h-3.5 ${
              activeTimerCount > 0 ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : 'text-neutral-400'
            }`}
          />
          <span className="hidden xl:inline">Clock</span>
          {activeTimerCount > 0 ? (
            <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
              {activeTimerCount} active
            </span>
          ) : todayTrackedSeconds > 0 ? (
            <span className="text-[11px] font-mono text-neutral-400 hidden 2xl:inline">
              {formatTrackedTime(todayTrackedSeconds)}
            </span>
          ) : null}
        </button>

        {/* Calendar & Deadlines Planner Button */}
        {onOpenCalendar && (
          <button
            id="btn-calendar-planner"
            type="button"
            onClick={onOpenCalendar}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-2xs cursor-pointer ${
              todayEventCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                : isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
            }`}
            title="Open Unified Workspace Calendar & Deadline Planner"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden xl:inline">Calendar</span>
            {todayEventCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                {todayEventCount} today
              </span>
            )}
          </button>
        )}

        {/* Unified Notifications & "What's Happening" Center */}
        {onOpenNotifications && (
          <button
            id="btn-notification-center"
            type="button"
            onClick={onOpenNotifications}
            className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-2xs cursor-pointer ${
              urgentNotificationCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 ring-2 ring-rose-500/20'
                : unreadNotificationCount > 0
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                : isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
            }`}
            title="Open Notification Center — See what is currently important & happening"
          >
            <Bell
              className={`w-3.5 h-3.5 ${
                urgentNotificationCount > 0
                  ? 'text-rose-600 dark:text-rose-400 animate-bounce'
                  : unreadNotificationCount > 0
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-neutral-400'
              }`}
            />
            <span className="hidden xl:inline">Updates</span>
            {unreadNotificationCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  urgentNotificationCount > 0 ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {unreadNotificationCount}
              </span>
            )}
          </button>
        )}

        {/* Google Drive Status & Action */}
        <div className="relative flex items-center gap-1.5">
          {!driveStatus.isSignedIn && (
            <span
              className="hidden lg:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
              title="All changes are safely auto-saved locally in this browser. Sign in with Google to sync to Firebase Cloud & Google Drive across devices."
            >
              Offline (Local)
            </span>
          )}

          {driveStatus.isSignedIn ? (
            <button
              id="btn-drive-menu"
              type="button"
              onClick={() => setShowDriveMenu(!showDriveMenu)}
              className={`relative flex items-center justify-center p-2 text-xs font-medium rounded-lg border shadow-2xs transition-all cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                  : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-800'
              }`}
              title={
                driveStatus.isSyncing
                  ? 'Syncing with Firebase Cloud & Drive...'
                  : `Firebase Cloud & Drive Connected (${driveStatus.userName || driveStatus.userEmail})`
              }
            >
              {driveStatus.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              )}
              {/* Active sync status indicator dot */}
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-neutral-900" />
            </button>
          ) : (
            <button
              id="btn-drive-connect"
              type="button"
              onClick={onConnectDrive}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Sign in with Google to back up and auto-sync your workspace with Firebase Cloud and Google Drive"
            >
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign in to Cloud</span>
            </button>
          )}

          {/* Drive & Firebase Menu Popup */}
          {showDriveMenu && driveStatus.isSignedIn && (
            <div
              className={`drive-menu-popup absolute right-0 top-full mt-1.5 w-68 border rounded-xl shadow-xl p-3 z-40 text-xs ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
                  : 'bg-white border-neutral-200 text-neutral-800'
              }`}
            >
              <div className={`flex items-center gap-2 pb-2.5 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                {driveStatus.userPhoto ? (
                  <img
                    src={driveStatus.userPhoto}
                    alt="avatar"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center">
                    G
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold truncate ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                    {driveStatus.userName || 'Connected User'}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {driveStatus.userEmail}
                  </div>
                </div>
              </div>

              <div className="py-2 space-y-1">
                <div className={`flex items-center justify-between ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                  <span>Firebase Firestore:</span>
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Synced
                  </span>
                </div>
                <div className={`flex items-center justify-between ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                  <span>Google Drive Backup:</span>
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active
                  </span>
                </div>
                {driveStatus.lastSyncedAt && (
                  <div className="text-[11px] text-neutral-400">
                    Last synced: {new Date(driveStatus.lastSyncedAt).toLocaleTimeString()}
                  </div>
                )}
                {driveStatus.error && (
                  <div className="text-red-500 text-[11px] flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span className="truncate">{driveStatus.error}</span>
                  </div>
                )}
              </div>

              <div className={`pt-2 border-t flex flex-col gap-1.5 ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDriveMenu(false);
                    onManualSyncDrive();
                  }}
                  disabled={driveStatus.isSyncing}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${driveStatus.isSyncing ? 'animate-spin' : ''}`} />
                  Sync to Cloud Now
                </button>

                {hasPreLoginBackup && onRestoreBackup && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDriveMenu(false);
                      onRestoreBackup();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-lg font-medium transition-colors cursor-pointer text-[11px]"
                    title="Restore offline workspace snapshot taken before logging in"
                  >
                    <History className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Restore Pre-login Backup
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowDriveMenu(false);
                    onDisconnectDrive();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect Cloud Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export / Import Menu */}
        <div className="relative">
          <button
            id="btn-export-menu"
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {showExportMenu && (
            <div
              className={`export-menu-popup absolute right-0 top-full mt-1.5 w-56 border rounded-xl shadow-xl p-1.5 z-40 text-xs ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
                  : 'bg-white border-neutral-200 text-neutral-700'
              }`}
            >
              <button
                type="button"
                id="btn-export-json"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportJSON();
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div>Save Backup (JSON)</div>
                  <div className="text-[10px] text-neutral-400 font-normal">Offline portable copy</div>
                </div>
              </button>

              <button
                type="button"
                id="btn-export-markdown"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportMarkdown();
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Download className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div>Export as Markdown</div>
                  <div className="text-[10px] text-neutral-400 font-normal">Text notes & tasks</div>
                </div>
              </button>

              <button
                type="button"
                id="btn-restore-json"
                onClick={() => {
                  setShowExportMenu(false);
                  fileInputRef.current?.click();
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Upload className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div>Restore from JSON</div>
                  <div className="text-[10px] text-neutral-400 font-normal">Load saved file</div>
                </div>
              </button>

              {onResetWorkspace && (
                <>
                  <div className={`my-1 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`} />

                  <button
                    type="button"
                    id="btn-reset-workspace"
                    onClick={() => {
                      setShowExportMenu(false);
                      setShowResetConfirm(true);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                      isDark ? 'hover:bg-red-950/40 text-red-400' : 'hover:bg-red-50 text-red-600'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <div>Reset to Blank Canvas</div>
                      <div className="text-[10px] opacity-70 font-normal">Clear all cards & boards</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Hidden JSON file input for Restore from JSON */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      {/* Confirmation Modal for Reset Workspace */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Reset to Blank Canvas?</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  This will remove all items and boards, leaving a completely fresh, clean workspace.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-reset-workspace"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetWorkspace?.();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-xs cursor-pointer transition-colors"
              >
                Reset to Blank
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
