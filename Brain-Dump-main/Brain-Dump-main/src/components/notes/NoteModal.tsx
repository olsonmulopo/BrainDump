import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NoteItem, ItemColor } from '../../types';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { RichTextEditor, RichTextEditorRef } from './RichTextEditor';
import { getWordCount, stripHtml, htmlToMarkdown } from '../../utils/richText';
import {
  X,
  Pin,
  Palette,
  Copy,
  Check,
  Download,
  Trash2,
  Bold,
  Underline,
  Highlighter,
  ListTodo,
  List,
  ListOrdered,
  Moon,
  Sun,
  Coffee,
  Maximize2,
  Minimize2,
  Tag,
  Plus,
  Type,
} from 'lucide-react';

interface NoteModalProps {
  item: NoteItem;
  onUpdate: (updates: Partial<NoteItem>) => void;
  onDelete: () => void;
  onDuplicate?: (item: NoteItem) => void;
  onClose: () => void;
}

export type NoteTheme = 'dark' | 'sepia' | 'light';
export type NoteFontSize = 'sm' | 'base' | 'lg';

export const NoteModal: React.FC<NoteModalProps> = ({
  item,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [newTagText, setNewTagText] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<NoteFontSize>('base');

  // Reading / Writing Theme Mode (Dark, Sepia, Light) like Markdown Reader & Editor
  const [themeMode, setThemeMode] = useState<NoteTheme>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    return 'sepia';
  });

  const richEditorRef = useRef<RichTextEditorRef>(null);

  const content = item.content || '';
  const title = item.title || '';
  const fontFamily = item.fontFamily || 'sans';
  const isPinned = Boolean(item.pinned);
  const tags = item.tags || [];

  // Active theme color tokens inspired by MarkdownOpenerModal
  const activeTheme = useMemo(() => {
    switch (themeMode) {
      case 'dark':
        return {
          id: 'dark',
          modalBg: 'bg-[#1e1f24]',
          windowBorder: 'border-[#33353d]',
          titleBarBg: 'bg-[#25262c] border-b border-[#363842] text-[#f4f4f5]',
          toolbarBg: 'bg-[#1e1f24] border-b border-[#33353d] text-[#d4d4d8]',
          contentBg: 'bg-[#18191c]',
          textColor: 'text-[#e4e4e7]',
          mutedColor: 'text-[#8c909b]',
          inputBg: 'bg-transparent text-[#f4f4f5] placeholder:text-[#5d606a]',
          statusBg: 'bg-[#18191c] border-t border-[#2a2c33] text-[#8c909b]',
          buttonHover: 'hover:bg-white/10 text-neutral-300 hover:text-white',
          activeToggle: 'bg-[#2c2e35] text-white shadow-xs',
          divider: 'bg-[#33353d]',
          badgeBg: 'bg-indigo-600 text-white',
          tagBg: 'bg-[#2c2e35] text-[#d4d4d8]',
        };
      case 'sepia':
        return {
          id: 'sepia',
          modalBg: 'bg-[#f7f2e7]',
          windowBorder: 'border-[#dfd5c2]',
          titleBarBg: 'bg-[#eee7d8] border-b border-[#e2d7c2] text-[#3d372e]',
          toolbarBg: 'bg-[#f7f2e7] border-b border-[#e2d7c2] text-[#6e6354]',
          contentBg: 'bg-[#fbf7ee]',
          textColor: 'text-[#3d372e]',
          mutedColor: 'text-[#7e7464]',
          inputBg: 'bg-transparent text-[#241f17] placeholder:text-[#9e9484]',
          statusBg: 'bg-[#eee7d8] border-t border-[#e2d7c2] text-[#7e7464]',
          buttonHover: 'hover:bg-black/5 text-[#5c5344] hover:text-[#241f17]',
          activeToggle: 'bg-[#eae1d1] text-[#241f17] shadow-xs',
          divider: 'bg-[#dfd5c2]',
          badgeBg: 'bg-[#854d0e] text-amber-50',
          tagBg: 'bg-[#eae0cd] text-[#4a3b2c]',
        };
      case 'light':
      default:
        return {
          id: 'light',
          modalBg: 'bg-[#f9fafb]',
          windowBorder: 'border-[#e5e7eb]',
          titleBarBg: 'bg-[#f3f4f6] border-b border-[#e5e7eb] text-[#1f2937]',
          toolbarBg: 'bg-white border-b border-[#e5e7eb] text-[#4b5563]',
          contentBg: 'bg-white',
          textColor: 'text-[#1f2937]',
          mutedColor: 'text-[#6b7280]',
          inputBg: 'bg-transparent text-[#111827] placeholder:text-[#9ca3af]',
          statusBg: 'bg-[#f3f4f6] border-t border-[#e5e7eb] text-[#6b7280]',
          buttonHover: 'hover:bg-black/5 text-[#4b5563] hover:text-[#111827]',
          activeToggle: 'bg-neutral-100 text-[#111827] shadow-xs',
          divider: 'bg-[#e5e7eb]',
          badgeBg: 'bg-indigo-600 text-white',
          tagBg: 'bg-neutral-100 text-neutral-700',
        };
    }
  }, [themeMode]);

  // Statistics
  const wordCount = getWordCount(content);
  const charCount = stripHtml(content).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Global Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showColorPicker) {
          setShowColorPicker(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showColorPicker, onClose]);

  // Add Tag
  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagText.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      onUpdate({ tags: [...tags, clean], updatedAt: Date.now() });
    }
    setNewTagText('');
    setIsAddingTag(false);
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    onUpdate({ tags: tags.filter((t) => t !== tagToRemove), updatedAt: Date.now() });
  };

  // Copy Note as clean plain text
  const handleCopyNote = () => {
    const cleanBody = stripHtml(content);
    const fullText = title ? `${title}\n\n${cleanBody}` : cleanBody;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download Note
  const handleDownload = (type: 'md' | 'txt') => {
    const cleanContent = type === 'md' ? htmlToMarkdown(content) : stripHtml(content);
    const fullText = `# ${title || 'Note'}\n\n${cleanContent}`;
    const blob = new Blob([fullText], {
      type: type === 'md' ? 'text/markdown' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'note'}.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md bg-black/75 animate-in fade-in select-none ${
        isFullscreen ? 'p-0!' : ''
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-150 border ${
          isFullscreen ? 'h-screen rounded-none' : 'max-w-5xl h-[88vh]'
        } ${activeTheme.modalBg} ${activeTheme.windowBorder}`}
      >
        {/* Top Window Title Bar */}
        <div
          className={`flex items-center justify-between px-3.5 py-2.5 ${activeTheme.titleBarBg} select-none shrink-0`}
        >
          {/* Left: Note App Badge & Note Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-4">
            <div
              className={`w-6 h-6 rounded ${activeTheme.badgeBg} font-bold font-serif flex items-center justify-center text-xs shadow-xs shrink-0`}
            >
              N
            </div>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-semibold text-xs truncate max-w-xs sm:max-w-md">
                {title || 'Untitled Note'}
              </span>
              <span className="text-[10px] opacity-50 font-mono hidden sm:inline">
                - Note App
              </span>
            </div>
          </div>

          {/* Right: Theme Switcher, Fullscreen, and Prominent Close Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 3-way Theme Switcher: Dark, Sepia, Light (Matches Markdown Reader & Editor) */}
            <div
              className="flex items-center p-0.5 rounded-lg bg-black/10 dark:bg-white/5 mr-1"
              title="Writing Theme"
            >
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  themeMode === 'dark' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Charcoal Dark"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('sepia')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  themeMode === 'sepia' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Warm Sepia (Paper)"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  themeMode === 'light' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Clean Light"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-lg ${activeTheme.buttonHover} transition-colors cursor-pointer`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button - ALWAYS clearly visible at top right */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean, Simple Formatting Toolbar: Bold, Underline, Highlighter, Lists */}
        <div
          className={`flex items-center justify-between px-3.5 py-1.5 text-xs select-none shrink-0 ${activeTheme.toolbarBg} overflow-x-auto`}
        >
          {/* Left: Essential Formatting Tools */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Bold */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                richEditorRef.current?.execBold();
              }}
              className={`p-1.5 rounded-lg ${activeTheme.buttonHover} font-bold transition-colors cursor-pointer`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                richEditorRef.current?.execUnderline();
              }}
              className={`p-1.5 rounded-lg ${activeTheme.buttonHover} transition-colors cursor-pointer`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Highlighter (Yellow Highlighter tool) */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                richEditorRef.current?.execHighlight();
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${activeTheme.buttonHover} text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-medium transition-colors cursor-pointer`}
              title="Highlight text in yellow (Ctrl+H)"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Highlight</span>
            </button>

            <div className={`w-px h-4 ${activeTheme.divider} mx-1`} />

            {/* Bullet List */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                richEditorRef.current?.execBulletList();
              }}
              className={`p-1.5 rounded-lg ${activeTheme.buttonHover} transition-colors cursor-pointer`}
              title="Bullet points"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                richEditorRef.current?.execNumberedList();
              }}
              className={`p-1.5 rounded-lg ${activeTheme.buttonHover} transition-colors cursor-pointer`}
              title="Numbered list"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            {/* Task Checklist */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                richEditorRef.current?.execChecklist();
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${activeTheme.buttonHover} text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 font-medium transition-colors cursor-pointer`}
              title="Interactive task checklist"
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Checklist</span>
            </button>

            <div className={`w-px h-4 ${activeTheme.divider} mx-1`} />

            {/* Typography Font: Sans, Serif, Mono */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/5">
              <button
                type="button"
                onClick={() => onUpdate({ fontFamily: 'sans', updatedAt: Date.now() })}
                className={`px-2 py-0.5 rounded text-[11px] font-sans transition-colors cursor-pointer ${
                  fontFamily === 'sans' ? activeTheme.activeToggle : 'opacity-60 hover:opacity-100'
                }`}
                title="Sans-serif"
              >
                Sans
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ fontFamily: 'serif', updatedAt: Date.now() })}
                className={`px-2 py-0.5 rounded text-[11px] font-serif transition-colors cursor-pointer ${
                  fontFamily === 'serif' ? activeTheme.activeToggle : 'opacity-60 hover:opacity-100'
                }`}
                title="Serif"
              >
                Serif
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ fontFamily: 'mono', updatedAt: Date.now() })}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  fontFamily === 'mono' ? activeTheme.activeToggle : 'opacity-60 hover:opacity-100'
                }`}
                title="Monospace"
              >
                Mono
              </button>
            </div>

            {/* Font Size A- / A+ */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/5 ml-1">
              <button
                type="button"
                onClick={() => setFontSize(fontSize === 'lg' ? 'base' : 'sm')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTheme.buttonHover} cursor-pointer`}
                title="Smaller text"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize(fontSize === 'sm' ? 'base' : 'lg')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTheme.buttonHover} cursor-pointer`}
                title="Larger text"
              >
                A+
              </button>
            </div>
          </div>

          {/* Right: Color, Copy, Export, Pin, Delete */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* Color Swatch Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${activeTheme.buttonHover} transition-colors cursor-pointer`}
                title="Change note color"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Color</span>
              </button>

              {showColorPicker && (
                <div
                  className="absolute right-0 top-full mt-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ColorPickerPopover
                    currentColor={item.color}
                    customColor={item.customColor}
                    onChangeColor={(color: ItemColor, customHex?: string) => {
                      onUpdate({ color, customColor: customHex, updatedAt: Date.now() });
                      setShowColorPicker(false);
                    }}
                    onClose={() => setShowColorPicker(false)}
                  />
                </div>
              )}
            </div>

            {/* Pin Note */}
            <button
              type="button"
              onClick={() => onUpdate({ pinned: !isPinned, updatedAt: Date.now() })}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isPinned ? 'bg-amber-500 text-white shadow-xs' : activeTheme.buttonHover
              }`}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            {/* Copy Text */}
            <button
              type="button"
              onClick={handleCopyNote}
              className={`p-1.5 rounded-lg ${activeTheme.buttonHover} transition-colors cursor-pointer`}
              title="Copy note text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={() => handleDownload('md')}
              className={`p-1.5 rounded-lg ${activeTheme.buttonHover} transition-colors cursor-pointer`}
              title="Download as Markdown file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Delete Note */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this note?')) {
                  onDelete();
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Note Body */}
        <div className={`flex-1 overflow-y-auto px-6 sm:px-10 py-6 ${activeTheme.contentBg}`}>
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Note Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => onUpdate({ title: e.target.value, updatedAt: Date.now() })}
              placeholder="Note title..."
              className={`w-full text-2xl sm:text-3xl font-bold outline-none cursor-text select-text transition-colors pb-1 border-b border-transparent focus:border-indigo-500/30 ${activeTheme.inputBg} ${
                fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans'
              }`}
            />

            {/* Note Tags Row */}
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              <Tag className={`w-3.5 h-3.5 ${activeTheme.mutedColor} shrink-0`} />
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${activeTheme.tagBg}`}
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 cursor-pointer"
                    title="Remove tag"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

              {isAddingTag ? (
                <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    placeholder="tag name"
                    autoFocus
                    className={`px-2 py-0.5 rounded text-xs outline-none border border-indigo-400 ${activeTheme.inputBg}`}
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded bg-indigo-600 text-white text-xs cursor-pointer font-medium"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    className={`p-0.5 ${activeTheme.mutedColor} hover:text-rose-500 cursor-pointer`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs opacity-60 hover:opacity-100 ${activeTheme.buttonHover} transition-opacity cursor-pointer`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Tag</span>
                </button>
              )}
            </div>

            {/* Note Text Editor Body */}
            <div className="pt-2">
              <RichTextEditor
                ref={richEditorRef}
                content={content}
                onChange={(newHtml) => {
                  onUpdate({ content: newHtml, updatedAt: Date.now() });
                }}
                placeholder="Type your notes here... Use formatting buttons above to bold, underline, highlight, or create lists."
                isDark={themeMode === 'dark'}
                fontFamily={fontFamily}
                fontSize={fontSize}
                minHeight="380px"
              />
            </div>
          </div>
        </div>

        {/* Bottom Window Status Bar */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 text-xs select-none shrink-0 ${activeTheme.statusBg}`}
        >
          {/* Left: Saved indicator and Statistics */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All changes saved</span>
            </span>

            <span className="opacity-40">|</span>

            <span>{wordCount} words</span>
            <span>·</span>
            <span>{charCount} characters</span>
            <span>·</span>
            <span>{readingTime} min read</span>
          </div>

          {/* Right: Done Button to close cleanly */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
