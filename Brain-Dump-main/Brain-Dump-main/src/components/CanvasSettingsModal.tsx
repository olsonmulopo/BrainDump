import React, { useState } from 'react';
import {
  X,
  Sun,
  Moon,
  Grid,
  CircleDot,
  Plus,
  Square,
  Magnet,
  Maximize2,
  RotateCcw,
  Sliders,
  Trash2,
  Sparkles,
  Check,
  Info,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  Cloud,
} from 'lucide-react';
import { CanvasBackgroundStyle, CanvasSettings, CanvasTheme } from '../types';

interface CanvasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CanvasSettings;
  onUpdateSettings: (newSettings: Partial<CanvasSettings>) => void;
  onResetZoom: () => void;
  onFitToContent?: () => void;
  onClearStrokes?: () => void;
  hasStrokes?: boolean;
  onOpenWindowsGuide?: () => void;
  defaultTab?: 'canvas' | 'about';
}

const LIGHT_PRESET_COLORS = [
  { hex: '#f6f7f9', name: 'Classic Studio' },
  { hex: '#ffffff', name: 'Pure White' },
  { hex: '#fbf9f4', name: 'Warm Cream' },
  { hex: '#f1f5f9', name: 'Cool Slate' },
  { hex: '#f0fdf4', name: 'Mint Soft' },
];

const DARK_PRESET_COLORS = [
  { hex: '#121316', name: 'Dark Slate' },
  { hex: '#18181b', name: 'Deep Charcoal' },
  { hex: '#090a0f', name: 'Pitch Obsidian' },
  { hex: '#0f172a', name: 'Midnight Navy' },
  { hex: '#1e1b2e', name: 'Deep Violet' },
];

