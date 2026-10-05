import React, { useState, useEffect } from 'react';
import { ColumnItem, CanvasItem, ItemColor } from '../../types';
import { isColorDark } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { MoreHorizontal, Plus, Trash2, Palette } from 'lucide-react';

interface ColumnCardProps {
  item: ColumnItem;
  childrenItems: CanvasItem[];
  renderChildItem: (child: CanvasItem) => React.ReactNode;
  onUpdate: (updates: Partial<ColumnItem>) => void;
  onDelete: () => void;
  onAddItem: (columnId: string, type: 'note' | 'todo' | 'board' | 'link') => void;
  isSelected?: boolean;
}

export const ColumnCard: React.FC<ColumnCardProps> = ({
  item,
  childrenItems,
  renderChildItem,
  onUpdate,
  onDelete,
  onAddItem,
  isSelected,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (!isSelected) {
      setShowColorPicker(false);
      setShowMenu(false);
    }
  }, [isSelected]);

  // Count items
  const cardCount = childrenItems.filter(i => i.type !== 'note' || !(i as any).isDocument).length;
  const docCount = childrenItems.filter(i => i.type === 'note' && (i as any).isDocument).length;
  const boardCount = childrenItems.filter(i => i.type === 'board').length;

  const countLabel = [
    boardCount > 0 ? `${boardCount} board${boardCount > 1 ? 's' : ''}` : '',
    cardCount > 0 ? `${cardCount} card${cardCount > 1 ? 's' : ''}` : '',
    docCount > 0 ? `${docCount} document` : '',
  ].filter(Boolean).join(', ') || '0 cards';

  // Compute theme styles for the column based on chosen color
  // A column is only dark mode when the 'dark' preset is selected,
  // as custom colors apply light tint backgrounds (10% & 20% alpha) to keep cards readable.
  const isCustomDark = item.customColor ? isColorDark(item.customColor) : false;
  const isDark = item.color === 'dark' || isCustomDark;

  let containerBg = 'bg-[#f9fafb] dark:bg-[#181a1f]';
  let containerBorder = 'border-neutral-200/90 dark:border-neutral-800';
  let headerBg = 'bg-white dark:bg-[#20232a]';
  let headerBorder = 'border-neutral-200/60 dark:border-neutral-800';
  let titleColor = isDark ? 'text-white' : 'text-neutral-900 dark:text-neutral-100';
  let countColor = isDark ? 'text-neutral-300' : 'text-neutral-500 dark:text-neutral-400';
  let customContainerStyle: React.CSSProperties | undefined = undefined;
  let customHeaderStyle: React.CSSProperties | undefined = undefined;

  if (item.customColor && item.customColor.startsWith('#')) {
    customContainerStyle = {
      backgroundColor: item.customColor + (isDark ? '28' : '18'),
      borderColor: item.customColor,
    };
    customHeaderStyle = {
      backgroundColor: isDark ? item.customColor : item.customColor + '30',
      borderBottomColor: item.customColor + '60',
    };
    titleColor = isDark ? 'text-white' : 'text-neutral-900';
    countColor = isDark ? 'text-neutral-200' : 'text-neutral-600';
  } else if (item.color && item.color !== 'default') {
    switch (item.color) {
      case 'peach':
        containerBg = 'bg-[#faece4]';
        containerBorder = 'border-[#ebd4c7]';
        headerBg = 'bg-[#f5dfd5]';
        headerBorder = 'border-[#ebd4c7]';
        titleColor = 'text-neutral-900';
        countColor = 'text-neutral-600';
        break;
      case 'purple':
        containerBg = 'bg-[#f0ecf8]';
        containerBorder = 'border-[#dbcef0]';
        headerBg = 'bg-[#e5def5]';
        headerBorder = 'border-[#dbcef0]';
        titleColor = 'text-neutral-900';
        countColor = 'text-neutral-600';
        break;
      case 'mint':
        containerBg = 'bg-[#e8f4ed]';
        containerBorder = 'border-[#cae5d4]';
        headerBg = 'bg-[#d8ece0]';
        headerBorder = 'border-[#cae5d4]';
        titleColor = 'text-neutral-900';
        countColor = 'text-neutral-600';
        break;
      case 'blue':
        containerBg = 'bg-[#e7f1f9]';
        containerBorder = 'border-[#c7def2]';
        headerBg = 'bg-[#d7e9f7]';
        headerBorder = 'border-[#c7def2]';
        titleColor = 'text-neutral-900';
        countColor = 'text-neutral-600';
        break;
      case 'yellow':
        containerBg = 'bg-[#fbf7dc]';
        containerBorder = 'border-[#ece4b7]';
        headerBg = 'bg-[#f5efc7]';
        headerBorder = 'border-[#ece4b7]';
        titleColor = 'text-neutral-900';
        countColor = 'text-neutral-600';
        break;
      case 'rose':
        containerBg = 'bg-[#fde8e8]';
        containerBorder = 'border-[#fbd0d0]';
        headerBg = 'bg-[#fad7d7]';
        headerBorder = 'border-[#fbd0d0]';
        titleColor = 'text-neutral-900';
        countColor = 'text-neutral-600';
        break;
      case 'amber':
        containerBg = 'bg-[#fef3c7]';
        containerBorder = 'border-[#fde68a]';
        headerBg = 'bg-[#fdeaa8]';
        headerBorder = 'border-[#fde68a]';
        titleColor = 'text-neutral-900';
        countColor = 'text-neutral-600';
        break;
      case 'indigo':
        containerBg = 'bg-[#e0e7ff]';
        containerBorder = 'border-[#c7d2fe]';
        headerBg = 'bg-[#d0dbfd]';
        headerBorder = 'border-[#c7d2fe]';
        titleColor = 'text-neutral-900';
        countColor = 'text-neutral-600';
        break;
      case 'emerald':
        containerBg = 'bg-[#d1fae5]';
        containerBorder = 'border-[#a7f3d0]';
        headerBg = 'bg-[#bbf7d0]';
        headerBorder = 'border-[#a7f3d0]';
        titleColor = 'text-neutral-900';
        countColor = 'text-neutral-600';
        break;
      case 'dark':
        containerBg = 'bg-[#292e35]';
        containerBorder = 'border-[#3d454f]';
        headerBg = 'bg-[#1f2329]';
        headerBorder = 'border-[#3d454f]';
        titleColor = 'text-white';
        countColor = 'text-neutral-300';
        break;
    }
  }

  return (
    <div
      id={`item-${item.id}`}
      className={`group relative w-[260px] rounded-lg border flex flex-col transition-all ${containerBg} ${containerBorder} ${
        isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'shadow-xs hover:shadow-sm'
      }`}
      style={customContainerStyle}
    >
      {/* Column Header */}
      <div
        className={`p-3 pb-2 flex items-start justify-between border-b rounded-t-lg transition-colors ${headerBg} ${headerBorder}`}
        style={customHeaderStyle}
      >
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={item.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Column title..."
            className={`font-serif font-bold text-sm tracking-tight bg-transparent outline-none w-full ${titleColor}`}
          />
          <div className={`text-[11px] font-sans mt-0.5 ${countColor}`}>
            {countLabel}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Color Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
                setShowMenu(false);
              }}
              className={`p-1 rounded transition-colors no-drag cursor-pointer ${
                showColorPicker
                  ? 'bg-indigo-100 text-indigo-700'
                  : isDark
                  ? 'text-neutral-300 hover:text-white hover:bg-white/10'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-black/5'
              }`}
              title="Change column color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <ColorPickerPopover
                currentColor={item.color || 'default'}
                customColor={item.customColor}
                onChangeColor={(col, customHex) => {
                  onUpdate({ color: col, customColor: customHex });
                }}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>

          {/* More options menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
                setShowColorPicker(false);
              }}
              className={`p-1 rounded transition-colors no-drag cursor-pointer ${
                isDark
                  ? 'text-neutral-300 hover:text-white hover:bg-white/10'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-black/5'
              }`}
              title="Column options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-xl py-1.5 z-30 text-xs text-neutral-700 dark:text-neutral-200 no-drag"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowColorPicker(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> Change Color
                </button>
                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    onAddItem(item.id, 'note');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Note
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddItem(item.id, 'todo');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add To-do
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddItem(item.id, 'board');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Sub-board
                </button>
                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete column
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column Children Items */}
      <div className="p-2 space-y-2 flex-1 min-h-[80px] max-h-[560px] overflow-y-auto overflow-x-hidden [scrollbar-width:thin]">
        {childrenItems.map((child) => (
          <div key={child.id} className="relative">
            {renderChildItem(child)}
          </div>
        ))}

        {/* Quick Add Buttons at bottom */}
        <div className="pt-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddItem(item.id, 'note')}
            className={`flex-1 py-1 px-2 text-[11px] font-medium rounded transition-colors flex items-center justify-center gap-1 border border-dashed cursor-pointer ${
              isDark
                ? 'text-neutral-300 hover:text-white hover:bg-white/10 border-neutral-600'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-black/5 border-neutral-200'
            }`}
          >
            <Plus className="w-3 h-3" /> Note
          </button>
          <button
            type="button"
            onClick={() => onAddItem(item.id, 'todo')}
            className={`flex-1 py-1 px-2 text-[11px] font-medium rounded transition-colors flex items-center justify-center gap-1 border border-dashed cursor-pointer ${
              isDark
                ? 'text-neutral-300 hover:text-white hover:bg-white/10 border-neutral-600'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-black/5 border-neutral-200'
            }`}
          >
            <Plus className="w-3 h-3" /> To-do
          </button>
        </div>
      </div>
    </div>
  );
};
