import React, { useState, useEffect, useRef } from 'react';
import { TitleCardItem, ItemColor } from '../../types';
import { getItemColorStyles } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { Trash2, Palette, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, ArrowUpRight } from 'lucide-react';

interface TitleCardProps {
  item: TitleCardItem;
  onUpdate: (updates: Partial<TitleCardItem>) => void;
  onDelete: () => void;
  onStartConnecting?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  item,
  onUpdate,
  onDelete,
  onStartConnecting,
  isSelected,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.text || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(item.text || '');
  }, [item.text]);

  useEffect(() => {
    if (!isSelected) {
      setShowColorPicker(false);
    }
  }, [isSelected]);

  const level = item.level || 1;
  const align = item.align || 'left';

  const colorStyles = getItemColorStyles(item.color || 'default', item.customColor);
  const isDark = colorStyles.isDark;

  const handleSave = () => {
    setIsEditing(false);
    onUpdate({ text });
  };

  const handleLevelChange = (newLevel: 1 | 2 | 3) => {
    onUpdate({ level: newLevel });
  };

  const handleAlignToggle = () => {
    onUpdate({ align: align === 'left' ? 'center' : 'left' });
  };

  // Adjust font styling based on heading level with balanced leading and baseline
  const headingStyle =
    level === 1
      ? 'text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug'
      : level === 2
      ? 'text-xl sm:text-2xl font-bold tracking-tight leading-snug'
      : 'text-lg sm:text-xl font-semibold tracking-tight leading-snug';

  const placeholderText =
    level === 1
      ? 'Heading 1 title...'
      : level === 2
      ? 'Heading 2 subtitle...'
      : 'Heading 3 section...';

  return (
    <div
      id={`item-${item.id}`}
      className={`group relative rounded-xl transition-all select-none px-4 py-2.5 sm:px-5 sm:py-3.5 flex items-center min-h-[48px] ${
        item.color && item.color !== 'default'
          ? !item.customColor
            ? `${colorStyles.className} border shadow-xs`
            : 'border shadow-xs'
          : 'bg-white/95 hover:bg-white border border-neutral-200/90 shadow-2xs hover:shadow-xs'
      } ${isSelected ? 'ring-2 ring-indigo-500 shadow-md ring-offset-2' : ''}`}
      style={item.customColor ? colorStyles.style : undefined}
    >
      {/* Floating Toolbar for Heading Level, Alignment, and Color */}
      <div
        className={`absolute -top-10 left-0 z-40 flex items-center gap-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs border border-neutral-200/90 dark:border-neutral-700/90 rounded-xl px-1.5 py-1 shadow-md transition-all no-drag ${
          isSelected
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Heading 1 */}
        <button
          type="button"
          onClick={() => handleLevelChange(1)}
          className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
            level === 1
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Heading 1 (Extra Large Title)"
        >
          H1
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => handleLevelChange(2)}
          className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
            level === 2
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Heading 2 (Large Subtitle)"
        >
          H2
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => handleLevelChange(3)}
          className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
            level === 3
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Heading 3 (Medium Section Title)"
        >
          H3
        </button>

        <div className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />

        {/* Alignment Toggle */}
        <button
          type="button"
          onClick={handleAlignToggle}
          className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
          title={`Align: currently ${align}`}
        >
          {align === 'center' ? (
            <AlignCenter className="w-3.5 h-3.5" />
          ) : (
            <AlignLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Connect with Arrow */}
        {onStartConnecting && (
          <button
            type="button"
            onClick={onStartConnecting}
            className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md transition-colors cursor-pointer"
            title="Connect with arrow"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Color Picker Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
            title="Change title color"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {showColorPicker && (
            <ColorPickerPopover
              currentColor={item.color}
              customColor={item.customColor}
              onChangeColor={(newColor: ItemColor, customHex?: string) => {
                onUpdate({ color: newColor, customColor: customHex });
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
          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors cursor-pointer"
          title="Delete title"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title Text Area / Display with clean vertical centering */}
      <div className={`w-full flex items-center ${align === 'center' ? 'justify-center text-center' : 'justify-start text-left'}`}>
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder={placeholderText}
            autoFocus
            rows={1}
            className={`w-full bg-transparent outline-none resize-none border-b border-indigo-400/80 p-0 m-0 no-drag ${headingStyle} ${
              align === 'center' ? 'text-center' : 'text-left'
            } ${
              isDark
                ? 'text-white placeholder:text-white/50'
                : 'text-neutral-900 placeholder:text-neutral-400'
            }`}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`w-full cursor-text transition-colors select-text break-words p-0 m-0 ${headingStyle} ${
              align === 'center' ? 'text-center' : 'text-left'
            } ${
              !text.trim()
                ? isDark
                  ? 'text-white/40 italic'
                  : 'text-neutral-400 italic'
                : isDark
                ? 'text-white'
                : 'text-neutral-900'
            }`}
            title="Click to edit title"
          >
            {text.trim() || placeholderText}
          </div>
        )}
      </div>
    </div>
  );
};
