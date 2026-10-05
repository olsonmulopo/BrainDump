import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  COLOR_PALETTE,
  PASTEL_PALETTE,
  VIBRANT_PALETTE,
  DARK_SLATE_PALETTE,
  SwatchColor,
  findMatchingPreset,
  isColorDark,
} from '../utils/theme';
import { ItemColor } from '../types';
import {
  Check,
  Palette,
  X,
  Plus,
  Trash2,
  Pipette,
  Copy,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface ColorPickerPopoverProps {
  currentColor?: ItemColor;
  customColor?: string;
  onChangeColor: (color: ItemColor, customColor?: string) => void;
  onClose?: () => void;
  showNoneOption?: boolean;
  isDark?: boolean;
}

const STORAGE_SAVED_COLORS = 'milanote_user_saved_colors';
const STORAGE_RECENT_COLORS = 'milanote_recent_colors';

const INITIAL_USER_SAVED = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

type PaletteCategory = 'pastel' | 'vibrant' | 'dark' | 'myColors';

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  currentColor,
  customColor,
  onChangeColor,
  onClose,
  showNoneOption = false,
  isDark: propIsDark,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active color resolution
  const activeColorHex =
    customColor ||
    COLOR_PALETTE.find((c) => c.id === currentColor)?.preview ||
    '#ffffff';

  const [hexInput, setHexInput] = useState(activeColorHex);
  const [activeTab, setActiveTab] = useState<PaletteCategory>('pastel');
  const [hasCopied, setHasCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User's custom default colors (persisted in localStorage)
  const [savedColors, setSavedColors] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_COLORS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_USER_SAVED;
  });

  // Recent colors (persisted in localStorage)
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_RECENT_COLORS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Keep hexInput in sync if customColor changes externally
  useEffect(() => {
    setHexInput(activeColorHex);
  }, [activeColorHex]);

  // Is screen dropper API available?
  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Position popover relative to anchor in fixed screen coordinates, preventing clipping
  useLayoutEffect(() => {
    const updatePosition = () => {
      const parent = sentinelRef.current?.parentElement;
      if (!parent) return;
      const anchor = parent.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = containerRef.current?.offsetHeight || 380;
      const padding = 12;

      // If anchor has moved out of visible screen, close
      if (
        anchor.bottom < 0 ||
        anchor.top > window.innerHeight ||
        anchor.right < 0 ||
        anchor.left > window.innerWidth
      ) {
        onClose?.();
        return;
      }

      // Determine top position:
      // Prefer below the trigger button (downward popup), otherwise flip above if space is tight below
      let top: number;
      if (anchor.bottom + popoverHeight + 8 <= window.innerHeight - padding) {
        top = anchor.bottom + 6;
      } else if (anchor.top - popoverHeight - 6 >= padding) {
        top = anchor.top - popoverHeight - 6;
      } else {
        top = Math.max(padding, Math.min(anchor.bottom + 6, window.innerHeight - popoverHeight - padding));
      }

      // Determine left position: prefer aligning with trigger left if space allows, otherwise align right edge
      let left: number;
      if (anchor.left + popoverWidth <= window.innerWidth - padding) {
        left = Math.max(padding, anchor.left);
      } else {
        left = Math.max(padding, anchor.right - popoverWidth);
      }

      setCoords({ top: Math.round(top), left: Math.round(left) });
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 30);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [activeTab, onClose]);

  // Dismiss immediately when canvas pans, zooms, or when user interacts outside
  useEffect(() => {
    // 1. Close when canvas navigates (pan or zoom changed)
    const handleCanvasNav = () => {
      onClose?.();
    };
    window.addEventListener('canvas:viewport-change', handleCanvasNav);
    window.addEventListener('canvas:pan-start', handleCanvasNav);
    window.addEventListener('popstate', handleCanvasNav);

    // 2. Close on ANY wheel event outside the popover (e.g. mouse wheel zoom / trackpad zoom / canvas scroll)
    const handleGlobalWheel = (e: WheelEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { capture: true, passive: true });

    // 3. Close on outside pointerdown / mousedown / touchstart with capture (catches all clicks immediately)
    const handleOutsideClick = (e: Event) => {
      const target = e.target as Node | null;
      if (!target) return;

      // Inside popover: do not close
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }

      // Inside trigger element: allow trigger element's onClick to handle toggling
      if (sentinelRef.current?.parentElement && sentinelRef.current.parentElement.contains(target)) {
        return;
      }

      onClose?.();
    };
    document.addEventListener('pointerdown', handleOutsideClick, { capture: true });
    document.addEventListener('mousedown', handleOutsideClick, { capture: true });
    document.addEventListener('touchstart', handleOutsideClick, { capture: true });

    // 4. Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // 5. Close when window blurs (user leaves browser tab or window)
    const handleWindowBlur = () => {
      onClose?.();
    };
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('canvas:viewport-change', handleCanvasNav);
      window.removeEventListener('canvas:pan-start', handleCanvasNav);
      window.removeEventListener('popstate', handleCanvasNav);
      window.removeEventListener('wheel', handleGlobalWheel, { capture: true });
      document.removeEventListener('pointerdown', handleOutsideClick, { capture: true });
      document.removeEventListener('mousedown', handleOutsideClick, { capture: true });
      document.removeEventListener('touchstart', handleOutsideClick, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [onClose]);

  // Prevent wheel events from panning the background canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const stopWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    el.addEventListener('wheel', stopWheel, { passive: true });
    return () => el.removeEventListener('wheel', stopWheel);
  }, []);

  // Save to recent colors
  const pushToRecent = (hex: string) => {
    try {
      const clean = hex.trim().toLowerCase();
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c.toLowerCase() !== clean);
        const updated = [clean, ...filtered].slice(0, 8);
        localStorage.setItem(STORAGE_RECENT_COLORS, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore storage error
    }
  };

  // Apply a hex color
  const applyHex = (hex: string) => {
    const cleanHex = hex.trim();
    if (!/^#[0-9A-Fa-f]{3,8}$/.test(cleanHex)) return;

    const matchedPreset = findMatchingPreset(cleanHex);
    if (matchedPreset) {
      onChangeColor(matchedPreset, undefined);
    } else {
      onChangeColor('default', cleanHex);
    }
    pushToRecent(cleanHex);
  };

  const handleCustomHexChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      applyHex(hex);
    }
  };

  const handleSelectSwatch = (swatch: SwatchColor) => {
    setHexInput(swatch.hex);
    if (swatch.presetId) {
      onChangeColor(swatch.presetId, undefined);
    } else {
      onChangeColor('default', swatch.hex);
    }
    pushToRecent(swatch.hex);
  };

  // User adds current color to "My Colors"
  const handleSaveCurrentColor = () => {
    const colorToSave = (customColor || hexInput || '#6366f1').toLowerCase();
    if (!savedColors.some((c) => c.toLowerCase() === colorToSave)) {
      const updated = [colorToSave, ...savedColors].slice(0, 18);
      setSavedColors(updated);
      try {
        localStorage.setItem(STORAGE_SAVED_COLORS, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  // User deletes a color from "My Colors"
  const handleDeleteSavedColor = (hexToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedColors.filter((c) => c.toLowerCase() !== hexToDelete.toLowerCase());
    setSavedColors(updated);
    try {
      localStorage.setItem(STORAGE_SAVED_COLORS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // EyeDropper screen sampler
  const handleOpenEyeDropper = async () => {
    if (!hasEyeDropper) return;
    try {
      const EyeDropperClass = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
      const eyeDropper = new EyeDropperClass();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        setHexInput(result.sRGBHex);
        applyHex(result.sRGBHex);
      }
    } catch {
      // User cancelled eye dropper
    }
  };

  // Copy HEX to clipboard
  const handleCopyHex = () => {
    const text = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    navigator.clipboard?.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 1400);
  };

  // Random / Inspire Palette generator
  const handleRandomInspire = () => {
    const allSwatches = [...PASTEL_PALETTE, ...VIBRANT_PALETTE, ...DARK_SLATE_PALETTE];
    const randomItem = allSwatches[Math.floor(Math.random() * allSwatches.length)];
    handleSelectSwatch(randomItem);
  };

  // Reset to default
  const handleResetDefault = () => {
    onChangeColor('default', undefined);
    setHexInput('#ffffff');
  };

  // Dedicated helper to ensure strictly ONE color swatch is selected at a time
  const isSwatchSelected = (swatch: SwatchColor): boolean => {
    if (customColor) {
      return swatch.hex.toLowerCase() === customColor.trim().toLowerCase();
    }
    // When no customColor is set, the item uses a preset (or 'default' if not explicitly defined)
    const activePreset = currentColor || 'default';
    if (swatch.presetId) {
      return swatch.presetId === activePreset;
    }
    return false;
  };

  const isCurrentDark = isColorDark(hexInput || activeColorHex);

  const popoverContent = (
    <div
      ref={containerRef}
      data-scrollable="true"
      style={{
        position: 'fixed',
        top: coords ? `${coords.top}px` : '-9999px',
        left: coords ? `${coords.left}px` : '-9999px',
        zIndex: 99999,
      }}
      className="bg-white/95 dark:bg-[#18191e]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-neutral-700/80 p-3.5 w-80 text-xs select-none animate-in fade-in zoom-in-95 duration-100 text-neutral-800 dark:text-neutral-100"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-[13px] block leading-tight">
              Color Palette
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {hasEyeDropper && (
            <button
              type="button"
              onClick={handleOpenEyeDropper}
              className="p-1.5 text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Pick color from screen (Eyedropper)"
            >
              <Pipette className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleRandomInspire}
            className="p-1.5 text-neutral-500 hover:text-amber-500 dark:text-neutral-400 dark:hover:text-amber-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Inspire me with a random designer color"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetDefault}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Reset color to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ml-0.5"
              title="Close palette"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Palette Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100/90 dark:bg-neutral-800/80 rounded-xl mb-3 text-[11px] font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('pastel')}
          className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
            activeTab === 'pastel'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Pastels
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('vibrant')}
          className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
            activeTab === 'vibrant'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Vibrant
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dark')}
          className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
            activeTab === 'dark'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Slate / Dark
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('myColors')}
          className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer relative ${
            activeTab === 'myColors'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          My Colors
          {savedColors.length > 0 && (
            <span className="ml-1 px-1 py-0.2 rounded-full text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              {savedColors.length}
            </span>
          )}
        </button>
      </div>

      {/* Swatches Display according to active tab */}
      {activeTab === 'pastel' && (
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {PASTEL_PALETTE.map((swatch) => {
            const isSelected = isSwatchSelected(swatch);
            const swatchDark = isColorDark(swatch.hex);

            return (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => handleSelectSwatch(swatch)}
                className={`w-10 h-8 rounded-lg flex items-center justify-center transition-all relative border cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-neutral-900 scale-105 shadow-xs'
                    : 'hover:scale-105 hover:shadow-xs'
                } border-black/10 dark:border-white/15`}
                style={{ backgroundColor: swatch.hex }}
                title={`${swatch.name} (${swatch.hex})`}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${swatchDark ? 'text-white' : 'text-neutral-900'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'vibrant' && (
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {VIBRANT_PALETTE.map((swatch) => {
            const isSelected = isSwatchSelected(swatch);
            const swatchDark = isColorDark(swatch.hex);

            return (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => handleSelectSwatch(swatch)}
                className={`w-10 h-8 rounded-lg flex items-center justify-center transition-all relative border cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-neutral-900 scale-105 shadow-xs'
                    : 'hover:scale-105 hover:shadow-xs'
                } border-black/10 dark:border-white/15`}
                style={{ backgroundColor: swatch.hex }}
                title={`${swatch.name} (${swatch.hex})`}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${swatchDark ? 'text-white' : 'text-neutral-900'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'dark' && (
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {DARK_SLATE_PALETTE.map((swatch) => {
            const isSelected = isSwatchSelected(swatch);
            const swatchDark = isColorDark(swatch.hex);

            return (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => handleSelectSwatch(swatch)}
                className={`w-10 h-8 rounded-lg flex items-center justify-center transition-all relative border cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-neutral-900 scale-105 shadow-xs'
                    : 'hover:scale-105 hover:shadow-xs'
                } border-black/10 dark:border-white/15`}
                style={{ backgroundColor: swatch.hex }}
                title={`${swatch.name} (${swatch.hex})`}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${swatchDark ? 'text-white' : 'text-neutral-900'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* User's Saved Colors Tab */}
      {activeTab === 'myColors' && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              Personal Default Swatches
            </span>
            <button
              type="button"
              onClick={handleSaveCurrentColor}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Plus className="w-3 h-3" />
              {saveSuccess ? 'Saved!' : 'Save current'}
            </button>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {savedColors.map((hex) => {
              const isSelected = customColor?.toLowerCase() === hex.toLowerCase();
              const swatchDark = isColorDark(hex);

              return (
                <div key={hex} className="relative group/swatch">
                  <button
                    type="button"
                    onClick={() => {
                      setHexInput(hex);
                      applyHex(hex);
                    }}
                    className={`w-10 h-8 rounded-lg flex items-center justify-center transition-all relative border cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-neutral-900 scale-105 shadow-xs'
                        : 'hover:scale-105 hover:shadow-xs'
                    } border-black/10 dark:border-white/15`}
                    style={{ backgroundColor: hex }}
                    title={`Custom Swatch (${hex})`}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 ${swatchDark ? 'text-white' : 'text-neutral-900'}`}
                      />
                    )}
                  </button>

                  {/* Delete button on hover */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSavedColor(hex, e)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900/85 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/swatch:opacity-100 transition-opacity cursor-pointer shadow-xs z-10"
                    title="Remove from saved colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}

            {/* Quick Add Button */}
            <button
              type="button"
              onClick={handleSaveCurrentColor}
              className="w-10 h-8 rounded-lg flex flex-col items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-400 hover:text-indigo-600 hover:border-indigo-400 dark:hover:text-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800"
              title="Add current color to My Colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Recents Bar (if any exists) */}
      {recentColors.length > 0 && activeTab !== 'myColors' && (
        <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 shrink-0">
            Recent:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
            {recentColors.map((hex) => {
              const isSelected = customColor?.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    setHexInput(hex);
                    applyHex(hex);
                  }}
                  className={`w-5 h-5 rounded-md border transition-transform cursor-pointer shrink-0 ${
                    isSelected
                      ? 'scale-110 ring-1 ring-indigo-500 ring-offset-1 dark:ring-offset-neutral-900 border-white'
                      : 'border-black/10 dark:border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Color Input & Contrast Indicator */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            Custom HEX & Spectrum
          </span>

          {/* Live Contrast Aa Pill */}
          <div
            className="px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors flex items-center gap-1 shadow-2xs"
            style={{
              backgroundColor: hexInput,
              color: isCurrentDark ? '#ffffff' : '#18181b',
              borderColor: isCurrentDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
            }}
            title={isCurrentDark ? 'Dark background: White text' : 'Light background: Dark text'}
          >
            <span>Aa Preview</span>
            <span className="text-[9px] opacity-75 font-normal">
              ({isCurrentDark ? 'Dark' : 'Light'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* HTML5 Native Color Picker Wheel */}
          <div
            className="relative w-8 h-8 rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-600 shrink-0 cursor-pointer shadow-xs transition-transform hover:scale-105"
            style={{ backgroundColor: hexInput }}
            title="Click to open color wheel"
          >
            <input
              type="color"
              value={hexInput.startsWith('#') && hexInput.length === 7 ? hexInput : '#6366f1'}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer opacity-0"
              title="Click to open color spectrum"
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 hover:opacity-60 transition-opacity">
              <div className="w-2 h-2 rounded-full border border-black/50 dark:border-white/50" />
            </div>
          </div>

          {/* Hex Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyHex(hexInput);
                }
              }}
              placeholder="#6366F1"
              maxLength={9}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-neutral-800 transition-all uppercase"
            />
          </div>

          {/* Copy Hex Button */}
          <button
            type="button"
            onClick={handleCopyHex}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl font-medium transition-colors cursor-pointer"
            title="Copy HEX code"
          >
            {hasCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Apply Button */}
          <button
            type="button"
            onClick={() => applyHex(hexInput)}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer shadow-xs"
          >
            Apply
          </button>
        </div>

        {/* Quick Save Current to My Colors shortcut */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px]">
          <span className="text-neutral-400 dark:text-neutral-500">
            {hasCopied ? 'HEX copied to clipboard!' : 'Press Enter or click Apply'}
          </span>
          <button
            type="button"
            onClick={handleSaveCurrentColor}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            {saveSuccess ? 'Color Saved!' : 'Add to My Colors'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <span ref={sentinelRef} className="hidden" aria-hidden="true" />
      {typeof document !== 'undefined' ? createPortal(popoverContent, document.body) : null}
    </>
  );
};
