import React, { useState, useEffect } from 'react';
import { FileCardItem, ItemColor } from '../../types';
import { getItemColorStyles } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import {
  formatFileSize,
  isMarkdownFile,
  downloadFile,
} from '../../services/fileStorage';
import {
  File,
  FileText,
  FileSpreadsheet,
  Presentation,
  Archive,
  Video,
  Music,
  Code2,
  Image as ImageIcon,
  Palette,
  Trash2,
  Cloud,
  Edit2,
  Check,
  BookOpen,
  ArrowUpRight,
  Download,
} from 'lucide-react';

interface FileCardProps {
  item: FileCardItem;
  onUpdate: (updates: Partial<FileCardItem>) => void;
  onDelete: () => void;
  onOpenPreview?: (item: FileCardItem) => void;
  onStartConnecting?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({
  item,
  onUpdate,
  onDelete,
  onOpenPreview,
  onStartConnecting,
  isSelected,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(item.fileName || 'Untitled File');
  const [isDownloading, setIsDownloading] = useState(false);

  const colorStyles = getItemColorStyles(item.color || 'default', item.customColor);
  const isDarkCard = colorStyles.isDark;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    await downloadFile(item);
    setTimeout(() => setIsDownloading(false), 600);
  };

  // Determine solid card background and border classes so card is NEVER transparent
  const cardBgClasses = item.customColor
    ? ''
    : item.color && item.color !== 'default'
    ? colorStyles.className
    : 'bg-white dark:bg-neutral-900 border-neutral-300/90 dark:border-neutral-700/80 shadow-xs';

  const titleColorClass = item.customColor
    ? isDarkCard ? 'text-white' : 'text-neutral-950'
    : item.color === 'dark'
    ? 'text-white'
    : item.color && item.color !== 'default'
    ? colorStyles.textColorClass || 'text-neutral-950'
    : 'text-neutral-900 dark:text-white';

  useEffect(() => {
    setTitleInput(item.fileName || 'Untitled File');
  }, [item.fileName]);

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== item.fileName) {
      onUpdate({ fileName: trimmed });
    } else {
      setTitleInput(item.fileName);
    }
    setIsEditingTitle(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenPreview?.(item);
  };

  // Determine category theme, icon, and badge
  const isMd = isMarkdownFile(item);
  const ext = (item.fileExtension || item.fileName.split('.').pop() || '').toLowerCase();

  const getFileIconConfig = () => {
    if (isMd) {
      return {
        icon: FileText,
        badgeText: 'MD',
        bg: 'bg-indigo-50 dark:bg-indigo-950/60',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800/80',
        accentBg: 'bg-indigo-600 text-white',
        typeLabel: 'Markdown Document',
      };
    }

    switch (item.fileCategory) {
      case 'document':
        return {
          icon: FileText,
          badgeText: ext.toUpperCase() || 'DOC',
          bg: 'bg-blue-50 dark:bg-blue-950/60',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800/80',
          accentBg: 'bg-blue-600 text-white',
          typeLabel: 'Document',
        };
      case 'spreadsheet':
        return {
          icon: FileSpreadsheet,
          badgeText: ext.toUpperCase() || 'XLS',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-800/80',
          accentBg: 'bg-emerald-600 text-white',
          typeLabel: 'Spreadsheet',
        };
      case 'presentation':
        return {
          icon: Presentation,
          badgeText: ext.toUpperCase() || 'PPT',
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800/80',
          accentBg: 'bg-amber-600 text-white',
          typeLabel: 'Presentation',
        };
      case 'archive':
        return {
          icon: Archive,
          badgeText: ext.toUpperCase() || 'ZIP',
          bg: 'bg-orange-50 dark:bg-orange-950/60',
          text: 'text-orange-600 dark:text-orange-400',
          border: 'border-orange-200 dark:border-orange-800/80',
          accentBg: 'bg-orange-600 text-white',
          typeLabel: 'Archive',
        };
      case 'video':
        return {
          icon: Video,
          badgeText: ext.toUpperCase() || 'VID',
          bg: 'bg-purple-50 dark:bg-purple-950/60',
          text: 'text-purple-600 dark:text-purple-400',
          border: 'border-purple-200 dark:border-purple-800/80',
          accentBg: 'bg-purple-600 text-white',
          typeLabel: 'Video',
        };
      case 'audio':
        return {
          icon: Music,
          badgeText: ext.toUpperCase() || 'AUD',
          bg: 'bg-pink-50 dark:bg-pink-950/60',
          text: 'text-pink-600 dark:text-pink-400',
          border: 'border-pink-200 dark:border-pink-800/80',
          accentBg: 'bg-pink-600 text-white',
          typeLabel: 'Audio',
        };
      case 'code':
        return {
          icon: Code2,
          badgeText: ext.toUpperCase() || 'DEV',
          bg: 'bg-cyan-50 dark:bg-cyan-950/60',
          text: 'text-cyan-600 dark:text-cyan-400',
          border: 'border-cyan-200 dark:border-cyan-800/80',
          accentBg: 'bg-cyan-600 text-white',
          typeLabel: 'Code File',
        };
      case 'image':
        return {
          icon: ImageIcon,
          badgeText: ext.toUpperCase() || 'IMG',
          bg: 'bg-rose-50 dark:bg-rose-950/60',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-200 dark:border-rose-800/80',
          accentBg: 'bg-rose-600 text-white',
          typeLabel: 'Image',
        };
      default:
        return {
          icon: File,
          badgeText: ext.toUpperCase() || 'FILE',
          bg: 'bg-neutral-100 dark:bg-neutral-800',
          text: 'text-neutral-700 dark:text-neutral-200',
          border: 'border-neutral-200 dark:border-neutral-700',
          accentBg: 'bg-neutral-700 text-white',
          typeLabel: 'File',
        };
    }
  };

