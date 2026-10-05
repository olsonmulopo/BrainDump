import React, { useState, useEffect } from 'react';
import { LineConnectorItem, CanvasItem, ItemColor } from '../../types';
import { calculateLineGeometry } from './ConnectorLine';
import { ColorPickerPopover } from '../ColorPickerPopover';
import {
  Trash2,
  Palette,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Minus,
  Type,
  Check,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface ArrowToolbarProps {
  line: LineConnectorItem;
  fromItem?: CanvasItem;
  toItem?: CanvasItem;
  allItems?: Record<string, CanvasItem>;
  onUpdateLine: (updates: Partial<LineConnectorItem>) => void;
  onDelete: () => void;
}

export const ArrowToolbar: React.FC<ArrowToolbarProps> = ({
  line,
  fromItem,
  toItem,
  allItems,
  onUpdateLine,
  onDelete,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(line.label || '');

  useEffect(() => {
    setLabelText(line.label || '');
  }, [line.label]);

  const isReverse = Boolean(line.arrowStart && !line.arrowEnd);
  const isCollapsed = Boolean(line.isCollapsed);
  const geom = calculateLineGeometry(fromItem, toItem, allItems, isCollapsed, isReverse);
  if (!geom) return null;

  const { midX, midY } = geom;

  const lineColor = line.colorHex || line.customColor || '#6366f1';

  // Direction mode:
  // - 'line': plain line (arrowStart=false, arrowEnd=false)
  // - 'forward': source to target (arrowStart=false, arrowEnd=true or default)
  // - 'reverse': target to source (arrowStart=true, arrowEnd=false)
  // - 'both': bidirectional (arrowStart=true, arrowEnd=true)
  const isEndArrow = line.arrowEnd !== false;
  const isStartArrow = Boolean(line.arrowStart);

  let currentDirection: 'line' | 'forward' | 'reverse' | 'both' = 'forward';
  if (!isStartArrow && !isEndArrow) {
    currentDirection = 'line';
  } else if (!isStartArrow && isEndArrow) {
    currentDirection = 'forward';
  } else if (isStartArrow && !isEndArrow) {
    currentDirection = 'reverse';
  } else if (isStartArrow && isEndArrow) {
    currentDirection = 'both';
  }

  const setDirection = (mode: 'line' | 'forward' | 'reverse' | 'both') => {
    switch (mode) {
      case 'line':
        onUpdateLine({ arrowStart: false, arrowEnd: false });
        break;
      case 'forward':
        onUpdateLine({ arrowStart: false, arrowEnd: true });
        break;
      case 'reverse':
        onUpdateLine({ arrowStart: true, arrowEnd: false });
        break;
      case 'both':
        onUpdateLine({ arrowStart: true, arrowEnd: true });
        break;
    }
  };

  const handleSaveLabel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateLine({ label: labelText.trim() || undefined });
    setIsEditingLabel(false);
  };

  return (
    <div
      id={`arrow-toolbar-${line.id}`}
      className="absolute z-40 -translate-x-1/2 -translate-y-1/2 pointer-events-auto select-none no-drag"
      style={{
        left: `${midX}px`,
        top: `${midY - 38}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-2 py-1 rounded-xl shadow-xl border border-neutral-200/90 dark:border-neutral-700/90 text-neutral-700 dark:text-neutral-200 text-xs no-drag">
        {isEditingLabel ? (
          <form
            onSubmit={handleSaveLabel}
            className="flex items-center gap-1 no-drag"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={() => handleSaveLabel()}
              autoFocus
              placeholder="Arrow label..."
              className="px-2 py-0.5 bg-white dark:bg-neutral-800 border border-indigo-500 rounded-md text-xs font-medium text-neutral-800 dark:text-neutral-100 text-center shadow-xs focus:outline-hidden no-drag w-28"
            />
            <button
              type="submit"
              className="p-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer no-drag shadow-2xs"
              title="Save label"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditingLabel(false)}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer no-drag"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <>
            {/* Direction Segmented Control */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200/70 dark:border-neutral-700/70">
              <button
                type="button"
                onClick={() => setDirection('line')}
                className={`p-1 rounded-md transition-colors no-drag cursor-pointer ${
                  currentDirection === 'line'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-700'
                }`}
                title="Line with dots (●—●)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setDirection('forward')}
                className={`p-1 rounded-md transition-colors no-drag cursor-pointer ${
                  currentDirection === 'forward'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-700'
                }`}
                title="Forward arrow (→)"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setDirection('reverse')}
                className={`p-1 rounded-md transition-colors no-drag cursor-pointer ${
                  currentDirection === 'reverse'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-700'
                }`}
                title="Reverse arrow (←)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setDirection('both')}
                className={`p-1 rounded-md transition-colors no-drag cursor-pointer ${
                  currentDirection === 'both'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-700'
                }`}
                title="Bidirectional arrow (↔)"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Color Swatch & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 transition-colors no-drag cursor-pointer"
                title="Change arrow color"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shrink-0 shadow-2xs"
                  style={{ backgroundColor: lineColor }}
                />
                <Palette className="w-3 h-3 text-neutral-400 dark:text-neutral-400" />
              </button>

              {showColorPicker && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 no-drag"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ColorPickerPopover
                    currentColor={line.color}
                    customColor={line.colorHex || line.customColor}
                    onChangeColor={(color: ItemColor, customHex?: string) => {
                      const hex = customHex || '#6366f1';
                      onUpdateLine({
                        color,
                        colorHex: hex,
                        customColor: customHex,
                      });
                      setShowColorPicker(false);
                    }}
                    onClose={() => setShowColorPicker(false)}
                  />
                </div>
              )}
            </div>

            {/* Line Style Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextStyle =
                  line.style === 'solid' || !line.style
                    ? 'dashed'
                    : line.style === 'dashed'
                    ? 'dotted'
                    : 'solid';
                onUpdateLine({ style: nextStyle });
              }}
              className="px-1.5 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 font-mono text-[10px] text-neutral-600 dark:text-neutral-300 uppercase transition-colors no-drag cursor-pointer"
              title={`Style: ${line.style || 'solid'}`}
            >
              {line.style === 'dashed' ? 'Dashed' : line.style === 'dotted' ? 'Dotted' : 'Solid'}
            </button>

            {/* Label Button */}
            <button
              type="button"
              onClick={() => {
                setIsEditingLabel(true);
                setLabelText(line.label || '');
              }}
              className={`p-1 rounded-md transition-colors no-drag cursor-pointer ${
                line.label
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={line.label ? `Label: "${line.label}"` : 'Add text label'}
            >
              <Type className="w-3.5 h-3.5" />
            </button>

            {/* Collapse / Expand Target Toggle */}
            <button
              type="button"
              onClick={() => onUpdateLine({ isCollapsed: !line.isCollapsed })}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md transition-colors no-drag cursor-pointer ${
                line.isCollapsed
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={
                line.isCollapsed
                  ? 'Expand target card (show on canvas)'
                  : 'Collapse target card (hide to declutter canvas)'
              }
            >
              {line.isCollapsed ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] font-semibold">Expand</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium hidden sm:inline">Collapse</span>
                </>
              )}
            </button>

            {/* Delete Arrow Button */}
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 text-neutral-400 hover:text-red-500 transition-colors no-drag cursor-pointer"
              title="Delete arrow connection"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
