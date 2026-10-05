import React, { useState, useEffect, useRef } from 'react';
import { FolderCardItem, FileCardItem, ItemColor } from '../../types';
import { ColorPickerPopover } from '../ColorPickerPopover';
import {
  formatFileSize,
  isMarkdownFile,
  openFileWithDesktopApp,
  downloadFile,
  downloadAllFilesAsZip,
} from '../../services/fileStorage';
import {
  Folder,
  FolderOpen,
  X,
  Search,
  Plus,
  Download,
  Trash2,
  ExternalLink,
  Edit2,
  Grid,
  List,
  FileUp,
  FileText,
  FileCode,
  FileSpreadsheet,
  Presentation,
  Archive,
  Video,
  Music,
  Image as ImageIcon,
  Palette,
  Check,
  ArrowUpRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface FolderModalProps {
  folder: FolderCardItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFolder: (folderId: string, updates: Partial<FolderCardItem>) => void;
  onExtractFile: (folderId: string, fileItem: FileCardItem) => void;
  onExtractAllFiles: (folderId: string) => void;
  onDeleteFile: (folderId: string, fileId: string) => void;
  onUploadFilesToFolder: (folderId: string, files: File[]) => void;
  onOpenMarkdownPreview?: (fileItem: FileCardItem) => void;
  isDark?: boolean;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  folder,
  isOpen,
  onClose,
  onUpdateFolder,
  onExtractFile,
  onExtractAllFiles,
  onDeleteFile,
  onUploadFilesToFolder,
  onOpenMarkdownPreview,
  isDark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [fileNameInput, setFileNameInput] = useState('');
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadAllZip = async () => {
    if (!folder || !files.length) return;
    setIsDownloadingZip(true);
    await downloadAllFilesAsZip(files, `${folder.title || 'Folder-Files'}.zip`);
    setTimeout(() => setIsDownloadingZip(false), 800);
  };

  const handleDownloadSingleFile = async (file: FileCardItem) => {
    await downloadFile(file);
  };

  useEffect(() => {
    if (folder) {
      setTitleInput(folder.title || 'New Folder');
      setViewMode(folder.viewMode || 'grid');
    }
  }, [folder]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !folder) return null;

  const files = folder.files || [];
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

  const filteredFiles = files.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.fileName.toLowerCase().includes(q) ||
      (f.fileExtension && f.fileExtension.toLowerCase().includes(q)) ||
      (f.fileCategory && f.fileCategory.toLowerCase().includes(q))
    );
  });

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== folder.title) {
      onUpdateFolder(folder.id, { title: trimmed });
    }
    setIsEditingTitle(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    window.dispatchEvent(new Event('canvas-file-dropped'));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFilesToFolder(folder.id, Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFilesToFolder(folder.id, Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleSaveFileName = (fileId: string) => {
    const trimmed = fileNameInput.trim();
    if (trimmed) {
      const updatedFiles = files.map((f) =>
        f.id === fileId ? { ...f, fileName: trimmed, updatedAt: Date.now() } : f
      );
      onUpdateFolder(folder.id, { files: updatedFiles });
    }
    setEditingFileId(null);
  };

  const handleOpenFile = (fileItem: FileCardItem) => {
    if (isMarkdownFile(fileItem) && onOpenMarkdownPreview) {
      onOpenMarkdownPreview(fileItem);
      return;
    }
    openFileWithDesktopApp(fileItem);
  };

  // Helper icon selector based on category
  const renderFileIcon = (file: FileCardItem) => {
    const ext = (file.fileExtension || file.fileName.split('.').pop() || '').toLowerCase();
    if (['md', 'markdown'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-indigo-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (['pptx', 'ppt', 'key'].includes(ext)) {
      return <Presentation className="w-5 h-5 text-amber-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-5 h-5 text-amber-600" />;
    }
    if (['mp4', 'mov', 'webm', 'mkv'].includes(ext)) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return <Music className="w-5 h-5 text-pink-500" />;
    }
    return <FileText className="w-5 h-5 text-neutral-500" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border transition-colors overflow-hidden ${
          isDark
            ? 'bg-[#18191e] border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-800'
        }`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Folder Icon Swatch */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
              style={{
                backgroundColor: folder.customColor || '#f59e0b',
                color: '#ffffff',
              }}
            >
              <FolderOpen className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="font-bold text-base px-2 py-0.5 rounded border border-indigo-500 bg-neutral-100 dark:bg-neutral-800 outline-hidden w-full max-w-xs"
                />
              ) : (
                <div className="flex items-center gap-2 group/title">
                  <h2
                    className="font-bold text-base truncate cursor-pointer hover:underline"
                    onClick={() => setIsEditingTitle(true)}
                    title="Click to rename folder"
                  >
                    {folder.title || 'New Folder'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 opacity-0 group-hover/title:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-opacity cursor-pointer"
                    title="Rename folder"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-neutral-400 font-medium">
                {files.length} {files.length === 1 ? 'file' : 'files'}
                {totalSizeBytes > 0 && ` • ${formatFileSize(totalSizeBytes)} total`}
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {/* Color Palette Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Change folder color"
              >
                <Palette className="w-4 h-4" />
              </button>

              {showColorPicker && (
                <ColorPickerPopover
                  currentColor={folder.color || 'amber'}
                  customColor={folder.customColor}
                  onChangeColor={(c, hex) => {
                    onUpdateFolder(folder.id, { color: c, customColor: hex });
                    setShowColorPicker(false);
                  }}
                  onClose={() => setShowColorPicker(false)}
                />
              )}
            </div>

            {/* Upload Files Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              title="Add files to this folder"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Files</span>
            </button>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ml-1"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-header Toolbar: Search & View Options */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200/60 dark:border-neutral-800/60 gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search files in folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Download All as ZIP */}
            {files.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isDownloadingZip}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
                title="Download all files in this folder as a single ZIP archive"
              >
                {isDownloadingZip ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Download All (ZIP)</span>
              </button>
            )}

            {/* Extract All Button */}
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => onExtractAllFiles(folder.id)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                title="Extract all files to the board canvas"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Extract All to Canvas</span>
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setViewMode('grid');
                  onUpdateFolder(folder.id, { viewMode: 'grid' });
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
                }`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  onUpdateFolder(folder.id, { viewMode: 'list' });
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Main File Browser Area */}
        <div className="relative flex-1 overflow-y-auto p-5 min-h-[300px] max-h-[55vh]">
          {/* Drag Overlay Feedback */}
          {isDragOver && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-amber-500/15 dark:bg-amber-500/25 border-2 border-dashed border-amber-500 rounded-xl backdrop-blur-2xs m-3 animate-in fade-in duration-100">
              <FileUp className="w-12 h-12 text-amber-500 animate-bounce mb-2" />
              <p className="font-bold text-sm text-amber-600 dark:text-amber-400">
                Drop files here to store in folder
              </p>
            </div>
          )}

          {files.length === 0 ? (
            /* Empty State */
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Folder className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mb-1">
                This folder is empty
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mb-4">
                Drag and drop files from your computer, or drop file cards directly onto this folder on the canvas to keep your workspace clean.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Upload First File</span>
              </button>
            </div>
          ) : filteredFiles.length === 0 ? (
            /* Search Filter Empty State */
            <div className="h-48 flex flex-col items-center justify-center text-center p-6">
              <p className="text-sm font-semibold text-neutral-500 mb-2">
                No files match "{searchQuery}"
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-amber-500 hover:underline cursor-pointer"
              >
                Clear search filter
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredFiles.map((file) => {
                const isEditing = editingFileId === file.id;

                return (
                  <div
                    key={file.id}
                    className="group relative flex flex-col justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition-all shadow-2xs hover:shadow-xs"
                  >
                    {/* Top: Icon & Actions */}
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 shadow-2xs">
                          {renderFileIcon(file)}
                        </div>

                        {/* Extension pill */}
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {file.fileExtension || 'FILE'}
                        </span>
                      </div>

                      {/* File Name */}
                      {isEditing ? (
                        <input
                          type="text"
                          value={fileNameInput}
                          onChange={(e) => setFileNameInput(e.target.value)}
                          onBlur={() => handleSaveFileName(file.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveFileName(file.id);
                            if (e.key === 'Escape') setEditingFileId(null);
                          }}
                          autoFocus
                          className="w-full text-xs font-semibold px-1.5 py-0.5 rounded border border-indigo-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-hidden"
                        />
                      ) : (
                        <h4
                          className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:underline"
                          title={file.fileName}
                          onDoubleClick={() => {
                            setEditingFileId(file.id);
                            setFileNameInput(file.fileName);
                          }}
                        >
                          {file.fileName}
                        </h4>
                      )}

                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                      <button
                        type="button"
                        onClick={() => handleOpenFile(file)}
                        className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-400 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title={isMarkdownFile(file) ? 'Open in Markdown editor' : 'Open / Preview file'}
                      >
                        {isMarkdownFile(file) ? (
                          <>
                            <BookOpen className="w-3 h-3" />
                            <span>Edit</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-3 h-3" />
                            <span>Open</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-0.5">
                        {/* Extract to Canvas */}
                        <button
                          type="button"
                          onClick={() => onExtractFile(folder.id, file)}
                          className="p-1 rounded text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          title="Extract out onto canvas"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Download */}
                        <button
                          type="button"
                          onClick={() => handleDownloadSingleFile(file)}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          title="Download file to computer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDeleteFile(folder.id, file.id)}
                          className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Remove file from folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
              {filteredFiles.map((file) => {
                const isEditing = editingFileId === file.id;

                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between py-2.5 px-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                        {renderFileIcon(file)}
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={fileNameInput}
                            onChange={(e) => setFileNameInput(e.target.value)}
                            onBlur={() => handleSaveFileName(file.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveFileName(file.id);
                              if (e.key === 'Escape') setEditingFileId(null);
                            }}
                            autoFocus
                            className="text-xs font-semibold px-1.5 py-0.5 rounded border border-indigo-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-hidden w-full max-w-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:underline"
                              onDoubleClick={() => {
                                setEditingFileId(file.id);
                                setFileNameInput(file.fileName);
                              }}
                              title={file.fileName}
                            >
                              {file.fileName}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500">
                              {file.fileExtension || 'FILE'}
                            </span>
                          </div>
                        )}
                        <span className="text-[10px] text-neutral-400">
                          {formatFileSize(file.fileSize)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() => handleOpenFile(file)}
                        className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-400 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer mr-1"
                        title={isMarkdownFile(file) ? 'Open in Markdown editor' : 'Open / Preview file'}
                      >
                        {isMarkdownFile(file) ? 'Edit .md' : 'Open'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onExtractFile(folder.id, file)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Extract file to canvas"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingleFile(file)}
                        className="px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Download file to computer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteFile(folder.id, file.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-50/50 dark:bg-neutral-900/60 border-t border-neutral-200/80 dark:border-neutral-800/80 text-[11px] text-neutral-400">
          <span>
            Drop files anywhere inside to upload • Click <ArrowUpRight className="w-3 h-3 inline text-amber-500" /> to move a file onto canvas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
