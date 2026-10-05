import React, { useState } from 'react';
import { WorkflowStatus } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  X,
  ChevronDown,
  Tag,
} from 'lucide-react';

interface WorkflowStatusBadgeProps {
  status?: WorkflowStatus;
  note?: string;
  onUpdateStatus: (status: WorkflowStatus, note?: string) => void;
  className?: string;
  compact?: boolean;
}

export const WORKFLOW_CONFIG: Record<
  Exclude<WorkflowStatus, 'none'>,
  {
    label: string;
    description: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  in_progress: {
    label: 'In Progress',
    description: 'Currently working on this step',
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    dot: 'bg-blue-500 animate-pulse',
    icon: PlayCircle,
  },
  done: {
    label: 'Done',
    description: 'Completed step in workflow',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Pending',
    description: 'Waiting or queued step',
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  error: {
    label: 'Error Found',
    description: 'Issue or error in workflow',
    bg: 'bg-rose-50 hover:bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
    icon: AlertCircle,
  },
};

export const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({
  status = 'none',
  note,
  onUpdateStatus,
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(note || '');

  const hasStatus = status && status !== 'none' && WORKFLOW_CONFIG[status];
  const config = hasStatus ? WORKFLOW_CONFIG[status] : null;

  return (
    <div className={`relative inline-flex items-center no-drag select-none ${className}`}>
      {/* Trigger Button */}
      {config ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-tight border transition-all cursor-pointer shadow-2xs ${config.bg} ${config.text} ${config.border}`}
          title={`Status: ${config.label} (${config.description})${note ? ` • Note: ${note}` : ''}. Click to change.`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          <span>{config.label}</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-neutral-400 hover:text-neutral-700 hover:bg-black/5 transition-colors cursor-pointer border border-transparent hover:border-neutral-200 ${
            compact ? 'opacity-0 group-hover:opacity-100' : ''
          }`}
          title="Tag workflow status (Done, In Progress, Pending, Error)"
        >
          <Tag className="w-3 h-3 text-neutral-400" />
          {!compact && <span>Status</span>}
        </button>
      )}

      {/* Popover Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-52 p-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200/90 dark:border-neutral-700/90 text-neutral-800 dark:text-neutral-100 text-xs animate-in fade-in zoom-in-95 duration-100 no-drag"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-1.5 py-1 mb-1 border-b border-neutral-100 dark:border-neutral-800">
            <span className="font-semibold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Workflow Status
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {(
              [
                'in_progress',
                'done',
                'pending',
                'error',
              ] as (keyof typeof WORKFLOW_CONFIG)[]
            ).map((key) => {
              const itemConfig = WORKFLOW_CONFIG[key];
              const Icon = itemConfig.icon;
              const isSelected = status === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onUpdateStatus(key, note);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? `${itemConfig.bg} ${itemConfig.text} font-semibold ring-1 ring-inset ${itemConfig.border}`
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <div>
                      <div className="font-medium text-xs leading-tight">
                        {itemConfig.label}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-tight">
                        {itemConfig.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold">Active</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Optional Note / Annotation */}
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {editingNote ? (
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g., Step 2 review needed"
                  className="w-full text-xs px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingNote(false)}
                    className="px-2 py-0.5 text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(status === 'none' ? 'in_progress' : status, noteText.trim());
                      setEditingNote(false);
                      setIsOpen(false);
                    }}
                    className="px-2 py-0.5 text-[10px] bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-medium rounded cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="truncate">{note ? `Note: "${note}"` : 'No custom note'}</span>
                <button
                  type="button"
                  onClick={() => setEditingNote(true)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium text-[10px]"
                >
                  {note ? 'Edit' : '+ Add Note'}
                </button>
              </div>
            )}
          </div>

          {/* Clear Status Button */}
          {hasStatus && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus('none', undefined);
                setIsOpen(false);
              }}
              className="mt-1.5 w-full py-1 text-center text-[10px] font-medium text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
            >
              Clear Status
            </button>
          )}
        </div>
      )}
    </div>
  );
};
