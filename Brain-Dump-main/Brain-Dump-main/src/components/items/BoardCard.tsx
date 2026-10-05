import React, { useState, useEffect } from 'react';
import { BoardItem, ItemColor } from '../../types';
import { getItemColorStyles } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import {
  Folder,
  FolderArchive,
  FolderGit2,
  FolderKanban,
  Archive,
  Inbox,
  Package,
  Box,
  Bookmark,
  Tag,
  Pin,
  Star,
  Flag,
  CheckSquare,
  ClipboardList,
  FileText,
  BookOpen,
  Book,
  Briefcase,
  Building2,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Trophy,
  Award,
  Zap,
  Flame,
  Lightbulb,
  Sparkles,
  Rocket,
  Shield,
  Activity,
  Code,
  Terminal,
  Cpu,
  Database,
  Globe,
  Laptop,
  Smartphone,
  Server,
  GitBranch,
  Key,
  Lock,
  Layout,
  Layers,
  Palette,
  Wand2,
  Paintbrush,
  PenTool,
  Image as ImageIcon,
  Camera,
  Film,
  Video,
  Music,
  Headphones,
  Mic,
  Disc,
  Scissors,
  GraduationCap,
  Coffee,
  Utensils,
  Heart,
  Smile,
  Sun,
  Moon,
  Compass,
  MapPin,
  Plane,
  ShoppingBag,
  Coins,
  DollarSign,
  Users,
  User,
  MessageSquare,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  Edit2,
  Search,
  X,
} from 'lucide-react';

interface BoardCardProps {
  item: BoardItem;
  onOpenBoard: (boardIdOrTitle: string, title?: string, targetBoardId?: string) => void;
  onUpdate: (updates: Partial<BoardItem>) => void;
  onDelete: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  isStandaloneCanvasItem?: boolean;
  isCanvasDark?: boolean;
}

