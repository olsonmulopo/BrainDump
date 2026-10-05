import React, { useState, useRef, useEffect } from 'react';
import { NoteItem, ItemColor, WorkflowStatus } from '../../types';
import { getItemColorStyles } from '../../utils/theme';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { WorkflowStatusBadge } from '../WorkflowStatusBadge';
import { NoteContentRenderer } from '../notes/NoteContentRenderer';
import { NoteModal } from '../notes/NoteModal';
import { RichTextEditor, RichTextEditorRef } from '../notes/RichTextEditor';
import { getWordCount, stripHtml } from '../../utils/richText';
import {
  FileText,
  Trash2,
  Smile,
  Palette,
  Maximize2,
  Pin,
  ListTodo,
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  ListOrdered,
  Heading2,
  Check,
  Plus,
  X,
  ArrowUpRight,
  MoreHorizontal,
  Copy,
  Code,
  Strikethrough,
  SlidersHorizontal,
} from 'lucide-react';

interface NoteCardProps {
  item: NoteItem;
  onUpdate: (updates: Partial<NoteItem>) => void;
  onDelete: () => void;
  onDuplicate?: (item: NoteItem) => void;
  onStartConnecting?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  isInsideColumn?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  item,
  onUpdate,
  onDelete,
  onDuplicate,
  onStartConnecting,
  isSelected,
  isInsideColumn,
}) => {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const richEditorRef = useRef<RichTextEditorRef>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const colorStyles = getItemColorStyles(item.color || 'default', item.customColor);
  const isDark = colorStyles.isDark;

  const content = item.content || '';
  const title = item.title || '';
  const currentWidth = item.width && item.width !== 560 ? item.width : 280;
  const isPinned = Boolean(item.pinned);
  const tags = item.tags || [];
  const fontFamily = item.fontFamily || 'sans';
  const paperStyle = item.paperStyle || 'plain';

  // Calculate statistics cleanly from visible text (ignoring HTML tags)
  const wordCount = getWordCount(content);
  const charCount = stripHtml(content).length;

  // Close more menu when clicking outside
  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  // Add Tag
  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      onUpdate({ tags: [...tags, clean], updatedAt: Date.now() });
    }
    setTagInput('');
    setIsAddingTag(false);
  };

  // Paper texture background styles
  const getPaperBackgroundStyle = (): React.CSSProperties => {
    if (paperStyle === 'ruled') {
      return {
        backgroundImage: isDark
          ? 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)'
          : 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
        backgroundSize: '100% 24px',
      };
    }
    if (paperStyle === 'grid') {
      return {
        backgroundImage: isDark
          ? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)'
          : 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      };
    }
    if (paperStyle === 'warm-paper') {
      return {
        backgroundColor: isDark ? '#26221c' : '#fefcf6',
        backgroundImage: isDark
          ? 'linear-gradient(rgba(251,191,36,0.08) 1px, transparent 1px)'
          : 'linear-gradient(rgba(217,119,6,0.08) 1px, transparent 1px)',
        backgroundSize: '100% 26px',
      };
    }
    return {};
  };

  return (
    <>
      <div
        id={`item-${item.id}`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className={`group relative w-full max-w-full box-border border transition-all select-none ${
          isInsideColumn ? 'p-3 rounded-xl' : 'p-4 rounded-2xl'
        } ${
          showColorPicker || showMoreMenu ? 'overflow-visible' : 'overflow-hidden'
        } ${
          !item.customColor ? colorStyles.className : ''
        } ${
          isSelected
            ? 'ring-2 ring-indigo-500 shadow-lg'
            : isPinned
            ? 'shadow-md border-amber-400/60 dark:border-amber-500/40'
            : 'shadow-xs hover:shadow-md'
        }`}
        style={{
          ...(item.customColor ? colorStyles.style : {}),
          ...getPaperBackgroundStyle(),
        }}
      >
        {/* Pinned Indicator Badge */}
        {isPinned && (
          <div
            className="absolute -top-1 right-2 z-10 p-1 text-amber-500 transform rotate-12 drop-shadow-xs"
            title="Pinned note"
          >
            <Pin className="w-3.5 h-3.5 fill-current" />
          </div>
        )}

        {/* Clean Desktop App Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Note App Icon & Title */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div
              className={`p-1 rounded-md shrink-0 ${
                isDark ? 'bg-white/10 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => onUpdate({ title: e.target.value, updatedAt: Date.now() })}
              placeholder="Note title..."
              className={`font-semibold text-sm tracking-tight flex-1 min-w-0 bg-transparent outline-none no-drag cursor-text select-text transition-colors truncate ${
                fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono text-xs' : 'font-sans'
              } ${
                isDark
                  ? 'text-white placeholder:text-white/40'
                  : 'text-neutral-900 placeholder:text-neutral-400'
              }`}
            />
          </div>

          {/* Streamlined Action Buttons */}
          <div className="flex items-center gap-0.5 shrink-0 no-drag">
            {/* Workflow Status Badge (if active) */}
            {(item.workflowStatus && item.workflowStatus !== 'none') ? (
              <WorkflowStatusBadge
                status={item.workflowStatus}
                note={item.workflowNote}
                onUpdateStatus={(status: WorkflowStatus, note?: string) =>
                  onUpdate({ workflowStatus: status, workflowNote: note, updatedAt: Date.now() })
                }
                compact
              />
            ) : null}

            {/* Quick Palette Button */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className={`p-1.5 rounded-lg transition-colors no-drag cursor-pointer ${
                  isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/15'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-black/5'
                }`}
                title="Change note color"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>

              {showColorPicker && (
                <ColorPickerPopover
                  currentColor={item.color}
                  customColor={item.customColor}
                  onChangeColor={(color: ItemColor, customHex?: string) => {
                    onUpdate({ color, customColor: customHex, updatedAt: Date.now() });
                    setShowColorPicker(false);
                  }}
                  onClose={() => setShowColorPicker(false)}
                />
              )}
            </div>

            {/* Expand to Full Focus Note Editor Modal */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className={`p-1.5 rounded-lg transition-colors no-drag cursor-pointer ${
                isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/15'
                  : 'text-neutral-400 hover:text-neutral-800 hover:bg-black/5'
              }`}
              title="Open full Note editor (double-click)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* More Options Menu (···) */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreMenu(!showMoreMenu);
                }}
                className={`p-1.5 rounded-lg transition-colors no-drag cursor-pointer ${
                  showMoreMenu
                    ? isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-neutral-900'
                    : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/15'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-black/5'
                }`}
                title="More note options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {showMoreMenu && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-1.5 z-50 text-xs no-drag text-neutral-800 dark:text-neutral-200 select-none animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Pin / Unpin */}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate({ pinned: !isPinned, updatedAt: Date.now() });
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-500 fill-current' : ''}`} />
                    <span>{isPinned ? 'Unpin note' : 'Pin note'}</span>
                  </button>

                  {/* App Width (Desktop Horizontal) */}
                  <div className="px-2.5 py-1 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mt-1">
                    App Width (Desktop)
                  </div>
                  <div className="flex items-center gap-1 px-2 pb-1">
                    {[
                      { width: 280, label: 'Standard' },
                      { width: 380, label: 'Medium' },
                      { width: 500, label: 'Wide' },
                    ].map((w) => (
                      <button
                        key={w.width}
                        type="button"
                        onClick={() => {
                          onUpdate({ width: w.width, updatedAt: Date.now() });
                          setShowMoreMenu(false);
                        }}
                        className={`flex-1 py-1 rounded text-center text-[11px] font-medium transition-colors cursor-pointer ${
                          Math.abs(currentWidth - w.width) < 30
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>

                  {/* Typography Font */}
                  <div className="px-2.5 py-1 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mt-1">
                    Font Family
                  </div>
                  <div className="flex items-center gap-1 px-2 pb-1">
                    {(['sans', 'serif', 'mono'] as const).map((font) => (
                      <button
                        key={font}
                        type="button"
                        onClick={() => {
                          onUpdate({ fontFamily: font, updatedAt: Date.now() });
                          setShowMoreMenu(false);
                        }}
                        className={`flex-1 py-1 rounded text-center text-[11px] capitalize transition-colors cursor-pointer ${
                          fontFamily === font
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {font}
                      </button>
                    ))}
                  </div>

                  {/* Paper Style */}
                  <div className="px-2.5 py-1 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mt-1">
                    Paper Texture
                  </div>
                  <div className="grid grid-cols-2 gap-1 px-2 pb-1">
                    {[
                      { id: 'plain', label: 'Plain' },
                      { id: 'ruled', label: 'Ruled' },
                      { id: 'grid', label: 'Grid' },
                      { id: 'warm-paper', label: 'Warm' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onUpdate({ paperStyle: p.id as any, updatedAt: Date.now() });
                          setShowMoreMenu(false);
                        }}
                        className={`py-1 rounded text-center text-[10px] transition-colors cursor-pointer ${
                          paperStyle === p.id
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                  {/* Connect Arrow */}
                  {onStartConnecting && (
                    <button
                      type="button"
                      onClick={(e) => {
                        onStartConnecting(e);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Connect with arrow</span>
                    </button>
                  )}

                  {/* Duplicate */}
                  {onDuplicate && (
                    <button
                      type="button"
                      onClick={() => {
                        onDuplicate(item);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate note</span>
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      onDelete();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete note</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags Row */}
        {(tags.length > 0 || isAddingTag) && (
          <div className="flex items-center flex-wrap gap-1.5 mb-2.5 no-drag">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                  isDark ? 'text-indigo-300' : 'text-indigo-600'
                }`}
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ tags: tags.filter((t) => t !== tag), updatedAt: Date.now() });
                  }}
                  className="hover:text-rose-500 transition-colors cursor-pointer"
                  title="Remove tag"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}

            {isAddingTag ? (
              <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onBlur={() => handleAddTag()}
                  placeholder="tag"
                  autoFocus
                  className="px-2 py-0.5 rounded-md text-[11px] border border-indigo-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none w-20"
                />
                <button
                  type="submit"
                  className="p-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <Check className="w-2.5 h-2.5" />
                </button>
              </form>
            ) : null}
          </div>
        )}

        {/* Note Body Area */}
        <div className="relative w-full max-w-full">
          {isEditingContent ? (
            /* Inline Textarea Editor with Safe Formatting Toolbar */
            <div className="space-y-2 no-drag" onClick={(e) => e.stopPropagation()}>
              {/* Inline Quick Toolbar: uses onMouseDown preventDefault to preserve text selection */}
              <div
                className={`flex items-center gap-0.5 py-1 px-1.5 rounded-xl border text-xs shadow-2xs ${
                  isDark
                    ? 'bg-neutral-800/90 border-neutral-700 text-neutral-200'
                    : 'bg-white/90 border-neutral-200 text-neutral-700'
                }`}
              >
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    richEditorRef.current?.execBold();
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700 cursor-pointer"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    richEditorRef.current?.execItalic();
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700 cursor-pointer"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    richEditorRef.current?.execUnderline();
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700 cursor-pointer"
                  title="Underline (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    richEditorRef.current?.execHighlight();
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700 text-amber-500 font-medium cursor-pointer"
                  title="Highlight (Ctrl+H)"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    richEditorRef.current?.execChecklist();
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700 text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer"
                  title="Checklist task"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    richEditorRef.current?.execBulletList();
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700 cursor-pointer"
                  title="Bullet list"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    richEditorRef.current?.execNumberedList();
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700 cursor-pointer"
                  title="Numbered list"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    richEditorRef.current?.execHeading();
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700 cursor-pointer"
                  title="Heading"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>

                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsEditingContent(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>

              <div className={`p-1 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] ${isInsideColumn ? 'max-h-[140px]' : 'max-h-[320px]'}`}>
                <RichTextEditor
                  ref={richEditorRef}
                  content={content}
                  onChange={(newHtml) => {
                    onUpdate({ content: newHtml, updatedAt: Date.now() });
                  }}
                  placeholder="Type your notes here..."
                  isDark={isDark}
                  fontFamily={fontFamily}
                  autoFocus
                  minHeight={isInsideColumn ? '48px' : '72px'}
                />
              </div>
            </div>
          ) : (
            /* Rendered Rich Text View with Interactive Clickable Checkboxes */
            <div
              className={`cursor-text select-text no-drag transition-colors overflow-y-auto overflow-x-hidden [scrollbar-width:thin] py-1 ${
                isInsideColumn ? 'max-h-[140px]' : 'max-h-[340px]'
              }`}
              style={{ minHeight: isInsideColumn ? '36px' : '52px' }}
              onClick={() => {
                setIsEditingContent(true);
              }}
              title="Click to edit note (or click ⛶ for focus view)"
            >
              <NoteContentRenderer
                content={content}
                isDark={isDark}
                fontFamily={fontFamily}
                onHtmlCheckboxToggle={(newHtml) => {
                  onUpdate({ content: newHtml, updatedAt: Date.now() });
                }}
              />
            </div>
          )}
        </div>

        {/* Clean Metadata Footer (Zero-Pill Discipline) */}
        <div
          className={`flex items-center justify-between pt-2.5 mt-2.5 border-t text-xs select-none no-drag ${
            isDark ? 'border-white/10 text-white/50' : 'border-neutral-200/70 text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-500 dark:text-neutral-400">Note App</span>
            <span aria-hidden="true">·</span>
            <span>{wordCount} words</span>
            {!isAddingTag && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingTag(true);
                  }}
                  className="hover:text-indigo-500 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                  title="Add tag"
                >
                  <Plus className="w-3 h-3" />
                  <span>tag</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditingContent ? (
              <span className="text-[11px] text-indigo-500 font-medium">Editing...</span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                className="hover:text-indigo-500 transition-colors cursor-pointer text-[11px]"
                title="Expand editor"
              >
                Focus view
              </button>
            )}
          </div>
        </div>

        {/* Emoji Reactions */}
        {item.reactions && item.reactions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 no-drag">
            {item.reactions.map((r, i) => (
              <span
                key={i}
                className="text-xs bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Full Note Focus Modal Dialog */}
      {showModal && (
        <NoteModal
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