  const fileConfig = getFileIconConfig();
  const IconComponent = fileConfig.icon;

  // Format created date (e.g. "Sep 23")
  const createdDateStr = new Date(item.createdAt || Date.now()).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      id={`file-card-${item.id}`}
      style={{
        ...(item.customColor ? colorStyles.style : {}),
        width: item.width ? `${item.width}px` : '220px',
      }}
      onDoubleClick={handleDoubleClick}
      className={`relative group/card rounded-2xl border transition-all text-xs select-none p-3.5 ${cardBgClasses} ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-md'
          : 'hover:shadow-md hover:border-black/30 dark:hover:border-white/30'
      }`}
      title="Double-click to open. Drag edges to connect arrow."
    >
      {/* Floating Action Controls on Hover/Select (Palette, Connect, Open, Delete) */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity z-20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs rounded-lg p-0.5 shadow-xs border border-black/5 dark:border-white/10">
        {/* Quick Open Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview?.(item);
          }}
          className="p-1 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded cursor-pointer transition-colors"
          title={isMd ? 'Open Markdown Editor' : 'Open file'}
        >
          <BookOpen className="w-3 h-3" />
        </button>

        {/* Direct Download Icon */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="p-1 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded cursor-pointer transition-colors"
          title="Download file to computer"
        >
          {isDownloading ? (
            <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
        </button>

        {/* Start Arrow Connection Button */}
        {onStartConnecting && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartConnecting(e);
            }}
            className="p-1 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded cursor-pointer transition-colors"
            title="Connect arrow to another card"
          >
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}

        {/* Color Popover Button */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded cursor-pointer transition-colors"
            title="Color code this file"
          >
            <Palette className="w-3 h-3" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full right-0 mt-1 z-30" onClick={(e) => e.stopPropagation()}>
              <ColorPickerPopover
                currentColor={item.color}
                customColor={item.customColor}
                onChangeColor={(c: ItemColor, hex?: string) => {
                  onUpdate({ color: c, customColor: hex });
                  setShowColorPicker(false);
                }}
                onClose={() => setShowColorPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Delete File Card Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-neutral-400 hover:text-red-600 rounded cursor-pointer transition-colors"
          title="Delete file"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Main File Icon & Extension Glyphs */}
      <div className="flex items-center gap-3">
        {/* Prominent File Icon Box */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border relative shadow-2xs ${fileConfig.bg} ${fileConfig.text} ${fileConfig.border}`}
        >
          <IconComponent className="w-5 h-5 stroke-[1.8]" />

          {/* Micro Extension Badge */}
          <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded font-mono font-bold text-[8px] tracking-wider uppercase bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs">
            {fileConfig.badgeText}
          </span>
        </div>

        {/* File Name & Double-click Hint */}
        <div className="flex-1 min-w-0 pr-4">
          {isEditingTitle ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="w-full px-1.5 py-0.5 text-xs font-semibold rounded border border-indigo-500 bg-white dark:bg-neutral-800 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              className="group/title flex items-start justify-between cursor-pointer"
              onClick={(e) => {
                // Clicking title allows renaming
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="Click to rename file"
            >
              <h4
                className={`font-semibold text-xs leading-snug break-all line-clamp-2 ${titleColorClass}`}
                title={item.fileName}
              >
                {item.fileName}
              </h4>
              <Edit2 className="w-2.5 h-2.5 text-neutral-400 opacity-0 group-hover/title:opacity-100 shrink-0 transition-opacity mt-0.5 ml-1" />
            </div>
          )}
        </div>
      </div>

      {/* Clean Unboxed Metadata: Size · Date Created (Anti-slop / Zero-Pill) */}
      <div
        className={`flex items-center justify-between text-[11px] mt-2.5 pt-2 border-t font-mono ${
          item.customColor && isDarkCard
            ? 'border-white/15 text-white/75'
            : item.color === 'dark'
            ? 'border-white/15 text-white/75'
            : 'border-black/8 dark:border-white/10 text-neutral-500 dark:text-neutral-400'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span>{formatFileSize(item.fileSize)}</span>
          <span className="opacity-40">·</span>
          <span>{createdDateStr}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 font-sans">
          {item.driveFileId ? (
            <span
              className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium"
              title="Synced with Google Drive"
            >
              <Cloud className="w-3 h-3" />
            </span>
          ) : null}

          {/* Prominent One-Click Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
              item.customColor && isDarkCard
                ? 'text-white hover:bg-white/20'
                : item.color === 'dark'
                ? 'text-white hover:bg-white/20'
                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
            }`}
            title="Download file directly to computer"
          >
            {isDownloading ? (
              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-2.8 h-2.8" />
            )}
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
