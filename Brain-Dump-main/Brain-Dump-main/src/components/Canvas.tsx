import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  CanvasItem,
  BoardData,
  ItemType,
  DrawStroke,
  DrawPoint,
  LineConnectorItem,
  TimeLogEntry,
  CanvasSettings,
  FileCardItem,
  CalendarCardItem,
  FolderCardItem,
} from '../types';
import { NoteCard } from './items/NoteCard';
import { LinkCard } from './items/LinkCard';
import { TodoCard } from './items/TodoCard';
import { BoardCard } from './items/BoardCard';
import { ColumnCard } from './items/ColumnCard';
import { TableCard } from './items/TableCard';
import { ImageCard } from './items/ImageCard';
import { CommentCard } from './items/CommentCard';
import { TimerCard } from './items/TimerCard';
import { TitleCard } from './items/TitleCard';
import { FileCard } from './items/FileCard';
import { CalendarCard } from './items/CalendarCard';
import { FolderCard } from './items/FolderCard';
import { ConnectorLine, getItemBounds, getBoxBorderPoint, getItemBorderPoint } from './items/ConnectorLine';
import { ArrowToolbar } from './items/ArrowToolbar';
import { isColorDark } from '../utils/theme';
import { getArrowCollapseState, isLineOutgoingFrom } from '../utils/arrowCollapse';

// Custom high-contrast SVG cursors that point outwards from each boundary edge
export const CONNECT_ARROW_CURSOR_TOP = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28' fill='none'%3E%3Ccircle cx='14' cy='22' r='4' fill='%236366f1' stroke='white' stroke-width='2'/%3E%3Cpath d='M14 22V7' stroke='white' stroke-width='4.5' stroke-linecap='round'/%3E%3Cpath d='M8 13l6-6 6 6' stroke='white' stroke-width='4.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M14 22V7' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M8 13l6-6 6 6' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 14 22, crosshair`;

export const CONNECT_ARROW_CURSOR_RIGHT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28' fill='none'%3E%3Ccircle cx='6' cy='14' r='4' fill='%236366f1' stroke='white' stroke-width='2'/%3E%3Cpath d='M6 14H21' stroke='white' stroke-width='4.5' stroke-linecap='round'/%3E%3Cpath d='M15 8l6 6-6 6' stroke='white' stroke-width='4.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M6 14H21' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M15 8l6 6-6 6' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 6 14, crosshair`;

export const CONNECT_ARROW_CURSOR_BOTTOM = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28' fill='none'%3E%3Ccircle cx='14' cy='6' r='4' fill='%236366f1' stroke='white' stroke-width='2'/%3E%3Cpath d='M14 6V21' stroke='white' stroke-width='4.5' stroke-linecap='round'/%3E%3Cpath d='M8 15l6 6 6-6' stroke='white' stroke-width='4.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M14 6V21' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M8 15l6 6 6-6' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 14 6, crosshair`;

export const CONNECT_ARROW_CURSOR_LEFT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28' fill='none'%3E%3Ccircle cx='22' cy='14' r='4' fill='%236366f1' stroke='white' stroke-width='2'/%3E%3Cpath d='M22 14H7' stroke='white' stroke-width='4.5' stroke-linecap='round'/%3E%3Cpath d='M13 8l-6 6 6 6' stroke='white' stroke-width='4.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M22 14H7' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M13 8l-6 6 6 6' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 22 14, crosshair`;

export const CONNECT_ARROW_CURSOR = CONNECT_ARROW_CURSOR_RIGHT;
import {
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X,
  PenTool,
  Check,
  RotateCcw,
  Trash2,
  Focus,
  ZoomIn,
  ZoomOut,
  Copy,
  GripVertical,
  Move,
  Plus,
  Minus,
  Maximize2,
} from 'lucide-react';

