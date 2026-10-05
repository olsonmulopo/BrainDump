import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TodoCardItem, TodoItem, ItemColor } from '../../types';
import { ColorPickerPopover } from '../ColorPickerPopover';
import {
  X,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  Palette,
  Flag,
  Calendar,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  CheckCheck,
  RotateCcw,
  Sparkles,
  FileText,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';

interface TodoModalProps {
  item: TodoCardItem;
  onUpdate: (updates: Partial<TodoCardItem>) => void;
  onDelete: () => void;
  onClose: () => void;
  onDuplicate?: (item: TodoCardItem) => void;
}

export type TodoTheme = 'dark' | 'sepia' | 'light';

export const TodoModal: React.FC<TodoModalProps> = ({
  item,
  onUpdate,
  onDelete,
  onClose,
  onDuplicate,
}) => {
  const [theme, setTheme] = useState<TodoTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('braindump_todo_theme') as TodoTheme;
      if (saved && ['dark', 'sepia', 'light'].includes(saved)) return saved;
    }
    return 'light';
  });

  const [isMaximized, setIsMaximized] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);

  const newTaskInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSetTheme = (newTheme: TodoTheme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('braindump_todo_theme', newTheme);
    }
  };

  // Theme styling definitions
  const themeClasses = {
    dark: {
      bg: 'bg-neutral-900',
      text: 'text-neutral-100',
      border: 'border-neutral-800',
      cardBg: 'bg-neutral-800/80',
      cardHover: 'hover:bg-neutral-800',
      subText: 'text-neutral-400',
      inputBg: 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500',
      activeFilter: 'bg-indigo-600 text-white',
      inactiveFilter: 'bg-neutral-800 text-neutral-400 hover:text-neutral-200',
      progressBarBg: 'bg-neutral-800',
    },
    sepia: {
      bg: 'bg-[#fbf0d9]',
      text: 'text-[#2c221e]',
      border: 'border-[#ebd4b4]',
      cardBg: 'bg-[#f5e4c6]/70',
      cardHover: 'hover:bg-[#f5e4c6]',
      subText: 'text-[#7d6556]',
      inputBg: 'bg-[#fffaf0] border-[#d8c09d] text-[#2c221e] placeholder:text-[#a08874]',
      activeFilter: 'bg-[#8d5b32] text-white',
      inactiveFilter: 'bg-[#ebd8bd] text-[#5e4533] hover:bg-[#e4cca9]',
      progressBarBg: 'bg-[#ebd4b4]',
    },
    light: {
      bg: 'bg-white',
      text: 'text-neutral-900',
      border: 'border-neutral-200',
      cardBg: 'bg-neutral-50/80',
      cardHover: 'hover:bg-neutral-100',
      subText: 'text-neutral-500',
      inputBg: 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400',
      activeFilter: 'bg-indigo-600 text-white',
      inactiveFilter: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
      progressBarBg: 'bg-neutral-100',
    },
  }[theme];

  const todos = item.todos || [];
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered & searched todos
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // Filter status
      if (activeFilter === 'active' && todo.completed) return false;
      if (activeFilter === 'completed' && !todo.completed) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = todo.text.toLowerCase().includes(query);
        const notesMatch = todo.notes?.toLowerCase().includes(query);
        return textMatch || notesMatch;
      }
      return true;
    });
  }, [todos, activeFilter, searchQuery]);

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

  const updateTodoNotes = (id: string, notes: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, notes } : t));
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

  const handleAddTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    newTaskInputRef.current?.focus();
  };

  const handleCheckAll = (checked: boolean) => {
    const updated = todos.map((t) => ({ ...t, completed: checked }));
    onUpdate({ todos: updated });
  };

  const handleClearCompleted = () => {
    const updated = todos.filter((t) => !t.completed);
    onUpdate({ todos: updated });
  };

  const handleSortByPriority = () => {
    const weight = { high: 3, medium: 2, low: 1, undefined: 0 };
    const sorted = [...todos].sort((a, b) => {
      const wa = weight[a.priority || 'undefined'];
      const wb = weight[b.priority || 'undefined'];
      return wb - wa;
    });
    onUpdate({ todos: sorted });
  };

  const handleCopyMarkdown = async () => {
    const markdown = `# ${item.title || 'To-do List'}\n\n` +
      todos
        .map((t) => `- [${t.completed ? 'x' : ' '}] ${t.text}${t.priority ? ` [Priority: ${t.priority.toUpperCase()}]` : ''}${t.notes ? `\n  - Notes: ${t.notes}` : ''}`)
        .join('\n');

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadMarkdown = () => {
    const markdown = `# ${item.title || 'To-do List'}\n\n` +
      todos
        .map((t) => `- [${t.completed ? 'x' : ' '}] ${t.text}${t.priority ? ` [Priority: ${t.priority.toUpperCase()}]` : ''}${t.notes ? `\n  - Notes: ${t.notes}` : ''}`)
        .join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(item.title || 'todo-list').toLowerCase().replace(/\s+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const priorityBadge = (priority?: 'low' | 'medium' | 'high') => {
    if (!priority) return null;
    const config = {
      high: { label: 'High', bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
      medium: { label: 'Medium', bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
      low: { label: 'Low', bg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' },
    }[priority];

    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={modalContentRef}
        className={`relative flex flex-col rounded-xl shadow-2xl border transition-all duration-200 overflow-hidden ${
          isMaximized
            ? 'w-full h-full max-w-none max-h-none rounded-none'
            : 'w-full max-w-3xl h-[88vh] max-h-[820px]'
        } ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Actions Toolbar */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${themeClasses.border}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Task App
                </span>
                <span className={`text-xs ${themeClasses.subText}`}>•</span>
                <span className={`text-xs font-medium ${themeClasses.subText}`}>
                  {completedCount}/{totalCount} completed ({progressPercent}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Theme switcher */}
            <div className={`flex items-center p-0.5 rounded-lg border mr-1 ${themeClasses.border}`}>
              <button
                type="button"
                onClick={() => handleSetTheme('light')}
                className={`p-1 rounded ${theme === 'light' ? 'bg-indigo-600 text-white' : themeClasses.subText}`}
                title="Light theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleSetTheme('sepia')}
                className={`p-1 rounded ${theme === 'sepia' ? 'bg-[#8d5b32] text-white' : themeClasses.subText}`}
                title="Sepia theme"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleSetTheme('dark')}
                className={`p-1 rounded ${theme === 'dark' ? 'bg-indigo-600 text-white' : themeClasses.subText}`}
                title="Dark theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy markdown */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className={`p-1.5 rounded-lg border transition-colors ${themeClasses.border} ${themeClasses.cardHover} ${themeClasses.text}`}
              title="Copy as Markdown checklist"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download markdown */}
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className={`p-1.5 rounded-lg border transition-colors ${themeClasses.border} ${themeClasses.cardHover} ${themeClasses.text}`}
              title="Download Markdown file"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Maximize / Minimize */}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className={`p-1.5 rounded-lg border transition-colors ${themeClasses.border} ${themeClasses.cardHover} ${themeClasses.text}`}
              title={isMaximized ? 'Restore normal view' : 'Maximize full screen'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Done button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors ml-1"
            >
              Done
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors hover:bg-rose-500/10 hover:text-rose-500 ${themeClasses.border} ${themeClasses.text}`}
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-1.5 ${themeClasses.progressBarBg}`}>
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* List Title & Search/Filter Bar */}
        <div className={`px-6 pt-5 pb-3 border-b shrink-0 ${themeClasses.border}`}>
          <input
            type="text"
            value={item.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="To-do list title..."
            className="w-full text-xl font-bold bg-transparent outline-none tracking-tight pb-1"
          />

          {/* Subtitle / Description */}
          <input
            type="text"
            value={item.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Add description or focus goal (optional)..."
            className={`w-full text-xs bg-transparent outline-none pt-1 pb-3 ${themeClasses.subText}`}
          />

          {/* Filter Pills, Search Bar, and Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeFilter === 'all' ? themeClasses.activeFilter : themeClasses.inactiveFilter
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('active')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeFilter === 'active' ? themeClasses.activeFilter : themeClasses.inactiveFilter
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('completed')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeFilter === 'completed' ? themeClasses.activeFilter : themeClasses.inactiveFilter
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs ml-auto">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border w-full ${themeClasses.inputBg}`}>
                <Search className="w-3.5 h-3.5 shrink-0 opacity-60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full text-xs bg-transparent outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="opacity-60 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Task List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {filteredTodos.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6">
              {searchQuery ? (
                <>
                  <p className="text-sm font-medium">No tasks found matching "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs text-indigo-500 hover:underline"
                  >
                    Clear search filter
                  </button>
                </>
              ) : activeFilter === 'completed' ? (
                <>
                  <Square className={`w-8 h-8 mb-2 ${themeClasses.subText}`} />
                  <p className="text-sm font-medium">No completed tasks yet</p>
                  <p className={`text-xs mt-1 ${themeClasses.subText}`}>Check off tasks to see them here.</p>
                </>
              ) : (
                <>
                  <Sparkles className="w-8 h-8 mb-2 text-indigo-500" />
                  <p className="text-sm font-semibold">All done or no tasks yet!</p>
                  <p className={`text-xs mt-1 ${themeClasses.subText}`}>
                    Add a task below to get started.
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredTodos.map((todo, index) => {
              const originalIndex = todos.findIndex((t) => t.id === todo.id);
              const isNotesOpen = editingNotesId === todo.id;

              return (
                <div
                  key={todo.id}
                  className={`group relative flex flex-col p-2.5 rounded-lg border transition-all ${
                    themeClasses.border
                  } ${themeClasses.cardBg} ${themeClasses.cardHover}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleTodo(todo.id)}
                      className={`p-1 rounded-md transition-colors shrink-0 ${
                        todo.completed
                          ? 'text-emerald-500 hover:text-emerald-600'
                          : 'text-neutral-400 hover:text-indigo-600'
                      }`}
                      title={todo.completed ? 'Mark uncompleted' : 'Mark completed'}
                    >
                      {todo.completed ? (
                        <CheckSquare className="w-5 h-5 fill-emerald-500/20" />
                      ) : (
                        <Square className="w-5 h-5" />
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
                          // Create a new task directly below this one
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
                      className={`flex-1 text-sm bg-transparent outline-none transition-all ${
                        todo.completed
                          ? `line-through opacity-50 ${themeClasses.subText}`
                          : 'font-normal'
                      }`}
                    />

                    {/* Priority Badge / Selector */}
                    <button
                      type="button"
                      onClick={() => cyclePriority(todo.id)}
                      className="shrink-0 transition-opacity hover:opacity-80"
                      title={`Priority: ${todo.priority || 'None'} (click to change)`}
                    >
                      {todo.priority ? (
                        priorityBadge(todo.priority)
                      ) : (
                        <span className="opacity-0 group-hover:opacity-60 text-[10px] px-1.5 py-0.5 rounded border border-dashed border-neutral-400">
                          + Flag
                        </span>
                      )}
                    </button>

                    {/* Notes toggle button */}
                    <button
                      type="button"
                      onClick={() => setEditingNotesId(isNotesOpen ? null : todo.id)}
                      className={`p-1 rounded transition-opacity ${
                        todo.notes
                          ? 'text-indigo-500 opacity-100'
                          : 'opacity-0 group-hover:opacity-60 hover:opacity-100'
                      }`}
                      title={todo.notes ? 'Edit task notes' : 'Add task note'}
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {/* Reorder Buttons */}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={originalIndex === 0}
                        onClick={() => moveTodo(originalIndex, 'up')}
                        className="p-1 rounded hover:bg-black/5 disabled:opacity-20"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={originalIndex === todos.length - 1}
                        onClick={() => moveTodo(originalIndex, 'down')}
                        className="p-1 rounded hover:bg-black/5 disabled:opacity-20"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete Task */}
                    <button
                      type="button"
                      onClick={() => removeTodo(todo.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Optional notes expandable area */}
                  {(isNotesOpen || todo.notes) && (
                    <div className="pl-11 pr-2 pt-2 pb-1">
                      <textarea
                        value={todo.notes || ''}
                        onChange={(e) => updateTodoNotes(todo.id, e.target.value)}
                        placeholder="Add details, links, or sub-notes for this task..."
                        rows={2}
                        className={`w-full text-xs p-2 rounded-md border outline-none resize-y ${themeClasses.inputBg}`}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Quick Add Task Input Bar */}
        <div className={`p-4 border-t shrink-0 ${themeClasses.border} ${themeClasses.cardBg}`}>
          <form onSubmit={handleAddTodo} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border ${themeClasses.inputBg}`}>
              <Plus className="w-4 h-4 shrink-0 text-indigo-500" />
              <input
                ref={newTaskInputRef}
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Add a new task (Press Enter to save & continue)..."
                className="w-full text-sm bg-transparent outline-none"
              />

              {/* Priority toggle for new task */}
              <button
                type="button"
                onClick={() => {
                  const cycle: Array<'low' | 'medium' | 'high' | undefined> = [undefined, 'low', 'medium', 'high'];
                  const nextIdx = (cycle.indexOf(newPriority) + 1) % cycle.length;
                  setNewPriority(cycle[nextIdx]);
                }}
                className="shrink-0 text-xs px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-black/5"
                title="Set priority for this task"
              >
                {newPriority ? (
                  <span className="font-semibold capitalize text-indigo-600 dark:text-indigo-400">
                    {newPriority}
                  </span>
                ) : (
                  <span className="opacity-60">+ Priority</span>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={!newText.trim()}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
            >
              Add Task
            </button>
          </form>

          {/* Quick Bulk Action Helpers */}
          <div className="flex items-center justify-between pt-2.5 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCheckAll(true)}
                className={`hover:underline ${themeClasses.subText}`}
              >
                Check all
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleCheckAll(false)}
                className={`hover:underline ${themeClasses.subText}`}
              >
                Uncheck all
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleSortByPriority}
                className={`hover:underline ${themeClasses.subText}`}
              >
                Sort by priority
              </button>
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-rose-500 hover:underline"
              >
                Clear completed ({completedCount})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
