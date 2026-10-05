import { ItemColor } from '../types';

export interface ColorDefinition {
  id: ItemColor;
  label: string;
  bg: string;
  border: string;
  preview: string;
  text: string;
}

export const COLOR_PALETTE: ColorDefinition[] = [
  { id: 'default', label: 'White', bg: 'bg-white', border: 'border-neutral-200/90', preview: '#ffffff', text: 'text-neutral-900' },
  { id: 'peach', label: 'Peach', bg: 'bg-[#faece4]', border: 'border-[#ebd4c7]', preview: '#faece4', text: 'text-neutral-900' },
  { id: 'purple', label: 'Lavender', bg: 'bg-[#f0ecf8]', border: 'border-[#dbcef0]', preview: '#f0ecf8', text: 'text-neutral-900' },
  { id: 'mint', label: 'Mint', bg: 'bg-[#e8f4ed]', border: 'border-[#cae5d4]', preview: '#e8f4ed', text: 'text-neutral-900' },
  { id: 'blue', label: 'Sky', bg: 'bg-[#e7f1f9]', border: 'border-[#c7def2]', preview: '#e7f1f9', text: 'text-neutral-900' },
  { id: 'yellow', label: 'Butter', bg: 'bg-[#fbf7dc]', border: 'border-[#ece4b7]', preview: '#fbf7dc', text: 'text-neutral-900' },
  { id: 'rose', label: 'Rose', bg: 'bg-[#fde8e8]', border: 'border-[#fbd0d0]', preview: '#fde8e8', text: 'text-neutral-900' },
  { id: 'amber', label: 'Amber', bg: 'bg-[#fef3c7]', border: 'border-[#fde68a]', preview: '#fef3c7', text: 'text-neutral-900' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-[#e0e7ff]', border: 'border-[#c7d2fe]', preview: '#e0e7ff', text: 'text-neutral-900' },
  { id: 'emerald', label: 'Sage', bg: 'bg-[#d1fae5]', border: 'border-[#a7f3d0]', preview: '#d1fae5', text: 'text-neutral-900' },
  { id: 'dark', label: 'Charcoal', bg: 'bg-[#292e35]', border: 'border-[#3d454f]', preview: '#292e35', text: 'text-white' },
];

export interface SwatchColor {
  hex: string;
  name: string;
  presetId?: ItemColor;
}

export const PASTEL_PALETTE: SwatchColor[] = [
  { hex: '#ffffff', name: 'Clean White', presetId: 'default' },
  { hex: '#faece4', name: 'Warm Peach', presetId: 'peach' },
  { hex: '#fde8e8', name: 'Blush Rose', presetId: 'rose' },
  { hex: '#fef3c7', name: 'Butter Chiffon', presetId: 'amber' },
  { hex: '#fbf7dc', name: 'Canary Yellow', presetId: 'yellow' },
  { hex: '#e8f4ed', name: 'Mint Sage', presetId: 'mint' },
  { hex: '#d1fae5', name: 'Pale Emerald', presetId: 'emerald' },
  { hex: '#e7f1f9', name: 'Sky Blue', presetId: 'blue' },
  { hex: '#e0e7ff', name: 'Periwinkle', presetId: 'indigo' },
  { hex: '#f0ecf8', name: 'Lavender Mist', presetId: 'purple' },
  { hex: '#ffedd5', name: 'Apricot Cream' },
  { hex: '#fce7f3', name: 'Lilac Cloud' },
];

export const VIBRANT_PALETTE: SwatchColor[] = [
  { hex: '#ef4444', name: 'Coral Red' },
  { hex: '#f97316', name: 'Tangerine' },
  { hex: '#f59e0b', name: 'Amber Gold' },
  { hex: '#10b981', name: 'Emerald Green' },
  { hex: '#06b6d4', name: 'Teal Cyan' },
  { hex: '#3b82f6', name: 'Electric Blue' },
  { hex: '#6366f1', name: 'Royal Indigo' },
  { hex: '#8b5cf6', name: 'Violet Iris' },
  { hex: '#ec4899', name: 'Hot Fuchsia' },
  { hex: '#84cc16', name: 'Cyber Lime' },
  { hex: '#e11d48', name: 'Crimson Berry' },
  { hex: '#14b8a6', name: 'Ocean Teal' },
];

export const DARK_SLATE_PALETTE: SwatchColor[] = [
  { hex: '#ffffff', name: 'Pure White', presetId: 'default' },
  { hex: '#e2e8f0', name: 'Slate Silver' },
  { hex: '#94a3b8', name: 'Muted Slate' },
  { hex: '#475569', name: 'Steel Gray' },
  { hex: '#292e35', name: 'Charcoal Dark', presetId: 'dark' },
  { hex: '#1e293b', name: 'Night Slate' },
  { hex: '#18181b', name: 'Obsidian Black' },
  { hex: '#0f172a', name: 'Midnight Navy' },
  { hex: '#064e3b', name: 'Deep Evergreen' },
  { hex: '#3b0764', name: 'Dark Plum' },
  { hex: '#4c0519', name: 'Dark Wine' },
  { hex: '#262626', name: 'Carbon Black' },
];

export function findMatchingPreset(hex: string): ItemColor | undefined {
  if (!hex) return undefined;
  const clean = hex.trim().toLowerCase();
  const match = COLOR_PALETTE.find((p) => p.preview.toLowerCase() === clean);
  return match?.id;
}

/**
 * Checks if a hex color is light or dark to pick contrasting text.
 * Uses perceived brightness (ITU-R BT.601 luminance). Any color
 * with brightness < 155 requires white text and high-contrast light elements.
 */
export function isColorDark(hex: string): boolean {
  if (!hex) return false;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  // Perceived luminance formula: 0.299 R + 0.587 G + 0.114 B
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 155;
}

export function getItemColorClasses(color?: ItemColor): { bg: string; border: string; text: string } {
  switch (color) {
    case 'peach':
      return { bg: 'bg-[#faece4]', border: 'border-[#ebd4c7]', text: 'text-neutral-900' };
    case 'purple':
      return { bg: 'bg-[#f0ecf8]', border: 'border-[#dbcef0]', text: 'text-neutral-900' };
    case 'mint':
      return { bg: 'bg-[#e8f4ed]', border: 'border-[#cae5d4]', text: 'text-neutral-900' };
    case 'blue':
      return { bg: 'bg-[#e7f1f9]', border: 'border-[#c7def2]', text: 'text-neutral-900' };
    case 'yellow':
      return { bg: 'bg-[#fbf7dc]', border: 'border-[#ece4b7]', text: 'text-neutral-900' };
    case 'rose':
      return { bg: 'bg-[#fde8e8]', border: 'border-[#fbd0d0]', text: 'text-neutral-900' };
    case 'amber':
      return { bg: 'bg-[#fef3c7]', border: 'border-[#fde68a]', text: 'text-neutral-900' };
    case 'indigo':
      return { bg: 'bg-[#e0e7ff]', border: 'border-[#c7d2fe]', text: 'text-neutral-900' };
    case 'emerald':
      return { bg: 'bg-[#d1fae5]', border: 'border-[#a7f3d0]', text: 'text-neutral-900' };
    case 'dark':
      return { bg: 'bg-[#292e35]', border: 'border-[#3d454f]', text: 'text-white' };
    default:
      return { bg: 'bg-white', border: 'border-neutral-200/90', text: 'text-neutral-900' };
  }
}

/**
 * Returns balanced, high-contrast styles for any element regardless of app theme.
 * The text readability is guaranteed on every background color.
 */
export function getItemColorStyles(
  color?: ItemColor,
  customColor?: string
): {
  className: string;
  style?: React.CSSProperties;
  textColorClass: string;
  textSecondaryClass: string;
  textMutedClass: string;
  iconClass: string;
  actionButtonClass: string;
  placeholderClass: string;
  isDark: boolean;
} {
  if (customColor && customColor.trim().startsWith('#')) {
    const dark = isColorDark(customColor);
    return {
      className: dark ? 'text-white' : 'text-neutral-900',
      style: {
        backgroundColor: customColor,
        borderColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)',
        color: dark ? '#ffffff' : '#0f172a',
      },
      textColorClass: dark ? 'text-white' : 'text-neutral-900',
      textSecondaryClass: dark ? 'text-neutral-200' : 'text-neutral-700',
      textMutedClass: dark ? 'text-neutral-400' : 'text-neutral-500',
      iconClass: dark ? 'text-neutral-300 hover:text-white' : 'text-neutral-500 hover:text-neutral-900',
      actionButtonClass: dark ? 'text-white/80 hover:text-white hover:bg-white/15' : 'text-neutral-500 hover:text-neutral-800 hover:bg-black/5',
      placeholderClass: dark ? 'placeholder:text-white/45' : 'placeholder:text-neutral-400',
      isDark: dark,
    };
  }

  const dark = color === 'dark';
  const classes = getItemColorClasses(color);

  return {
    className: `${classes.bg} ${classes.border} ${classes.text}`,
    textColorClass: dark ? 'text-white' : 'text-neutral-900',
    textSecondaryClass: dark ? 'text-neutral-200' : 'text-neutral-700',
    textMutedClass: dark ? 'text-neutral-400' : 'text-neutral-500',
    iconClass: dark ? 'text-neutral-300 hover:text-white' : 'text-neutral-500 hover:text-neutral-900',
    actionButtonClass: dark ? 'text-white/80 hover:text-white hover:bg-white/15' : 'text-neutral-500 hover:text-neutral-800 hover:bg-black/5',
    placeholderClass: dark ? 'placeholder:text-white/45' : 'placeholder:text-neutral-400',
    isDark: dark,
  };
}