interface CanvasProps {
  currentBoard: BoardData;
  items: Record<string, CanvasItem>;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateItem: (id: string, updates: Partial<CanvasItem>) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem?: (item: CanvasItem) => void;
  onAddItem: (type: ItemType, pos?: { x: number; y: number }, columnId?: string) => void;
  onOpenBoard: (boardTitle: string) => void;
  isDrawMode: boolean;
  onToggleDrawMode?: () => void;
  onAddStroke: (stroke: DrawStroke) => void;
  onUpdateStroke?: (strokeId: string, updates: Partial<DrawStroke>) => void;
  onDeleteStroke?: (strokeId: string) => void;
  onDuplicateStroke?: (strokeId: string) => void;
  onUndoStroke?: () => void;
  onClearStrokes?: () => void;
  pan: { x: number; y: number };
  zoom: number;
  onUpdateViewport: (pan: { x: number; y: number }, zoom: number) => void;
  onFitToContent?: () => void;
  searchQuery?: string;
  settings?: CanvasSettings;
  onConnectItems?: (fromId: string, toId: string) => void;
  onUploadFiles?: (files: File[], pos?: { x: number; y: number }, columnId?: string) => void;
  onOpenPreview?: (item: FileCardItem) => void;
  onLogTime?: (entry: {
    cardId: string;
    cardTitle: string;
    durationSeconds: number;
    category: 'Design' | 'Development' | 'Planning' | 'Review' | 'Storyboard' | 'Meeting' | 'Writing' | 'Other';
    notes?: string;
  }) => void;
  onOpenCalendarModal?: (cardId?: string) => void;
  onOpenFolderModal?: (folder: FolderCardItem) => void;
  onMoveFileToFolder?: (file: FileCardItem, folderId: string) => void;
  onFilesDroppedOnFolder?: (folderId: string, files: File[]) => void;
  onUpdateItems?: (updates: Record<string, Partial<CanvasItem>>) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  currentBoard,
  items,
  selectedItemId,
  onSelectItem,
  onUpdateItem,
  onUpdateItems,
  onDeleteItem,
  onDuplicateItem,
  onAddItem,
  onOpenBoard,
  isDrawMode,
  onToggleDrawMode,
  onAddStroke,
  onUpdateStroke,
  onDeleteStroke,
  onDuplicateStroke,
  onUndoStroke,
  onClearStrokes,
  pan,
  zoom,
  onUpdateViewport,
  onFitToContent,
  searchQuery,
  settings,
  onConnectItems,
  onUploadFiles,
  onOpenPreview,
  onLogTime,
  onOpenCalendarModal,
  onOpenFolderModal,
  onMoveFileToFolder,
  onFilesDroppedOnFolder,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingFilesOver, setIsDraggingFilesOver] = useState(false);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);

  // Robust global handler for OS file dragging into canvas / folders
  useEffect(() => {
    let dragCounter = 0;
    let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

    const resetDragOver = () => {
      dragCounter = 0;
      setIsDraggingFilesOver(false);
      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer);
        autoDismissTimer = null;
      }
    };

    const handleWindowDragEnter = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        dragCounter++;
        setIsDraggingFilesOver(true);
        if (autoDismissTimer) clearTimeout(autoDismissTimer);
        autoDismissTimer = setTimeout(() => {
          resetDragOver();
        }, 3500);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault();
        if (autoDismissTimer) clearTimeout(autoDismissTimer);
        autoDismissTimer = setTimeout(() => {
          resetDragOver();
        }, 3500);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        dragCounter--;
        if (dragCounter <= 0) {
          resetDragOver();
        }
      }
    };

    // CAPTURE phase for drop & dragend: intercepts immediately before any child calls stopPropagation
    const handleCaptureDrop = () => {
      resetDragOver();
    };

    const handleCaptureDragEnd = () => {
      resetDragOver();
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetDragOver();
      }
    };

    const handleWindowMouseUp = () => {
      resetDragOver();
    };

    const handleCustomDropEnded = () => {
      resetDragOver();
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleCaptureDrop, true);
    window.addEventListener('dragend', handleCaptureDragEnd, true);
    window.addEventListener('keydown', handleWindowKeyDown);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('canvas-file-dropped', handleCustomDropEnded);

    return () => {
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleCaptureDrop, true);
      window.removeEventListener('dragend', handleCaptureDragEnd, true);
      window.removeEventListener('keydown', handleWindowKeyDown);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('canvas-file-dropped', handleCustomDropEnded);
    };
  }, []);

  // Dragging cards
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [isDraggingMoved, setIsDraggingMoved] = useState(false);
  const dragRef = useRef<{
    itemId: string;
    startScreen: { x: number; y: number };
    startItem: { x: number; y: number };
    hasMoved: boolean;
  } | null>(null);

  // Freehand drawing state
  const [currentStroke, setCurrentStroke] = useState<DrawPoint[] | null>(null);
  const [penColor, setPenColor] = useState('#6366f1');
  const [penSize, setPenSize] = useState(3);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawPoint[]>([]);

  // Stroke selection and move state
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const [draggingStrokeId, setDraggingStrokeId] = useState<string | null>(null);
  const strokeDragRef = useRef<{
    strokeId: string;
    startScreen: { x: number; y: number };
    startPoints: DrawPoint[];
    hasMoved: boolean;
  } | null>(null);

  // Connecting cards with arrows state
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [cursorCanvasPos, setCursorCanvasPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  // Cancel connecting mode on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && connectingFromId) {
        setConnectingFromId(null);
        setCursorCanvasPos(null);
        setHoveredTargetId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [connectingFromId]);

  // Filter items that belong to the current board
  const boardItems = Object.values(items).filter((item) => item.boardId === currentBoard.id);

  // Line connectors
  const lineConnectors = boardItems.filter((item) => item.type === 'line') as LineConnectorItem[];

  // Arrow collapse calculation: determines hidden items, collapsed lines, and hidden intermediate lines
  const collapseState = useMemo(
    () => getArrowCollapseState(items, lineConnectors),
    [items, lineConnectors]
  );
  const { hiddenItemIds, collapsedLineIds, hiddenLineIds, downstreamCountByLineId } = collapseState;

  // Search override: if user is searching for something, ensure search hits are not obscured
  const isSearchActive = Boolean(searchQuery && searchQuery.trim().length > 0);
  const isItemHidden = (itemId: string) => {
    const it = items[itemId];
    if (it?.columnId && hiddenItemIds.has(it.columnId)) {
      return true;
    }
    if (!hiddenItemIds.has(itemId)) return false;
    if (isSearchActive) {
      if (it && JSON.stringify(it).toLowerCase().includes(searchQuery!.toLowerCase())) {
        return false;
      }
    }
    return true;
  };

  // Standalone canvas items (not inside columns, not lines, and not hidden)
  const standaloneItems = boardItems.filter(
    (item) => !item.columnId && item.type !== 'line' && !isItemHidden(item.id)
  );
  // Column items (not hidden)
  const columns = boardItems.filter((item) => item.type === 'column' && !isItemHidden(item.id));

  // Toggle all outgoing branches from a specific item
  const handleToggleOutgoingBranches = (itemId: string) => {
    const outgoing = lineConnectors.filter((l) => isLineOutgoingFrom(l, itemId));
    if (outgoing.length === 0) return;
    const allCollapsed = outgoing.every((l) => Boolean(l.isCollapsed));
    const targetCollapsedState = !allCollapsed;

    if (onUpdateItems) {
      const updates: Record<string, Partial<CanvasItem>> = {};
      outgoing.forEach((line) => {
        updates[line.id] = { isCollapsed: targetCollapsedState };
      });
      onUpdateItems(updates);
    } else {
      outgoing.forEach((line) => {
        onUpdateItem(line.id, { isCollapsed: targetCollapsedState } as Partial<CanvasItem>);
      });
    }
  };

  // Deselect item or line if it becomes hidden by an arrow collapse
  useEffect(() => {
    if (selectedItemId && (isItemHidden(selectedItemId) || hiddenLineIds.has(selectedItemId))) {
      onSelectItem(null);
    }
  }, [selectedItemId, hiddenItemIds, hiddenLineIds, onSelectItem]);

  // Convert screen coordinates to canvas space
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Stable ref for viewport state to keep native event listeners active without teardown
  const viewportRef = useRef({ pan, zoom, onUpdateViewport });
  useEffect(() => {
    viewportRef.current = { pan, zoom, onUpdateViewport };
    window.dispatchEvent(new CustomEvent('canvas:viewport-change', { detail: { pan, zoom } }));
  }, [pan, zoom, onUpdateViewport]);

  // Non-passive wheel and gesture listener: prevents whole-browser zoom on Ctrl+Wheel and zooms only canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const { pan: currentPan, zoom: currentZoom, onUpdateViewport: updateViewport } = viewportRef.current;

      // When Ctrl or Meta is held, the user is zooming with mouse wheel or trackpad pinch
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Smooth zoom step
        let zoomFactor: number;
        if (e.deltaMode === 1) {
          // Line mode (common on Windows wheel mice)
          zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        } else {
          // Pixel mode (trackpads or standard wheel)
          const clampedDelta = Math.max(-100, Math.min(100, e.deltaY));
          zoomFactor = Math.exp(-clampedDelta * 0.0035);
        }

        const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.25), 3.0);

        // Keep canvas point under cursor fixed during zoom
        const newPanX = mouseX - ((mouseX - currentPan.x) / currentZoom) * newZoom;
        const newPanY = mouseY - ((mouseY - currentPan.y) / currentZoom) * newZoom;

        updateViewport({ x: newPanX, y: newPanY }, newZoom);
        return;
      }

      // Normal wheel without Ctrl: pan canvas smoothly unless inside a scrollable container or input
      const target = e.target as HTMLElement | null;
      let el: HTMLElement | null = target;
      while (el && el !== container) {
        if (
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'INPUT' ||
          el.getAttribute('contenteditable') === 'true' ||
          el.hasAttribute('data-scrollable') ||
          el.classList.contains('custom-scrollbar')
        ) {
          return;
        }

        // Check if current ancestor element is scrollable
        const style = window.getComputedStyle(el);
        const canScrollY =
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight;
        const canScrollX =
          (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
          el.scrollWidth > el.clientWidth;

        if (canScrollY || canScrollX) {
          return;
        }

        el = el.parentElement;
      }

      e.preventDefault();
      updateViewport(
        {
          x: currentPan.x - e.deltaX,
          y: currentPan.y - e.deltaY,
        },
        currentZoom
      );
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    // Window capture listener to strictly block native browser zoom on Ctrl+Wheel anywhere
    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });

    // Keyboard shortcuts for zooming: Ctrl+=, Ctrl+-, Ctrl+0
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '0') {
        e.preventDefault();
        const { pan: currentPan, zoom: currentZoom, onUpdateViewport: updateViewport } = viewportRef.current;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        if (e.key === '=' || e.key === '+') {
          const newZoom = Math.min(currentZoom * 1.15, 3.0);
          const newPanX = centerX - ((centerX - currentPan.x) / currentZoom) * newZoom;
          const newPanY = centerY - ((centerY - currentPan.y) / currentZoom) * newZoom;
          updateViewport({ x: newPanX, y: newPanY }, newZoom);
        } else if (e.key === '-') {
          const newZoom = Math.max(currentZoom * 0.85, 0.25);
          const newPanX = centerX - ((centerX - currentPan.x) / currentZoom) * newZoom;
          const newPanY = centerY - ((centerY - currentPan.y) / currentZoom) * newZoom;
          updateViewport({ x: newPanX, y: newPanY }, newZoom);
        } else if (e.key === '0') {
          const newZoom = 1;
          const newPanX = centerX - ((centerX - currentPan.x) / currentZoom) * newZoom;
          const newPanY = centerY - ((centerY - currentPan.y) / currentZoom) * newZoom;
          updateViewport({ x: newPanX, y: newPanY }, newZoom);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false, capture: true });

    const preventGesture = (e: Event) => e.preventDefault();
    window.addEventListener('gesturestart', preventGesture, { passive: false });
    window.addEventListener('gesturechange', preventGesture, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
      window.removeEventListener('wheel', handleGlobalWheel, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('gesturestart', preventGesture);
      window.removeEventListener('gesturechange', preventGesture);
    };
  }, []);

  // Window-level mouse listener for smooth canvas panning
  useEffect(() => {
    if (!isPanning) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!panStartRef.current) return;
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      onUpdateViewport(
        {
          x: panStartRef.current.panX + dx,
          y: panStartRef.current.panY + dy,
        },
        zoom
      );
    };

    const handleWindowMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isPanning, zoom, onUpdateViewport]);

  // Window-level mouse listener for card dragging (prevents sticking and suppresses drag clicks)
  useEffect(() => {
    if (!draggingItemId) return;

    let rafId: number | null = null;
    let latestEvt: MouseEvent | null = null;

    const updateItemPosition = () => {
      rafId = null;
      if (!dragRef.current || !latestEvt) return;
      const { itemId, startScreen, startItem } = dragRef.current;

      const dxScreen = latestEvt.clientX - startScreen.x;
      const dyScreen = latestEvt.clientY - startScreen.y;

      // Mark moved if dragged beyond 3px threshold
      if (!dragRef.current.hasMoved && Math.hypot(dxScreen, dyScreen) > 3) {
        dragRef.current.hasMoved = true;
        setIsDraggingMoved(true);
      }

      if (dragRef.current.hasMoved) {
        const dxCanvas = dxScreen / zoom;
        const dyCanvas = dyScreen / zoom;

        const rawX = startItem.x + dxCanvas;
        const rawY = startItem.y + dyCanvas;

        const gridStep = settings?.snapToGrid ? (settings?.gridSize || 24) : 1;
        const snappedX = gridStep > 1 ? Math.round(rawX / gridStep) * gridStep : Math.round(rawX);
        const snappedY = gridStep > 1 ? Math.round(rawY / gridStep) * gridStep : Math.round(rawY);

        onUpdateItem(itemId, { x: snappedX, y: snappedY });

        // If the dragged item is a file card, check if cursor is over any folder card
        const draggedItem = items[itemId];
        if (draggedItem && draggedItem.type === 'file') {
          const mouseCanvasX = (latestEvt.clientX - pan.x) / zoom;
          const mouseCanvasY = (latestEvt.clientY - pan.y) / zoom;

          const targetFolder = Object.values(items).find(
            (it): it is FolderCardItem =>
              it.boardId === currentBoard.id &&
              it.type === 'folder' &&
              it.id !== itemId &&
              mouseCanvasX >= it.x - 12 &&
              mouseCanvasX <= it.x + (it.width || 170) + 12 &&
              mouseCanvasY >= it.y - 12 &&
              mouseCanvasY <= it.y + (it.height || 140) + 12
          );
          setHoveredFolderId(targetFolder ? targetFolder.id : null);
        } else {
          setHoveredFolderId(null);
        }
      }
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      latestEvt = e;
      if (rafId === null) {
        rafId = requestAnimationFrame(updateItemPosition);
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      const wasDragging = dragRef.current?.hasMoved;
      const draggedId = dragRef.current?.itemId;
      const draggedFile = draggedId ? items[draggedId] : null;
      const destinationFolderId = hoveredFolderId;

      dragRef.current = null;
      setDraggingItemId(null);
      setIsDraggingMoved(false);
      setHoveredFolderId(null);

      // If user dragged a file over a folder: store it into the folder!
      if (wasDragging && draggedFile && draggedFile.type === 'file' && destinationFolderId) {
        onMoveFileToFolder?.(draggedFile as FileCardItem, destinationFolderId);
      }

      // If user actually dragged, block the immediate trailing click so links/buttons don't trigger!
      if (wasDragging) {
        const suppressClick = (clickEvt: MouseEvent) => {
          clickEvt.stopPropagation();
          clickEvt.preventDefault();
        };
        window.addEventListener('click', suppressClick, { capture: true, once: true });
        setTimeout(() => {
          window.removeEventListener('click', suppressClick, { capture: true });
        }, 100);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [
    draggingItemId,
    zoom,
    pan,
    items,
    currentBoard.id,
    hoveredFolderId,
    onUpdateItem,
    onMoveFileToFolder,
    settings?.snapToGrid,
    settings?.gridSize,
  ]);

  // Window-level mouse listener for dragging freehand strokes
  useEffect(() => {
    if (!draggingStrokeId) return;

    const handleStrokeMouseMove = (e: MouseEvent) => {
      if (!strokeDragRef.current) return;
      const { strokeId, startScreen, startPoints } = strokeDragRef.current;
      const dxScreen = e.clientX - startScreen.x;
      const dyScreen = e.clientY - startScreen.y;

      if (!strokeDragRef.current.hasMoved && Math.hypot(dxScreen, dyScreen) > 3) {
        strokeDragRef.current.hasMoved = true;
      }

      if (strokeDragRef.current.hasMoved) {
        const dxCanvas = dxScreen / zoom;
        const dyCanvas = dyScreen / zoom;
        const newPoints = startPoints.map((p) => ({
          x: Math.round(p.x + dxCanvas),
          y: Math.round(p.y + dyCanvas),
        }));
        onUpdateStroke?.(strokeId, { points: newPoints });
      }
    };

    const handleStrokeMouseUp = () => {
      const wasMoved = strokeDragRef.current?.hasMoved;
      strokeDragRef.current = null;
      setDraggingStrokeId(null);

      if (wasMoved) {
        const suppressClick = (clickEvt: MouseEvent) => {
          clickEvt.stopPropagation();
          clickEvt.preventDefault();
        };
        window.addEventListener('click', suppressClick, { capture: true, once: true });
        setTimeout(() => {
          window.removeEventListener('click', suppressClick, { capture: true });
        }, 100);
      }
    };

    window.addEventListener('mousemove', handleStrokeMouseMove);
    window.addEventListener('mouseup', handleStrokeMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleStrokeMouseMove);
      window.removeEventListener('mouseup', handleStrokeMouseUp);
    };
  }, [draggingStrokeId, zoom, onUpdateStroke]);

  // Keyboard shortcut for deleting selected drawing stroke
  useEffect(() => {
    const handleStrokeKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedStrokeId) {
          e.preventDefault();
          onDeleteStroke?.(selectedStrokeId);
          setSelectedStrokeId(null);
        }
      } else if (e.key === 'Escape') {
        if (selectedStrokeId) {
          setSelectedStrokeId(null);
        }
      }
    };

    window.addEventListener('keydown', handleStrokeKeyDown);
    return () => window.removeEventListener('keydown', handleStrokeKeyDown);
  }, [selectedStrokeId, onDeleteStroke]);

  // Stable ref for drawing parameters to prevent rebuilding pointer listeners
  const drawStateRef = useRef({ pan, zoom, onAddStroke, penColor, penSize });
  useEffect(() => {
    drawStateRef.current = { pan, zoom, onAddStroke, penColor, penSize };
  }, [pan, zoom, onAddStroke, penColor, penSize]);

  // Window-level pointer listeners for freehand drawing (supports mouse, pen/stylus, touch)
  useEffect(() => {
    if (!isDrawMode) {
      isDrawingRef.current = false;
      currentStrokeRef.current = [];
      setCurrentStroke((prev) => (prev !== null ? null : prev));
      return;
    }

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentPan = drawStateRef.current.pan;
      const currentZoom = drawStateRef.current.zoom;
      const coords = {
        x: (e.clientX - rect.left - currentPan.x) / currentZoom,
        y: (e.clientY - rect.top - currentPan.y) / currentZoom,
      };
      const pts = currentStrokeRef.current;
      if (pts.length > 0) {
        const last = pts[pts.length - 1];
        if (Math.abs(coords.x - last.x) < 1 && Math.abs(coords.y - last.y) < 1) {
          return;
        }
      }
      pts.push(coords);
      setCurrentStroke([...pts]);
    };

    const handleWindowPointerUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      const completed = [...currentStrokeRef.current];
      currentStrokeRef.current = [];
      setCurrentStroke(null);

      if (completed.length > 0) {
        const validPoints =
          completed.length === 1
            ? [completed[0], { x: completed[0].x + 0.1, y: completed[0].y + 0.1 }]
            : completed;

        drawStateRef.current.onAddStroke({
          id: 'stroke-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          points: validPoints,
          color: drawStateRef.current.penColor,
          size: drawStateRef.current.penSize,
        });
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [isDrawMode]);

  // Direct start for freehand drawing
  const handleDrawPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // only left click / primary touch
    e.preventDefault();
    e.stopPropagation();

    const coords = getCanvasCoords(e.clientX, e.clientY);
    isDrawingRef.current = true;
    currentStrokeRef.current = [coords];
    setCurrentStroke([coords]);
  };

  // Mouse pan handling on canvas background
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDrawMode) {
      return; // Handled directly by drawing surface
    }

    if (connectingFromId && !hoveredTargetId) {
      setConnectingFromId(null);
      setCursorCanvasPos(null);
      return;
    }

    const target = e.target as HTMLElement;
    const isBackground =
      target === containerRef.current ||
      target.id === 'canvas-grid' ||
      target.id === 'canvas-content-layer' ||
      target.id === 'canvas-cards-layer';

    if (isBackground || e.button === 1) {
      setIsPanning(true);
      window.dispatchEvent(new CustomEvent('canvas:pan-start'));
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      onSelectItem(null);
      setSelectedStrokeId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (connectingFromId) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setCursorCanvasPos(coords);
    }
  };

  const handleMouseUp = () => {
    if (connectingFromId && hoveredTargetId && connectingFromId !== hoveredTargetId) {
      onConnectItems?.(connectingFromId, hoveredTargetId);
      setConnectingFromId(null);
      setCursorCanvasPos(null);
      setHoveredTargetId(null);
    }
  };

  const startDraggingItem = (itemId: string, e: React.MouseEvent) => {
    if (isDrawMode || connectingFromId) return;
    if (e.button !== 0) return; // Only left click initiates drag

    onSelectItem(itemId);
    const item = items[itemId];
    if (!item) return;

    dragRef.current = {
      itemId,
      startScreen: { x: e.clientX, y: e.clientY },
      startItem: { x: item.x, y: item.y },
      hasMoved: false,
    };
    setDraggingItemId(itemId);
  };

  const handleStartConnecting = (fromItemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConnectingFromId(fromItemId);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setCursorCanvasPos(coords);
  };

  const handleCardClickInConnectingMode = (cardId: string) => {
    if (!connectingFromId) {
      setConnectingFromId(cardId);
    } else if (connectingFromId !== cardId) {
      onConnectItems?.(connectingFromId, cardId);
      setConnectingFromId(null);
      setCursorCanvasPos(null);
    }
  };

  // Dynamic outward-pointing cursor while actively dragging an arrow connection
  const activeConnectingCursor = React.useMemo(() => {
    if (!connectingFromId || !cursorCanvasPos) return undefined;
    const source = items[connectingFromId];
    if (!source) return CONNECT_ARROW_CURSOR_RIGHT;
    const box = getItemBounds(source, items);
    const cx = source.type === 'timer' ? box.x + 92 : box.x + box.width / 2;
    const cy = source.type === 'timer' ? box.y + 92 : box.y + box.height / 2;
    const dx = cursorCanvasPos.x - cx;
    const dy = cursorCanvasPos.y - cy;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 ? CONNECT_ARROW_CURSOR_RIGHT : CONNECT_ARROW_CURSOR_LEFT;
    } else {
      return dy >= 0 ? CONNECT_ARROW_CURSOR_BOTTOM : CONNECT_ARROW_CURSOR_TOP;
    }
  }, [connectingFromId, cursorCanvasPos, items]);

  // Compute live arrow preview path if currently connecting
  const getConnectingArrowPath = () => {
    if (!connectingFromId || !cursorCanvasPos) return null;
    const sourceItem = items[connectingFromId];
    if (!sourceItem) return null;

    const sourceBox = getItemBounds(sourceItem, items);
    const sourceCenter = {
      x: sourceItem.type === 'timer' ? sourceBox.x + 92 : sourceBox.x + sourceBox.width / 2,
      y: sourceItem.type === 'timer' ? sourceBox.y + 92 : sourceBox.y + sourceBox.height / 2,
    };

    let endX = cursorCanvasPos.x;
    let endY = cursorCanvasPos.y;

    // If currently hovering over another card, snap the preview arrowhead to the target card's outer border
    if (hoveredTargetId && items[hoveredTargetId] && hoveredTargetId !== connectingFromId) {
      const targetItem = items[hoveredTargetId];
      const targetBox = getItemBounds(targetItem, items);
      const targetCenter = {
        x: targetItem.type === 'timer' ? targetBox.x + 92 : targetBox.x + targetBox.width / 2,
        y: targetItem.type === 'timer' ? targetBox.y + 92 : targetBox.y + targetBox.height / 2,
      };

      const p2 = getItemBorderPoint(targetCenter, sourceCenter, targetItem, targetBox, 4);
      endX = p2.x;
      endY = p2.y;
    }

    const p1 = getItemBorderPoint(sourceCenter, { x: endX, y: endY }, sourceItem, sourceBox, 4);
    const startX = p1.x;
    const startY = p1.y;

    const dist = Math.hypot(endX - startX, endY - startY);
    const offset = Math.max(12, Math.min(dist * 0.32, 65));

    const cx1 = startX + (endX > startX ? offset : -offset);
    const cy1 = startY + (endY > startY ? offset * 0.3 : -offset * 0.3);
    const cx2 = endX - (endX > startX ? offset : -offset);
    const cy2 = endY - (endY > startY ? offset * 0.3 : -offset * 0.3);

    return `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
  };

  const renderSingleItem = (item: CanvasItem, isInsideColumn = false) => {
    const isSelected = selectedItemId === item.id;
    const isConnectingSource = connectingFromId === item.id;
    const isConnectingHover = hoveredTargetId === item.id && connectingFromId !== item.id;
    const isMatch = searchQuery
      ? JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const workflowStatus = item.workflowStatus;
    const workflowClass =
      workflowStatus === 'done'
        ? 'ring-2 ring-emerald-500/80 rounded-xl'
        : workflowStatus === 'in_progress'
        ? 'ring-2 ring-blue-500/90 shadow-sm shadow-blue-500/15 rounded-xl'
        : workflowStatus === 'pending'
        ? 'ring-2 ring-amber-500/80 rounded-xl'
        : workflowStatus === 'error'
        ? 'ring-2 ring-rose-500/90 shadow-sm shadow-rose-500/15 rounded-xl'
        : '';

    const wrapperClasses = isInsideColumn
      ? `pointer-events-auto ${workflowClass}`
      : `absolute group/item pointer-events-auto ${workflowClass} ${
          isMatch ? '' : 'opacity-25'
        }`;

    const content = (() => {
      switch (item.type) {
        case 'note':
          return (
            <NoteCard
              item={item}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              onDuplicate={onDuplicateItem ? (it) => onDuplicateItem(it) : undefined}
              onStartConnecting={(e) => handleStartConnecting(item.id, e)}
              isSelected={isSelected}
              isInsideColumn={isInsideColumn}
            />
          );
        case 'link':
          return (
            <LinkCard
              item={item}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              isSelected={isSelected}
            />
          );
        case 'todo':
          return (
            <TodoCard
              item={item}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              isSelected={isSelected}
              isInsideColumn={isInsideColumn}
            />
          );
        case 'board':
          return (
            <BoardCard
              item={item}
              onOpenBoard={onOpenBoard}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              onSelect={() => onSelectItem(item.id)}
              isSelected={isSelected}
              isStandaloneCanvasItem={!isInsideColumn}
              isCanvasDark={isCanvasDark}
            />
          );
        case 'timer':
          return (
            <TimerCard
              item={item}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              onSelect={() => onSelectItem(item.id)}
              onLogTime={onLogTime}
              onStartConnecting={(e) => handleStartConnecting(item.id, e)}
              isSelected={isSelected}
            />
          );
        case 'column':
          return null; // Handled separately
        case 'table':
          return (
            <TableCard
              item={item}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              isSelected={isSelected}
            />
          );
        case 'image':
          return (
            <ImageCard
              item={item}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              isSelected={isSelected}
            />
          );
        case 'comment':
          return (
            <CommentCard
              item={item}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              isSelected={isSelected}
            />
          );
        case 'title':
          return (
            <TitleCard
              item={item}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              onStartConnecting={(e) => handleStartConnecting(item.id, e)}
              isSelected={isSelected}
            />
          );
        case 'file':
          return (
            <FileCard
              item={item}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              onOpenPreview={onOpenPreview}
              onStartConnecting={(e) => handleStartConnecting(item.id, e)}
              isSelected={isSelected}
            />
          );
        case 'calendar':
          return (
            <CalendarCard
              item={item as CalendarCardItem}
              allItems={items}
              lineConnectors={lineConnectors}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              onOpenModal={onOpenCalendarModal}
              onStartConnecting={(e) => handleStartConnecting(item.id, e)}
              isSelected={isSelected}
              isInsideColumn={isInsideColumn}
            />
          );
        case 'folder':
          return (
            <FolderCard
              item={item as FolderCardItem}
              onUpdate={(u) => onUpdateItem(item.id, u)}
              onDelete={() => onDeleteItem(item.id)}
              onOpenFolder={() => onOpenFolderModal?.(item as FolderCardItem)}
              onStartConnecting={(e) => handleStartConnecting(item.id, e)}
              isSelected={isSelected}
              isInsideColumn={isInsideColumn}
              isDropTarget={hoveredFolderId === item.id}
              onFilesDropped={(files) => onFilesDroppedOnFolder?.(item.id, files)}
            />
          );
        default:
          return null;
      }
    })();

    if (isInsideColumn) {
      return (
        <div
          id={`child-container-${item.id}`}
          className="w-full max-w-full overflow-hidden box-border"
          onClick={(e) => {
            e.stopPropagation();
            onSelectItem(item.id);
          }}
        >
          {content}
        </div>
      );
    }

    return (
      <div
        key={item.id}
        id={`card-container-${item.id}`}
        className={wrapperClasses}
        style={{
          transform: `translate(${item.x}px, ${item.y}px)`,
          transition: 'none',
          width:
            item.type === 'title'
              ? item.width && item.width !== 340
                ? `${item.width}px`
                : 'max-content'
              : item.type === 'note'
              ? `${item.width && item.width !== 560 ? Math.min(Math.max(item.width, 240), 680) : 280}px`
              : item.type === 'comment'
              ? `${Math.max(item.width || 280, 240)}px`
              : item.type === 'board'
              ? 'max-content'
              : item.type === 'timer'
              ? item.simpleMode !== false
                ? 'max-content'
                : `${item.width || 200}px`
              : item.type === 'file'
              ? `${item.width || 220}px`
              : item.type === 'todo'
              ? `${item.width && item.width !== 380 && item.width !== 240 ? Math.min(Math.max(item.width, 240), 520) : 280}px`
              : item.type === 'link'
              ? `${item.width ? Math.min(Math.max(item.width, 240), 480) : 280}px`
              : item.type === 'calendar'
              ? `${item.width || 440}px`
              : item.width
              ? `${item.width}px`
              : '280px',
          maxWidth: item.type === 'title' ? '760px' : undefined,
          zIndex: isSelected || isConnectingSource ? 30 : 15,
        }}
        onMouseEnter={() => {
          if (connectingFromId && connectingFromId !== item.id) {
            setHoveredTargetId(item.id);
          }
        }}
        onMouseLeave={() => {
          if (hoveredTargetId === item.id) {
            setHoveredTargetId(null);
          }
        }}
        onClick={(e) => {
          if (connectingFromId) {
            e.stopPropagation();
            handleCardClickInConnectingMode(item.id);
          }
        }}
        onMouseDown={(e) => {
          if (isDrawMode || connectingFromId) return;

          // Don't drag if user is interacting with buttons, links, inputs, selects, or no-drag controls
          const target = e.target as HTMLElement;
          const isInteractive = Boolean(
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'BUTTON' ||
            target.tagName === 'A' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable ||
            target.getAttribute('role') === 'button' ||
            target.classList.contains('no-drag') ||
            target.closest('button') ||
            target.closest('a') ||
            target.closest('input') ||
            target.closest('textarea') ||
            target.closest('select') ||
            target.closest('[role="button"]') ||
            target.closest('.no-drag') ||
            target.closest('[data-no-drag]')
          );

          if (isInteractive) {
            onSelectItem(item.id);
            return;
          }

          startDraggingItem(item.id, e);
        }}
      >
        {/* Visual Target Highlight when Connecting - soft glow without harsh borders */}
        {isConnectingHover && (
          <div className="absolute -inset-1 rounded-xl bg-indigo-500/10 pointer-events-none z-30" />
        )}

        {/* 4 Interactive Connection Edge Zones - mouse cursor indicates outward arrow direction */}
        {!isDrawMode && (
          <>
            {/* Top Edge Handle (Points UP / Outward) */}
            <div
              className="absolute -top-2 left-3 right-3 h-4 z-40"
              style={{ cursor: CONNECT_ARROW_CURSOR_TOP }}
              onMouseDown={(e) => handleStartConnecting(item.id, e)}
              title="Click or drag up to connect arrow"
            />

            {/* Right Edge Handle (Points RIGHT / Outward) */}
            <div
              className="absolute -right-2 top-3 bottom-3 w-4 z-40"
              style={{ cursor: CONNECT_ARROW_CURSOR_RIGHT }}
              onMouseDown={(e) => handleStartConnecting(item.id, e)}
              title="Click or drag right to connect arrow"
            />

            {/* Bottom Edge Handle (Points DOWN / Outward) */}
            <div
              className="absolute -bottom-2 left-3 right-3 h-4 z-40"
              style={{ cursor: CONNECT_ARROW_CURSOR_BOTTOM }}
              onMouseDown={(e) => handleStartConnecting(item.id, e)}
              title="Click or drag down to connect arrow"
            />

            {/* Left Edge Handle (Points LEFT / Outward) */}
            <div
              className="absolute -left-2 top-3 bottom-3 w-4 z-40"
              style={{ cursor: CONNECT_ARROW_CURSOR_LEFT }}
              onMouseDown={(e) => handleStartConnecting(item.id, e)}
              title="Click or drag left to connect arrow"
            />
          </>
        )}

        {content}

        {/* Outgoing Branch Collapse/Expand Hub Badge */}
        {(() => {
          const outgoing = lineConnectors.filter((l) => isLineOutgoingFrom(l, item.id));
          if (outgoing.length === 0) return null;
          const allCollapsed = outgoing.every((l) => Boolean(l.isCollapsed));
          const count = outgoing.length;

          return (
            <div
              className="absolute -top-2.5 -right-2.5 z-40 no-drag pointer-events-auto select-none"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleOutgoingBranches(item.id);
              }}
            >
              <button
                type="button"
                className={`group/branch flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-md border transition-all transform hover:scale-110 active:scale-95 cursor-pointer no-drag ${
                  allCollapsed
                    ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/30'
                    : 'bg-white/95 dark:bg-neutral-900/95 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-neutral-800'
                }`}
                title={
                  allCollapsed
                    ? `Expand all ${count} outgoing branch${count > 1 ? 'es' : ''}`
                    : `Collapse all ${count} outgoing branch${count > 1 ? 'es' : ''} (hide from canvas)`
                }
              >
                {allCollapsed ? (
                  <>
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>{count}</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3 stroke-[2.5]" />
                    <span>{count}</span>
                  </>
                )}
              </button>
            </div>
          );
        })()}
      </div>
    );
  };

  // Selected stroke reference and its canvas bounding box
  const selectedStroke = currentBoard.strokes?.find((s) => s.id === selectedStrokeId);
  const selectedStrokeBBox = React.useMemo(() => {
    if (!selectedStroke || selectedStroke.points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    selectedStroke.points.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    return { minX, minY, maxX, maxY, centerX: (minX + maxX) / 2 };
  }, [selectedStroke]);

  // Calculate content bounding box across items and strokes for wayfinder & fit-to-view
  const containerRect = containerRef.current?.getBoundingClientRect();
  const viewportW = containerRect?.width || (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const viewportH = containerRect?.height || (typeof window !== 'undefined' ? window.innerHeight : 800);

  let minContentX = Infinity;
  let minContentY = Infinity;
  let maxContentX = -Infinity;
  let maxContentY = -Infinity;
  let hasContent = false;

  boardItems.forEach((item) => {
    if (item.type === 'line' || isItemHidden(item.id)) return;
    hasContent = true;
    const w = item.width || (item.type === 'column' ? 260 : item.type === 'board' ? 120 : item.type === 'calendar' ? 440 : 280);
    const h = item.height || (item.type === 'column' ? 300 : item.type === 'board' ? 125 : item.type === 'calendar' ? 360 : 160);
    minContentX = Math.min(minContentX, item.x);
    minContentY = Math.min(minContentY, item.y);
    maxContentX = Math.max(maxContentX, item.x + w);
    maxContentY = Math.max(maxContentY, item.y + h);
  });

  currentBoard.strokes?.forEach((stroke) => {
    stroke.points.forEach((p) => {
      hasContent = true;
      minContentX = Math.min(minContentX, p.x);
      minContentY = Math.min(minContentY, p.y);
      maxContentX = Math.max(maxContentX, p.x);
      maxContentY = Math.max(maxContentY, p.y);
    });
  });

  const viewMinX = -pan.x / zoom;
  const viewMinY = -pan.y / zoom;
  const viewMaxX = (viewportW - pan.x) / zoom;
  const viewMaxY = (viewportH - pan.y) / zoom;

  const viewCenterX = (viewMinX + viewMaxX) / 2;
  const viewCenterY = (viewMinY + viewMaxY) / 2;
  const contentCenterX = hasContent ? (minContentX + maxContentX) / 2 : 0;
  const contentCenterY = hasContent ? (minContentY + maxContentY) / 2 : 0;

  const isContentOverlappingView =
    hasContent &&
    !(
      viewMaxX < minContentX ||
      viewMinX > maxContentX ||
      viewMaxY < minContentY ||
      viewMinY > maxContentY
    );

  const distCanvasX = contentCenterX - viewCenterX;
  const distCanvasY = contentCenterY - viewCenterY;
  const contentDistance = Math.hypot(distCanvasX, distCanvasY);
  // Direction arrow angle in degrees
  const contentAngle = (Math.atan2(distCanvasY, distCanvasX) * 180) / Math.PI;

  const isContentFarAway = hasContent && !isContentOverlappingView && contentDistance > 320;

  const handleFitView = () => {
    if (onFitToContent) {
      onFitToContent();
      return;
    }
    if (!hasContent) {
      onUpdateViewport({ x: 80, y: 80 }, 1);
      return;
    }
    const contentW = Math.max(maxContentX - minContentX, 100);
    const contentH = Math.max(maxContentY - minContentY, 100);
    const availW = Math.max(viewportW - 200, 200);
    const availH = Math.max(viewportH - 180, 200);
    const targetZoom = Math.min(Math.max(0.35, Math.min(availW / contentW, availH / contentH)), 1.15);
    const targetPanX = Math.round(viewportW / 2 - contentCenterX * targetZoom + 30);
    const targetPanY = Math.round(viewportH / 2 - contentCenterY * targetZoom);

    const startPan = { ...pan };
    const startZoom = zoom;
    const duration = 280;
    const startTime = performance.now();
    const animationStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const curX = startPan.x + (targetPanX - startPan.x) * ease;
      const curY = startPan.y + (targetPanY - startPan.y) * ease;
      const curZ = startZoom + (targetZoom - startZoom) * ease;
      onUpdateViewport({ x: Math.round(curX), y: Math.round(curY) }, parseFloat(curZ.toFixed(2)));
      if (progress < 1) requestAnimationFrame(animationStep);
    };
    requestAnimationFrame(animationStep);
  };

  const isDark = settings?.theme === 'dark';
  const bgStyle = settings?.backgroundStyle || 'dots';
  const gridSize = settings?.gridSize || 24;
  const canvasBgColor =
    settings?.canvasColor || (isDark ? '#121316' : '#f6f7f9');
  const isCanvasDark = isColorDark(canvasBgColor) || isDark;

  // Dot size radius in px (default 0.9px gives crisp, elegant dots on standard & retina displays)
  const rawDotSize = settings?.dotSize;
  const dotRadius = typeof rawDotSize === 'number' && rawDotSize > 0 ? rawDotSize : 0.9;

  // Calculate adaptive grid step so dots never clump into a dense noisy mesh when zooming out
  // The dots stay the exact same size on screen and maintain comfortable spacing (at least 16px)
  const baseStep = gridSize * zoom;
  let effectiveStep = baseStep;
  while (effectiveStep < 16) {
    effectiveStep *= 2;
  }

  const canvasBackgroundStyle = (() => {
    if (bgStyle === 'blank') {
      return {
        backgroundColor: canvasBgColor,
        backgroundImage: 'none',
      };
    }

    if (bgStyle === 'grid') {
      const lineColor = isCanvasDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.08)';
      return {
        backgroundColor: canvasBgColor,
        backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${effectiveStep}px ${effectiveStep}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        backgroundRepeat: 'repeat',
      };
    }

    if (bgStyle === 'cross') {
      const crossColor = isCanvasDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.22)';
      return {
        backgroundColor: canvasBgColor,
        backgroundImage: `radial-gradient(circle, ${crossColor} ${dotRadius}px, transparent ${dotRadius + 0.45}px)`,
        backgroundSize: `${effectiveStep}px ${effectiveStep}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        backgroundRepeat: 'repeat',
      };
    }

    // Default 'dots' - clean, subtle, consistent dot size at any zoom level
    const dotColor = isCanvasDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.20)';
    return {
      backgroundColor: canvasBgColor,
      backgroundImage: `radial-gradient(circle, ${dotColor} ${dotRadius}px, transparent ${dotRadius + 0.45}px)`,
      backgroundSize: `${effectiveStep}px ${effectiveStep}px`,
      backgroundPosition: `${pan.x}px ${pan.y}px`,
      backgroundRepeat: 'repeat',
    };
  })();

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      if (!isDraggingFilesOver) setIsDraggingFilesOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFilesOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFilesOver(false);

      if (onUploadFiles) {
        const rect = containerRef.current?.getBoundingClientRect();
        const clientX = e.clientX - (rect?.left || 0);
        const clientY = e.clientY - (rect?.top || 0);
        const dropCanvasX = Math.round((clientX - pan.x) / zoom);
        const dropCanvasY = Math.round((clientY - pan.y) / zoom);

        onUploadFiles(Array.from(e.dataTransfer.files), { x: dropCanvasX, y: dropCanvasY });
      }
    }
  };

  return (
    <main
      ref={containerRef}
      id="milanote-canvas-viewport"
      className={`relative w-full h-full overflow-hidden select-none outline-none ${
        isDrawMode
          ? 'cursor-crosshair'
          : isPanning
          ? 'cursor-grabbing'
          : 'cursor-default'
      }`}
      style={{
        cursor: activeConnectingCursor || (connectingFromId ? CONNECT_ARROW_CURSOR_RIGHT : undefined),
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Background Grid Pattern (Dots / Grid / Crosshairs / Blank) */}
      <div
        id="canvas-grid"
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={canvasBackgroundStyle}
      />

      {/* OS File Drag-and-Drop Active Overlay */}
      {isDraggingFilesOver && (
        <div
          onClick={() => setIsDraggingFilesOver(false)}
          className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-start pt-14 bg-indigo-950/20 border-4 border-dashed border-indigo-400/80 animate-in fade-in transition-all"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-neutral-900/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md text-white pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md border border-indigo-400">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left pr-2">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                Drop files on Canvas or directly onto a Folder
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Release anywhere to add cards, or hover over a folder to pack files
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDraggingFilesOver(false);
              }}
              className="ml-2 px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Interaction Shield while actively dragging or panning */}
      {(isPanning || (draggingItemId && isDraggingMoved)) && (
        <div
          className="fixed inset-0 z-50 cursor-grabbing select-none pointer-events-auto"
          style={{ background: 'transparent' }}
        />
      )}

      {/* Floating Arrow Connection Mode Indicator Banner */}
      {connectingFromId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2 bg-neutral-900/95 text-white rounded-full shadow-2xl backdrop-blur-md text-xs border border-indigo-500/40 animate-in fade-in slide-in-from-top-2">
          <ArrowUpRight className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="font-medium text-neutral-200">
            {hoveredTargetId && hoveredTargetId !== connectingFromId
              ? `Release to connect to ${(items[hoveredTargetId] as any)?.title || 'card'}`
              : 'Click or drop on any card to create an arrow'}
          </span>
          <button
            type="button"
            onClick={() => {
              setConnectingFromId(null);
              setCursorCanvasPos(null);
              setHoveredTargetId(null);
            }}
            className="ml-1 p-1 hover:bg-white/20 rounded-full cursor-pointer transition-colors text-neutral-400 hover:text-white"
            title="Cancel connection (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drawing Interaction Overlay: active during Draw Mode to capture strokes across whole canvas */}
      {isDrawMode && (
        <div
          id="canvas-drawing-overlay"
          className="absolute inset-0 z-40 cursor-crosshair select-none touch-none pointer-events-auto"
          onPointerDown={handleDrawPointerDown}
        />
      )}

      {/* Floating Drawing Mode Toolbar */}
      {isDrawMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2 bg-neutral-900/95 text-white rounded-full shadow-2xl backdrop-blur-md text-xs border border-white/10 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 pr-2 border-r border-white/20 font-medium text-neutral-300">
            <PenTool className="w-4 h-4 text-indigo-400" />
            <span>Drawing Pen</span>
          </div>

          {/* Color swatches */}
          <div className="flex items-center gap-1.5">
            {[
              { color: '#1e293b', label: 'Charcoal' },
              { color: '#6366f1', label: 'Indigo' },
              { color: '#ef4444', label: 'Coral' },
              { color: '#10b981', label: 'Emerald' },
              { color: '#f59e0b', label: 'Amber' },
            ].map((swatch) => (
              <button
                key={swatch.color}
                type="button"
                onClick={() => setPenColor(swatch.color)}
                className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                  penColor === swatch.color
                    ? 'scale-125 border-white shadow-xs'
                    : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: swatch.color }}
                title={swatch.label}
              />
            ))}
          </div>

          {/* Stroke width selector */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/20">
            {[
              { size: 2, label: 'Fine' },
              { size: 4, label: 'Medium' },
              { size: 8, label: 'Thick' },
            ].map((opt) => (
              <button
                key={opt.size}
                type="button"
                onClick={() => setPenSize(opt.size)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  penSize === opt.size
                    ? 'bg-white/25 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title={`${opt.label} stroke width`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Undo last stroke */}
          {onUndoStroke && (currentBoard.strokes?.length || 0) > 0 && (
            <button
              type="button"
              onClick={onUndoStroke}
              className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-neutral-200 rounded-md transition-colors cursor-pointer ml-1"
              title="Undo last stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px]">Undo</span>
            </button>
          )}

          {/* Clear strokes */}
          {onClearStrokes && (currentBoard.strokes?.length || 0) > 0 && (
            <button
              type="button"
              onClick={onClearStrokes}
              className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-red-500/30 text-neutral-300 hover:text-red-200 rounded-md transition-colors cursor-pointer"
              title="Clear all drawings on this board"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[10px]">Clear</span>
            </button>
          )}

          {/* Done / Exit draw mode */}
          <button
            type="button"
            onClick={() => onToggleDrawMode?.()}
            className="flex items-center gap-1 ml-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full text-xs shadow-xs cursor-pointer transition-colors"
            title="Exit drawing mode"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      )}

      {/* Canvas Scene with Zoom and Pan */}
      <div
        id="canvas-content-layer"
        className="absolute origin-top-left pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '5000px',
          height: '5000px',
        }}
      >
        {/* SVG Layer for Connector Lines and Freehand Strokes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20">
          <defs>
            {/* Live connecting arrow preview marker - bold barbed arrowhead matching sketch */}
            <marker
              id="arrow-preview-marker"
              viewBox="0 0 14 14"
              refX="11.5"
              refY="7"
              markerWidth="13"
              markerHeight="13"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M 1 1.5 L 13 7 L 1 12.5 L 4.5 7 Z"
                fill="#6366f1"
                stroke="#6366f1"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </marker>

            {/* Live connecting arrow start dot marker - solid circular dot at the beginning */}
            <marker
              id="dot-preview-marker"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <circle cx="5" cy="5" r="4" fill="#6366f1" />
            </marker>
          </defs>

          {/* Connector Lines */}
          {lineConnectors
            .filter((line) => !hiddenLineIds.has(line.id))
            .map((line) => (
              <ConnectorLine
                key={line.id}
                line={line}
                fromItem={items[line.fromId]}
                toItem={items[line.toId]}
                allItems={items}
                onUpdateLine={(updates) => onUpdateItem(line.id, updates as Partial<CanvasItem>)}
                onDelete={() => onDeleteItem(line.id)}
                onSelect={() => onSelectItem(line.id)}
                isSelected={selectedItemId === line.id}
                downstreamCount={downstreamCountByLineId[line.id] || 1}
              />
            ))}

          {/* Live Connecting Arrow in Progress (One-sided arrow with beginning dot) */}
          {connectingFromId && cursorCanvasPos && (
            <path
              d={getConnectingArrowPath() || ''}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeDasharray="6,6"
              markerStart="url(#dot-preview-marker)"
              markerEnd="url(#arrow-preview-marker)"
              className="pointer-events-none opacity-90"
            />
          )}

          {/* Saved Drawing Strokes with Interactive Selection & Dragging */}
          {currentBoard.strokes?.map((stroke) => {
            if (!stroke.points || stroke.points.length === 0) return null;
            const pathData =
              stroke.points.length === 1
                ? `M ${stroke.points[0].x} ${stroke.points[0].y} L ${stroke.points[0].x + 0.1} ${stroke.points[0].y + 0.1}`
                : `M ${stroke.points[0].x} ${stroke.points[0].y} ` +
                  stroke.points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');

            const isStrokeSelected = selectedStrokeId === stroke.id;

            // Bounding box for selection highlight outline
            let strokeMinX = Infinity;
            let strokeMinY = Infinity;
            let strokeMaxX = -Infinity;
            let strokeMaxY = -Infinity;
            stroke.points.forEach((p) => {
              strokeMinX = Math.min(strokeMinX, p.x);
              strokeMinY = Math.min(strokeMinY, p.y);
              strokeMaxX = Math.max(strokeMaxX, p.x);
              strokeMaxY = Math.max(strokeMaxY, p.y);
            });
            const strokeW = Math.max(strokeMaxX - strokeMinX, 16);
            const strokeH = Math.max(strokeMaxY - strokeMinY, 16);

            return (
              <g key={stroke.id} id={`canvas-stroke-${stroke.id}`} className="group/stroke">
                {/* Selection dashed highlight outline */}
                {isStrokeSelected && (
                  <rect
                    x={strokeMinX - 8}
                    y={strokeMinY - 8}
                    width={strokeW + 16}
                    height={strokeH + 16}
                    rx="6"
                    fill="rgba(99, 102, 241, 0.05)"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    className="pointer-events-none"
                  />
                )}

                {/* Invisible wide hit path for effortless grabbing and dragging */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(stroke.size + 16, 24)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`${
                    isDrawMode
                      ? 'pointer-events-none'
                      : 'pointer-events-auto cursor-grab active:cursor-grabbing'
                  }`}
                  onMouseDown={(e) => {
                    if (isDrawMode) return;
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedStrokeId(stroke.id);
                    onSelectItem(null);

                    // Initiate drag
                    setDraggingStrokeId(stroke.id);
                    strokeDragRef.current = {
                      strokeId: stroke.id,
                      startScreen: { x: e.clientX, y: e.clientY },
                      startPoints: stroke.points.map((pt) => ({ ...pt })),
                      hasMoved: false,
                    };
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStrokeId(stroke.id);
                    onSelectItem(null);
                  }}
                />

                {/* Visible drawing stroke path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isStrokeSelected ? '#4f46e5' : stroke.color}
                  strokeWidth={stroke.size}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`pointer-events-none transition-opacity ${
                    isStrokeSelected
                      ? 'opacity-100 filter drop-shadow-md'
                      : 'opacity-80 group-hover/stroke:opacity-100'
                  }`}
                />
              </g>
            );
          })}

          {/* Current Drawing Stroke in progress */}
          {currentStroke && currentStroke.length > 0 && (
            <path
              d={
                currentStroke.length === 1
                  ? `M ${currentStroke[0].x} ${currentStroke[0].y} L ${currentStroke[0].x + 0.1} ${currentStroke[0].y + 0.1}`
                  : `M ${currentStroke[0].x} ${currentStroke[0].y} ` +
                    currentStroke.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
              }
              fill="none"
              stroke={penColor}
              strokeWidth={penSize}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-95 pointer-events-none"
            />
          )}
        </svg>

        {/* HTML Cards Layer */}
        <div id="canvas-cards-layer" className="absolute inset-0 pointer-events-none">
          {/* Floating Toolbar for Selected Stroke */}
          {selectedStroke && (
            <div
              id="selected-stroke-toolbar"
              className="absolute pointer-events-auto z-40 flex items-center gap-1.5 bg-neutral-900/95 text-white rounded-xl px-2.5 py-1.5 shadow-2xl backdrop-blur-md border border-white/10 text-xs no-drag select-none"
              style={{
                left: `${selectedStrokeBBox.centerX}px`,
                top: `${selectedStrokeBBox.minY - 14}px`,
                transform: 'translate(-50%, -100%)',
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 text-neutral-300 pr-1.5 border-r border-white/20">
                <Move className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-medium hidden sm:inline">Drag stroke to move</span>
              </div>

              {/* Stroke quick color swatches */}
              <div className="flex items-center gap-1 px-1">
                {[
                  { hex: '#1e293b', label: 'Charcoal' },
                  { hex: '#6366f1', label: 'Indigo' },
                  { hex: '#ef4444', label: 'Crimson' },
                  { hex: '#10b981', label: 'Emerald' },
                  { hex: '#f59e0b', label: 'Amber' },
                  { hex: '#3b82f6', label: 'Blue' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onUpdateStroke?.(selectedStroke.id, { color: c.hex })}
                    className={`w-4 h-4 rounded-full border border-white/30 transition-transform cursor-pointer ${
                      selectedStroke.color === c.hex
                        ? 'scale-125 ring-2 ring-indigo-400 ring-offset-1 ring-offset-neutral-900'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>

              <div className="w-px h-3 bg-white/20 mx-0.5" />

              {/* Stroke size selector */}
              <div className="flex items-center gap-0.5">
                {[
                  { size: 2, label: 'Thin' },
                  { size: 4, label: 'Med' },
                  { size: 7, label: 'Thick' },
                ].map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => onUpdateStroke?.(selectedStroke.id, { size: s.size })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      selectedStroke.size === s.size
                        ? 'bg-white/25 text-white'
                        : 'text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={`${s.label} (${s.size}px)`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-3 bg-white/20 mx-0.5" />

              {/* Duplicate stroke */}
              {onDuplicateStroke && (
                <button
                  type="button"
                  onClick={() => onDuplicateStroke(selectedStroke.id)}
                  className="p-1 hover:bg-white/20 rounded text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Duplicate stroke"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Delete stroke */}
              {onDeleteStroke && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteStroke(selectedStroke.id);
                    setSelectedStrokeId(null);
                  }}
                  className="p-1 hover:bg-red-500/30 rounded text-neutral-300 hover:text-red-300 transition-colors cursor-pointer"
                  title="Delete stroke (Del / Backspace)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Close */}
              <button
                type="button"
                onClick={() => setSelectedStrokeId(null)}
                className="p-1 hover:bg-white/20 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Deselect"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Columns */}
          {columns.map((col) => {
            const colItem = col as any;
            const children = boardItems.filter((item) => item.columnId === col.id && !isItemHidden(item.id));
            const isSelected = selectedItemId === col.id;
            const isConnectingSource = connectingFromId === col.id;
            const isConnectingHover = hoveredTargetId === col.id && connectingFromId !== col.id;

            return (
              <div
                key={col.id}
                id={`column-${col.id}`}
                className="absolute cursor-grab active:cursor-grabbing pointer-events-auto group/item"
                style={{
                  transform: `translate(${col.x}px, ${col.y}px)`,
                  transition: 'none',
                  width: col.width ? `${col.width}px` : '280px',
                  zIndex: isSelected || isConnectingSource ? 30 : 12,
                }}
                onMouseEnter={() => {
                  if (connectingFromId && connectingFromId !== col.id) {
                    setHoveredTargetId(col.id);
                  }
                }}
                onMouseLeave={() => {
                  if (hoveredTargetId === col.id) {
                    setHoveredTargetId(null);
                  }
                }}
                onClick={(e) => {
                  if (connectingFromId) {
                    e.stopPropagation();
                    handleCardClickInConnectingMode(col.id);
                  }
                }}
                onMouseDown={(e) => {
                  if (isDrawMode || connectingFromId) return;
                  const target = e.target as HTMLElement;
                  if (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable ||
                    target.closest('input') ||
                    target.closest('textarea')
                  ) {
                    onSelectItem(col.id);
                    return;
                  }
                  startDraggingItem(col.id, e);
                }}
              >
                {/* Visual Target Highlight when Connecting - soft glow without harsh borders */}
                {isConnectingHover && (
                  <div className="absolute -inset-1 rounded-xl bg-indigo-500/10 pointer-events-none z-30" />
                )}

                {/* 4 Interactive Connection Edge Zones - mouse cursor indicates outward arrow direction */}
                {!isDrawMode && (
                  <>
                    <div
                      className="absolute -top-2 left-4 right-4 h-4 z-40"
                      style={{ cursor: CONNECT_ARROW_CURSOR_TOP }}
                      onMouseDown={(e) => handleStartConnecting(col.id, e)}
                      title="Click or drag up to connect arrow"
                    />
                    <div
                      className="absolute -right-2 top-4 bottom-4 w-4 z-40"
                      style={{ cursor: CONNECT_ARROW_CURSOR_RIGHT }}
                      onMouseDown={(e) => handleStartConnecting(col.id, e)}
                      title="Click or drag right to connect arrow"
                    />
                    <div
                      className="absolute -bottom-2 left-4 right-4 h-4 z-40"
                      style={{ cursor: CONNECT_ARROW_CURSOR_BOTTOM }}
                      onMouseDown={(e) => handleStartConnecting(col.id, e)}
                      title="Click or drag down to connect arrow"
                    />
                    <div
                      className="absolute -left-2 top-4 bottom-4 w-4 z-40"
                      style={{ cursor: CONNECT_ARROW_CURSOR_LEFT }}
                      onMouseDown={(e) => handleStartConnecting(col.id, e)}
                      title="Click or drag left to connect arrow"
                    />
                  </>
                )}

                <ColumnCard
                  item={colItem}
                  childrenItems={children}
                  renderChildItem={(child) => renderSingleItem(child, true)}
                  onUpdate={(u) => onUpdateItem(col.id, u)}
                  onDelete={() => onDeleteItem(col.id)}
                  onAddItem={(colId, type) => onAddItem(type, undefined, colId)}
                  isSelected={isSelected}
                />

                {/* Outgoing Branch Collapse/Expand Hub Badge on Column */}
                {(() => {
                  const outgoing = lineConnectors.filter((l) => isLineOutgoingFrom(l, col.id));
                  if (outgoing.length === 0) return null;
                  const allCollapsed = outgoing.every((l) => Boolean(l.isCollapsed));
                  const count = outgoing.length;

                  return (
                    <div
                      className="absolute -top-2.5 -right-2.5 z-40 no-drag pointer-events-auto select-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleOutgoingBranches(col.id);
                      }}
                    >
                      <button
                        type="button"
                        className={`group/branch flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-md border transition-all transform hover:scale-110 active:scale-95 cursor-pointer no-drag ${
                          allCollapsed
                            ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/30'
                            : 'bg-white/95 dark:bg-neutral-900/95 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-neutral-800'
                        }`}
                        title={
                          allCollapsed
                            ? `Expand all ${count} outgoing branch${count > 1 ? 'es' : ''}`
                            : `Collapse all ${count} outgoing branch${count > 1 ? 'es' : ''} (hide from canvas)`
                        }
                      >
                        {allCollapsed ? (
                          <>
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>{count}</span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                            <span>{count}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* Standalone Items on Canvas */}
          {standaloneItems.map((item) => renderSingleItem(item, false))}

          {/* Clean Empty Canvas State */}
          {boardItems.length === 0 && (!currentBoard.strokes || currentBoard.strokes.length === 0) && (
            <div
              className="absolute pointer-events-auto flex flex-col items-center justify-center p-8 text-center select-none"
              style={{
                left: '120px',
                top: '100px',
                maxWidth: '440px',
              }}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-sm border ${
                  isCanvasDark
                    ? 'bg-neutral-800/90 border-neutral-700/80 text-neutral-300'
                    : 'bg-white/90 border-neutral-200/90 text-neutral-600'
                }`}
              >
                <Plus className="w-7 h-7 text-indigo-500 stroke-[2]" />
              </div>
              <h3 className={`text-base font-semibold ${isCanvasDark ? 'text-neutral-100' : 'text-neutral-800'}`}>
                {currentBoard.title}
              </h3>
              <p className={`text-xs mt-1.5 leading-relaxed ${isCanvasDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Your canvas is empty and ready. Use the left toolbar to add notes, task lists, columns, sub-boards, tables, or draw freehand.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => onAddItem('note', { x: 120, y: 100 })}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer transition-colors"
                >
                  + Add Note
                </button>
                <button
                  type="button"
                  onClick={() => onAddItem('column', { x: 120, y: 100 })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border shadow-xs cursor-pointer transition-colors ${
                    isCanvasDark
                      ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  + Column
                </button>
                <button
                  type="button"
                  onClick={() => onAddItem('todo', { x: 120, y: 100 })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border shadow-xs cursor-pointer transition-colors ${
                    isCanvasDark
                      ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  + To-Do
                </button>
                <button
                  type="button"
                  onClick={() => onAddItem('board', { x: 120, y: 100 })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border shadow-xs cursor-pointer transition-colors ${
                    isCanvasDark
                      ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  + Sub-board
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const inp = document.createElement('input');
                    inp.type = 'file';
                    inp.multiple = true;
                    inp.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0 && onUploadFiles) {
                        onUploadFiles(Array.from(files), { x: 120, y: 100 });
                      }
                    };
                    inp.click();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border shadow-xs cursor-pointer transition-colors ${
                    isCanvasDark
                      ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  + Import File
                </button>
              </div>
            </div>
          )}

          {/* Floating Arrow Toolbar for Selected Connector Line */}
          {selectedItemId && items[selectedItemId]?.type === 'line' && !hiddenLineIds.has(selectedItemId) && (
            <ArrowToolbar
              line={items[selectedItemId] as LineConnectorItem}
              fromItem={items[(items[selectedItemId] as LineConnectorItem).fromId]}
              toItem={items[(items[selectedItemId] as LineConnectorItem).toId]}
              allItems={items}
              onUpdateLine={(updates) => onUpdateItem(selectedItemId, updates as Partial<CanvasItem>)}
              onDelete={() => onDeleteItem(selectedItemId)}
            />
          )}
        </div>
      </div>

      {/* Floating Canvas Navigation & Zoom Controls (Bottom Right) */}
      <div
        id="canvas-viewport-controls"
        className={`absolute bottom-5 right-5 z-30 flex items-center gap-1 backdrop-blur-md border rounded-xl px-1.5 py-1 shadow-lg text-xs no-drag select-none transition-all duration-200 ${
          isDark
            ? 'bg-neutral-900/95 border-neutral-800 text-neutral-200'
            : 'bg-white/95 border-neutral-200/90 text-neutral-700'
        }`}
      >
        <button
          type="button"
          onClick={() => onUpdateViewport(pan, Math.max(zoom * 0.85, 0.25))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onUpdateViewport(pan, 1)}
          className={`px-2 py-0.5 font-mono text-[11px] font-medium rounded cursor-pointer ${
            isDark
              ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
          }`}
          title="Reset Zoom (100%)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => onUpdateViewport(pan, Math.min(zoom * 1.15, 3.0))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />

        {/* Fit View / Back to Elements button */}
        <button
          type="button"
          onClick={handleFitView}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            isContentFarAway
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs animate-pulse ring-2 ring-indigo-400/40'
              : isDark
              ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              : 'text-neutral-700 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
          title={
            isContentFarAway
              ? `Elements are ${Math.round(contentDistance)}px away. Click to return (Home)`
              : 'Center and fit all elements (Home)'
          }
        >
          {isContentFarAway ? (
            <>
              <div
                className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-200"
                style={{ transform: `rotate(${contentAngle}deg)` }}
              >
                <ArrowUp className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-semibold whitespace-nowrap">
                Back to Elements ({Math.round(contentDistance)}px)
              </span>
            </>
          ) : (
            <>
              <Focus className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="hidden sm:inline text-[11px]">Fit View</span>
            </>
          )}
        </button>

        {/* Expand All Collapsed Arrow Branches Button */}
        {collapsedLineIds.size > 0 && (
          <>
            <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
            <button
              type="button"
              onClick={() => {
                if (onUpdateItems) {
                  const updates: Record<string, Partial<CanvasItem>> = {};
                  lineConnectors.forEach((l) => {
                    if (l.isCollapsed) {
                      updates[l.id] = { isCollapsed: false };
                    }
                  });
                  onUpdateItems(updates);
                } else {
                  lineConnectors.forEach((l) => {
                    if (l.isCollapsed) {
                      onUpdateItem(l.id, { isCollapsed: false } as Partial<CanvasItem>);
                    }
                  });
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
              title="Expand all collapsed arrow branches on canvas"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold whitespace-nowrap">
                Expand All ({collapsedLineIds.size})
              </span>
            </button>
          </>
        )}
      </div>
    </main>
  );
};
