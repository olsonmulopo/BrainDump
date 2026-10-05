/**
 * Markdown <-> Visual HTML Converter for the .md Document App
 * 
 * Ensures all raw Markdown commands (e.g. **bold**, *italic*, ## headings, - [ ] tasks)
 * are completely INVISIBLE in the editor view, giving everyday users a seamless,
 * modern WYSIWYG experience while preserving standard, clean .md format on save.
 */

export function isHtmlContent(text: string): boolean {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Escapes characters for HTML text nodes.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats inline Markdown syntax (**bold**, *italic*, `code`, ~~strike~~, ==mark==, links, images)
 * into rich visual HTML elements with markdown commands hidden.
 */
export function formatMarkdownInline(rawText: string): string {
  if (!rawText) return '';

  let text = escapeHtml(rawText);

  // Images: ![alt](url)
  text = text.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<img src="$2" alt="$1" class="max-w-full rounded-lg shadow-xs my-2 border border-black/10 dark:border-white/10" />'
  );

  // Links: [title](url)
  text = text.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer">$1</a>'
  );

  // Inline Code: `code`
  text = text.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-black/5 dark:bg-white/10 text-emerald-600 dark:text-emerald-400">$1</code>'
  );

  // Highlights: ==highlight==
  text = text.replace(
    /==(.*?)==/g,
    '<mark class="bg-amber-200 dark:bg-amber-400/40 text-inherit px-1 rounded-xs font-medium">$1</mark>'
  );

  // Bold: **text** or __text__
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>');

  // Strikethrough: ~~text~~
  text = text.replace(/~~(.*?)~~/g, '<del class="line-through opacity-60">$1</del>');

  // Italic: *text* or _text_
  text = text.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

  return text;
}

/**
 * Converts a raw Markdown document into clean, command-free Visual HTML for the editor.
 * The average user sees bold as bold, headings as headings, tables as tables,
 * and checkboxes as checkboxes — with zero raw commands visible.
 */
