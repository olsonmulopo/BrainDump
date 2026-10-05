import React, { useState, useEffect } from 'react';
import { FolderCardItem, ItemColor } from '../../types';
import { getItemColorStyles } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { formatFileSize, downloadAllFilesAsZip } from '../../services/fileStorage';
import {
  Folder,
  FolderOpen,
  Palette,
  Trash2,
  Edit2,
  FileUp,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  ArrowUpRight,
  Maximize2,
  FolderArchive,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';

interface FolderCardProps {
  item: FolderCardItem;
  onUpdate: (updates: Partial<FolderCardItem>) => void;
  onDelete: () => void;
  onOpenFolder?: () => void;
  onStartConnecting?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  isInsideColumn?: boolean;
  isDropTarget?: boolean;
  onFilesDropped?: (files: File[]) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  item,
  onUpdate,
  onDelete,
  onOpenFolder,
  onStartConnecting,
  isSelected,
  isInsideColumn,
  isDropTarget,
  onFilesDropped,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(item.title || 'New Folder');
  const [isNativeDragOver, setIsNativeDragOver] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  useEffect(() => {
    setTitleInput(item.title || 'New Folder');
  }, [item.title]);

  const handleDownloadAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.files || item.files.length === 0) return;
    setIsDownloadingZip(true);
    await downloadAllFilesAsZip(item.files, `${item.title || 'Folder'}.zip`);
    setTimeout(() => setIsDownloadingZip(false), 800);
  };

  const colorStyles = getItemColorStyles(item.color || 'amber', item.customColor);
  const isDarkCard = colorStyles.isDark;

  const cardBgClasses = item.customColor
    ? ''
    : item.color && item.color !== 'default'
    ? colorStyles.className
    : 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60';

  const files = item.files || [];
  const fileCount = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== item.title) {
      onUpdate({ title: trimmed });
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitleInput(item.title || 'New Folder');
      setIsEditingTitle(false);
    }
  };

  const handleNativeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isNativeDragOver) setIsNativeDragOver(true);
  };

  const handleNativeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNativeDragOver(false);
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNativeDragOver(false);
    window.dispatchEvent(new Event('canvas-file-dropped'));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDropped?.(Array.from(e.dataTransfer.files));
    }
  };

  const isHighlighted = isDropTarget || isNativeDragOver;

  // Mini preview extensions
  const previewExtensions = files.slice(0, 4).map((f) => {
    const ext = f.fileExtension?.toUpperCase() || f.fileName.split('.').pop()?.toUpperCase() || 'FILE';
    return { name: f.fileName, ext };
  });

  return (
    <div
      data-folder-id={item.id}
      id={`card-${item.id}`}
      onDoubleClick={onOpenFolder}
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
      style={{
        backgroundColor: item.customColor ? `${item.customColor}22` : undefined,
        borderColor: item.customColor || undefined,
        width: isInsideColumn ? '100%' : `${item.width || 170}px`,
      }}
      className={`group relative rounded-2xl border transition-all duration-200 select-none overflow-visible cursor-pointer ${cardBgClasses} ${
        isSelected ? 'ring-2 ring-indigo-500 shadow-xl' : 'shadow-sm hover:shadow-md'
      } ${
        isHighlighted
          ? 'ring-3 ring-amber-500 scale-[1.03] shadow-2xl border-amber-500 bg-amber-500/20 dark:bg-amber-500/30'
          : ''
      }`}
    >
      {/* Top Floating Action Bar */}
      <div
        className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/95 dark:bg-neutral-800/95 text-white rounded-xl px-1.5 py-0.5 shadow-xl flex items-center gap-1 z-30 pointer-events-auto no-drag border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onOpenFolder}
          className="p-1 hover:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Open folder pop-up"
        >
          <FolderOpen className="w-3.5 h-3.5" />
        </button>

        {/* Download all files as ZIP */}
        {fileCount > 0 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={isDownloadingZip}
            className="p-1 hover:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Download all files in this folder as ZIP"
          >
            {isDownloadingZip ? (
              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsEditingTitle(true)}
          className="p-1 hover:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Rename folder"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {/* Color Palette Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 hover:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Folder color"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {showColorPicker && (
            <ColorPickerPopover
              currentColor={item.color || 'amber'}
              customColor={item.customColor}
              onChangeColor={(c, hex) => {
                onUpdate({ color: c, customColor: hex });
                setShowColorPicker(false);
              }}
              onClose={() => setShowColorPicker(false)}
            />
          )}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="p-1 hover:bg-red-600 rounded-lg text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Delete folder"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Folder Visual Card Body */}
      <div className="p-3.5 flex flex-col items-center text-center">
        {/* Folder Tab Shape / Graphic */}
        <div className="relative mb-2 flex items-center justify-center">
          <div
            className={`w-14 h-12 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
              isHighlighted
                ? 'bg-amber-500 text-white animate-bounce'
                : item.customColor
                ? 'text-white'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}
            style={{
              backgroundColor: item.customColor || undefined,
            }}
          >
            {isHighlighted ? (
              <FileUp className="w-6 h-6 stroke-[2.2]" />
            ) : fileCount > 0 ? (
              <FolderArchive className="w-6 h-6 stroke-[2]" />
            ) : (
              <Folder className="w-6 h-6 stroke-[2]" />
            )}
          </div>

          {/* Badge count overlay */}
          {fileCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md">
              {fileCount}
            </span>
          )}
        </div>

        {/* Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full text-center text-xs font-bold px-1.5 py-0.5 rounded border border-indigo-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-hidden shadow-xs"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate w-full px-1 hover:underline cursor-text leading-tight mb-1"
            title={item.title || 'New Folder'}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
          >
            {item.title || 'New Folder'}
          </h3>
        )}

        {/* Subtitle / File Count Info */}
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
          {fileCount === 0 ? (
            <span className="italic opacity-80">Drop files here</span>
          ) : (
            <span>
              {fileCount} {fileCount === 1 ? 'file' : 'files'}
              {totalSizeBytes > 0 && ` • ${formatFileSize(totalSizeBytes)}`}
            </span>
          )}
        </p>

        {/* Mini Preview Chips for Stored Files */}
        {previewExtensions.length > 0 && (
          <div className="flex items-center justify-center gap-1 mt-2.5 max-w-full flex-wrap">
            {previewExtensions.map((f, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold tracking-tight rounded bg-neutral-200/80 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-300/60 dark:border-neutral-700/60"
              >
                .{f.ext.toLowerCase()}
              </span>
            ))}
            {fileCount > 4 && (
              <span className="text-[8.5px] font-bold text-neutral-400">+{fileCount - 4}</span>
            )}
          </div>
        )}

        {/* Drop zone visual hint when hovering */}
        {isHighlighted && (
          <div className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
            Drop file to store inside
          </div>
        )}

        {/* Open Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFolder?.();
          }}
          className="mt-2.5 w-full py-1 px-2 rounded-lg bg-neutral-900/5 dark:bg-white/5 hover:bg-neutral-900/10 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-neutral-200/60 dark:border-neutral-700/60"
        >
          <FolderOpen className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
          <span>Open Folder</span>
        </button>
      </div>

      {/* Arrow Connection Handles */}
      {onStartConnecting && (
        <>
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnecting(e);
            }}
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 hover:scale-125 transition-all cursor-crosshair z-30 border-2 border-white dark:border-neutral-900"
            title="Connect arrow"
          />
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnecting(e);
            }}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 hover:scale-125 transition-all cursor-crosshair z-30 border-2 border-white dark:border-neutral-900"
            title="Connect arrow"
          />
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnecting(e);
            }}
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 hover:scale-125 transition-all cursor-crosshair z-30 border-2 border-white dark:border-neutral-900"
            title="Connect arrow"
          />
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnecting(e);
            }}
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 hover:scale-125 transition-all cursor-crosshair z-30 border-2 border-white dark:border-neutral-900"
            title="Connect arrow"
          />
        </>
      )}
    </div>
  );
};
