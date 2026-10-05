import React, { useRef } from 'react';
import { isHtmlContent, markdownToHtml } from '../../utils/richText';

interface NoteContentRendererProps {
  content: string;
  isDark?: boolean;
  fontFamily?: 'sans' | 'serif' | 'mono';
  onToggleCheckbox?: (lineIndex: number, newChecked: boolean) => void;
  onHtmlCheckboxToggle?: (newHtml: string) => void;
  onLinkClick?: (url: string) => void;
}

export const NoteContentRenderer: React.FC<NoteContentRendererProps> = ({
  content,
  isDark = false,
  fontFamily = 'sans',
  onToggleCheckbox,
  onHtmlCheckboxToggle,
  onLinkClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!content || !content.trim()) {
    return (
      <div
        className={`italic text-xs py-2 select-none ${
          isDark ? 'text-white/40' : 'text-neutral-400'
        }`}
      >
        Empty note. Click to start typing...
      </div>
    );
  }

  const fontClass =
    fontFamily === 'serif'
      ? 'font-serif'
      : fontFamily === 'mono'
      ? 'font-mono text-[11px]'
      : 'font-sans';

  // Ensure content is formatted as HTML, converting legacy markdown (e.g. **62**) seamlessly
  const htmlContent = isHtmlContent(content) ? content : markdownToHtml(content);

  // Handle clicking interactive checkboxes in view mode
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
      if (containerRef.current && onHtmlCheckboxToggle) {
        onHtmlCheckboxToggle(containerRef.current.innerHTML);
      }
    }

    // Check if an anchor link was clicked
    if (target && target.tagName === 'A') {
      const href = target.getAttribute('href');
      if (href) {
        onLinkClick?.(href);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`w-full text-xs leading-relaxed select-text break-words [overflow-wrap:anywhere] ${fontClass} ${
        isDark ? 'text-white/95' : 'text-neutral-900'
      } [&_mark]:bg-yellow-200 dark:[&_mark]:bg-yellow-400/40 [&_mark]:text-inherit [&_mark]:px-1 [&_mark]:rounded-xs [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-1.5 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:my-1.5 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1 [&_p]:my-0.5 [&_code]:bg-black/5 dark:[&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_code]:font-mono [&_a]:underline [&_a]:text-indigo-500 [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-400 [&_blockquote]:pl-2.5 [&_blockquote]:italic [&_blockquote]:my-1`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
