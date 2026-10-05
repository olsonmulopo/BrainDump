import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { markdownToVisualHtml, visualHtmlToMarkdown } from '../../utils/markdownConverter';
import { MarkdownTheme, ReadingFontFamily, ReadingFontSize } from '../MarkdownOpenerModal';

export interface MarkdownVisualEditorRef {
  focus: () => void;
  execBold: () => void;
  execItalic: () => void;
  execUnderline: () => void;
  execStrikethrough: () => void;
  execHighlight: () => void;
  execHeading: (level: 1 | 2 | 3 | 0) => void;
  execBulletList: () => void;
  execNumberedList: () => void;
  execChecklist: () => void;
  execBlockquote: () => void;
  execCodeBlock: () => void;
  execInlineCode: () => void;
  execDivider: () => void;
  execTable: () => void;
  execLink: (url?: string, text?: string) => void;
  execClearFormatting: () => void;
  getMarkdown: () => string;
  setMarkdown: (md: string) => void;
}

interface MarkdownVisualEditorProps {
  markdown: string;
  onChange: (newMarkdown: string) => void;
  themeMode: MarkdownTheme;
  fontFamily: ReadingFontFamily;
  fontSize: ReadingFontSize;
  placeholder?: string;
  autoFocus?: boolean;
}

