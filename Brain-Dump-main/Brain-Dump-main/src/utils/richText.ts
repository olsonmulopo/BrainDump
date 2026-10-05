/**
 * Utility functions for Rich Text Notes
 * Converts between legacy Markdown and clean Rich Text HTML,
 * ensuring users NEVER see raw markdown symbols (like **, *, ##, ~~).
 */

/**
 * Checks if a string contains HTML tags
 */
export function isHtmlContent(text: string): boolean {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Converts legacy Markdown into clean, accessible Rich Text HTML.
 * This cleans up any raw `**bold**`, `*italic*`, `## headings`, etc.
 */
export function markdownToHtml(md: string): string {
  if (!md) return '';
  if (isHtmlContent(md)) {
    return md;
  }

  const lines = md.split('\n');
  const htmlLines: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      htmlLines.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      htmlLines.push('</ol>');
      inOl = false;
    }
  };

  const formatInline = (text: string): string => {
    return text
      // Escape HTML entities to avoid XSS
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Highlight: ==text==
      .replace(/==(.*?)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-400/40 text-inherit px-1 rounded-sm">$1</mark>')
      // Bold: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Strikethrough: ~~text~~
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Italic: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Inline code: `code`
      .replace(/`(.*?)`/g, '<code class="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')
      // Markdown link: [text](url)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-indigo-500">$1</a>');
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      closeLists();
      htmlLines.push('<p><br></p>');
      continue;
    }

    // Heading 1 (# ...)
    if (raw.startsWith('# ')) {
      closeLists();
      htmlLines.push(`<h1 class="text-base font-bold my-1 tracking-tight">${formatInline(raw.slice(2))}</h1>`);
      continue;
    }

    // Heading 2 (## ...)
    if (raw.startsWith('## ')) {
      closeLists();
      htmlLines.push(`<h2 class="text-sm font-semibold my-1 tracking-tight">${formatInline(raw.slice(3))}</h2>`);
      continue;
    }

    // Heading 3 (### ...)
    if (raw.startsWith('### ')) {
      closeLists();
      htmlLines.push(`<h3 class="text-xs font-semibold my-0.5 tracking-tight">${formatInline(raw.slice(4))}</h3>`);
      continue;
    }

    // Checklist item: - [ ] or - [x]
    const checkMatch = raw.match(/^(\s*)(?:-\s*)?\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      closeLists();
      const isChecked = checkMatch[2].toLowerCase() === 'x';
      const text = checkMatch[3];
      htmlLines.push(
        `<div class="task-row flex items-start gap-2 py-0.5 ${isChecked ? 'line-through opacity-60' : ''}" data-task="true" data-checked="${isChecked ? 'true' : 'false'}">` +
          `<input type="checkbox" ${isChecked ? 'checked' : ''} class="task-checkbox mt-0.5 rounded cursor-pointer" />` +
          `<span class="task-text flex-1">${formatInline(text)}</span>` +
        `</div>`
      );
      continue;
    }

    // Unordered list item: - ... or * ...
    const ulMatch = raw.match(/^(\s*)[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!inUl) {
        closeLists();
        htmlLines.push('<ul class="list-disc pl-4 space-y-0.5 my-1">');
        inUl = true;
      }
      htmlLines.push(`<li>${formatInline(ulMatch[2])}</li>`);
      continue;
    }

    // Numbered list item: 1. ...
    const olMatch = raw.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!inOl) {
        closeLists();
        htmlLines.push('<ol class="list-decimal pl-4 space-y-0.5 my-1">');
        inOl = true;
      }
      htmlLines.push(`<li>${formatInline(olMatch[2])}</li>`);
      continue;
    }

    // Blockquote: > ...
    if (raw.startsWith('> ')) {
      closeLists();
      htmlLines.push(`<blockquote class="border-l-2 border-indigo-400 pl-2.5 my-1 italic opacity-85">${formatInline(raw.slice(2))}</blockquote>`);
      continue;
    }

    // Regular paragraph
    closeLists();
    htmlLines.push(`<p>${formatInline(raw)}</p>`);
  }

  closeLists();
  return htmlLines.join('');
}

/**
 * Strips HTML tags to get pure plain text for word/character counting or search.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Calculates word count accurately from HTML or plain text.
 */
export function getWordCount(content: string): number {
  const plain = stripHtml(content).trim();
  if (!plain) return 0;
  return plain.split(/\s+/).length;
}

/**
 * Converts HTML note content into clean Markdown for export.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  if (!isHtmlContent(html)) return html;

  let text = html;

  // Replace headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');

  // Replace interactive tasks
  text = text.replace(/<div[^>]*class="[^"]*task-row[^"]*"[^>]*data-checked="true"[^>]*>[\s\S]*?<span[^>]*class="task-text"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi, '- [x] $1\n');
  text = text.replace(/<div[^>]*class="[^"]*task-row[^"]*"[^>]*data-checked="false"[^>]*>[\s\S]*?<span[^>]*class="task-text"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi, '- [ ] $1\n');
  text = text.replace(/<div[^>]*class="[^"]*task-row[^"]*"[^>]*>[\s\S]*?<span[^>]*class="task-text"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi, '- [ ] $1\n');

  // Replace lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  text = text.replace(/<ul[^>]*>/gi, '');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '');
  text = text.replace(/<\/ol>/gi, '\n');

  // Replace highlights
  text = text.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '==$1==');
  text = text.replace(/<span[^>]*style="[^"]*background-color:[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '==$1==');

  // Replace inline formatting
  text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');
  text = text.replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~');
  text = text.replace(/<strike>([\s\S]*?)<\/strike>/gi, '~~$1~~');
  text = text.replace(/<u>([\s\S]*?)<\/u>/gi, '$1');

  // Replace paragraphs and linebreaks
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  text = text.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1\n');

  // Clean any remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

  return text.trim();
}
