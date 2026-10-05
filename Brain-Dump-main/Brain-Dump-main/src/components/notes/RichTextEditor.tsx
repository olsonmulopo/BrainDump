import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { markdownToHtml } from '../../utils/richText';

export interface RichTextEditorRef {
  focus: () => void;
  execBold: () => void;
  execItalic: () => void;
  execUnderline: () => void;
  execHighlight: () => void;
  execStrikethrough: () => void;
  execHeading: () => void;
  execBulletList: () => void;
  execNumberedList: () => void;
  execChecklist: () => void;
  getHtml: () => string;
}

interface RichTextEditorProps {
  content: string;
  onChange: (newHtml: string) => void;
  placeholder?: string;
  isDark?: boolean;
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontSize?: 'sm' | 'base' | 'lg';
  minHeight?: string;
  className?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      content,
      onChange,
      placeholder = 'Type your notes here...',
      isDark = false,
      fontFamily = 'sans',
      fontSize = 'base',
      minHeight = '90px',
      className = '',
      autoFocus = false,
      readOnly = false,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastEmittedHtml = useRef<string>('');
    const isComposing = useRef<boolean>(false);

    // Prepare initial HTML by converting legacy markdown (e.g. **bold**) if needed
    const initialHtml = markdownToHtml(content || '');

    // Initialize content once or when content changes externally
    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const currentInnerHtml = editor.innerHTML;
      // Only set innerHTML if content is substantially different from what we last emitted
      if (
        initialHtml !== lastEmittedHtml.current &&
        initialHtml !== currentInnerHtml
      ) {
        editor.innerHTML = initialHtml;
        lastEmittedHtml.current = initialHtml;
      }
    }, [content, initialHtml]);

    useEffect(() => {
      if (autoFocus && editorRef.current && !readOnly) {
        editorRef.current.focus();
      }
    }, [autoFocus, readOnly]);

    // Handle user input
    const handleInput = useCallback(() => {
      if (isComposing.current) return;
      const editor = editorRef.current;
      if (!editor) return;

      const newHtml = editor.innerHTML;
      lastEmittedHtml.current = newHtml;
      onChange(newHtml);
    }, [onChange]);

    // Handle clicks inside editor (such as clicking interactive checkboxes)
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Check if an interactive task checkbox was clicked
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

    // Execute standard formatting commands
    const execCommand = useCallback(
      (command: string, value: string | undefined = undefined) => {
        const editor = editorRef.current;
        if (!editor || readOnly) return;

        editor.focus();
        document.execCommand(command, false, value);
        handleInput();
      },
      [handleInput, readOnly]
    );

    // Insert or toggle interactive checklist item
    const insertChecklist = useCallback(() => {
      const editor = editorRef.current;
      if (!editor || readOnly) return;

      editor.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString() || 'Task item';

      // Create interactive task element
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-row flex items-start gap-2 py-0.5';
      taskDiv.setAttribute('data-task', 'true');
      taskDiv.setAttribute('data-checked', 'false');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox mt-0.5 rounded cursor-pointer';

      const span = document.createElement('span');
      span.className = 'task-text flex-1';
      span.textContent = selectedText;

      taskDiv.appendChild(checkbox);
      taskDiv.appendChild(span);

      range.deleteContents();
      range.insertNode(taskDiv);

      // Move cursor after inserted task
      range.setStartAfter(taskDiv);
      range.setEndAfter(taskDiv);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    }, [handleInput, readOnly]);

    // Toggle yellow text highlighter on current selection
    const execHighlight = useCallback(() => {
      const editor = editorRef.current;
      if (!editor || readOnly) return;
      editor.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Check if current selection or parent is already highlighted
      let isAlreadyHighlighted = false;
      let parentNode: Node | null = selection.anchorNode;
      while (parentNode && parentNode !== editor) {
        if (
          parentNode.nodeName === 'MARK' ||
          ((parentNode as HTMLElement).style &&
            ((parentNode as HTMLElement).style.backgroundColor === 'rgb(254, 240, 138)' ||
              (parentNode as HTMLElement).style.backgroundColor.includes('yellow') ||
              (parentNode as HTMLElement).style.backgroundColor !== ''))
        ) {
          isAlreadyHighlighted = true;
          break;
        }
        parentNode = parentNode.parentNode;
      }

      if (isAlreadyHighlighted) {
        // Clear background color
        document.execCommand('hiliteColor', false, 'transparent');
        document.execCommand('backColor', false, 'transparent');
      } else {
        // Apply yellow highlight
        if (!document.execCommand('hiliteColor', false, '#fef08a')) {
          document.execCommand('backColor', false, '#fef08a');
        }
      }
      handleInput();
    }, [handleInput, readOnly]);

    // Expose formatting commands to parent toolbars
    useImperativeHandle(ref, () => ({
      focus: () => editorRef.current?.focus(),
      execBold: () => execCommand('bold'),
      execItalic: () => execCommand('italic'),
      execUnderline: () => execCommand('underline'),
      execHighlight: () => execHighlight(),
      execStrikethrough: () => execCommand('strikeThrough'),
      execHeading: () => {
        // Toggle H2 heading or return to paragraph
        const selection = window.getSelection();
        if (!selection || !selection.anchorNode) return;
        const parentElem = (selection.anchorNode.nodeType === 3
          ? selection.anchorNode.parentElement
          : selection.anchorNode) as HTMLElement | null;

        if (parentElem && parentElem.closest('h2')) {
          execCommand('formatBlock', '<p>');
        } else {
          execCommand('formatBlock', '<h2>');
        }
      },
      execBulletList: () => execCommand('insertUnorderedList'),
      execNumberedList: () => execCommand('insertOrderedList'),
      execChecklist: () => insertChecklist(),
      getHtml: () => editorRef.current?.innerHTML || '',
    }));

    // Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+H)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (readOnly) return;

      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          execCommand('bold');
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          execCommand('italic');
        } else if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          execCommand('underline');
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          execHighlight();
        }
      }
    };

    const fontClass =
      fontFamily === 'serif'
        ? 'font-serif'
        : fontFamily === 'mono'
        ? 'font-mono text-[11px]'
        : 'font-sans';

    const sizeClass =
      fontSize === 'sm'
        ? 'text-xs'
        : fontSize === 'lg'
        ? 'text-base'
        : 'text-sm';

    return (
      <div
        ref={editorRef}
        contentEditable={!readOnly}
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
        style={{ minHeight }}
        className={`w-full ${sizeClass} leading-relaxed outline-none break-words [overflow-wrap:anywhere] transition-colors select-text cursor-text ${fontClass} ${
          isDark
            ? 'text-white/95 empty:before:text-white/40'
            : 'text-neutral-900 empty:before:text-neutral-400'
        } empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none empty:before:italic [&_mark]:bg-yellow-200 dark:[&_mark]:bg-yellow-400/40 [&_mark]:text-inherit [&_mark]:px-1 [&_mark]:rounded-xs [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_p]:my-1 [&_code]:bg-black/5 dark:[&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_a]:underline [&_a]:text-indigo-500 [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-1.5 ${className}`}
      />
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
