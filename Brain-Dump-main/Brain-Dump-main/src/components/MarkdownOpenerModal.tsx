import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FileCardItem } from '../types';
import {
  readFileText,
  saveFileText,
  formatFileSize,
} from '../services/fileStorage';
import {
  X,
  Save,
  Download,
  Copy,
  Check,
  Eye,
  Columns,
  Edit3,
  Moon,
  Sun,
  Coffee,
  Maximize2,
  Minimize2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Table as TableIcon,
  Minus,
  Link2,
  RemoveFormatting,
  Sparkles,
  FileCode,
  ExternalLink,
  Cloud,
  Type,
  WrapText,
} from 'lucide-react';
import {
  MarkdownVisualEditor,
  MarkdownVisualEditorRef,
} from './markdown/MarkdownVisualEditor';

interface MarkdownOpenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FileCardItem | null;
  onSaveContent?: (item: FileCardItem, newContent: string) => Promise<void> | void;
}

type ViewMode = 'reader' | 'split' | 'editor';
export type MarkdownTheme = 'dark' | 'sepia' | 'light';
export type ReadingFontFamily = 'sans' | 'serif' | 'mono';
export type ReadingFontSize = 'sm' | 'base' | 'lg';

export const MarkdownOpenerModal: React.FC<MarkdownOpenerModalProps> = ({
  isOpen,
  onClose,
  item,
  onSaveContent,
}) => {
  const [content, setContent] = useState<string>('');
  const [initialContent, setInitialContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('reader');

  // Theme: Charcoal Dark (matches reference), Warm Sepia (eye comfort), Clean Light
  const [themeMode, setThemeMode] = useState<MarkdownTheme>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    return 'sepia';
  });

  // Reading Typography Preferences
  const [fontFamily, setFontFamily] = useState<ReadingFontFamily>('sans');
  const [fontSize, setFontSize] = useState<ReadingFontSize>('base');
  const [wrapCodeText, setWrapCodeText] = useState<boolean>(true);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editorSubMode, setEditorSubMode] = useState<'visual' | 'source'>('visual');
  const visualEditorRef = useRef<MarkdownVisualEditorRef>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync theme when opened if document theme changes
  useEffect(() => {
    if (isOpen) {
      const isDocDark = document.documentElement.classList.contains('dark');
      if (isDocDark && themeMode === 'light') {
        setThemeMode('dark');
      }
    }
  }, [isOpen]);

  // Load content when opened or when item changes
  useEffect(() => {
    let active = true;
    if (isOpen && item) {
      setIsLoading(true);
      readFileText(item)
        .then((text) => {
          if (active) {
            setContent(text || '');
            setInitialContent(text || '');
            setHasUnsavedChanges(false);
            setIsLoading(false);
            setLastSavedAt(item.updatedAt || Date.now());
          }
        })
        .catch((err) => {
          console.error('Failed to load markdown text:', err);
          if (active) {
            setContent('# Untitled Document\n\nWrite your thoughts here...');
            setIsLoading(false);
          }
        });
    } else {
      setContent('');
      setInitialContent('');
      setHasUnsavedChanges(false);
    }
    return () => {
      active = false;
    };
  }, [isOpen, item]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content !== initialContent);
  }, [content, initialContent]);

  // Calculate stats (Characters, Words, Lines, Reading Time)
  const stats = useMemo(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    const readMinutes = Math.max(1, Math.ceil(words / 220));
    return { chars, words, lines, readMinutes };
  }, [content]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      const { size } = await saveFileText(item, content);
      setInitialContent(content);
      setHasUnsavedChanges(false);
      setLastSavedAt(Date.now());
      if (onSaveContent) {
        await onSaveContent({ ...item, fileSize: size, updatedAt: Date.now() }, content);
      }
    } catch (err) {
      console.error('Failed to save markdown content:', err);
    } finally {
      setIsSaving(false);
    }
  }, [item, content, onSaveContent]);

  // Keyboard shortcuts (Ctrl+S to save, Esc to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape' && !activeMenu) {
        if (!hasUnsavedChanges || window.confirm('Close markdown file? Unsaved edits may be lost.')) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSave, activeMenu, hasUnsavedChanges, onClose]);

  // Download copy
  const handleDownload = () => {
    if (!item) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName.endsWith('.md') ? item.fileName : `${item.fileName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy raw content
  const handleCopyRaw = () => {
    navigator.clipboard.writeText(content);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  // Text insertion utilities for Markdown Editor
  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || defaultText;
    const replacement = prefix + selected + suffix;

    const newText = content.substring(0, start) + replacement + content.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + prefix.length + selected.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  const insertLinePrefix = (linePrefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newText =
      content.substring(0, lineStart) +
      linePrefix +
      content.substring(lineStart);

    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + linePrefix.length, start + linePrefix.length);
    }, 10);
  };

  const insertTable = () => {
    const tableTemplate =
      '\n| Header 1 | Header 2 | Header 3 |\n| :--- | :--- | :--- |\n| Value 1 | Value 2 | Value 3 |\n| Value 4 | Value 5 | Value 6 |\n\n';
    insertFormatting(tableTemplate);
  };

  // Unified Action Handlers (Routes to visual editor when in visual mode, or raw syntax when in source mode)
  const handleFormatBold = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execBold();
    } else {
      insertFormatting('**', '**', 'bold');
    }
  };

  const handleFormatItalic = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execItalic();
    } else {
      insertFormatting('*', '*', 'italic');
    }
  };

  const handleFormatUnderline = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execUnderline();
    } else {
      insertFormatting('<u>', '</u>', 'underlined');
    }
  };

  const handleFormatStrike = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execStrikethrough();
    } else {
      insertFormatting('~~', '~~', 'strikethrough');
    }
  };

  const handleFormatHighlight = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execHighlight();
    } else {
      insertFormatting('==', '==', 'highlighted');
    }
  };

  const handleFormatHeading = (level: 1 | 2 | 3 | 0) => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execHeading(level);
    } else {
      if (level === 1) insertLinePrefix('# ');
      else if (level === 2) insertLinePrefix('## ');
      else if (level === 3) insertLinePrefix('### ');
    }
  };

  const handleFormatBulletList = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execBulletList();
    } else {
      insertLinePrefix('- ');
    }
  };

  const handleFormatNumberedList = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execNumberedList();
    } else {
      insertLinePrefix('1. ');
    }
  };

  const handleFormatChecklist = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execChecklist();
    } else {
      insertLinePrefix('- [ ] ');
    }
  };

  const handleFormatTable = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execTable();
    } else {
      insertTable();
    }
  };

  const handleFormatCodeBlock = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execCodeBlock();
    } else {
      insertFormatting('```\n', '\n```', 'code block');
    }
  };

  const handleFormatInlineCode = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execInlineCode();
    } else {
      insertFormatting('`', '`', 'code');
    }
  };

  const handleFormatQuote = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execBlockquote();
    } else {
      insertLinePrefix('> ');
    }
  };

  const handleFormatDivider = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execDivider();
    } else {
      insertFormatting('\n---\n');
    }
  };

  const handleFormatLink = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execLink();
    } else {
      insertFormatting('[', '](https://example.com)', 'link title');
    }
  };

  const handleFormatClear = () => {
    if (editorSubMode === 'visual') {
      visualEditorRef.current?.execClearFormatting();
    }
  };

  // Tab key handling in textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Toggle task checkbox right inside the Reader view
  const handleToggleTaskInReader = (lineIndex: number, currentChecked: boolean) => {
    const lines = content.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    const updatedLine = currentChecked
      ? line.replace(/^(\s*[-*+]\s+)\[[xX]\]/, '$1[ ]')
      : line.replace(/^(\s*[-*+]\s+)\[\s*\]/, '$1[x]');
    lines[lineIndex] = updatedLine;
    const newContent = lines.join('\n');
    setContent(newContent);
  };

  // Click outside menu handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenu && !(e.target as HTMLElement).closest('.menu-dropdown-container')) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  // Curated theme styles for distraction-free reading
  const activeTheme = useMemo(() => {
    switch (themeMode) {
      case 'dark':
        return {
          id: 'dark',
          name: 'Charcoal Dark',
          modalBg: 'bg-[#1e1f23]',
          windowBorder: 'border-[#2d2f36]',
          titleBarBg: 'bg-[#18191c] border-b border-[#2a2c33] text-[#e4e4e7]',
          menuBarBg: 'bg-[#1e1f23] border-b border-[#2a2c33] text-[#a1a1aa]',
          menuDropdownBg: 'bg-[#25262c] border-[#363842] text-[#e4e4e7]',
          contentBg: 'bg-[#16171a]',
          textColor: 'text-[#d6d8de]',
          headingColor: 'text-[#f4f4f5]',
          mutedColor: 'text-[#8c909b]',
          codeBoxBg: 'bg-[#1e1f23]',
          codeBoxHeader: 'bg-[#25272d] border-b border-[#2e3038] text-[#9ca3af]',
          codeBoxBorder: 'border-[#2e3038]',
          codeBoxText: 'text-[#d1d5db]',
          quoteBorder: 'border-indigo-400 text-[#c7cbd2]',
          tableHeaderBg: 'bg-[#24252a] text-[#e4e4e7]',
          tableRowEven: 'bg-[#1a1b1f]',
          tableBorder: 'border-[#2d2f36]',
          textareaBg: 'bg-[#16171a] text-[#e4e4e7]',
          statusBg: 'bg-[#18191c] border-t border-[#2a2c33] text-[#8c909b]',
          buttonHover: 'hover:bg-white/10',
          activeToggle: 'bg-[#2c2e35] text-white shadow-xs',
        };
      case 'sepia':
        return {
          id: 'sepia',
          name: 'Warm Sepia',
          modalBg: 'bg-[#f7f2e7]',
          windowBorder: 'border-[#dfd5c2]',
          titleBarBg: 'bg-[#eee7d8] border-b border-[#e2d7c2] text-[#3d372e]',
          menuBarBg: 'bg-[#f7f2e7] border-b border-[#e2d7c2] text-[#6e6354]',
          menuDropdownBg: 'bg-[#fdfaf3] border-[#ded4c1] text-[#3d372e]',
          contentBg: 'bg-[#fbf7ee]',
          textColor: 'text-[#3d372e]',
          headingColor: 'text-[#221c15]',
          mutedColor: 'text-[#7e7464]',
          codeBoxBg: 'bg-[#f2ece0]',
          codeBoxHeader: 'bg-[#eae1d1] border-b border-[#ded4c1] text-[#6d6353]',
          codeBoxBorder: 'border-[#ded4c1]',
          codeBoxText: 'text-[#3c352a]',
          quoteBorder: 'border-amber-700 text-[#4a4237]',
          tableHeaderBg: 'bg-[#eee7d8] text-[#241f17]',
          tableRowEven: 'bg-[#f5eedf]',
          tableBorder: 'border-[#dfd5c2]',
          textareaBg: 'bg-[#fbf7ee] text-[#3d372e]',
          statusBg: 'bg-[#eee7d8] border-t border-[#e2d7c2] text-[#7e7464]',
          buttonHover: 'hover:bg-black/5',
          activeToggle: 'bg-[#eae1d1] text-[#241f17] shadow-xs',
        };
      case 'light':
      default:
        return {
          id: 'light',
          name: 'Clean Light',
          modalBg: 'bg-[#f9fafb]',
          windowBorder: 'border-[#e5e7eb]',
          titleBarBg: 'bg-[#f3f4f6] border-b border-[#e5e7eb] text-[#1f2937]',
          menuBarBg: 'bg-[#f9fafb] border-b border-[#e5e7eb] text-[#4b5563]',
          menuDropdownBg: 'bg-white border-[#e5e7eb] text-[#1f2937]',
          contentBg: 'bg-white',
          textColor: 'text-[#374151]',
          headingColor: 'text-[#111827]',
          mutedColor: 'text-[#6b7280]',
          codeBoxBg: 'bg-[#f3f4f6]',
          codeBoxHeader: 'bg-[#e5e7eb] border-b border-[#d1d5db] text-[#4b5563]',
          codeBoxBorder: 'border-[#d1d5db]',
          codeBoxText: 'text-[#1f2937]',
          quoteBorder: 'border-indigo-600 text-[#374151]',
          tableHeaderBg: 'bg-[#f3f4f6] text-[#111827]',
          tableRowEven: 'bg-[#f9fafb]',
          tableBorder: 'border-[#e5e7eb]',
          textareaBg: 'bg-white text-[#111827]',
          statusBg: 'bg-[#f3f4f6] border-t border-[#e5e7eb] text-[#6b7280]',
          buttonHover: 'hover:bg-black/5',
          activeToggle: 'bg-white text-[#111827] shadow-xs',
        };
    }
  }, [themeMode]);

  // Inline Markdown Formatted Parser
  const renderInlineFormatted = (text: string, keyPrefix: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let idx = 0;

    const inlineRegex =
      /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(~~([^~]+)~~)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))|(https?:\/\/[^\s]+)/;

    while (remaining.length > 0) {
      const match = inlineRegex.exec(remaining);
      if (!match) {
        parts.push(remaining);
        break;
      }

      const matchIndex = match.index;
      if (matchIndex > 0) {
        parts.push(remaining.substring(0, matchIndex));
      }

      if (match[1]) {
        // Inline code: `code`
        parts.push(
          <code
            key={`${keyPrefix}-code-${idx++}`}
            className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${
              themeMode === 'dark'
                ? 'bg-white/10 text-emerald-300'
                : themeMode === 'sepia'
                ? 'bg-[#eae0cd] text-[#4a3b2c]'
                : 'bg-neutral-200/80 text-neutral-800'
            }`}
          >
            {match[2]}
          </code>
        );
      } else if (match[3]) {
        // Bold: **bold**
        parts.push(
          <strong key={`${keyPrefix}-bold-${idx++}`} className="font-semibold tracking-normal">
            {match[4]}
          </strong>
        );
      } else if (match[5]) {
        // Strikethrough: ~~strike~~
        parts.push(
          <del
            key={`${keyPrefix}-del-${idx++}`}
            className="line-through opacity-50"
          >
            {match[6]}
          </del>
        );
      } else if (match[7]) {
        // Italic: *italic*
        parts.push(
          <em key={`${keyPrefix}-italic-${idx++}`} className="italic">
            {match[8]}
          </em>
        );
      } else if (match[9]) {
        // Link: [title](url)
        parts.push(
          <a
            key={`${keyPrefix}-link-${idx++}`}
            href={match[11]}
            target="_blank"
            rel="noopener noreferrer"
            className={`${
              themeMode === 'dark'
                ? 'text-indigo-400 hover:text-indigo-300'
                : themeMode === 'sepia'
                ? 'text-[#854d0e] hover:text-[#713f12]'
                : 'text-indigo-600 hover:text-indigo-700'
            } hover:underline font-medium inline-flex items-center gap-0.5`}
            onClick={(e) => e.stopPropagation()}
          >
            {match[10]}
            <ExternalLink className="w-2.5 h-2.5 inline opacity-70" />
          </a>
        );
      } else if (match[12]) {
        // Raw URL
        parts.push(
          <a
            key={`${keyPrefix}-rawurl-${idx++}`}
            href={match[12]}
            target="_blank"
            rel="noopener noreferrer"
            className={`${
              themeMode === 'dark'
                ? 'text-indigo-400 hover:text-indigo-300'
                : themeMode === 'sepia'
                ? 'text-[#854d0e] hover:text-[#713f12]'
                : 'text-indigo-600 hover:text-indigo-700'
            } hover:underline break-all`}
            onClick={(e) => e.stopPropagation()}
          >
            {match[12]}
          </a>
        );
      }

      remaining = remaining.substring(matchIndex + match[0].length);
    }

    return parts;
  };

  // Formatted Markdown Reader Component
  const renderFormattedMarkdown = useMemo(() => {
    if (!content.trim()) {
      return (
        <div className="py-24 text-center opacity-40 text-sm">
          Empty document. Switch to Edit mode or press Ctrl+E to start writing.
        </div>
      );
    }

    const lines = content.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;
    let blockIndex = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code / Text Block (e.g. ```text or ```json)
      if (line.trim().startsWith('```')) {
        const rawLang = line.trim().slice(3).trim();
        const lang = rawLang || 'TEXT';
        const codeLines: string[] = [];
        const startLineIdx = i;
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // skip closing ```
        const codeText = codeLines.join('\n');
        const currentCodeIdx = blockIndex++;

        nodes.push(
          <div
            key={`code-block-${startLineIdx}`}
            className={`my-5 rounded-xl overflow-hidden border ${activeTheme.codeBoxBorder} ${activeTheme.codeBoxBg} shadow-xs relative group/code font-mono text-xs`}
          >
            {/* Header matching theme with language, copy button, and wrap toggle */}
            <div className={`flex items-center justify-between px-3.5 py-1.5 ${activeTheme.codeBoxHeader} text-[11px] font-sans font-medium`}>
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-wider text-[10px] opacity-80 font-mono">
                  {lang}
                </span>
                <span className="text-[10px] opacity-50">
                  {codeLines.length} {codeLines.length === 1 ? 'line' : 'lines'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Wrap toggle button */}
                <button
                  type="button"
                  onClick={() => setWrapCodeText(!wrapCodeText)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                    wrapCodeText ? 'opacity-90 font-semibold' : 'opacity-40 hover:opacity-80'
                  }`}
                  title={wrapCodeText ? 'Lines wrap (No side scroll)' : 'Preformatted (May scroll horizontally)'}
                >
                  <WrapText className="w-3 h-3" />
                  <span>{wrapCodeText ? 'Wrap on' : 'Wrap off'}</span>
                </button>
                <div className="w-px h-3 bg-current opacity-20" />
                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(codeText);
                    setCopiedCodeIndex(currentCodeIdx);
                    setTimeout(() => setCopiedCodeIndex(null), 2000);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-80 hover:opacity-100 transition-colors cursor-pointer"
                  title="Copy text block"
                >
                  {copiedCodeIndex === currentCodeIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 text-[10px] font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* Text Box Content: forces clean wrapping so NO side scrollbar occurs */}
            <pre
              className={`p-4 leading-relaxed font-mono text-xs sm:text-[13px] ${activeTheme.codeBoxText} select-text ${
                wrapCodeText
                  ? 'whitespace-pre-wrap break-words overflow-x-hidden'
                  : 'overflow-x-auto whitespace-pre'
              }`}
            >
              <code className={wrapCodeText ? 'whitespace-pre-wrap break-words block' : 'block'}>
                {codeText}
              </code>
            </pre>
          </div>
        );
        continue;
      }

      // Markdown Table (e.g. | Event | Beat | Scenes |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        const startTableIdx = i;
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0]
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          const bodyRows = tableLines.slice(2).map((rowStr) =>
            rowStr
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim())
          );

          nodes.push(
            <div
              key={`table-${startTableIdx}`}
              className={`my-5 overflow-x-auto rounded-xl border ${activeTheme.tableBorder} shadow-xs`}
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`${activeTheme.tableHeaderBg}`}>
                    {headerRow.map((head, hIdx) => (
                      <th
                        key={`th-${hIdx}`}
                        className={`py-2.5 px-3.5 font-bold tracking-wide border-b ${activeTheme.tableBorder}`}
                      >
                        {renderInlineFormatted(head, `th-${hIdx}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${activeTheme.tableBorder}`}>
                  {bodyRows.map((rowCells, rIdx) => (
                    <tr
                      key={`tr-${rIdx}`}
                      className={`transition-colors ${
                        rIdx % 2 === 1 ? activeTheme.tableRowEven : 'bg-transparent'
                      }`}
                    >
                      {rowCells.map((cell, cIdx) => (
                        <td key={`td-${rIdx}-${cIdx}`} className="py-2.5 px-3.5 leading-relaxed align-top">
                          {renderInlineFormatted(cell, `td-${rIdx}-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Horizontal Rule (`---` or `***`)
      if (/^(\s*[-*_]\s*){3,}$/.test(line.trim())) {
        nodes.push(
          <hr
            key={`hr-${i}`}
            className={`my-6 border-0 border-t ${activeTheme.tableBorder} opacity-60`}
          />
        );
        i++;
        continue;
      }

      // Heading 1 - Clean & Elegant without distracting bright underline bar
      if (/^#\s+/.test(line)) {
        const text = line.replace(/^#\s+/, '');
        nodes.push(
          <div key={`h1-${i}`} className="mt-8 mb-4">
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight leading-snug ${activeTheme.headingColor} pb-2 border-b ${activeTheme.tableBorder}`}>
              {renderInlineFormatted(text, `h1-${i}`)}
            </h1>
          </div>
        );
        i++;
        continue;
      }

      // Heading 2
      if (/^##\s+/.test(line)) {
        const text = line.replace(/^##\s+/, '');
        nodes.push(
          <h2
            key={`h2-${i}`}
            className={`text-xl sm:text-2xl font-bold tracking-tight mt-7 mb-3 leading-snug ${activeTheme.headingColor}`}
          >
            {renderInlineFormatted(text, `h2-${i}`)}
          </h2>
        );
        i++;
        continue;
      }

      // Heading 3
      if (/^###\s+/.test(line)) {
        const text = line.replace(/^###\s+/, '');
        nodes.push(
          <h3
            key={`h3-${i}`}
            className={`text-base sm:text-lg font-semibold tracking-normal mt-5 mb-2 leading-snug ${activeTheme.headingColor}`}
          >
            {renderInlineFormatted(text, `h3-${i}`)}
          </h3>
        );
        i++;
        continue;
      }

      // Heading 4-6
      if (/^#{4,6}\s+/.test(line)) {
        const text = line.replace(/^#{4,6}\s+/, '');
        nodes.push(
          <h4
            key={`h4-${i}`}
            className={`text-xs font-semibold tracking-wider uppercase opacity-75 mt-4 mb-1.5 ${activeTheme.headingColor}`}
          >
            {renderInlineFormatted(text, `h4-${i}`)}
          </h4>
        );
        i++;
        continue;
      }

      // Blockquote
      if (/^>\s?/.test(line)) {
        const quoteLines: string[] = [];
        const startQIdx = i;
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        nodes.push(
          <blockquote
            key={`quote-${startQIdx}`}
            className={`my-4 pl-4 border-l-3 ${activeTheme.quoteBorder} italic leading-relaxed text-sm`}
          >
            {quoteLines.map((ql, qIdx) => (
              <p key={`qp-${qIdx}`} className="my-1">
                {renderInlineFormatted(ql, `qp-${startQIdx}-${qIdx}`)}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Task List Item: `- [ ]` or `- [x]`
      const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
      if (taskMatch) {
        const currentLineIdx = i;
        const isChecked = taskMatch[2].toLowerCase() === 'x';
        const taskText = taskMatch[3];
        const indentLevel = Math.floor(taskMatch[1].length / 2);

        nodes.push(
          <div
            key={`task-${i}`}
            style={{ paddingLeft: `${indentLevel * 1.25}rem` }}
            className="flex items-start gap-2.5 my-1.5 leading-relaxed group/task"
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggleTaskInReader(currentLineIdx, isChecked)}
              className="mt-1 w-4 h-4 rounded border-neutral-500 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
            />
            <span
              className={`text-sm sm:text-[15px] ${
                isChecked
                  ? 'line-through opacity-50'
                  : 'opacity-95'
              }`}
            >
              {renderInlineFormatted(taskText, `task-${i}`)}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // Bullet List Item: `- `, `* `, `+ ` (matches clean reference screenshot)
      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (bulletMatch) {
        const indentLevel = Math.floor(bulletMatch[1].length / 2);
        nodes.push(
          <div
            key={`bullet-${i}`}
            style={{ paddingLeft: `${indentLevel * 1.25}rem` }}
            className="flex items-start gap-2.5 my-1.5 leading-relaxed text-sm sm:text-[15px]"
          >
            <span className="opacity-60 shrink-0 font-bold select-none mt-0.5">•</span>
            <span className="opacity-95 flex-1">
              {renderInlineFormatted(bulletMatch[2], `bullet-${i}`)}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // Numbered List Item: `1. `
      const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numMatch) {
        const indentLevel = Math.floor(numMatch[1].length / 2);
        nodes.push(
          <div
            key={`num-${i}`}
            style={{ paddingLeft: `${indentLevel * 1.25}rem` }}
            className="flex items-start gap-2 my-1.5 leading-relaxed text-sm sm:text-[15px]"
          >
            <span className="font-mono text-xs opacity-60 shrink-0 font-bold select-none pt-0.5">
              {numMatch[2]}.
            </span>
            <span className="opacity-95 flex-1">
              {renderInlineFormatted(numMatch[3], `num-${i}`)}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // Empty line / paragraph gap
      if (!line.trim()) {
        nodes.push(<div key={`gap-${i}`} className="h-3" />);
        i++;
        continue;
      }

      // Standard Paragraph with comfortable line height and clean typography
      nodes.push(
        <p key={`p-${i}`} className="my-2.5 text-sm sm:text-[15px] leading-relaxed sm:leading-7 opacity-95">
          {renderInlineFormatted(line, `p-${i}`)}
        </p>
      );
      i++;
    }

    return nodes;
  }, [content, themeMode, wrapCodeText, activeTheme, copiedCodeIndex]);

  if (!isOpen || !item) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md bg-black/75 animate-in fade-in select-none ${
        isFullscreen ? 'p-0!' : ''
      }`}
      onClick={() => {
        if (!hasUnsavedChanges || window.confirm('Close file? Unsaved edits may be lost.')) {
          onClose();
        }
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-150 border ${
          isFullscreen ? 'h-screen rounded-none' : 'max-w-5xl h-[92vh]'
        } ${activeTheme.modalBg} ${activeTheme.windowBorder}`}
      >
        {/* Top Window Title Bar */}
        <div
          className={`flex items-center justify-between px-3.5 py-2 ${activeTheme.titleBarBg} select-none`}
        >
          {/* Left: Document Icon & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shadow-xs shrink-0 tracking-tight">
              MD
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-xs truncate max-w-xs sm:max-w-md">
                {item.fileName}
              </span>
              <span className="text-[10px] opacity-40 font-mono hidden sm:inline">
                - Markdown Document
              </span>
              {viewMode !== 'reader' && editorSubMode === 'visual' && (
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                  <Sparkles className="w-2.5 h-2.5" /> Invisible Commands
                </span>
              )}
            </div>

            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved
              </span>
            )}
          </div>

          {/* Right: Mode & Window Controls */}
          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle: Reader, Split, Edit */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/10 dark:bg-white/5 mr-1">
              <button
                type="button"
                onClick={() => setViewMode('reader')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'reader'
                    ? activeTheme.activeToggle
                    : 'opacity-60 hover:opacity-100'
                }`}
                title="Reader Mode (Ctrl+E)"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reader</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'split'
                    ? activeTheme.activeToggle
                    : 'opacity-60 hover:opacity-100'
                }`}
                title="Split View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'editor'
                    ? activeTheme.activeToggle
                    : 'opacity-60 hover:opacity-100'
                }`}
                title="Editor Mode"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>

            {/* 3-way Theme Switcher: Dark, Sepia, Light */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/10 dark:bg-white/5 mr-1" title="Reading Theme">
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  themeMode === 'dark' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Charcoal Dark (Slate)"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('sepia')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  themeMode === 'sepia' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Warm Sepia (Eye Comfort)"
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

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white scale-102'
                  : 'opacity-40 cursor-not-allowed bg-neutral-500/20 text-neutral-400'
              }`}
              title="Save changes (Ctrl+S)"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${activeTheme.buttonHover} border border-current opacity-80 hover:opacity-100 transition-all cursor-pointer shadow-2xs`}
              title="Download Markdown file (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-lg ${activeTheme.buttonHover} transition-colors opacity-70 hover:opacity-100 cursor-pointer`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                if (!hasUnsavedChanges || window.confirm('Close file? Unsaved edits may be lost.')) {
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer ml-0.5"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Menu Bar & Reader Controls Bar */}
        <div
          className={`flex items-center justify-between px-3 py-1 text-xs select-none ${activeTheme.menuBarBg}`}
        >
          {/* Left Menus (File, Edit, Format, View) */}
          <div className="flex items-center gap-2">
            {/* File Menu */}
            <div className="relative menu-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className={`px-2 py-0.5 rounded ${activeTheme.buttonHover} transition-colors cursor-pointer`}
              >
                File
              </button>
              {activeMenu === 'file' && (
                <div
                  className={`absolute top-full left-0 mt-1 w-44 rounded-xl shadow-xl border py-1 z-50 text-xs ${activeTheme.menuDropdownBg}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleSave();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Save</span>
                    <span className="opacity-50 text-[10px]">Ctrl+S</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDownload();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Download .md</span>
                    <Download className="w-3 h-3 opacity-60" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCopyRaw();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Copy Markdown</span>
                    <Copy className="w-3 h-3 opacity-60" />
                  </button>
                  <div className="h-px bg-current opacity-10 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenu(null);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-600 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Close</span>
                    <span className="opacity-50 text-[10px]">Esc</span>
                  </button>
                </div>
              )}
            </div>

            {/* Format Menu */}
            <div className="relative menu-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === 'format' ? null : 'format')}
                className={`px-2 py-0.5 rounded ${activeTheme.buttonHover} transition-colors cursor-pointer`}
              >
                Format
              </button>
              {activeMenu === 'format' && (
                <div
                  className={`absolute top-full left-0 mt-1 w-44 rounded-xl shadow-xl border py-1 z-50 text-xs ${activeTheme.menuDropdownBg}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleFormatBold();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center justify-between"
                  >
                    <span>Bold</span>
                    <span className="opacity-50 text-[10px]">Ctrl+B</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFormatItalic();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center justify-between"
                  >
                    <span>Italic</span>
                    <span className="opacity-50 text-[10px]">Ctrl+I</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFormatUnderline();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center justify-between"
                  >
                    <span>Underline</span>
                    <span className="opacity-50 text-[10px]">Ctrl+U</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFormatStrike();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer"
                  >
                    Strikethrough
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFormatHighlight();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer"
                  >
                    Highlight
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFormatInlineCode();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer"
                  >
                    Inline Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFormatLink();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer"
                  >
                    Link
                  </button>
                  <div className="h-px bg-current opacity-10 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      handleFormatClear();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center justify-between"
                  >
                    <span>Clear Formatting</span>
                  </button>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative menu-dropdown-container">
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                className={`px-2 py-0.5 rounded ${activeTheme.buttonHover} transition-colors cursor-pointer`}
              >
                View
              </button>
              {activeMenu === 'view' && (
                <div
                  className={`absolute top-full left-0 mt-1 w-44 rounded-xl shadow-xl border py-1 z-50 text-xs ${activeTheme.menuDropdownBg}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('reader');
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer"
                  >
                    Reader Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('split');
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer"
                  >
                    Split View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('editor');
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white cursor-pointer"
                  >
                    Editor Mode
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Reading Controls: Font Family & Font Size */}
          <div className="flex items-center gap-2">
            {/* Font Family Selector */}
            <div className="flex items-center p-0.5 rounded bg-black/5 dark:bg-white/5 text-[11px]">
              <button
                type="button"
                onClick={() => setFontFamily('sans')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer font-sans ${
                  fontFamily === 'sans' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Sans-serif"
              >
                Sans
              </button>
              <button
                type="button"
                onClick={() => setFontFamily('serif')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer font-serif ${
                  fontFamily === 'serif' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Serif"
              >
                Serif
              </button>
              <button
                type="button"
                onClick={() => setFontFamily('mono')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer font-mono ${
                  fontFamily === 'mono' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Monospace"
              >
                Mono
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div className="flex items-center p-0.5 rounded bg-black/5 dark:bg-white/5 text-[11px]">
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  fontSize === 'sm' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Compact font"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  fontSize === 'base' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Normal font"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  fontSize === 'lg' ? activeTheme.activeToggle : 'opacity-50 hover:opacity-100'
                }`}
                title="Large font"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        {/* Quick formatting toolbar buttons if in Edit or Split mode */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`flex items-center justify-between px-3 py-1.5 border-b text-xs overflow-x-auto gap-2 ${activeTheme.menuBarBg}`}>
            {/* Left: Mode Switcher & Formatting Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Visual vs Source Switcher */}
              <div className="flex items-center p-0.5 rounded-lg bg-black/10 dark:bg-white/10 mr-1.5">
                <button
                  type="button"
                  onClick={() => setEditorSubMode('visual')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    editorSubMode === 'visual'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Visual Editor: All Markdown commands (e.g. **bold**, # headings) are completely invisible"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Visual (Invisible Commands)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSubMode('source')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    editorSubMode === 'source'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Markdown Code: View and edit raw markdown syntax directly"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Markdown Code</span>
                </button>
              </div>

              <div className="w-px h-3.5 bg-current opacity-20 mx-1 hidden sm:block" />

              {/* Formatting Tools */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handleFormatBold}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatItalic}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatUnderline}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Underline (Ctrl+U)"
                >
                  <UnderlineIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatStrike}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatHighlight}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer text-amber-500`}
                  title="Highlight Text"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-3.5 bg-current opacity-20 mx-1" />

                <button
                  type="button"
                  onClick={() => handleFormatHeading(1)}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer font-bold`}
                  title="Heading 1"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatHeading(2)}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer font-bold`}
                  title="Heading 2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatHeading(3)}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer font-bold`}
                  title="Heading 3"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-3.5 bg-current opacity-20 mx-1" />

                <button
                  type="button"
                  onClick={handleFormatBulletList}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatNumberedList}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatChecklist}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer text-indigo-500`}
                  title="Interactive Checklist Task"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-3.5 bg-current opacity-20 mx-1" />

                <button
                  type="button"
                  onClick={handleFormatTable}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Insert Table"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatCodeBlock}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Code Block"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatQuote}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Blockquote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatDivider}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Divider"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleFormatLink}
                  className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                  title="Insert Link (Ctrl+K)"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </button>
                {editorSubMode === 'visual' && (
                  <button
                    type="button"
                    onClick={handleFormatClear}
                    className={`p-1.5 rounded ${activeTheme.buttonHover} opacity-75 hover:opacity-100 cursor-pointer`}
                    title="Clear Formatting"
                  >
                    <RemoveFormatting className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Tag/Hint */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] opacity-60 font-sans shrink-0">
              {editorSubMode === 'visual' ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3 h-3" /> Commands hidden
                </span>
              ) : (
                <span>Editing raw markdown syntax</span>
              )}
            </div>
          </div>
        )}

        {/* Main Content Workspace */}
        <div className="flex-1 overflow-hidden relative flex">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs opacity-60">Loading markdown content...</div>
            </div>
          ) : (
            <>
              {/* Editor Pane (shown in Editor and Split mode) */}
              {(viewMode === 'editor' || viewMode === 'split') && (
                <div
                  className={`flex-1 h-full overflow-hidden flex flex-col ${
                    viewMode === 'split' ? `border-r ${activeTheme.tableBorder}` : ''
                  }`}
                >
                  {editorSubMode === 'visual' ? (
                    <MarkdownVisualEditor
                      ref={visualEditorRef}
                      markdown={content}
                      onChange={(newMarkdown) => setContent(newMarkdown)}
                      themeMode={themeMode}
                      fontFamily={fontFamily}
                      fontSize={fontSize}
                      placeholder="Start writing your document... (markdown commands like **bold** are automatically hidden)"
                      autoFocus={viewMode === 'editor'}
                    />
                  ) : (
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onKeyDown={handleTextareaKeyDown}
                      placeholder="Type markdown content here..."
                      className={`w-full h-full p-6 sm:p-8 font-mono text-sm leading-relaxed resize-none focus:outline-hidden overflow-y-auto selection:bg-indigo-600/30 ${activeTheme.textareaBg}`}
                      spellCheck="false"
                    />
                  )}
                </div>
              )}

              {/* Reader / Preview Pane (shown in Reader and Split mode) */}
              {(viewMode === 'reader' || viewMode === 'split') && (
                <div
                  className={`flex-1 h-full overflow-y-auto ${activeTheme.contentBg} ${activeTheme.textColor}`}
                >
                  <div
                    className={`max-w-3xl mx-auto p-6 sm:p-10 md:p-12 select-text ${
                      fontFamily === 'serif'
                        ? 'font-serif'
                        : fontFamily === 'mono'
                        ? 'font-mono'
                        : 'font-sans'
                    } ${
                      fontSize === 'sm'
                        ? 'text-[13.5px]'
                        : fontSize === 'lg'
                        ? 'text-[16.5px]'
                        : 'text-[15px]'
                    }`}
                  >
                    {renderFormattedMarkdown}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div
          className={`flex items-center justify-between px-4 py-2 text-[11px] select-none font-mono ${activeTheme.statusBg}`}
        >
          {/* Left info: Save status & sync */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasUnsavedChanges ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span className="font-sans">
                {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
              </span>
            </div>

            <span className="opacity-30">|</span>

            <span>{formatFileSize(stats.chars)}</span>

            {item.driveFileId && (
              <span className="flex items-center gap-1 text-emerald-500">
                <Cloud className="w-3 h-3" /> Drive
              </span>
            )}
          </div>

          {/* Right info: Character, word, and reading counter */}
          <div className="flex items-center gap-3 tabular-nums">
            <span>{stats.words.toLocaleString()} Words</span>
            <span className="opacity-30">·</span>
            <span>{stats.chars.toLocaleString()} Characters</span>
            <span className="opacity-30 hidden sm:inline">·</span>
            <span className="hidden sm:inline">{stats.readMinutes} min read</span>
          </div>
        </div>
      </div>
    </div>
  );
};
