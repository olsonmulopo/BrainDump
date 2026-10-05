import React, { useState, useRef, useMemo } from 'react';
import { TodoCardItem, TodoItem, ItemColor, WorkflowStatus } from '../../types';
import { getItemColorStyles } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { WorkflowStatusBadge } from '../WorkflowStatusBadge';
import { TodoModal } from '../todos/TodoModal';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  X,
  Palette,
  Maximize2,
  Flag,
  ChevronUp,
  ChevronDown,
  CheckCheck,
  RotateCcw,
  Sparkles,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface TodoCardProps {
  item: TodoCardItem;
  onUpdate: (updates: Partial<TodoCardItem>) => void;
  onDelete: () => void;
  isSelected?: boolean;
  onDuplicate?: (item: TodoCardItem) => void;
  isInsideColumn?: boolean;
}

export const TodoCard: React.FC<TodoCardProps> = ({
  item,
  onUpdate,
  onDelete,
  isSelected,
  onDuplicate,
  isInsideColumn,
}) => {
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showWidthMenu, setShowWidthMenu] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const colorStyles = getItemColorStyles(item.color || 'default', item.customColor);
  const isDark = colorStyles.isDark;

  const todos = item.todos || [];
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  // Filtered tasks
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    });
  }, [todos, filter]);

  // Actions
  const toggleTodo = (id: string) => {
    const updated = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    onUpdate({ todos: updated });
  };

  const updateTodoText = (id: string, text: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, text } : t));
    onUpdate({ todos: updated });
  };

  const cyclePriority = (id: string) => {
    const priorityOrder: Array<'low' | 'medium' | 'high' | undefined> = [undefined, 'low', 'medium', 'high'];
    const updated = todos.map((t) => {
      if (t.id !== id) return t;
      const currentIndex = priorityOrder.indexOf(t.priority);
      const nextIndex = (currentIndex + 1) % priorityOrder.length;
      return { ...t, priority: priorityOrder[nextIndex] };
    });
    onUpdate({ todos: updated });
  };

  const removeTodo = (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    onUpdate({ todos: updated });
  };

  const moveTodo = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= todos.length) return;
    const newTodos = [...todos];
    const temp = newTodos[index];
    newTodos[index] = newTodos[targetIndex];
    newTodos[targetIndex] = temp;
    onUpdate({ todos: newTodos });
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newTodo: TodoItem = {
      id: `td-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: newText.trim(),
      completed: false,
      priority: newPriority,
      createdAt: Date.now(),
    };
    onUpdate({ todos: [...todos, newTodo] });
    setNewText('');
    setNewPriority(undefined);
    inputRef.current?.focus();
  };

  const handleCheckAll = (checked: boolean) => {
    const updated = todos.map((t) => ({ ...t, completed: checked }));
    onUpdate({ todos: updated });
  };

  const handleClearCompleted = () => {
    const updated = todos.filter((t) => !t.completed);
    onUpdate({ todos: updated });
  };

  const setWidthPreset = (w: number) => {
    onUpdate({ width: w });
    setShowWidthMenu(false);
  };

  const currentWidth = item.width && item.width !== 380 ? item.width : 280;

  return (
    <>
      <div
        id={`item-${item.id}`}
        className={`group relative w-full max-w-full box-border rounded-xl border overflow-hidden transition-all ${
          !item.customColor ? colorStyles.className : ''
        } ${isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'shadow-2xs hover:shadow-xs'}`}
        style={item.customColor ? colorStyles.style : undefined}
      >
        {/* Progress Bar Header Stripe */}
        {totalCount > 0 && (
          <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-t-xl overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isAllDone
                  ? 'bg-emerald-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Card Header */}
        <div className="p-3 pb-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={`p-1 rounded-md shrink-0 ${
                  isDark ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={item.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="To-do List..."
                className={`font-bold text-sm tracking-tight bg-transparent outline-none w-full truncate no-drag transition-colors ${
                  isDark
                    ? 'text-white placeholder:text-white/60'
                    : 'text-neutral-900 placeholder:text-neutral-400'
                }`}
              />
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1 shrink-0 no-drag">
              {item.workflowStatus && item.workflowStatus !== 'none' && (
                <WorkflowStatusBadge
                  status={item.workflowStatus}
                  note={item.workflowNote}
                  onUpdateStatus={(status: WorkflowStatus, note?: string) =>
                    onUpdate({ workflowStatus: status, workflowNote: note })
                  }
                  compact
                />
              )}

              {/* Progress Count Badge */}
              {totalCount > 0 && (
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isAllDone
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : isDark
                      ? 'bg-white/15 text-white/90'
                      : 'bg-black/5 text-neutral-600'
                  }`}
                  title={`${completedCount} of ${totalCount} tasks completed (${progressPercent}%)`}
                >
                  {completedCount}/{totalCount}
                </span>
              )}

              {/* Expand to Full Desktop Modal */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                className={`p-1 rounded transition-opacity no-drag cursor-pointer ${
                  isDark
                    ? 'text-white/75 hover:text-white hover:bg-white/20'
                    : 'text-neutral-400 hover:text-neutral-700 hover:bg-black/5'
                }`}
                title="Expand to Full Desktop View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Color Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity no-drag cursor-pointer ${
                    isDark
                      ? 'text-white/75 hover:text-white hover:bg-white/20'
                      : 'text-neutral-400 hover:text-neutral-700 hover:bg-black/5'
                  }`}
                  title="Change card color"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>

                {showColorPicker && (
                  <ColorPickerPopover
                    currentColor={item.color}
                    customColor={item.customColor}
                    onChangeColor={(color: ItemColor, customHex?: string) => {
                      onUpdate({ color, customColor: customHex });
                      setShowColorPicker(false);
                    }}
                    onClose={() => setShowColorPicker(false)}
                  />
                )}
              </div>

              {/* Delete Card */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity no-drag cursor-pointer ${
                  isDark
                    ? 'text-white/75 hover:text-red-300 hover:bg-white/20'
                    : 'text-neutral-400 hover:text-red-500 hover:bg-black/5'
                }`}
                title="Delete list"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subtitle / Filter Bar */}
          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-black/5 dark:border-white/10 text-xs">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 no-drag">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter('all');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filter === 'all'
                    ? isDark
                      ? 'bg-white/25 text-white font-bold'
                      : 'bg-indigo-600 text-white font-bold'
                    : isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter('active');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filter === 'active'
                    ? isDark
                      ? 'bg-white/25 text-white font-bold'
                      : 'bg-indigo-600 text-white font-bold'
                    : isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Active {activeCount > 0 && `(${activeCount})`}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter('completed');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filter === 'completed'
                    ? isDark
                      ? 'bg-white/25 text-white font-bold'
                      : 'bg-indigo-600 text-white font-bold'
                    : isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Done {completedCount > 0 && `(${completedCount})`}
              </button>
            </div>

            {/* Quick Bulk / Width Actions */}
            <div className="flex items-center gap-2 no-drag">
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearCompleted();
                  }}
                  className={`text-[10px] hover:underline ${
                    isDark ? 'text-red-300' : 'text-rose-500'
                  }`}
                  title="Remove completed tasks"
                >
                  Clear done
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task Items List */}
        <div className={`px-3 pb-2 space-y-1 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] ${isInsideColumn ? 'max-h-[140px]' : 'max-h-[260px]'}`}>
          {filteredTodos.length === 0 ? (
            <div className="py-4 text-center">
              {filter === 'completed' ? (
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-neutral-400'}`}>
                  No completed tasks yet.
                </p>
              ) : filter === 'active' ? (
                <div className="flex items-center justify-center gap-1 text-emerald-500">
                  <Sparkles className="w-3.5 h-3.5" />
                  <p className="text-xs font-medium">All active tasks completed!</p>
                </div>
              ) : (
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-neutral-400'}`}>
                  No tasks in this list. Add one below!
                </p>
              )}
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const originalIndex = todos.findIndex((t) => t.id === todo.id);

              return (
                <div
                  key={todo.id}
                  className={`group/item flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
                >
                  {/* Custom Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTodo(todo.id);
                    }}
                    className={`p-0.5 rounded transition-colors shrink-0 no-drag ${
                      todo.completed
                        ? 'text-emerald-500 hover:text-emerald-600'
                        : isDark
                        ? 'text-white/40 hover:text-white'
                        : 'text-neutral-400 hover:text-indigo-600'
                    }`}
                  >
                    {todo.completed ? (
                      <CheckSquare className="w-4 h-4 fill-emerald-500/20" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Task Text Input */}
                  <input
                    type="text"
                    value={todo.text}
                    onChange={(e) => updateTodoText(todo.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const newTodo: TodoItem = {
                          id: `td-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                          text: '',
                          completed: false,
                          createdAt: Date.now(),
                        };
                        const newTodos = [...todos];
                        newTodos.splice(originalIndex + 1, 0, newTodo);
                        onUpdate({ todos: newTodos });
                      } else if (e.key === 'Backspace' && !todo.text && todos.length > 1) {
                        e.preventDefault();
                        removeTodo(todo.id);
                      }
                    }}
                    className={`flex-1 min-w-0 text-xs bg-transparent outline-none no-drag transition-colors ${
                      isDark ? 'text-white' : 'text-neutral-900'
                    } ${
                      todo.completed
                        ? isDark
                          ? 'line-through text-white/40'
                          : 'line-through text-neutral-400'
                        : ''
                    }`}
                  />

                  {/* Priority Tag (Flag) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cyclePriority(todo.id);
                    }}
                    className="shrink-0 no-drag cursor-pointer"
                    title={`Priority: ${todo.priority || 'None'} (click to change)`}
                  >
                    {todo.priority === 'high' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        High
                      </span>
                    ) : todo.priority === 'medium' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Med
                      </span>
                    ) : todo.priority === 'low' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                        Low
                      </span>
                    ) : (
                      <span className="opacity-0 group-hover/item:opacity-40 hover:opacity-100 text-[9px] px-1 rounded border border-dashed">
                        + flag
                      </span>
                    )}
                  </button>

                  {/* Notes indicator if present */}
                  {todo.notes && (
                    <span
                      className="text-indigo-500 shrink-0"
                      title={todo.notes}
                    >
                      <FileText className="w-3 h-3" />
                    </span>
                  )}

                  {/* Reorder Buttons (Up / Down) */}
                  <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity no-drag shrink-0">
                    <button
                      type="button"
                      disabled={originalIndex === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTodo(originalIndex, 'up');
                      }}
                      className="p-0.5 rounded hover:bg-black/10 disabled:opacity-20"
                      title="Move up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={originalIndex === todos.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTodo(originalIndex, 'down');
                      }}
                      className="p-0.5 rounded hover:bg-black/10 disabled:opacity-20"
                      title="Move down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTodo(todo.id);
                    }}
                    className={`opacity-0 group-hover/item:opacity-100 p-0.5 rounded transition-opacity no-drag cursor-pointer shrink-0 ${
                      isDark ? 'text-white/60 hover:text-red-300' : 'text-neutral-400 hover:text-red-500'
                    }`}
                    title="Remove task"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Add Task Input Form */}
        <div className="px-3.5 pb-3">
          <form
            onSubmit={addTodo}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border no-drag ${
              isDark
                ? 'bg-white/5 border-white/10'
                : 'bg-black/2 border-black/5 hover:border-black/10'
            }`}
          >
            <Plus className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-white/60' : 'text-neutral-400'}`} />
            <input
              ref={inputRef}
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Add a task (Press Enter)..."
              className={`w-full text-xs bg-transparent outline-none no-drag ${
                isDark ? 'text-white placeholder:text-white/50' : 'text-neutral-900 placeholder:text-neutral-400'
              }`}
            />

            {/* Quick Priority flag for new task */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const cycle: Array<'low' | 'medium' | 'high' | undefined> = [undefined, 'low', 'medium', 'high'];
                const next = (cycle.indexOf(newPriority) + 1) % cycle.length;
                setNewPriority(cycle[next]);
              }}
              className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-black/5"
              title="Set priority for this task"
            >
              {newPriority ? (
                <span className="font-bold capitalize text-indigo-600 dark:text-indigo-400">
                  {newPriority}
                </span>
              ) : (
                <span className="opacity-50">+ Flag</span>
              )}
            </button>

            {newText.trim() && (
              <button
                type="submit"
                className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors shrink-0"
              >
                Add
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Expanded Desktop View Modal */}
      {showModal && (
        <TodoModal
          item={item}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};
