import React, { useRef } from 'react';
import { ItemType, ItemColor, CanvasSettings } from '../types';
import {
  FileText,
  CheckSquare,
  FolderPlus,
  FolderArchive,
  Columns,
  Table as TableIcon,
  LayoutGrid,
  Calendar as CalendarIcon,
  FileCode,
} from 'lucide-react';

interface ToolbarProps {
  onAddItem: (type: ItemType) => void;
  onUploadFiles?: (files: File[]) => void;
  isDrawMode?: boolean;
  onToggleDrawMode?: () => void;
  selectedItemId?: string | null;
  selectedItemColor?: ItemColor;
  selectedCustomColor?: string;
  onUpdateSelectedColor?: (color: ItemColor, customHex?: string) => void;
  onDeleteSelected?: () => void;
  onClearBoard?: () => void;
  onOpenTrash?: () => void;
  trashedCount?: number;
  settings?: CanvasSettings;
  onOpenSettings?: () => void;
  onOpenAppLibrary?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddItem,
  settings,
  onOpenAppLibrary,
}) => {
  const isDark = settings?.theme === 'dark';

  const appTools = [
    { type: 'note' as ItemType, label: 'Note', appName: 'Note App', icon: FileText, title: 'Note App — Rich text & checklists' },
    { type: 'markdown' as ItemType, label: 'MD', appName: 'Markdown App', icon: FileCode, title: 'Markdown App (.md) — Visual editor with invisible commands' },
    { type: 'todo' as ItemType, label: 'Task', appName: 'Task App', icon: CheckSquare, title: 'Task App — To-do checklist' },
    { type: 'calendar' as ItemType, label: 'Calendar', appName: 'Calendar App', icon: CalendarIcon, title: 'Calendar App — Month, week & deadline planner' },
    { type: 'board' as ItemType, label: 'Board', appName: 'Board App', icon: FolderPlus, title: 'Board App — Nested sub-canvas' },
    { type: 'folder' as ItemType, label: 'Folder', appName: 'Folder App', icon: FolderArchive, title: 'Folder App — Box to drop & store files cleanly' },
    { type: 'column' as ItemType, label: 'Column', appName: 'Column App', icon: Columns, title: 'Column App — Vertical container' },
    { type: 'table' as ItemType, label: 'Table', appName: 'Table App', icon: TableIcon, title: 'Table App — Data spreadsheet' },
  ];

  const handleToolClick = (type: ItemType) => {
    onAddItem(type);
  };

  return (
    <aside
      id="milanote-toolbar"
      className={`absolute left-0 top-0 bottom-0 z-20 flex flex-col justify-between w-14 border-r border-l-0 border-t-0 border-b-0 shadow-2xs py-2 px-1 select-none overflow-x-hidden overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-colors duration-150 ${
        isDark
          ? 'bg-neutral-900 border-neutral-800 text-neutral-200'
          : 'bg-white border-neutral-200/90 text-neutral-700'
      }`}
    >
      {/* Top Section: Apps Library Launcher & Apps List */}
      <div className="flex flex-col items-center gap-1">
        {/* Apps Library Master Button */}
        {onOpenAppLibrary && (
          <button
            id="btn-open-app-library"
            type="button"
            onClick={onOpenAppLibrary}
            className="group relative w-10 h-10 flex flex-col items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-xs mb-1"
            title="Apps Library — Explore and add App blocks"
          >
            <LayoutGrid className="w-4 h-4 stroke-[2]" />
            <span className="text-[8px] mt-0.5 tracking-tight font-bold uppercase leading-none">
              Apps
            </span>

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2.5 py-1 bg-neutral-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-40">
              Apps Library (browse & add)
            </div>
          </button>
        )}

        <div className="w-8 h-px bg-neutral-200 dark:bg-neutral-800 my-0.5" />

        {/* Primary Apps Quick Dock */}
        {appTools.map((tool) => {
          const Icon = tool.icon;

          return (
            <button
              key={tool.type}
              id={`tool-btn-${tool.type}`}
              type="button"
              onClick={() => handleToolClick(tool.type)}
              className="group relative w-10 h-9 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title={tool.title}
            >
              <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
              <span className="text-[8.5px] mt-0.5 tracking-tight font-medium opacity-80 leading-none">
                {tool.label}
              </span>

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-neutral-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-40">
                {tool.title}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
