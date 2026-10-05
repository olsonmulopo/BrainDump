import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceTab, BoardData } from '../types';
import { Plus, X, Home, Layers, Edit2, Check } from 'lucide-react';

interface TabBarProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  boards: Record<string, BoardData>;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onRenameTab: (tabId: string, newTitle: string) => void;
  isDark?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  boards,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onRenameTab,
  isDark = false,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const startRenaming = (tabId: string, currentTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTabId(tabId);
    setEditTitle(currentTitle);
  };

  const saveRenaming = (tabId: string) => {
    if (editTitle.trim()) {
      onRenameTab(tabId, editTitle.trim());
    }
    setEditingTabId(null);
  };

  const handleKeyDown = (tabId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRenaming(tabId);
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
    }
  };

  // Scroll active tab into view when it changes
  useEffect(() => {
    const activeEl = scrollRef.current?.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeTabId]);

  return (
    <nav
      id="milanote-tab-bar"
      aria-label="Rooms and boards tabs"
      className={`h-9 w-full flex items-center justify-between px-2 select-none border-b shrink-0 z-40 text-xs transition-colors duration-150 ${
        isDark
          ? 'bg-[#121316] border-neutral-800/90 text-neutral-300'
          : 'bg-[#ebecef] border-neutral-200/90 text-neutral-700'
      }`}
    >
      {/* Tab Scroll Area */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 h-full flex-1 min-w-0 pr-2"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const board = boards[tab.boardId];
          const isHomeBoard = !board?.parentId || board?.id === 'board-home';
          const boardTitle = board?.title || 'Home';
          const tabTitle = tab.title || `Room ${index + 1}`;

          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => onSelectTab(tab.id)}
              onDoubleClick={(e) => startRenaming(tab.id, tabTitle, e)}
              className={`group/tab relative flex items-center gap-1.5 h-7 px-2.5 rounded-t-md text-xs font-medium cursor-pointer transition-all duration-150 max-w-[200px] shrink-0 border-t-2 ${
                isActive
                  ? isDark
                    ? 'bg-neutral-900 text-white border-indigo-500 shadow-xs'
                    : 'bg-white text-neutral-900 border-indigo-600 shadow-2xs'
                  : isDark
                  ? 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70'
              }`}
              title={`${tabTitle} • Currently viewing: ${boardTitle} (Double click to rename room)`}
            >
              {/* Room / Board Icon */}
              {isHomeBoard ? (
                <Home
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-indigo-500' : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                />
              ) : (
                <Layers
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-indigo-500' : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                />
              )}

              {/* Title / Renaming Input */}
              {editingTabId === tab.id ? (
                <div className="flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveRenaming(tab.id)}
                    onKeyDown={(e) => handleKeyDown(tab.id, e)}
                    autoFocus
                    className={`text-xs font-semibold px-1 py-0.2 rounded outline-hidden ring-1 ring-indigo-500 max-w-[100px] ${
                      isDark ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => saveRenaming(tab.id)}
                    className="p-0.5 text-emerald-500 hover:text-emerald-400"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 min-w-0 truncate">
                  <span className="truncate font-semibold tracking-tight">
                    {tabTitle}
                  </span>
                  <span
                    className={`text-[10.5px] truncate font-normal ${
                      isActive
                        ? isDark
                          ? 'text-neutral-400'
                          : 'text-neutral-500'
                        : 'text-neutral-400/80 dark:text-neutral-500'
                    }`}
                  >
                    : {boardTitle}
                  </span>
                </div>
              )}

              {/* Rename button on hover (desktop affordance) */}
              {isActive && editingTabId !== tab.id && (
                <button
                  type="button"
                  onClick={(e) => startRenaming(tab.id, tabTitle, e)}
                  className="opacity-0 group-hover/tab:opacity-100 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded transition-opacity"
                  title="Rename room"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
              )}

              {/* Close Tab Button */}
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className={`p-0.5 rounded-full transition-opacity ml-0.5 ${
                    isActive
                      ? 'opacity-70 hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-300'
                      : 'opacity-0 group-hover/tab:opacity-80 hover:bg-neutral-300/60 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                  title="Close room tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Plus / Add Tab Button */}
        <button
          id="btn-add-room-tab"
          type="button"
          onClick={onAddTab}
          className={`flex items-center gap-1 h-6 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            isDark
              ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/80'
          }`}
          title="Open new room tab (starts at Home page)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">New Tab</span>
        </button>
      </div>

      {/* Right side: Rooms info */}
      <div className="hidden md:flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0 pr-1 font-medium">
        <span>
          {tabs.length} {tabs.length === 1 ? 'room tab' : 'room tabs'}
        </span>
      </div>
    </nav>
  );
};
