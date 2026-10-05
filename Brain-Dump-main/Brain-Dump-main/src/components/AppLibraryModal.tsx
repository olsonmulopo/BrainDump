import React, { useState } from 'react';
import { ItemType } from '../types';
import {
  FileText,
  Heading,
  Link2,
  CheckSquare,
  FolderPlus,
  FolderArchive,
  Columns,
  Table as TableIcon,
  Image as ImageIcon,
  PenTool,
  Clock,
  FileUp,
  MessageSquare,
  X,
  Search,
  Sparkles,
  ArrowRight,
  Layers,
  LayoutGrid,
  Calendar as CalendarIcon,
  FileCode,
} from 'lucide-react';

export interface AppDefinition {
  type: ItemType;
  name: string;
  category: 'Writing' | 'Planning' | 'Organization' | 'Media & Data' | 'Creative';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  isPopular?: boolean;
}

export const APPS_CATALOG: AppDefinition[] = [
  {
    type: 'markdown',
    name: 'Markdown App (.md)',
    category: 'Writing',
    description: 'Visual Markdown document editor with invisible syntax commands, checklists, tables, and export.',
    icon: FileCode,
    accentColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
    isPopular: true,
  },
  {
    type: 'note',
    name: 'Note App',
    category: 'Writing',
    description: 'Rich text notes, interactive task checklists, and quick thoughts.',
    icon: FileText,
    accentColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
    isPopular: true,
  },
  {
    type: 'todo',
    name: 'Task App',
    category: 'Planning',
    description: 'Clean to-do lists, progress tracking, and task completion.',
    icon: CheckSquare,
    accentColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
    isPopular: true,
  },
  {
    type: 'calendar',
    name: 'Calendar App',
    category: 'Planning',
    description: 'Interactive month & week calendar, event scheduling, and card deadline tracker.',
    icon: CalendarIcon,
    accentColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
    isPopular: true,
  },
  {
    type: 'board',
    name: 'Board App',
    category: 'Organization',
    description: 'Nested sub-canvases to organize projects inside their own workspaces.',
    icon: FolderPlus,
    accentColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
    isPopular: true,
  },
  {
    type: 'folder',
    name: 'Folder App',
    category: 'Organization',
    description: 'Declutter your canvas by dropping files into a clean folder box with instant pop-up preview.',
    icon: FolderArchive,
    accentColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
    isPopular: true,
  },
  {
    type: 'column',
    name: 'Column App',
    category: 'Organization',
    description: 'Vertical stack containers to group related cards and cards together.',
    icon: Columns,
    accentColor: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400',
  },
  {
    type: 'table',
    name: 'Table App',
    category: 'Media & Data',
    description: 'Spreadsheet-style grids with customizable columns and calculations.',
    icon: TableIcon,
    accentColor: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400',
  },
  {
    type: 'timer',
    name: 'Timer App',
    category: 'Planning',
    description: 'Focus timer, countdowns, and time logging for productivity sessions.',
    icon: Clock,
    accentColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
  },
  {
    type: 'file',
    name: 'File App',
    category: 'Media & Data',
    description: 'Attach PDFs, documents, audio, video, code, and zip archives.',
    icon: FileUp,
    accentColor: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400',
  },
  {
    type: 'title',
    name: 'Heading App',
    category: 'Writing',
    description: 'High-impact H1, H2, and H3 titles to section and label your canvas.',
    icon: Heading,
    accentColor: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400',
  },
  {
    type: 'comment',
    name: 'Comment App',
    category: 'Writing',
    description: 'Quick sticky notes, review feedback, and floating thoughts.',
    icon: MessageSquare,
    accentColor: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 dark:text-yellow-400',
  },
  {
    type: 'link',
    name: 'Link App',
    category: 'Media & Data',
    description: 'Web bookmarks with live metadata, previews, and URL cards.',
    icon: Link2,
    accentColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
  },
  {
    type: 'image',
    name: 'Image App',
    category: 'Creative',
    description: 'Photo cards, mood board visual references, and illustrations.',
    icon: ImageIcon,
    accentColor: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 dark:text-pink-400',
  },
];

interface AppLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApp: (type: ItemType) => void;
  onToggleDrawMode?: () => void;
  isDark?: boolean;
}

export const AppLibraryModal: React.FC<AppLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectApp,
  onToggleDrawMode,
  isDark = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Writing', 'Planning', 'Organization', 'Media & Data', 'Creative'];

  const filteredApps = APPS_CATALOG.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden max-h-[85vh] transition-all ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Apps Library</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose an App block to add to your workspace canvas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="px-6 pt-4 pb-2 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps (e.g. note, checklist, table, board)..."
              autoFocus
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none transition-colors ${
                isDark
                  ? 'bg-neutral-800/80 border-neutral-700 focus:border-indigo-500 text-white placeholder:text-neutral-500'
                  : 'bg-neutral-50 border-neutral-200 focus:border-indigo-500 text-neutral-900 placeholder:text-neutral-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark
                    ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* App Grid */}
        <div className="px-6 py-3 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredApps.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.type}
                type="button"
                onClick={() => {
                  onSelectApp(app.type);
                  onClose();
                }}
                className={`group flex items-start gap-3 p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-800/40 hover:bg-neutral-800 hover:border-indigo-500/50'
                    : 'border-neutral-200/80 bg-neutral-50/50 hover:bg-white hover:border-indigo-500/50 hover:shadow-sm'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${app.accentColor}`}>
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {app.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {app.description}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Quick Draw App Tile */}
          {onToggleDrawMode && (selectedCategory === 'All' || selectedCategory === 'Creative') && (
            <button
              type="button"
              onClick={() => {
                onToggleDrawMode();
                onClose();
              }}
              className={`group flex items-start gap-3 p-3 text-left rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-800 bg-neutral-800/40 hover:bg-neutral-800 hover:border-indigo-500/50'
                  : 'border-neutral-200/80 bg-neutral-50/50 hover:bg-white hover:border-indigo-500/50 hover:shadow-sm'
              }`}
            >
              <div className="p-2.5 rounded-xl shrink-0 text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400">
                <PenTool className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Sketch & Draw App
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                  Freehand sketching tool for wireframes, hand-drawn annotations, and diagrams.
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700 font-mono text-[10px]">N</kbd> on canvas for a quick note</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
