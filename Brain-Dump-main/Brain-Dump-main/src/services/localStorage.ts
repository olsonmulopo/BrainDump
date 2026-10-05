import { WorkspaceData } from '../types';
import { INITIAL_WORKSPACE } from '../data/initialWorkspace';

const STORAGE_KEY = 'visual_canvas_workspace_v2';
const LEGACY_STORAGE_KEY = 'milanote_offline_workspace_v1';
const AUTOSAVE_BACKUP_KEY = 'visual_canvas_backup_v2';

// Known default demo board IDs that came bundled with the tool
const DEMO_BOARD_IDS = new Set([
  'board-whop',
  'board-tdy',
  'board-moodboard',
  'board-ideas',
  'board-logo-concepts',
  'board-packaging',
  'board-tdy-sub',
]);

// Known default demo item IDs that came bundled with the tool
const DEMO_ITEM_IDS = new Set([
  'home-board-whop',
  'whop-board-tdy',
  'col-planning',
  'plan-card-1',
  'plan-card-2',
  'plan-card-3',
  'col-inspiration',
  'insp-board-1',
  'insp-board-2',
  'insp-image-drop',
  'col-design',
  'design-board-1',
  'design-board-2',
  'design-note-1',
  'canvas-image-1',
  'canvas-board-tdy-sub',
  'canvas-table-budget',
  'tdy-link-tdj',
  'tdy-note-video-prompt',
  'tdy-link-youtube',
  'tdy-line-prompt-to-video',
  'canvas-link-1',
]);

function sanitizeWorkspaceData(parsed: any): WorkspaceData {
  if (!parsed || typeof parsed !== 'object') {
    return JSON.parse(JSON.stringify(INITIAL_WORKSPACE));
  }

  // Ensure boards map exists
  const rawBoards = parsed.boards || {};
  const cleanedBoards: Record<string, any> = {};

  Object.entries(rawBoards).forEach(([id, board]: [string, any]) => {
    // Exclude default demo boards
    if (!DEMO_BOARD_IDS.has(id)) {
      cleanedBoards[id] = board;
    }
  });

  // Ensure root home board exists
  if (!cleanedBoards['board-home']) {
    cleanedBoards['board-home'] = {
      id: 'board-home',
      parentId: null,
      title: 'Home',
      icon: 'Home',
      viewState: { panX: 100, panY: 100, zoom: 1 },
      strokes: [],
    };
  }

  // Filter out demo items
  const rawItems = parsed.items || {};
  const cleanedItems: Record<string, any> = {};

  Object.entries(rawItems).forEach(([id, item]: [string, any]) => {
    if (DEMO_ITEM_IDS.has(id)) return;
    // If it's a board item pointing to a demo board, exclude it
    if (item.type === 'board' && item.targetBoardId && DEMO_BOARD_IDS.has(item.targetBoardId)) return;
    // If it belongs to a deleted demo board, exclude it
    if (item.boardId && DEMO_BOARD_IDS.has(item.boardId)) return;
    // If it's a line connector pointing to or from a demo item, exclude it
    if (item.type === 'line') {
      if (DEMO_ITEM_IDS.has(item.fromId) || DEMO_ITEM_IDS.has(item.toId)) return;
    }
    cleanedItems[id] = item;
  });

  // Validate currentBoardId
  let activeBoardId = parsed.currentBoardId;
  if (!activeBoardId || DEMO_BOARD_IDS.has(activeBoardId) || !cleanedBoards[activeBoardId]) {
    activeBoardId = 'board-home';
  }

  // Sanitize tabs
  let sanitizedTabs = Array.isArray(parsed.tabs) ? parsed.tabs : [];
  sanitizedTabs = sanitizedTabs
    .filter((t: any) => t && t.id)
    .map((t: any, idx: number) => ({
      id: t.id,
      title: t.title || `Room ${idx + 1}`,
      boardId: cleanedBoards[t.boardId] ? t.boardId : 'board-home',
    }));

  if (sanitizedTabs.length === 0) {
    sanitizedTabs = [
      {
        id: 'tab-1',
        title: 'Room 1',
        boardId: 'board-home',
      },
    ];
  }

  let activeTabId = parsed.activeTabId;
  if (!activeTabId || !sanitizedTabs.some((t: any) => t.id === activeTabId)) {
    activeTabId = sanitizedTabs[0].id;
  }

  const settings = {
    ...INITIAL_WORKSPACE.settings,
    ...(parsed.settings || {}),
  };

  return {
    version: 2,
    currentBoardId: activeBoardId,
    boards: cleanedBoards,
    items: cleanedItems,
    settings,
    tabs: sanitizedTabs,
    activeTabId,
    trash: parsed.trash || { items: {}, boards: {} },
    timeLogs: parsed.timeLogs || [],
    updatedAt: parsed.updatedAt || Date.now(),
  };
}