export const CanvasSettingsModal: React.FC<CanvasSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetZoom,
  onFitToContent,
  onClearStrokes,
  hasStrokes = false,
  onOpenWindowsGuide,
  defaultTab = 'canvas',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'canvas' | 'about'>(defaultTab);
  const isDark = settings.theme === 'dark';
  const presetColors = isDark ? DARK_PRESET_COLORS : LIGHT_PRESET_COLORS;
  const currentBgColor =
    settings.canvasColor || (isDark ? DARK_PRESET_COLORS[0].hex : LIGHT_PRESET_COLORS[0].hex);
  const currentDotSize = typeof settings.dotSize === 'number' && settings.dotSize > 0 ? settings.dotSize : 0.9;

  const backgroundStyles: {
    id: CanvasBackgroundStyle;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'dots',
      label: 'Dots Grid',
      description: 'Signature subtle dot grid',
      icon: CircleDot,
    },
    {
      id: 'grid',
      label: 'Square Grid',
      description: 'Classic planning & engineering graph lines',
      icon: Grid,
    },
    {
      id: 'cross',
      label: 'Crosshairs',
      description: 'Technical plus marks at grid intersections',
      icon: Plus,
    },
    {
      id: 'blank',
      label: 'No Grid (Blank)',
      description: 'Clean solid canvas with zero distractions',
      icon: Square,
    },
  ];

  const handleResetDefaults = () => {
    onUpdateSettings({
      backgroundStyle: 'dots',
      theme: 'light',
      snapToGrid: false,
      gridSize: 24,
      dotSize: 0.9,
      canvasColor: '#f6f7f9',
    });
  };

  return (
    <div
      id="canvas-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="canvas-settings-modal"
        className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/80'
            : 'bg-white border-neutral-200/90 text-neutral-900 shadow-neutral-900/15'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-3.5 border-b shrink-0 ${
            isDark ? 'border-neutral-800 bg-neutral-900/90' : 'border-neutral-100 bg-neutral-50/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                activeTab === 'about'
                  ? isDark
                    ? 'bg-blue-950/70 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                  : isDark
                  ? 'bg-indigo-950/70 text-indigo-400'
                  : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {activeTab === 'about' ? <Info className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                {activeTab === 'about' ? 'About Us & Desktop Setup' : 'Canvas Settings'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {activeTab === 'about'
                  ? 'App mission, Windows 10 setup, and subscription-free cloud sync'
                  : 'Appearance, background grid style, and theme preferences'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-canvas-settings"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800'
            }`}
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Canvas & Appearance vs About Us */}
        <div
          className={`flex items-center px-6 border-b shrink-0 gap-6 ${
            isDark ? 'border-neutral-800 bg-neutral-900/60' : 'border-neutral-100 bg-neutral-50/60'
          }`}
        >
          <button
            type="button"
            id="tab-btn-canvas-settings"
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'canvas'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Canvas & Theme</span>
          </button>

          <button
            type="button"
            id="tab-btn-about-us"
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Us</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
              $0 / mo
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'canvas' ? (
            <>
              {/* Section 1: Night Mode / Light Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-80">
              Color Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-theme-light"
                onClick={() => {
                  onUpdateSettings({
                    theme: 'light',
                    // If the current color was dark, switch to standard light
                    canvasColor: DARK_PRESET_COLORS.some((c) => c.hex === settings.canvasColor)
                      ? LIGHT_PRESET_COLORS[0].hex
                      : settings.canvasColor || LIGHT_PRESET_COLORS[0].hex,
                  });
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  !isDark
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-neutral-800 hover:border-neutral-700 bg-neutral-800/40 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shadow-2xs shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold ${!isDark ? 'text-indigo-950' : 'text-neutral-200'}`}>
                    Light Mode
                  </div>
                  <div className="text-[11px] opacity-70 truncate">Studio daytime canvas</div>
                </div>
              </button>

              <button
                type="button"
                id="btn-theme-dark"
                onClick={() => {
                  onUpdateSettings({
                    theme: 'dark',
                    // If current color was light, switch to standard dark
                    canvasColor: LIGHT_PRESET_COLORS.some((c) => c.hex === settings.canvasColor)
                      ? DARK_PRESET_COLORS[0].hex
                      : settings.canvasColor || DARK_PRESET_COLORS[0].hex,
                  });
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  isDark
                    ? 'border-indigo-500 bg-indigo-950/40 text-white ring-2 ring-indigo-500/30'
                    : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <div className="p-2 rounded-lg bg-indigo-900 text-indigo-300 shadow-2xs shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-neutral-800'}`}>
                    Night Mode
                  </div>
                  <div className="text-[11px] opacity-70 truncate">Eye-friendly dark canvas</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Canvas Background Grid Style */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-80">
                Grid Pattern Style
              </label>
              <span className="text-[11px] text-indigo-500 font-medium">
                {backgroundStyles.find((s) => s.id === settings.backgroundStyle)?.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {backgroundStyles.map((style) => {
                const Icon = style.icon;
                const isSelected = settings.backgroundStyle === style.id;

                return (
                  <button
                    key={style.id}
                    id={`btn-canvas-style-${style.id}`}
                    type="button"
                    onClick={() => onUpdateSettings({ backgroundStyle: style.id })}
                    className={`group relative p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? isDark
                          ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/20'
                          : 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : isDark
                        ? 'border-neutral-800 hover:border-neutral-700 bg-neutral-800/30 hover:bg-neutral-800/60'
                        : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/60 hover:bg-neutral-100/60'
                    }`}
                  >
                    {/* Simulated miniature preview thumbnail */}
                    <div
                      className={`w-full h-12 rounded-lg border mb-2.5 relative overflow-hidden transition-transform group-hover:scale-[1.02] ${
                        isDark ? 'border-neutral-700/60' : 'border-neutral-200/80'
                      }`}
                      style={{
                        backgroundColor: currentBgColor,
                        backgroundImage:
                          style.id === 'dots'
                            ? `radial-gradient(circle, ${
                                isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'
                              } ${currentDotSize}px, transparent ${currentDotSize + 0.4}px)`
                            : style.id === 'grid'
                            ? `linear-gradient(to right, ${
                                isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
                              } 1px, transparent 1px), linear-gradient(to bottom, ${
                                isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
                              } 1px, transparent 1px)`
                            : style.id === 'cross'
                            ? `radial-gradient(circle, ${
                                isDark ? '#64748b' : '#64748b'
                              } 1px, transparent 1px)`
                            : 'none',
                        backgroundSize: '12px 12px',
                        backgroundPosition: '0 0',
                      }}
                    >
                      {/* Mini simulated cards in preview */}
                      <div className="absolute left-2 top-2 w-6 h-4 bg-white dark:bg-neutral-800 rounded shadow-xs border border-black/10 dark:border-white/10" />
                      <div className="absolute right-2.5 bottom-1.5 w-7 h-3 bg-indigo-500/80 rounded-xs shadow-xs" />
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-500' : 'opacity-60'}`} />
                        <span className="text-xs font-semibold leading-tight">{style.label}</span>
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10.5px] opacity-65 mt-1 leading-snug">
                      {style.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Canvas Tone / Color Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-80">
              Canvas Background Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {presetColors.map((preset) => {
                const isSelected =
                  settings.canvasColor === preset.hex ||
                  (!settings.canvasColor && preset.hex === presetColors[0].hex);

                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => onUpdateSettings({ canvasColor: preset.hex })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'border-indigo-500 bg-neutral-800 text-white shadow-xs ring-2 ring-indigo-500/30'
                          : 'border-indigo-600 bg-white text-indigo-950 shadow-xs ring-2 ring-indigo-500/20'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:border-neutral-700'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span>{preset.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-indigo-500 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Grid Density / Spacing */}
          {settings.backgroundStyle !== 'blank' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-80">
                Grid Spacing & Density
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { size: 16, label: 'Dense (16px)' },
                  { size: 24, label: 'Standard (24px)' },
                  { size: 32, label: 'Spacious (32px)' },
                ].map((item) => {
                  const isSelected = (settings.gridSize || 24) === item.size;
                  return (
                    <button
                      key={item.size}
                      type="button"
                      onClick={() => onUpdateSettings({ gridSize: item.size })}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'border-indigo-500 bg-indigo-950/30 text-white font-semibold'
                            : 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                          : isDark
                          ? 'border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4b: Dot Marker Size (Sizer) */}
          {(settings.backgroundStyle === 'dots' || settings.backgroundStyle === 'cross') && (
            <div id="section-dot-sizer">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Dot Marker Size (Sizer)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
                    {currentDotSize.toFixed(1)} px
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {currentDotSize <= 0.6
                      ? 'Ultra Fine'
                      : currentDotSize <= 0.9
                      ? 'Small'
                      : currentDotSize <= 1.4
                      ? 'Medium'
                      : 'Large'}
                  </span>
                </div>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { size: 0.6, label: 'Fine', sub: '0.6px' },
                  { size: 0.9, label: 'Small', sub: '0.9px' },
                  { size: 1.3, label: 'Medium', sub: '1.3px' },
                  { size: 1.8, label: 'Large', sub: '1.8px' },
                ].map((preset) => {
                  const isSelected = Math.abs(currentDotSize - preset.size) < 0.08;
                  return (
                    <button
                      key={preset.size}
                      type="button"
                      id={`btn-dot-size-${preset.label.toLowerCase()}`}
                      onClick={() => onUpdateSettings({ dotSize: preset.size })}
                      className={`py-2 px-1 rounded-xl text-xs border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? isDark
                            ? 'border-indigo-500 bg-indigo-950/30 text-white font-semibold'
                            : 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                          : isDark
                          ? 'border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center justify-center h-4 w-4">
                        <span
                          className="rounded-full bg-current"
                          style={{
                            width: `${Math.max(2.5, preset.size * 3.5)}px`,
                            height: `${Math.max(2.5, preset.size * 3.5)}px`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] leading-none">{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Precision Range Slider */}
              <div className="p-3.5 rounded-xl border bg-neutral-50/50 dark:bg-neutral-800/30 border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between text-[11px] opacity-70 mb-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-neutral-400 inline-block" />
                    Smaller (0.4px)
                  </span>
                  <span>Drag to customize dot size</span>
                  <span className="flex items-center gap-1.5">
                    Larger (2.5px)
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 inline-block" />
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-dot-size"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={currentDotSize}
                  onChange={(e) => onUpdateSettings({ dotSize: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                />

                {/* Live mini preview tile inside modal */}
                <div
                  className="mt-3 w-full h-12 rounded-lg border relative overflow-hidden flex items-center justify-between px-3"
                  style={{
                    backgroundColor: currentBgColor,
                    backgroundImage: `radial-gradient(circle, ${
                      isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'
                    } ${currentDotSize}px, transparent ${currentDotSize + 0.45}px)`,
                    backgroundSize: `${settings.gridSize || 24}px ${settings.gridSize || 24}px`,
                  }}
                >
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded shadow-2xs backdrop-blur-xs ${
                    isDark ? 'bg-neutral-900/85 text-neutral-300 border border-neutral-700/60' : 'bg-white/85 text-neutral-700 border border-neutral-200/80'
                  }`}>
                    Live Preview: {currentDotSize.toFixed(1)}px dot size
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Constant zoom scaling enabled
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Alignment & Snapping */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'border-neutral-800 bg-neutral-800/40' : 'border-neutral-200/80 bg-neutral-50/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  settings.snapToGrid
                    ? 'bg-indigo-600 text-white'
                    : isDark
                    ? 'bg-neutral-800 text-neutral-400'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                <Magnet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">Snap Cards to Grid</div>
                <div className="text-[11px] opacity-70">
                  Align items smoothly to grid increments when dragging
                </div>
              </div>
            </div>

            <button
              type="button"
              id="btn-toggle-snap-grid"
              onClick={() => onUpdateSettings({ snapToGrid: !settings.snapToGrid })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                settings.snapToGrid ? 'bg-indigo-600' : isDark ? 'bg-neutral-700' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.snapToGrid ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Section 6: Canvas Quick Actions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-80">
              Canvas Actions
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onResetZoom();
                  onClose();
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                <span>Reset Zoom (100%)</span>
              </button>

              {onFitToContent && (
                <button
                  type="button"
                  onClick={() => {
                    onFitToContent();
                    onClose();
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    isDark
                      ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Fit to Elements</span>
                </button>
              )}

              {onClearStrokes && hasStrokes && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all freehand drawings on this board?')) {
                      onClearStrokes();
                    }
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer col-span-2 ${
                    isDark
                      ? 'border-red-900/60 hover:bg-red-950/40 text-red-300'
                      : 'border-red-200 hover:bg-red-50 text-red-600'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Board Freehand Drawings</span>
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* About Us & Windows 10 Setup View */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* App Mission & Overview Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark
                ? 'bg-neutral-800/60 border-neutral-700/80 text-neutral-200'
                : 'bg-neutral-50 border-neutral-200 text-neutral-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
                VB
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Visual Board Canvas
                  </h3>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                    v1.3.1 Pro
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    $0 / mo Forever
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                  An infinite, distraction-free spatial whiteboard crafted for creative thinkers, project managers, and designers. Engineered with zero subscriptions, local-first storage, and free Google Drive cloud synchronization.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-3 border-t border-neutral-200/70 dark:border-neutral-700/70">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium">100% Private & Local</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-[11px] font-medium">Google Drive Auto-Sync</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Laptop className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-[11px] font-medium">Windows 10 / 11 Ready</span>
              </div>
            </div>
          </div>

          {/* Windows 10 Pro Setup Guide */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Laptop className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                  Windows 10 Pro Desktop Setup
                </h4>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                No Subscription Needed
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Step 1 */}
              <div
                className={`p-3.5 rounded-xl border flex gap-3 text-xs ${
                  isDark ? 'bg-neutral-800/40 border-neutral-700/80' : 'bg-neutral-50/70 border-neutral-200/80'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <div className="space-y-1 flex-1">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                    <span>Install as Desktop App (Edge or Chrome)</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.2 rounded font-medium">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    In Microsoft Edge or Google Chrome on Windows 10:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-neutral-600 dark:text-neutral-300 space-y-0.5 pl-0.5">
                    <li>Click the three dots menu <strong>(⋯)</strong> in the top-right of your browser.</li>
                    <li>Select <strong>Apps</strong> &gt; <strong>Install this site as an app</strong>.</li>
                    <li>Check <strong>"Pin to Taskbar"</strong> or <strong>"Create Desktop Shortcut"</strong>.</li>
                  </ul>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    Runs in its own clean window without tabs or address bars, exactly like native Windows software.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className={`p-3.5 rounded-xl border flex gap-3 text-xs ${
                  isDark ? 'bg-neutral-800/40 border-neutral-700/80' : 'bg-neutral-50/70 border-neutral-200/80'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <div className="space-y-1 flex-1">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Connect Google Drive for Free Cloud Backup
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Click the <strong>Cloud icon</strong> in the top-right bar to authorize Google Drive. Your boards and notes auto-save into your private Google Drive storage, allowing you to access the exact same workspace from your desktop, laptop, or work PC.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`p-3.5 rounded-xl border flex gap-3 text-xs ${
                  isDark ? 'bg-neutral-800/40 border-neutral-700/80' : 'bg-neutral-50/70 border-neutral-200/80'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </div>
                <div className="space-y-1 flex-1">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    100% Offline & Standalone Operation
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Even without Wi-Fi, the app loads instantly from browser storage. Create notes, drag columns, and track time offline — everything syncs smoothly the next time you connect.
                  </p>
                </div>
              </div>
            </div>

            {onOpenWindowsGuide && (
              <button
                type="button"
                id="btn-open-interactive-windows-guide"
                onClick={() => {
                  onClose();
                  onOpenWindowsGuide();
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors cursor-pointer border border-indigo-200/70 dark:border-indigo-800/70"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Open Detailed Interactive Windows 10 Guide</span>
              </button>
            )}
          </div>

          {/* System Specifications */}
          <div
            className={`p-3.5 rounded-xl border text-[11px] space-y-1.5 ${
              isDark ? 'bg-neutral-900/90 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-medium text-neutral-500">System Architecture:</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">React 18 + Vite + Tailwind CSS</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-neutral-500">Local Persistence:</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">IndexedDB & LocalStorage Engine</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-neutral-500">Cloud Sync:</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">Google Drive REST API v3</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-neutral-500">Subscription Status:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">$0.00 / month (Free & Open)</span>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Modal Footer */}
    <div
      className={`flex items-center justify-between px-6 py-3.5 border-t shrink-0 ${
        isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-100 bg-neutral-50'
      }`}
    >
      {activeTab === 'canvas' ? (
        <>
          <button
            type="button"
            onClick={handleResetDefaults}
            className={`text-xs font-medium transition-colors cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Reset to Defaults
          </button>

          <button
            type="button"
            id="btn-save-canvas-settings"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`text-xs font-medium transition-colors cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            ← Back to Canvas Settings
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </>
      )}
    </div>
      </div>
    </div>
  );
};
