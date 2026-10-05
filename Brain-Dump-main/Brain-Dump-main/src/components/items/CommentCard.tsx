import React, { useRef, useEffect, useState } from 'react';
import { CommentItem, ItemColor, WorkflowStatus } from '../../types';
import { getItemColorClasses, getItemColorStyles } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { WorkflowStatusBadge } from '../WorkflowStatusBadge';
import {
  MessageSquare,
  Check,
  Trash2,
  Maximize2,
  Minimize2,
  Palette,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CommentCardProps {
  item: CommentItem;
  onUpdate: (updates: Partial<CommentItem>) => void;
  onDelete: () => void;
  isSelected?: boolean;
}

const COMMENT_CHARACTER_LIMIT = 500;

function truncateComment(text: string, limit: number = COMMENT_CHARACTER_LIMIT): string {
  if (!text || text.length <= limit) return text;
  const sub = text.slice(0, limit);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > limit * 0.8) {
    return sub.slice(0, lastSpace) + '...';
  }
  return sub + '...';
}

export const CommentCard: React.FC<CommentCardProps> = ({
  item,
  onUpdate,
  onDelete,
  isSelected,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const text = item.text || '';
  const isOverLimit = text.length > COMMENT_CHARACTER_LIMIT;
  const isExpanded = item.isExpanded ?? false;

  // Auto-resize textarea dynamically but CAP it at 260px so it never blows up into an infinite tower
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const targetHeight = Math.min(260, Math.max(72, scrollHeight));
      textareaRef.current.style.height = `${targetHeight}px`;
    }
  }, [text, isExpanded, isEditing]);

  const currentWidth = item.width || 300;

  // Cycle width between 300px, 400px, 500px for generous writing space
  const handleCycleWidth = (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextWidth = 300;
    if (currentWidth < 360) {
      nextWidth = 400;
    } else if (currentWidth < 460) {
      nextWidth = 500;
    } else {
      nextWidth = 300;
    }
    onUpdate({ width: nextWidth });
  };

  // Format relative creation time
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'Just now';
    const elapsed = Date.now() - timestamp;
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const hasColor = item.color && item.color !== 'default';
  const colorClasses = hasColor ? getItemColorClasses(item.color) : null;
  const colorStyles = hasColor ? getItemColorStyles(item.color, item.customColor) : null;

  const isDark = colorStyles?.isDark ?? false;

  return (
    <div
      id={`item-${item.id}`}
      style={colorStyles?.style || undefined}
      className={`group relative rounded-xl border p-3.5 shadow-xs transition-all duration-200 select-none max-w-full ${
        showColorPicker ? 'overflow-visible' : 'overflow-hidden'
      } ${
        item.resolved
          ? 'opacity-65 bg-[#fbfbfa] border-neutral-200'
          : hasColor && colorClasses
          ? `${colorClasses.bg} ${colorClasses.border}`
          : 'bg-[#fffdf2] border-[#eddca3]'
      } ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-md border-indigo-400'
          : 'hover:shadow-md hover:border-amber-300'
      }`}
    >
      {/* Top Header: Author, Timestamp, Workflow Status & Action Controls */}
      <div
        className={`flex items-center justify-between gap-1.5 mb-2.5 pb-2 border-b ${
          isDark ? 'border-white/15' : 'border-amber-200/50'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-amber-500/20 text-amber-900 border-amber-400/40'
            }`}
          >
            {item.author ? item.author.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className={`font-semibold text-xs truncate leading-tight ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {item.author || 'Contributor'}
            </span>
            <span
              className={`text-[10px] flex items-center gap-1 ${
                isDark ? 'text-neutral-300' : 'text-neutral-500'
              }`}
            >
              <Clock className="w-2.5 h-2.5" />
              <span>{formatTime(item.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 no-drag">
          {/* Workflow Status Badge */}
          <WorkflowStatusBadge
            status={item.workflowStatus}
            note={item.workflowNote}
            onUpdateStatus={(status: WorkflowStatus, note?: string) =>
              onUpdate({ workflowStatus: status, workflowNote: note })
            }
            compact
          />

          {/* Resolve / Unresolve status button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ resolved: !item.resolved });
            }}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              item.resolved
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                : 'text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 bg-white/60 border border-neutral-200/80'
            }`}
            title={item.resolved ? 'Click to re-open comment' : 'Mark as resolved'}
          >
            {item.resolved ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                <span>Resolved</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">Resolve</span>
              </>
            )}
          </button>

          {/* Width expansion button */}
          <button
            type="button"
            onClick={handleCycleWidth}
            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
            title={`Expand space (${currentWidth}px)`}
          >
            {currentWidth > 360 ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Color palette popover */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
              title="Change note color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <div
                className="absolute right-0 top-full mt-1.5 z-50 no-drag"
                onClick={(e) => e.stopPropagation()}
              >
                <ColorPickerPopover
                  currentColor={item.color}
                  customColor={item.customColor}
                  onChangeColor={(color: ItemColor, customHex?: string) => {
                    onUpdate({ color, customColor: customHex });
                    setShowColorPicker(false);
                  }}
                  onClose={() => setShowColorPicker(false)}
                />
              </div>
            )}
          </div>

          {/* Delete comment */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
            title="Delete comment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comment Body: 500-Character Cap with "See more / See less" and Strict Word Breaking */}
      <div className="relative w-full max-w-full overflow-hidden">
        {/* If text exceeds 500 chars and is NOT expanded: show truncated preview */}
        {isOverLimit && !isExpanded && !isEditing ? (
          <div
            className={`w-full text-xs sm:text-sm font-sans leading-relaxed min-h-[64px] whitespace-pre-wrap select-text cursor-text break-words break-all [overflow-wrap:anywhere] ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}
            onClick={() => setIsEditing(true)}
            title="Click to edit comment"
          >
            {truncateComment(text, COMMENT_CHARACTER_LIMIT)}
          </div>
        ) : (
          <div className={isExpanded ? 'max-h-[320px] overflow-y-auto pr-1' : ''}>
            <textarea
              ref={textareaRef}
              value={item.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
              placeholder="Write your comment, feedback, or review note..."
              className={`w-full text-xs sm:text-sm bg-transparent outline-none resize-none font-sans leading-relaxed min-h-[64px] no-drag select-text break-words break-all [overflow-wrap:anywhere] ${
                isDark
                  ? 'text-white placeholder:text-white/50'
                  : 'text-neutral-900 placeholder:text-neutral-400'
              } ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}
            />
          </div>
        )}
      </div>

      {/* See More / See Less Toggle Button & Character Status */}
      {isOverLimit && (
        <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-amber-200/50 no-drag select-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ isExpanded: !isExpanded });
            }}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/5 hover:bg-black/10 text-neutral-700 transition-colors cursor-pointer"
            title={
              isExpanded
                ? 'Compress comment back to 500 characters'
                : 'Expand to view full comment'
            }
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-600" />
                <span>See less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  See more (+{text.length - COMMENT_CHARACTER_LIMIT} chars)
                </span>
              </>
            )}
          </button>

          <span
            className="text-[10px] tabular-nums font-mono text-neutral-400"
            title="Total character count"
          >
            {text.length} chars
          </span>
        </div>
      )}

      {/* Live character limit helper when typing near 500 characters */}
      {!isOverLimit && text.length > 350 && (
        <div className="flex justify-end pt-1">
          <span className="text-[10px] text-neutral-400 font-mono">
            {text.length} / {COMMENT_CHARACTER_LIMIT} chars
          </span>
        </div>
      )}
    </div>
  );
};