export interface IconDefinition {
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface IconCategory {
  id: string;
  name: string;
  shortLabel: string;
  icons: IconDefinition[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'folders',
    name: 'Folders & Organization',
    shortLabel: 'Folders',
    icons: [
      { name: 'Folder', label: 'Folder', icon: Folder },
      { name: 'FolderKanban', label: 'Kanban', icon: FolderKanban },
      { name: 'FolderArchive', label: 'Archive', icon: FolderArchive },
      { name: 'FolderGit2', label: 'Git Folder', icon: FolderGit2 },
      { name: 'Archive', label: 'Archive Box', icon: Archive },
      { name: 'Inbox', label: 'Inbox', icon: Inbox },
      { name: 'Package', label: 'Package', icon: Package },
      { name: 'Box', label: 'Box', icon: Box },
      { name: 'Bookmark', label: 'Bookmark', icon: Bookmark },
      { name: 'Tag', label: 'Tag', icon: Tag },
      { name: 'Pin', label: 'Pin', icon: Pin },
      { name: 'Star', label: 'Star', icon: Star },
      { name: 'Flag', label: 'Flag', icon: Flag },
      { name: 'CheckSquare', label: 'Tasks', icon: CheckSquare },
      { name: 'ClipboardList', label: 'List', icon: ClipboardList },
    ],
  },
  {
    id: 'business',
    name: 'Work & Productivity',
    shortLabel: 'Work',
    icons: [
      { name: 'Briefcase', label: 'Work', icon: Briefcase },
      { name: 'Building2', label: 'Company', icon: Building2 },
      { name: 'TrendingUp', label: 'Growth', icon: TrendingUp },
      { name: 'BarChart3', label: 'Analytics', icon: BarChart3 },
      { name: 'PieChart', label: 'Metrics', icon: PieChart },
      { name: 'Target', label: 'Goal', icon: Target },
      { name: 'Trophy', label: 'Trophy', icon: Trophy },
      { name: 'Award', label: 'Award', icon: Award },
      { name: 'Zap', label: 'Speed', icon: Zap },
      { name: 'Flame', label: 'Urgent', icon: Flame },
      { name: 'Lightbulb', label: 'Idea', icon: Lightbulb },
      { name: 'Sparkles', label: 'Creative', icon: Sparkles },
      { name: 'Rocket', label: 'Launch', icon: Rocket },
      { name: 'Shield', label: 'Security', icon: Shield },
      { name: 'Activity', label: 'Activity', icon: Activity },
    ],
  },
  {
    id: 'design',
    name: 'Design & Media',
    shortLabel: 'Design',
    icons: [
      { name: 'Layout', label: 'Design', icon: Layout },
      { name: 'Layers', label: 'Layers', icon: Layers },
      { name: 'Palette', label: 'Art', icon: Palette },
      { name: 'Wand2', label: 'Magic', icon: Wand2 },
      { name: 'Paintbrush', label: 'Paint', icon: Paintbrush },
      { name: 'PenTool', label: 'Vector', icon: PenTool },
      { name: 'ImageIcon', label: 'Photos', icon: ImageIcon },
      { name: 'Camera', label: 'Camera', icon: Camera },
      { name: 'Film', label: 'Film', icon: Film },
      { name: 'Video', label: 'Video', icon: Video },
      { name: 'Music', label: 'Music', icon: Music },
      { name: 'Headphones', label: 'Audio', icon: Headphones },
      { name: 'Mic', label: 'Podcast', icon: Mic },
      { name: 'Disc', label: 'Vinyl', icon: Disc },
      { name: 'Scissors', label: 'Craft', icon: Scissors },
    ],
  },
  {
    id: 'tech',
    name: 'Tech & Development',
    shortLabel: 'Tech',
    icons: [
      { name: 'Code', label: 'Code', icon: Code },
      { name: 'Terminal', label: 'Terminal', icon: Terminal },
      { name: 'Cpu', label: 'Hardware', icon: Cpu },
      { name: 'Database', label: 'Database', icon: Database },
      { name: 'Globe', label: 'Web', icon: Globe },
      { name: 'Laptop', label: 'Laptop', icon: Laptop },
      { name: 'Smartphone', label: 'Mobile', icon: Smartphone },
      { name: 'Server', label: 'Server', icon: Server },
      { name: 'GitBranch', label: 'Branch', icon: GitBranch },
      { name: 'Key', label: 'Key', icon: Key },
      { name: 'Lock', label: 'Lock', icon: Lock },
    ],
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle & Social',
    shortLabel: 'Life',
    icons: [
      { name: 'BookOpen', label: 'Docs', icon: BookOpen },
      { name: 'Book', label: 'Book', icon: Book },
      { name: 'FileText', label: 'Notes', icon: FileText },
      { name: 'GraduationCap', label: 'Study', icon: GraduationCap },
      { name: 'Coffee', label: 'Coffee', icon: Coffee },
      { name: 'Utensils', label: 'Food', icon: Utensils },
      { name: 'Heart', label: 'Favorite', icon: Heart },
      { name: 'Smile', label: 'Fun', icon: Smile },
      { name: 'Sun', label: 'Daily', icon: Sun },
      { name: 'Moon', label: 'Night', icon: Moon },
      { name: 'Compass', label: 'Travel', icon: Compass },
      { name: 'MapPin', label: 'Places', icon: MapPin },
      { name: 'Plane', label: 'Flight', icon: Plane },
      { name: 'ShoppingBag', label: 'Shopping', icon: ShoppingBag },
      { name: 'Coins', label: 'Finance', icon: Coins },
      { name: 'DollarSign', label: 'Budget', icon: DollarSign },
      { name: 'Users', label: 'Team', icon: Users },
      { name: 'User', label: 'Personal', icon: User },
      { name: 'MessageSquare', label: 'Discussion', icon: MessageSquare },
      { name: 'Calendar', label: 'Calendar', icon: Calendar },
      { name: 'Clock', label: 'Time', icon: Clock },
    ],
  },
];

export const AVAILABLE_ICONS = ICON_CATEGORIES.flatMap((c) => c.icons);

const IconPickerModal: React.FC<{
  currentIcon?: string;
  onSelectIcon: (name: string) => void;
  onClose: () => void;
}> = ({ currentIcon, onSelectIcon, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Keep icon picker modal strictly inside viewport frame regardless of board card position
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const clampToViewport = () => {
      el.style.transform = '';
      const rect = el.getBoundingClientRect();
      const padding = 12;
      let deltaX = 0;
      let deltaY = 0;

      if (rect.right > window.innerWidth - padding) {
        deltaX = window.innerWidth - padding - rect.right;
      }
      if (rect.left + deltaX < padding) {
        deltaX = padding - rect.left;
      }
      if (rect.bottom > window.innerHeight - padding) {
        deltaY = window.innerHeight - padding - rect.bottom;
      }
      if (rect.top + deltaY < padding) {
        deltaY = padding - rect.top;
      }

      el.style.transform = `translate(calc(-50% + ${Math.round(deltaX)}px), ${Math.round(deltaY)}px)`;
    };

    clampToViewport();
    const timer = setTimeout(clampToViewport, 20);
    window.addEventListener('resize', clampToViewport);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', clampToViewport);
    };
  }, [selectedCategory, search]);

  // Prevent wheel events from propagating to canvas pan listener
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const stopWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    el.addEventListener('wheel', stopWheel, { passive: true });
    return () => el.removeEventListener('wheel', stopWheel);
  }, []);

  const filteredCategories = ICON_CATEGORIES.map((category) => {
    const matching = category.icons.filter(
      (ico) =>
        ico.name.toLowerCase().includes(search.toLowerCase()) ||
        ico.label.toLowerCase().includes(search.toLowerCase())
    );
    return {
      ...category,
      icons: matching,
    };
  }).filter((category) => {
    if (selectedCategory !== 'all' && category.id !== selectedCategory) {
      return false;
    }
    return category.icons.length > 0;
  });

  const totalMatches = filteredCategories.reduce((sum, c) => sum + c.icons.length, 0);

  return (
    <div
      ref={modalRef}
      className="absolute -top-[340px] left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-3.5 w-84 no-drag animate-in fade-in zoom-in-95 text-neutral-800 dark:text-neutral-100"
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-100 dark:border-neutral-800">
        <span className="font-semibold text-xs tracking-tight">
          Choose Board Icon ({AVAILABLE_ICONS.length})
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Pills */}
      <div
        data-scrollable="true"
        onWheel={(e) => e.stopPropagation()}
        className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 custom-scrollbar text-[11px] font-medium select-none"
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-2 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-2xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          All
        </button>
        {ICON_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-2xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {cat.shortLabel}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-2.5">
        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all icons..."
          className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border border-transparent focus:border-indigo-500 focus:outline-none transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Grouped Icons Container with Sleek Dark Custom Scrollbar */}
      <div
        data-scrollable="true"
        onWheel={(e) => e.stopPropagation()}
        className="max-h-56 overflow-y-auto pr-1.5 custom-scrollbar space-y-3"
      >
        {filteredCategories.map((cat) => (
          <div key={cat.id}>
            {/* Group Header */}
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5 px-0.5">
              <span>{cat.name}</span>
              <span className="text-[9px] font-normal opacity-70">
                {cat.icons.length}
              </span>
            </div>

            {/* Icons Grid in this Group */}
            <div className="grid grid-cols-6 gap-1">
              {cat.icons.map((ico) => {
                const IconComp = ico.icon;
                const isCurrent =
                  currentIcon === ico.name ||
                  (currentIcon === 'Image' && ico.name === 'ImageIcon');
                return (
                  <button
                    key={ico.name}
                    type="button"
                    onClick={() => {
                      onSelectIcon(ico.name);
                      onClose();
                    }}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all no-drag cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 ring-1.5 ring-indigo-500 shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title={ico.label}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {totalMatches === 0 && (
          <div className="py-8 text-center text-xs text-neutral-400">
            No icons found matching "{search}"
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="text-indigo-500 hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const BoardCard: React.FC<BoardCardProps> = ({
  item,
  onOpenBoard,
  onUpdate,
  onDelete,
  onSelect,
  isSelected,
  isStandaloneCanvasItem,
  isCanvasDark,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(item.title);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    setTitleText(item.title);
  }, [item.title]);

  useEffect(() => {
    if (!isSelected) {
      setShowIconPicker(false);
      setShowColorPicker(false);
      setIsEditingTitle(false);
    }
  }, [isSelected]);

  const colorStyles = getItemColorStyles(item.color || 'default', item.customColor);

  const handleSaveTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = titleText.trim();
    if (trimmed && trimmed !== item.title) {
      onUpdate({ title: trimmed });
    } else {
      setTitleText(item.title);
    }
    setIsEditingTitle(false);
  };

  const renderIcon = (iconName?: string, className = 'w-5 h-5') => {
    if (iconName === 'Image') return <ImageIcon className={className} />;
    const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const IconComp = found ? found.icon : Folder;
    return <IconComp className={className} />;
  };

  const handleOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onOpenBoard(item.targetBoardId || item.id, item.title, item.targetBoardId);
  };

  // If rendered on canvas as a standalone board launcher
  if (isStandaloneCanvasItem && !item.columnId) {
    return (
      <div
        id={`item-${item.id}`}
        className="group relative flex flex-col items-center select-none px-1"
        onClick={() => {
          setShowIconPicker(false);
          setShowColorPicker(false);
          onSelect?.();
        }}
      >
        {/* Floating Options Bar when Selected or Hovered */}
        <div
          className={`absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs border border-neutral-200/90 dark:border-neutral-700/90 rounded-xl px-1.5 py-1 shadow-md transition-all no-drag ${
            isSelected
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color Picker Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowIconPicker(false);
              }}
              className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer no-drag"
              title="Change board color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <ColorPickerPopover
                currentColor={item.color}
                customColor={item.customColor}
                onChangeColor={(color: ItemColor, customHex?: string) => {
                  onUpdate({ color, customColor: customHex });
                  setShowColorPicker(false);
                }}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>

          {/* Icon Picker Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowIconPicker(!showIconPicker);
              setShowColorPicker(false);
            }}
            className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer no-drag"
            title="Change board icon"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {/* Rename Button */}
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer no-drag"
            title="Rename board"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete()}
            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors cursor-pointer no-drag"
            title="Move to Trash"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Extended Icon picker popup */}
        {showIconPicker && (
          <IconPickerModal
            currentIcon={item.iconName}
            onSelectIcon={(name) => onUpdate({ iconName: name })}
            onClose={() => setShowIconPicker(false)}
          />
        )}

        {/* Big Board Tile with Centered Content */}
        <div
          className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center p-2.5 shadow-xs border transition-all cursor-pointer relative ${
            item.customColor
              ? ''
              : item.color === 'peach'
              ? 'bg-[#edd8cc] border-[#d8c2b5]'
              : item.color === 'purple'
              ? 'bg-[#7e6d9b] text-white border-[#6a5a87]'
              : colorStyles.className
          } ${
            isSelected
              ? 'ring-3 ring-indigo-500 shadow-md scale-102'
              : 'hover:scale-105 hover:shadow-md'
          }`}
          style={item.customColor ? colorStyles.style : undefined}
          onDoubleClick={handleOpen}
          onClick={(e) => {
            e.stopPropagation();
            setShowIconPicker(false);
            setShowColorPicker(false);
            onSelect?.();
          }}
          title="Double-click to open board. Single-click to select options."
        >
          {isEditingTitle ? (
            <form
              onSubmit={handleSaveTitle}
              className="w-full flex items-center justify-center no-drag z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                onBlur={() => handleSaveTitle()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setTitleText(item.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="w-full text-center text-xs font-semibold rounded px-1.5 py-1 shadow-xs bg-white text-neutral-900 border border-indigo-500 focus:outline-none no-drag"
              />
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center text-center w-full h-full gap-1.5 select-none pointer-events-none">
              <div className={`shrink-0 ${colorStyles.isDark ? 'text-white opacity-95' : 'text-neutral-800 opacity-90'}`}>
                {renderIcon(item.iconName, 'w-6 h-6')}
              </div>
              <span
                className={`font-semibold text-xs leading-tight text-center px-1 line-clamp-2 break-words max-w-full tracking-tight ${
                  colorStyles.isDark ? 'text-white' : 'text-neutral-900'
                }`}
                title={item.title}
              >
                {item.title || 'Untitled Board'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Rendered inside a column or stack
  return (
    <div
      id={`item-${item.id}`}
      className={`group relative w-full rounded-md border p-2.5 transition-all select-none ${
        isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'shadow-2xs hover:shadow-xs'
      } ${!item.customColor ? colorStyles.className : ''}`}
      style={item.customColor ? colorStyles.style : undefined}
      onClick={() => onSelect?.()}
    >
      {/* Icon picker popup in column */}
      {showIconPicker && (
        <IconPickerModal
          currentIcon={item.iconName}
          onSelectIcon={(name) => onUpdate({ iconName: name })}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
          onDoubleClick={handleOpen}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          title="Double-click to open board"
        >
          <div className="w-8 h-8 rounded-md bg-black/6 dark:bg-white/10 flex items-center justify-center shrink-0">
            {renderIcon(item.iconName, 'w-4 h-4')}
          </div>
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <form
                onSubmit={handleSaveTitle}
                onClick={(e) => e.stopPropagation()}
                className="no-drag"
              >
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onBlur={() => handleSaveTitle()}
                  autoFocus
                  className="w-full text-xs font-semibold text-neutral-900 bg-white border border-indigo-500 rounded px-1.5 py-0.5 focus:outline-hidden no-drag"
                />
              </form>
            ) : (
              <div
                className={`font-semibold text-xs leading-snug truncate ${
                  colorStyles.isDark ? 'text-white' : 'text-neutral-900'
                }`}
                title={item.title}
              >
                {item.title}
              </div>
            )}
            {item.description && (
              <div
                className={`text-[10px] truncate ${
                  colorStyles.isDark ? 'text-neutral-300' : 'text-neutral-500'
                }`}
              >
                {item.description}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity no-drag">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
                setShowIconPicker(false);
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded no-drag cursor-pointer"
              title="Change card color"
            >
              <Palette className="w-3 h-3" />
            </button>

            {showColorPicker && (
              <ColorPickerPopover
                currentColor={item.color}
                customColor={item.customColor}
                onChangeColor={(color: ItemColor, customHex?: string) => {
                  onUpdate({ color, customColor: customHex });
                  setShowColorPicker(false);
                }}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowIconPicker(!showIconPicker);
              setShowColorPicker(false);
            }}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded no-drag cursor-pointer"
            title="Change board icon"
          >
            <Smile className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded no-drag cursor-pointer"
            title="Rename board"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded no-drag cursor-pointer"
            title="Open board"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-neutral-400 hover:text-red-500 rounded no-drag cursor-pointer"
            title="Move to Trash"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