export function loadLocalWorkspace(): WorkspaceData {
  try {
    // 1. Check current storage key
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (parsed && parsed.boards) {
        const sanitized = sanitizeWorkspaceData(parsed);
        return sanitized;
      }
    }

    // 2. Check legacy storage key
    const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawV1) {
      const parsed = JSON.parse(rawV1);
      if (parsed && parsed.boards) {
        const sanitized = sanitizeWorkspaceData(parsed);
        // Persist the sanitized workspace to the new key and clean legacy
        saveLocalWorkspace(sanitized);
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {}
        return sanitized;
      }
    }
  } catch (err) {
    console.error('Failed to parse local workspace:', err);
  }

  const initial = JSON.parse(JSON.stringify(INITIAL_WORKSPACE));
  saveLocalWorkspace(initial);
  return initial;
}

export function saveLocalWorkspace(data: WorkspaceData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Save lightweight backup if space allows
    try {
      localStorage.setItem(
        AUTOSAVE_BACKUP_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          boardCount: Object.keys(data.boards || {}).length,
          itemCount: Object.keys(data.items || {}).length,
        })
      );
    } catch {}
  } catch (err) {
    // If quota exceeded, clean redundant backup and legacy keys and try saving again
    try {
      localStorage.removeItem(AUTOSAVE_BACKUP_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (quotaErr) {
      console.warn('LocalStorage quota limit reached, could not persist workspace:', quotaErr);
    }
  }
}

export function resetLocalWorkspace(): WorkspaceData {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(AUTOSAVE_BACKUP_KEY);
  } catch (err) {
    console.error('Failed to clear local workspace storage:', err);
  }
  const clean = JSON.parse(JSON.stringify(INITIAL_WORKSPACE));
  clean.updatedAt = Date.now();
  saveLocalWorkspace(clean);
  return clean;
}

export function exportWorkspaceJSON(data: WorkspaceData, filename = 'my-visual-boards.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportWorkspaceMarkdown(data: WorkspaceData, currentBoardId: string): void {
  const currentBoard = data.boards[currentBoardId] || Object.values(data.boards)[0];
  if (!currentBoard) return;

  let md = `# ${currentBoard.title}\n\n`;
  const boardItems = Object.values(data.items).filter((item) => item.boardId === currentBoard.id);

  // Group columns
  const columns = boardItems.filter((i) => i.type === 'column');
  const standaloneItems = boardItems.filter((i) => !i.columnId && i.type !== 'column');

  for (const col of columns) {
    md += `## Column: ${col.type === 'column' ? col.title : ''}\n\n`;
    const colItems = boardItems
      .filter((i) => i.columnId === col.id)
      .sort((a, b) => (a.orderInColumn || 0) - (b.orderInColumn || 0));

    for (const item of colItems) {
      if (item.type === 'note') {
        md += `### ${item.title || 'Note'}\n${item.content}\n\n`;
      } else if (item.type === 'todo') {
        md += `### ${item.title || 'To Do'}\n`;
        item.todos.forEach((t) => {
          md += `- [${t.completed ? 'x' : ' '}] ${t.text}\n`;
        });
        md += '\n';
      } else if (item.type === 'board') {
        md += `* Sub-board: **${item.title}** (${item.description || ''})\n\n`;
      } else if (item.type === 'link') {
        md += `* Link: [${item.title}](${item.url}) - ${item.description || ''}\n\n`;
      }
    }
  }

  if (standaloneItems.length > 0) {
    md += `## Canvas Items\n\n`;
    for (const item of standaloneItems) {
      if (item.type === 'note') {
        md += `### ${item.title || 'Note'}\n${item.content}\n\n`;
      } else if (item.type === 'todo') {
        md += `### ${item.title || 'To Do'}\n`;
        item.todos.forEach((t) => {
          md += `- [${t.completed ? 'x' : ' '}] ${t.text}\n`;
        });
        md += '\n';
      } else if (item.type === 'table') {
        md += `### Table: ${item.table.title}\n`;
        const headers = item.table.columns.map((c) => c.name).join(' | ');
        const dividers = item.table.columns.map(() => '---').join(' | ');
        md += `| ${headers} |\n| ${dividers} |\n`;
        item.table.rows.forEach((r) => {
          const rowVals = item.table.columns.map((c) => String(r.cells[c.id] ?? ''));
          md += `| ${rowVals.join(' | ')} |\n`;
        });
        md += '\n';
      } else if (item.type === 'board') {
        md += `* Board: **${item.title}** (${item.description || ''})\n\n`;
      } else if (item.type === 'link') {
        md += `* [${item.title}](${item.url}) - ${item.description || ''}\n\n`;
      } else if (item.type === 'calendar') {
        md += `### Calendar: ${item.title || 'Calendar'}\n`;
        (item.events || []).forEach((ev) => {
          md += `- [${ev.completed ? 'x' : ' '}] **${ev.date}** ${ev.time ? `(${ev.time}) ` : ''}${ev.title} [${ev.category || 'Event'}]${ev.notes ? ` - ${ev.notes}` : ''}\n`;
        });
        md += '\n';
      }
    }
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentBoard.title.toLowerCase().replace(/\s+/g, '-')}-export.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
