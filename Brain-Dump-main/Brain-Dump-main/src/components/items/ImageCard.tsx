import React, { useRef, useState } from 'react';
import { ImageCardItem, WorkflowStatus } from '../../types';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Link,
  Clipboard,
  Check,
  AlertCircle,
  Download,
} from 'lucide-react';
import { WorkflowStatusBadge } from '../WorkflowStatusBadge';
import { downloadImageUrl } from '../../services/fileStorage';

interface ImageCardProps {
  item: ImageCardItem;
  onUpdate: (updates: Partial<ImageCardItem>) => void;
  onDelete: () => void;
  isSelected?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  onUpdate,
  onDelete,
  isSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.url) return;
    setIsDownloading(true);
    const fileName = item.caption && item.caption !== 'Add a caption' ? `${item.caption}.png` : 'canvas-image.png';
    await downloadImageUrl(item.url, fileName);
    setTimeout(() => setIsDownloading(false), 600);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    loadImageFromFile(file);
  };

  const loadImageFromFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setPasteError('File is not an image');
      setTimeout(() => setPasteError(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({
        url: reader.result as string,
        caption: item.caption === 'Add a caption' ? file.name : item.caption,
      });
      setPasteSuccess(true);
      setTimeout(() => setPasteSuccess(false), 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUpdate({ url: urlInput.trim() });
      setIsAddingUrl(false);
    }
  };

  // Paste image directly from clipboard
  const handlePasteFromClipboard = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPasteError(null);

    try {
      // 1. Try reading clipboard items directly (Blob)
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
          const imageType = clipboardItem.types.find((type) =>
            type.startsWith('image/')
          );
          if (imageType) {
            const blob = await clipboardItem.getType(imageType);
            const file = new File([blob], 'pasted-image.png', { type: imageType });
            loadImageFromFile(file);
            return;
          }
        }
      }

      // 2. Fallback: try reading text in clipboard in case user copied an image URL or base64
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const trimmed = text.trim();
        if (
          trimmed.startsWith('data:image/') ||
          trimmed.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ||
          trimmed.startsWith('http')
        ) {
          onUpdate({ url: trimmed });
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
          return;
        }
      }

      setPasteError('No image found in clipboard. Copy an image or screenshot first!');
      setTimeout(() => setPasteError(null), 3500);
    } catch (err) {
      console.warn('Clipboard read error:', err);
      setPasteError('Please allow clipboard access or press Ctrl+V directly.');
      setTimeout(() => setPasteError(null), 4000);
    }
  };

  // Keyboard Ctrl+V paste listener directly on the card
  const handleCardPaste = (e: React.ClipboardEvent) => {
    e.stopPropagation();
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          loadImageFromFile(file);
          return;
        }
      }
    }

    // Check if plain text is an image link
    const pastedText = e.clipboardData.getData('text/plain')?.trim();
    if (
      pastedText &&
      (pastedText.startsWith('data:image/') ||
        pastedText.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ||
        pastedText.startsWith('http'))
    ) {
      onUpdate({ url: pastedText });
      setPasteSuccess(true);
      setTimeout(() => setPasteSuccess(false), 2000);
    }
  };

  // Drag and Drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    window.dispatchEvent(new Event('canvas-file-dropped'));

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      loadImageFromFile(files[0]);
    }
  };

  return (
    <div
      id={`item-${item.id}`}
      tabIndex={0}
      onPaste={handleCardPaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group w-full rounded-xl border bg-white overflow-hidden transition-all outline-none ${
        isDraggingOver
          ? 'ring-3 ring-indigo-500 border-indigo-400 bg-indigo-50/20'
          : isSelected
          ? 'ring-2 ring-indigo-500 shadow-md border-indigo-300'
          : 'border-neutral-200/90 shadow-2xs hover:shadow-sm'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header with Workflow Status and Quick Actions */}
      <div className="px-2.5 py-1.5 bg-neutral-50/80 border-b border-neutral-100 flex items-center justify-between gap-1.5">
        <WorkflowStatusBadge
          status={item.workflowStatus}
          note={item.workflowNote}
          onUpdateStatus={(status: WorkflowStatus, note?: string) =>
            onUpdate({ workflowStatus: status, workflowNote: note })
          }
          compact
        />

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-drag">
          {item.url && (
            <>
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="p-1 text-neutral-400 hover:text-indigo-600 hover:bg-black/5 rounded transition-colors cursor-pointer"
                title="Download image to computer"
              >
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="p-1 text-neutral-400 hover:text-indigo-600 hover:bg-black/5 rounded transition-colors cursor-pointer"
                title="Paste image from clipboard (replace current)"
              >
                <Clipboard className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-black/5 rounded transition-colors cursor-pointer"
            title="Delete card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {item.url ? (
        <div className="relative group/img bg-neutral-900/5">
          <img
            src={item.url}
            alt={item.caption || 'Board image'}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            className="w-full max-h-[340px] object-cover select-none pointer-events-none"
          />

          {/* Quick paste / change overlay on image hover */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity no-drag">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="px-2 py-1 bg-black/75 hover:bg-black text-white text-[11px] font-medium rounded-md shadow-md flex items-center gap-1 transition-colors cursor-pointer"
              title="Download image"
            >
              <Download className="w-3 h-3 text-white" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="px-2 py-1 bg-black/75 hover:bg-black text-white text-[11px] font-medium rounded-md shadow-md flex items-center gap-1 transition-colors cursor-pointer"
              title="Paste new image from clipboard (Ctrl+V)"
            >
              <Clipboard className="w-3 h-3 text-indigo-300" />
              <span>Paste New</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center justify-center bg-neutral-50/70 border-b border-dashed border-neutral-200 min-h-[180px] text-center">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-2.5 text-neutral-400">
            <UploadCloud className="w-5 h-5" />
          </div>

          <div className="font-medium text-xs text-neutral-700 mb-2">
            Add an image to your board
          </div>

          {/* 3 Prominent Options: Paste from Clipboard, Upload, Paste URL */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 no-drag mb-2">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-md transition-colors cursor-pointer shadow-2xs"
              title="Click or press Ctrl+V while focused to paste image from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste Image</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-neutral-500" />
              <span>Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingUrl(!isAddingUrl)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <Link className="w-3 h-3 text-neutral-400" />
              <span>URL</span>
            </button>
          </div>

          <p className="text-[10px] text-neutral-400">
            Tip: Press <kbd className="px-1 py-0.5 bg-neutral-200/80 rounded text-[9px] font-mono">Ctrl+V</kbd> or drag and drop an image
          </p>

          {/* Feedback messages */}
          {pasteSuccess && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Image pasted successfully!</span>
            </div>
          )}
          {pasteError && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium max-w-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{pasteError}</span>
            </div>
          )}

          {isAddingUrl && (
            <form
              onSubmit={handleUrlSubmit}
              className="mt-3 flex items-center gap-1 w-full max-w-[220px] no-drag"
            >
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs p-1.5 border border-neutral-300 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <button
                type="submit"
                className="text-xs px-2.5 py-1.5 bg-neutral-900 text-white rounded font-medium cursor-pointer"
              >
                Add
              </button>
            </form>
          )}
        </div>
      )}

      {/* Caption input */}
      <div className="p-2 border-t border-neutral-100 flex items-center justify-between bg-white">
        <input
          type="text"
          value={item.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Add a caption..."
          className="w-full text-xs text-neutral-600 bg-transparent outline-none placeholder:text-neutral-300 italic no-drag"
        />
      </div>
    </div>
  );
};
