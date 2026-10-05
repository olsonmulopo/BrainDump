import React, { useRef } from 'react';
import { ItemType, CanvasSettings } from '../types';
import {
  FileUp,
  Image as ImageIcon,
  Link2,
  Heading,
  Clock,
  PenTool,
  Trash2,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface BottomBarProps {
  onAddItem: (type: ItemType) => void;
  onUploadFiles?: (files: File[]) => void;
  isDrawMode: boolean;
  onToggleDrawMode: () => void;
  onOpenTrash?: () => void;
  trashedCount?: number;
  settings?: CanvasSettings;
  onOpenSettings?: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  onAddItem,
  onUploadFiles,
  isDrawMode,
  onToggleDrawMode,
  onOpenTrash,
  trashedCount = 0,
  settings,
  onOpenSettings,
}) => {
  const isDark = settings?.theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const bottomTools = [
    {
      type: 'file' as ItemType,
      label: 'File',
      title: 'File App — Upload documents & attachments',
      icon: FileUp,
      action: () => fileInputRef.current?.click(),
    },
    {
      type: 'image' as ItemType,
      label: 'Image',
      title: 'Image App — Add visual photos & graphics',
      icon: ImageIcon,
      action: () => imageInputRef.current?.click(),
    },
    {
      type: 'link' as ItemType,
      label: 'Link',
      title: 'Link App — Web link bookmark & preview',
      icon: Link2,
      action: () => onAddItem('link'),
    },
    {
      type: 'title' as ItemType,
      label: 'Title',
      title: 'Heading App — Large board title & headers',
      icon: Heading,
      action: () => onAddItem('title'),
    },
    {
      type: 'timer' as ItemType,
      label: 'Timer',
      title: 'Timer App — Focus countdown & task clock',
      icon: Clock,
      action: () => onAddItem('timer'),
    },
  ];

  return (
    <nav
      aria-label="Canvas Bottom Dock"
      className="absolute bottom-4 left-20 sm:left-24 z-20 select-none animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <div
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl shadow-xl border backdrop-blur-md transition-colors duration-150 ${
          isDark
            ? 'bg-neutral-900/90 border-neutral-800/90 text-neutral-200'
            : 'bg-white/95 border-neutral-200/90 text-neutral-700'
        }`}
      >
        {/* Creation Tools: File, Image, Link, Title, Timer */}
        {bottomTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.type}
              id={`bottom-tool-btn-${tool.type}`}
              type="button"
              onClick={tool.action}
              className="group relative flex flex-col items-center justify-center w-11 h-10 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/80"
              title={tool.title}
            >
              <Icon className="w-4 h-4 stroke-[1.9]" />
              <span className="text-[9px] mt-0.5 tracking-tight font-medium opacity-85 leading-none">
                {tool.label}
              </span>

              {/* Tooltip popping UPWARDS */}
              <div className="absolute bottom-full mb-2 px-2.5 py-1 bg-neutral-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {tool.title}
              </div>
            </button>
          );
        })}

        {/* Freehand Sketch Tool */}
        <button
          id="bottom-tool-btn-sketch"
          type="button"
          onClick={onToggleDrawMode}
          className={`group relative flex flex-col items-center justify-center w-11 h-10 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isDrawMode
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
          }`}
          title="Sketch App — Freehand pen drawing tool"
        >
          <PenTool className="w-4 h-4 stroke-[1.9]" />
          <span className="text-[9px] mt-0.5 tracking-tight font-medium opacity-85 leading-none">
            Sketch
          </span>

          <div className="absolute bottom-full mb-2 px-2.5 py-1 bg-neutral-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {isDrawMode ? 'Exit Drawing Mode' : 'Sketch App (Freehand Pen)'}
          </div>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* Utilities: Trash Bin */}
        <button
          id="bottom-btn-trash-bin"
          type="button"
          onClick={onOpenTrash}
          className="group relative flex flex-col items-center justify-center w-9 h-10 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer"
          title={`Trash Bin ${trashedCount > 0 ? `(${trashedCount} items)` : ''}`}
        >
          <div className="relative">
            <Trash2 className="w-4 h-4" />
            {trashedCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                {trashedCount > 9 ? '9+' : trashedCount}
              </span>
            )}
          </div>
          <span className="text-[8.5px] mt-0.5 tracking-tight font-medium opacity-85 leading-none">
            Trash
          </span>

          <div className="absolute bottom-full mb-2 px-2.5 py-1 bg-neutral-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Trash Bin {trashedCount > 0 ? `(${trashedCount} deleted items)` : '(Empty)'}
          </div>
        </button>

        {/* Canvas Settings */}
        {onOpenSettings && (
          <button
            id="bottom-btn-settings"
            type="button"
            onClick={onOpenSettings}
            className="group relative flex flex-col items-center justify-center w-9 h-10 rounded-xl text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer"
            title="Canvas Settings"
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[8.5px] mt-0.5 tracking-tight font-medium opacity-85 leading-none">
              Canvas
            </span>

            <div className="absolute bottom-full mb-2 px-2.5 py-1 bg-neutral-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Canvas Settings (Grid, Snap, Background)
            </div>
          </button>
        )}

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUploadFiles?.(Array.from(e.target.files));
              e.target.value = '';
            }
          }}
        />

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUploadFiles?.(Array.from(e.target.files));
              e.target.value = '';
            }
          }}
        />
      </div>
    </nav>
  );
};
