import React, { useState, useEffect } from 'react';
import { FileCardItem } from '../types';
import {
  getFileBlob,
  openFileWithDesktopApp,
  downloadFile,
  formatFileSize,
} from '../services/fileStorage';
import {
  X,
  Monitor,
  Download,
  Cloud,
  FileText,
  FileSpreadsheet,
  Presentation,
  Archive,
  Video,
  Music,
  Code2,
  Image as ImageIcon,
  File,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Info,
} from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FileCardItem | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLaunchingDesktop, setIsLaunchingDesktop] = useState(false);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);

  const handleDirectDownload = async () => {
    if (!item) return;
    setIsDownloadingFile(true);
    await downloadFile(item);
    setTimeout(() => setIsDownloadingFile(false), 600);
  };

  useEffect(() => {
    let active = true;
    let url: string | null = null;

    if (isOpen && item) {
      if (item.fileDataUrl) {
        setBlobUrl(item.fileDataUrl);
        if (item.fileCategory === 'code' || item.fileMime.includes('text') || item.fileExtension === 'txt' || item.fileExtension === 'csv' || item.fileExtension === 'json' || item.fileExtension === 'md') {
          fetch(item.fileDataUrl)
            .then((r) => r.text())
            .then((txt) => {
              if (active) setTextContent(txt);
            })
            .catch(() => {});
        }
      } else if (item.blobKey) {
        getFileBlob(item.blobKey).then((blob) => {
          if (active && blob) {
            url = URL.createObjectURL(blob);
            setBlobUrl(url);

            if (
              item.fileCategory === 'code' ||
              item.fileMime.includes('text') ||
              item.fileExtension === 'txt' ||
              item.fileExtension === 'csv' ||
              item.fileExtension === 'json' ||
              item.fileExtension === 'md'
            ) {
              blob.text().then((txt) => {
                if (active) setTextContent(txt);
              });
            }
          }
        });
      }
    } else {
      setBlobUrl(null);
      setTextContent(null);
    }

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleDesktopLaunch = async () => {
    setIsLaunchingDesktop(true);
    await openFileWithDesktopApp(item);
    setIsLaunchingDesktop(false);
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const extUpper = (item.fileExtension || 'FILE').toUpperCase();

  return (
    <div
      id="file-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[85vh] max-h-[800px] flex flex-col rounded-2xl shadow-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 uppercase tracking-wider shrink-0">
              {extUpper}
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate max-w-md" title={item.fileName}>
                {item.fileName}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {formatFileSize(item.fileSize)} • {item.fileMime || item.fileCategory}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download copy button - ALWAYS VISIBLE */}
            <button
              type="button"
              onClick={handleDirectDownload}
              disabled={isDownloadingFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-xs cursor-pointer transition-all disabled:opacity-50"
              title="Download copy of file to computer"
            >
              {isDownloadingFile ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download</span>
            </button>

            {/* Cloud Drive Button */}
            {item.driveWebViewLink && (
              <a
                href={item.driveWebViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors"
                title="Open in Google Drive / Google Docs / Office Online"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Google Drive</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          {/* PDF Viewer */}
          {item.fileCategory === 'pdf' && blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white"
              title={item.fileName}
            />
          ) : item.fileCategory === 'video' && blobUrl ? (
            /* Video Player */
            <div className="w-full h-full max-h-[640px] flex items-center justify-center bg-black rounded-xl overflow-hidden">
              <video
                src={blobUrl}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : item.fileCategory === 'audio' && blobUrl ? (
            /* Audio Player */
            <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center mx-auto shadow-inner">
                <Music className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-semibold text-base break-all">{item.fileName}</h4>
                <p className="text-xs text-neutral-400 mt-1">{formatFileSize(item.fileSize)}</p>
              </div>
              <audio src={blobUrl} controls className="w-full mt-4" autoPlay />
            </div>
          ) : item.fileCategory === 'image' && blobUrl ? (
            /* Image Viewer */
            <div className="w-full h-full flex items-center justify-center p-2">
              <img
                src={blobUrl}
                alt={item.fileName}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
              />
            </div>
          ) : (item.fileCategory === 'code' || textContent !== null) ? (
            /* Code / Text Viewer */
            <div className="w-full h-full flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 text-xs">
                <span className="font-mono text-neutral-500">{item.fileName}</span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors text-neutral-600 dark:text-neutral-300 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="flex-1 p-4 font-mono text-xs overflow-auto whitespace-pre leading-relaxed text-neutral-800 dark:text-neutral-200 select-text">
                {textContent || 'Loading content...'}
              </pre>
            </div>
          ) : (
            /* Document (Word, Excel, PowerPoint, ZIP, Binary) Desktop Launch Canvas */
            <div className="w-full max-w-lg p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/60 shadow-inner">
                {item.fileCategory === 'document' ? (
                  <FileText className="w-10 h-10" />
                ) : item.fileCategory === 'spreadsheet' ? (
                  <FileSpreadsheet className="w-10 h-10" />
                ) : item.fileCategory === 'presentation' ? (
                  <Presentation className="w-10 h-10" />
                ) : item.fileCategory === 'archive' ? (
                  <Archive className="w-10 h-10" />
                ) : (
                  <File className="w-10 h-10" />
                )}
              </div>

              <div>
                <h4 className="font-bold text-base break-all">{item.fileName}</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  {formatFileSize(item.fileSize)} • Registered OS file format ({extUpper})
                </p>
              </div>

              {/* Computer Interface Guidance */}
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-left text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300">
                  <Laptop className="w-4 h-4" />
                  <span>Desktop App Integration</span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                  Click below to open this document directly in your computer's registered application (e.g. Microsoft Word, Excel, PowerPoint, or 7-Zip).
                </p>
                <div className="pt-1 text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Info className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>Pro-tip: In Chrome/Edge, enable <i>"Always open files of this type"</i> for instant zero-click launch!</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDesktopLaunch}
                  disabled={isLaunchingDesktop}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <Monitor className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
                  <span>Open with Desktop Application</span>
                </button>

                {item.driveWebViewLink && (
                  <a
                    href={item.driveWebViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors"
                  >
                    <Cloud className="w-4 h-4 text-emerald-600" />
                    <span>Open in Google Drive / Web Office</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
