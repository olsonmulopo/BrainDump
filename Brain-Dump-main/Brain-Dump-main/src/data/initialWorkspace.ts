import { WorkspaceData } from '../types';

export const INITIAL_WORKSPACE: WorkspaceData = {
  version: 2,
  currentBoardId: 'board-home',
  boards: {
    'board-home': {
      id: 'board-home',
      parentId: null,
      title: 'Home',
      icon: 'Home',
      viewState: { panX: 100, panY: 100, zoom: 1 },
      strokes: [],
    },
  },
  items: {},
  settings: {
    backgroundStyle: 'dots',
    theme: 'light',
    snapToGrid: false,
    gridSize: 24,
    dotSize: 0.9,
  },
  tabs: [
    {
      id: 'tab-1',
      title: 'Room 1',
      boardId: 'board-home',
    },
  ],
  activeTabId: 'tab-1',
  updatedAt: Date.now(),
};
