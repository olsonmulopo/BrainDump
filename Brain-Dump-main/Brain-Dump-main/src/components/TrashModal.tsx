import React, { useState } from 'react';
import { WorkspaceTrash, CanvasItem, BoardData, TrashedBoardEntry, TrashedItemEntry } from '../types';
import {
  X,
  Trash2,
  RotateCcw,
  Folder,
  FileText,
  CheckSquare,
  Clock,
  Link2,
  Table as TableIcon,
  Image as ImageIcon,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trash?: WorkspaceTrash;
  onRestoreItem: (itemId: string) => void;
  onRestoreBoard: (boardId: string) => void;
  onPermanentDeleteItem: (itemId: string) => void;
  onPermanentDeleteBoard: (boardId: string) => void;
  onEmptyTrash: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  trash,
  onRestoreItem,
  onRestoreBoard,
  onPermanentDeleteItem,
  onPermanentDeleteBoard,
  onEmptyTrash,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'boards' | 'items'>('all');
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  const trashedBoards = Object.values(trash?.boards || {});
  const trashedItems = Object.values(trash?.items || {});

  const totalCount = trashedBoards.length + trashedItems.length;

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'board':
        return <Folder className="w-4 h-4 text-amber-600" />;
      case 'note':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'todo':
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case 'timer':
        return <Clock className="w-4 h-4 text-indigo-600" />;
      case 'link':
        return <Link2 className="w-4 h-4 text-violet-600" />;
      case 'table':
        return <TableIcon className="w-4 h-4 text-cyan-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-teal-600" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-neutral-500" />;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getItemTitle = (item: CanvasItem) => {
    if ('title' in item && item.title) return item.title;
    if ('url' in item && item.url) return item.url;
    if ('author' in item && item.text) return `Comment: ${item.text.slice(0, 30)}`;
    return `Untitled ${item.type}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div
        id="trash-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-neutral-200/90 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                Trash
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Deleted boards and cards stay here until permanently deleted
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <>
                {confirmEmpty ? (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                    <span className="text-[11px] font-medium text-red-700">Delete all forever?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onEmptyTrash();
                        setConfirmEmpty(false);
                      }}
                      className="text-[11px] font-bold text-red-600 hover:text-red-800 px-1.5 py-0.5 hover:bg-red-100 rounded"
                    >
                      Yes, empty
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmEmpty(false)}
                      className="text-[11px] text-neutral-500 hover:text-neutral-800 px-1.5 py-0.5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmEmpty(true)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-2.5 py-1.5 rounded-lg border border-red-200/80 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Empty Trash
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-6 py-2 border-b border-neutral-100 flex items-center gap-2 bg-[#fafbfc]">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-neutral-900 shadow-2xs border border-neutral-200/80'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            All Items ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('boards')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'boards'
                ? 'bg-white text-neutral-900 shadow-2xs border border-neutral-200/80'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            Boards ({trashedBoards.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'items'
                ? 'bg-white text-neutral-900 shadow-2xs border border-neutral-200/80'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            Cards & Notes ({trashedItems.length})
          </button>
        </div>

        {/* Trash Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 min-h-[260px]">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                <Trash2 className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-800">Trash is empty</h3>
              <p className="text-xs text-neutral-400 max-w-xs mt-1">
                Any boards or canvas cards you delete will show up here, where you can safely restore them.
              </p>
            </div>
          ) : (
            <>
              {/* Trashed Boards */}
              {(activeTab === 'all' || activeTab === 'boards') &&
                trashedBoards.map((tb: TrashedBoardEntry) => (
                  <div
                    key={tb.id}
                    className="flex items-center justify-between p-3.5 bg-white border border-neutral-200/90 rounded-xl shadow-2xs hover:border-neutral-300 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                        <Folder className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-neutral-900 truncate">
                            {tb.board.title || 'Untitled Board'}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                            Board ({tb.childItems.length} cards)
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                          <span>Deleted {formatTimeAgo(tb.deletedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() => onRestoreBoard(tb.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200/70 rounded-lg transition-colors cursor-pointer"
                        title="Restore board back to workspace"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => onPermanentDeleteBoard(tb.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* Trashed Cards / Items */}
              {(activeTab === 'all' || activeTab === 'items') &&
                trashedItems.map((ti: TrashedItemEntry) => (
                  <div
                    key={ti.id}
                    className="flex items-center justify-between p-3.5 bg-white border border-neutral-200/90 rounded-xl shadow-2xs hover:border-neutral-300 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0">
                        {getItemIcon(ti.item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-neutral-900 truncate">
                            {getItemTitle(ti.item)}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 capitalize shrink-0">
                            {ti.item.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                          <span>Deleted {formatTimeAgo(ti.deletedAt)}</span>
                          {ti.originalBoardTitle && (
                            <>
                              <span>•</span>
                              <span>From: {ti.originalBoardTitle}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() => onRestoreItem(ti.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200/70 rounded-lg transition-colors cursor-pointer"
                        title="Restore item back to board"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => onPermanentDeleteItem(ti.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