export const MarkdownVisualEditor = forwardRef<MarkdownVisualEditorRef, MarkdownVisualEditorProps>(
  (
    {
      markdown,
      onChange,
      themeMode,
      fontFamily,
      fontSize,
      placeholder = 'Start writing your document... (markdown commands like **bold** are automatically hidden)',
      autoFocus = false,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastEmittedMarkdown = useRef<string>('');
    const isComposing = useRef<boolean>(false);

    // Initial HTML conversion from markdown
    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;

      // Only update DOM if the external markdown is different from what we last emitted
      if (markdown !== lastEmittedMarkdown.current) {
        const visualHtml = markdownToVisualHtml(markdown);
        editor.innerHTML = visualHtml;
        lastEmittedMarkdown.current = markdown;
      }
    }, [markdown]);

    // Auto-focus if requested
    useEffect(() => {
      if (autoFocus && editorRef.current) {
        editorRef.current.focus();
      }
    }, [autoFocus]);

    // Handle user input in contenteditable
    const handleInput = useCallback(() => {
      if (isComposing.current) return;
      const editor = editorRef.current;
      if (!editor) return;

      const html = editor.innerHTML;
      const newMarkdown = visualHtmlToMarkdown(html);
      lastEmittedMarkdown.current = newMarkdown;
      onChange(newMarkdown);
    }, [onChange]);

    // Handle clicks inside editor (e.g. interactive checklist checkboxes)
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Interactive task checkbox clicked
        if (target && target.matches('input[type="checkbox"]')) {
          const checkbox = target as HTMLInputElement;
          const taskRow = checkbox.closest('.task-row') || checkbox.parentElement;
          if (taskRow) {
            if (checkbox.checked) {
              taskRow.classList.add('line-through', 'opacity-60');
              taskRow.setAttribute('data-checked', 'true');
            } else {
              taskRow.classList.remove('line-through', 'opacity-60');
              taskRow.setAttribute('data-checked', 'false');
            }
          }
          handleInput();
        }
      },
      [handleInput]
    );

    // Execute standard document commands
    const execCommand = useCallback(
      (command: string, value: string | undefined = undefined) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        document.execCommand(command, false, value);
        handleInput();
      },
      [handleInput]
    );

    // Yellow / Amber highlight
    const execHighlight = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Check if already highlighted
      let isHighlighted = false;
      let node: Node | null = selection.anchorNode;
      while (node && node !== editor) {
        if (
          node.nodeName === 'MARK' ||
          ((node as HTMLElement).style &&
            ((node as HTMLElement).style.backgroundColor?.includes('254') ||
              (node as HTMLElement).style.backgroundColor?.includes('yellow') ||
              (node as HTMLElement).style.backgroundColor?.includes('amber')))
        ) {
          isHighlighted = true;
          break;
        }
        node = node.parentNode;
      }

      if (isHighlighted) {
        document.execCommand('hiliteColor', false, 'transparent');
        document.execCommand('backColor', false, 'transparent');
      } else {
        if (!document.execCommand('hiliteColor', false, '#fef08a')) {
          document.execCommand('backColor', false, '#fef08a');
        }
      }
      handleInput();
    }, [handleInput]);

    // Headings (H1, H2, H3, or Paragraph)
    const execHeading = useCallback(
      (level: 1 | 2 | 3 | 0) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();

        if (level === 0) {
          document.execCommand('formatBlock', false, '<p>');
        } else {
          document.execCommand('formatBlock', false, `<h${level}>`);
        }
        handleInput();
      },
      [handleInput]
    );

    // Interactive checklist insert
    const execChecklist = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString() || 'New task';

      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-row flex items-start gap-2.5 py-1';
      taskDiv.setAttribute('data-task', 'true');
      taskDiv.setAttribute('data-checked', 'false');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer';

      const span = document.createElement('span');
      span.className = 'task-text flex-1 select-text';
      span.textContent = selectedText;

      taskDiv.appendChild(checkbox);
      taskDiv.appendChild(span);

      range.deleteContents();
      range.insertNode(taskDiv);

      // Place cursor at end of span
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    }, [handleInput]);

    // Blockquote insert
    const execBlockquote = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      document.execCommand('formatBlock', false, '<blockquote>');
      handleInput();
    }, [handleInput]);

    // Code Block insert
    const execCodeBlock = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString() || '// Write code here\n';

      const pre = document.createElement('pre');
      pre.className =
        'code-block my-3 p-4 rounded-xl font-mono text-xs overflow-x-auto bg-neutral-900 text-neutral-100 dark:bg-black/60 dark:border dark:border-neutral-800';
      pre.setAttribute('data-lang', 'javascript');

      const langBadge = document.createElement('div');
      langBadge.className = 'text-[10px] text-neutral-400 uppercase tracking-widest font-mono select-none mb-1.5 opacity-60';
      langBadge.textContent = 'CODE';

      const code = document.createElement('code');
      code.textContent = selectedText;

      pre.appendChild(langBadge);
      pre.appendChild(code);

      range.deleteContents();
      range.insertNode(pre);

      range.setStartAfter(pre);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    }, [handleInput]);

    // Inline code insert
    const execInlineCode = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString() || 'code';

      const code = document.createElement('code');
      code.className = 'px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-black/5 dark:bg-white/10 text-emerald-600 dark:text-emerald-400';
      code.textContent = selectedText;

      range.deleteContents();
      range.insertNode(code);

      range.setStartAfter(code);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    }, [handleInput]);

    // Horizontal Divider insert
    const execDivider = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      document.execCommand('insertHorizontalRule', false);
      handleInput();
    }, [handleInput]);

    // Table insert
    const execTable = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'overflow-x-auto my-4';
      tableWrapper.innerHTML = `
        <table class="w-full border-collapse border border-neutral-300 dark:border-neutral-700 text-sm rounded-lg overflow-hidden">
          <thead class="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th class="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-left font-semibold">Column 1</th>
              <th class="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-left font-semibold">Column 2</th>
              <th class="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-left font-semibold">Column 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-neutral-300 dark:border-neutral-700 px-3 py-2">Item A</td>
              <td class="border border-neutral-300 dark:border-neutral-700 px-3 py-2">Details</td>
              <td class="border border-neutral-300 dark:border-neutral-700 px-3 py-2">Active</td>
            </tr>
            <tr class="bg-neutral-500/5">
              <td class="border border-neutral-300 dark:border-neutral-700 px-3 py-2">Item B</td>
              <td class="border border-neutral-300 dark:border-neutral-700 px-3 py-2">Details</td>
              <td class="border border-neutral-300 dark:border-neutral-700 px-3 py-2">Pending</td>
            </tr>
          </tbody>
        </table>
      `;

      range.deleteContents();
      range.insertNode(tableWrapper);

      range.setStartAfter(tableWrapper);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    }, [handleInput]);

    // Link insert
    const execLink = useCallback(
      (url?: string, text?: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();

        const selection = window.getSelection();
        const selectedText = selection ? selection.toString() : '';

        const targetUrl = url || window.prompt('Enter link URL (e.g. https://example.com):', 'https://');
        if (!targetUrl) return;

        const linkText = text || selectedText || targetUrl;

        if (selection && selection.rangeCount > 0 && selectedText) {
          document.execCommand('createLink', false, targetUrl);
        } else {
          const a = document.createElement('a');
          a.href = targetUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'text-indigo-600 dark:text-indigo-400 hover:underline font-medium';
          a.textContent = linkText;

          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(a);
            range.setStartAfter(a);
            range.collapse(true);
          }
        }
        handleInput();
      },
      [handleInput]
    );

    // Clear formatting
    const execClearFormatting = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      document.execCommand('removeFormat', false);
      handleInput();
    }, [handleInput]);

    // Keyboard shortcuts inside visual editor
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        execCommand('bold');
      } else if (modKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        execCommand('italic');
      } else if (modKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        execCommand('underline');
      } else if (modKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        execLink();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
        handleInput();
      }
    };

    // Expose methods to parent toolbar
    useImperativeHandle(ref, () => ({
      focus: () => editorRef.current?.focus(),
      execBold: () => execCommand('bold'),
      execItalic: () => execCommand('italic'),
      execUnderline: () => execCommand('underline'),
      execStrikethrough: () => execCommand('strikeThrough'),
      execHighlight: () => execHighlight(),
      execHeading: (level) => execHeading(level),
      execBulletList: () => execCommand('insertUnorderedList'),
      execNumberedList: () => execCommand('insertOrderedList'),
      execChecklist: () => execChecklist(),
      execBlockquote: () => execBlockquote(),
      execCodeBlock: () => execCodeBlock(),
      execInlineCode: () => execInlineCode(),
      execDivider: () => execDivider(),
      execTable: () => execTable(),
      execLink: (url, text) => execLink(url, text),
      execClearFormatting: () => execClearFormatting(),
      getMarkdown: () => {
        if (!editorRef.current) return '';
        return visualHtmlToMarkdown(editorRef.current.innerHTML);
      },
      setMarkdown: (md: string) => {
        if (!editorRef.current) return;
        editorRef.current.innerHTML = markdownToVisualHtml(md);
        lastEmittedMarkdown.current = md;
      },
    }));

    // Theme styling classes
    const themeClasses = {
      dark: 'bg-[#18181b] text-neutral-100 placeholder:text-neutral-500',
      sepia: 'bg-[#fbf7ee] text-[#3d3326] placeholder:text-[#998b7a]',
      light: 'bg-white text-neutral-900 placeholder:text-neutral-400',
    }[themeMode];

    const fontClasses = {
      sans: 'font-sans',
      serif: 'font-serif',
      mono: 'font-mono',
    }[fontFamily];

    const sizeClasses = {
      sm: 'text-[13.5px] leading-relaxed',
      base: 'text-[15px] leading-relaxed',
      lg: 'text-[16.5px] leading-relaxed',
    }[fontSize];

    return (
      <div className={`w-full h-full overflow-y-auto ${themeClasses}`}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onCompositionEnd={() => {
            isComposing.current = false;
            handleInput();
          }}
          data-placeholder={placeholder}
          className={`max-w-3xl mx-auto min-h-full p-6 sm:p-10 md:p-12 outline-hidden focus:outline-hidden ${fontClasses} ${sizeClasses} selection:bg-indigo-500/30 prose-headings:font-bold`}
          style={{ minHeight: '100%' }}
        />
      </div>
    );
  }
);

MarkdownVisualEditor.displayName = 'MarkdownVisualEditor';