export function markdownToVisualHtml(markdown: string): string {
  if (!markdown) {
    return '<p><br></p>';
  }

  // If already full HTML, return as-is
  if (isHtmlContent(markdown) && (markdown.includes('<p>') || markdown.includes('<div>') || markdown.includes('<h1>'))) {
    return markdown;
  }

  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;
  let blockquoteLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const closeList = () => {
    if (inUl) {
      output.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      output.push('</ol>');
      inOl = false;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      output.push(
        `<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 my-3 italic opacity-90 bg-indigo-500/5 rounded-r-lg">${blockquoteLines
          .map((l) => `<p>${formatMarkdownInline(l)}</p>`)
          .join('')}</blockquote>`
      );
      inBlockquote = false;
      blockquoteLines = [];
    }
  };

  const closeTable = () => {
    if (inTable && tableRows.length > 0) {
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1);

      let tableHtml = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-neutral-300 dark:border-neutral-700 text-sm rounded-lg overflow-hidden">';
      if (headerRow) {
        tableHtml += '<thead class="bg-neutral-100 dark:bg-neutral-800"><tr>';
        headerRow.forEach((cell) => {
          tableHtml += `<th class="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-left font-semibold">${formatMarkdownInline(
            cell
          )}</th>`;
        });
        tableHtml += '</tr></thead>';
      }
      if (bodyRows.length > 0) {
        tableHtml += '<tbody>';
        bodyRows.forEach((row, rIdx) => {
          const bg = rIdx % 2 === 0 ? 'bg-transparent' : 'bg-neutral-500/5';
          tableHtml += `<tr class="${bg}">`;
          row.forEach((cell) => {
            tableHtml += `<td class="border border-neutral-300 dark:border-neutral-700 px-3 py-2">${formatMarkdownInline(
              cell
            )}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody>';
      }
      tableHtml += '</table></div>';
      output.push(tableHtml);
      inTable = false;
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block fences: ```
    if (trimmed.startsWith('```')) {
      closeList();
      closeBlockquote();
      closeTable();

      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        codeLines = [];
      } else {
        inCodeBlock = false;
        const codeContent = escapeHtml(codeLines.join('\n'));
        output.push(
          `<pre class="code-block my-3 p-4 rounded-xl font-mono text-xs overflow-x-auto bg-neutral-900 text-neutral-100 dark:bg-black/60 dark:border dark:border-neutral-800" data-lang="${codeLang}"><div class="text-[10px] text-neutral-400 uppercase tracking-widest font-mono select-none mb-1.5 opacity-60">${codeLang || 'CODE'}</div><code>${codeContent}</code></pre>`
        );
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    // Markdown Table check: | cell | cell |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList();
      closeBlockquote();

      // Skip delimiter row like | :--- | :---: | ---: |
      if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(trimmed)) {
        continue;
      }

      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      inTable = true;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      closeTable();
    }

    // Blockquote: > ...
    if (trimmed.startsWith('>')) {
      closeList();
      closeTable();
      inBlockquote = true;
      blockquoteLines.push(trimmed.replace(/^>\s?/, ''));
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }

    // Horizontal Rule: ---, ***, ___
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList();
      closeBlockquote();
      closeTable();
      output.push('<hr class="my-6 border-t-2 border-neutral-200 dark:border-neutral-800" />');
      continue;
    }

    // Headings (H1, H2, H3, H4)
    if (rawLine.startsWith('# ')) {
      closeList();
      closeBlockquote();
      closeTable();
      output.push(
        `<h1 class="text-2xl sm:text-3xl font-bold tracking-tight mt-6 mb-3 text-neutral-900 dark:text-neutral-100">${formatMarkdownInline(
          rawLine.slice(2)
        )}</h1>`
      );
      continue;
    }
    if (rawLine.startsWith('## ')) {
      closeList();
      closeBlockquote();
      closeTable();
      output.push(
        `<h2 class="text-xl sm:text-2xl font-bold tracking-tight mt-5 mb-2.5 text-neutral-800 dark:text-neutral-200">${formatMarkdownInline(
          rawLine.slice(3)
        )}</h2>`
      );
      continue;
    }
    if (rawLine.startsWith('### ')) {
      closeList();
      closeBlockquote();
      closeTable();
      output.push(
        `<h3 class="text-lg font-semibold tracking-tight mt-4 mb-2 text-neutral-800 dark:text-neutral-200">${formatMarkdownInline(
          rawLine.slice(4)
        )}</h3>`
      );
      continue;
    }
    if (rawLine.startsWith('#### ')) {
      closeList();
      closeBlockquote();
      closeTable();
      output.push(
        `<h4 class="text-base font-semibold tracking-tight mt-3 mb-1.5 text-neutral-700 dark:text-neutral-300">${formatMarkdownInline(
          rawLine.slice(5)
        )}</h4>`
      );
      continue;
    }

    // Interactive Task checklist: - [ ] or - [x]
    const taskMatch = rawLine.match(/^(\s*)(?:-\s*)?\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      closeList();
      closeBlockquote();
      closeTable();
      const isChecked = taskMatch[2].toLowerCase() === 'x';
      const text = taskMatch[3];
      output.push(
        `<div class="task-row flex items-start gap-2.5 py-1 ${
          isChecked ? 'line-through opacity-60' : ''
        }" data-task="true" data-checked="${isChecked ? 'true' : 'false'}">` +
          `<input type="checkbox" ${
            isChecked ? 'checked' : ''
          } class="task-checkbox mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />` +
          `<span class="task-text flex-1 select-text">${formatMarkdownInline(text)}</span>` +
        `</div>`
      );
      continue;
    }

    // Unordered List: - ... or * ...
    const ulMatch = rawLine.match(/^(\s*)[-*]\s+(.*)$/);
    if (ulMatch) {
      closeBlockquote();
      closeTable();
      if (!inUl) {
        closeList();
        output.push('<ul class="list-disc pl-6 space-y-1 my-2.5">');
        inUl = true;
      }
      output.push(`<li>${formatMarkdownInline(ulMatch[2])}</li>`);
      continue;
    }

    // Ordered List: 1. ...
    const olMatch = rawLine.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olMatch) {
      closeBlockquote();
      closeTable();
      if (!inOl) {
        closeList();
        output.push('<ol class="list-decimal pl-6 space-y-1 my-2.5">');
        inOl = true;
      }
      output.push(`<li>${formatMarkdownInline(olMatch[2])}</li>`);
      continue;
    }

    // Empty line
    if (!trimmed) {
      closeList();
      closeBlockquote();
      closeTable();
      output.push('<p><br></p>');
      continue;
    }

    // Regular paragraph
    closeList();
    closeBlockquote();
    closeTable();
    output.push(`<p class="my-1.5 leading-relaxed">${formatMarkdownInline(rawLine)}</p>`);
  }

  closeList();
  closeBlockquote();
  closeTable();

  return output.join('\n');
}

/**
 * Reverses the visual HTML back into clean, standard Markdown (.md)
 * when saving or exporting.
 */
export function visualHtmlToMarkdown(html: string): string {
  if (!html) return '';
  if (!isHtmlContent(html)) return html;

  if (typeof document === 'undefined') {
    return html;
  }

  const container = document.createElement('div');
  container.innerHTML = html;

  const serializeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    // Check for interactive task row
    if (el.classList.contains('task-row') || el.getAttribute('data-task') === 'true') {
      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      const isChecked = checkbox ? checkbox.checked : el.getAttribute('data-checked') === 'true';
      const taskTextEl = el.querySelector('.task-text') || el;
      const innerText = serializeChildren(taskTextEl).trim();
      return `- [${isChecked ? 'x' : ' '}] ${innerText}\n`;
    }

    switch (tag) {
      case 'H1':
        return `# ${serializeChildren(el).trim()}\n\n`;
      case 'H2':
        return `## ${serializeChildren(el).trim()}\n\n`;
      case 'H3':
        return `### ${serializeChildren(el).trim()}\n\n`;
      case 'H4':
        return `#### ${serializeChildren(el).trim()}\n\n`;
      case 'H5':
        return `##### ${serializeChildren(el).trim()}\n\n`;
      case 'H6':
        return `###### ${serializeChildren(el).trim()}\n\n`;

      case 'P': {
        const text = serializeChildren(el);
        if (!text.trim() && el.querySelector('br')) {
          return '\n';
        }
        return `${text.trim()}\n\n`;
      }

      case 'BR':
        return '\n';

      case 'HR':
        return '---\n\n';

      case 'STRONG':
      case 'B':
        return `**${serializeChildren(el)}**`;

      case 'EM':
      case 'I':
        return `*${serializeChildren(el)}*`;

      case 'DEL':
      case 'S':
      case 'STRIKE':
        return `~~${serializeChildren(el)}~~`;

      case 'MARK':
        return `==${serializeChildren(el)}==`;

      case 'CODE': {
        // If child of pre, handled by pre
        if (el.closest('pre')) {
          return serializeChildren(el);
        }
        return `\`${serializeChildren(el)}\``;
      }

      case 'PRE': {
        const lang = el.getAttribute('data-lang') || '';
        const code = el.querySelector('code')?.textContent || el.textContent || '';
        return `\`\`\`${lang}\n${code.replace(/\r/g, '')}\n\`\`\`\n\n`;
      }

      case 'BLOCKQUOTE': {
        const inner = serializeChildren(el).trim();
        const lines = inner.split('\n');
        return `${lines.map((l) => `> ${l}`).join('\n')}\n\n`;
      }

      case 'UL': {
        let res = '';
        el.querySelectorAll(':scope > li').forEach((li) => {
          res += `- ${serializeChildren(li).trim()}\n`;
        });
        return `${res}\n`;
      }

      case 'OL': {
        let res = '';
        const items = el.querySelectorAll(':scope > li');
        items.forEach((li, idx) => {
          res += `${idx + 1}. ${serializeChildren(li).trim()}\n`;
        });
        return `${res}\n`;
      }

      case 'TABLE': {
        const rows: string[][] = [];
        el.querySelectorAll('tr').forEach((tr) => {
          const cells: string[] = [];
          tr.querySelectorAll('th, td').forEach((cell) => {
            cells.push(serializeChildren(cell).trim().replace(/\|/g, '\\|'));
          });
          if (cells.length > 0) {
            rows.push(cells);
          }
        });

        if (rows.length === 0) return '';

        let tableMd = '';
        const header = rows[0];
        tableMd += `| ${header.join(' | ')} |\n`;
        tableMd += `| ${header.map(() => '---').join(' | ')} |\n`;

        for (let i = 1; i < rows.length; i++) {
          tableMd += `| ${rows[i].join(' | ')} |\n`;
        }
        return `${tableMd}\n`;
      }

      case 'A': {
        const href = el.getAttribute('href') || '';
        const text = serializeChildren(el);
        return `[${text}](${href})`;
      }

      case 'IMG': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        return `![${alt}](${src})`;
      }

      case 'DIV': {
        // Normal container div
        const inner = serializeChildren(el);
        return inner ? `${inner}\n` : '';
      }

      default:
        return serializeChildren(el);
    }
  };

  const serializeChildren = (el: Node): string => {
    let out = '';
    el.childNodes.forEach((child) => {
      out += serializeNode(child);
    });
    return out;
  };

  let md = '';
  container.childNodes.forEach((node) => {
    md += serializeNode(node);
  });

  // Clean excessive blank lines (more than 2 consecutive)
  return md.replace(/\n{3,}/g, '\n\n').trim();
}
