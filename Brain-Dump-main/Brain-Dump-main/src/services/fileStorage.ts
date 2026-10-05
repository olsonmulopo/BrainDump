import { FileCategory, FileCardItem } from '../types';

const DB_NAME = 'VisualCanvasFilesDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileBlobs';

/**
 * Initializes and returns the IndexedDB database instance for unlimited file blob storage.
 */
function openFilesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores a binary Blob into IndexedDB.
 */
export async function saveFileBlob(blobKey: string, blob: Blob): Promise<void> {
  try {
    const db = await openFilesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, blobKey);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save file blob in IndexedDB:', err);
    throw err;
  }
}

/**
 * Retrieves a stored binary Blob by key from IndexedDB.
 */
export async function getFileBlob(blobKey: string): Promise<Blob | null> {
  try {
    const db = await openFilesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(blobKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get file blob from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes a stored file blob from IndexedDB.
 */
export async function deleteFileBlob(blobKey: string): Promise<void> {
  try {
    const db = await openFilesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(blobKey);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete file blob from IndexedDB:', err);
  }
}

/**
 * Formats byte size into human readable string (e.g. 2.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Determines file category based on filename extension and MIME type.
 */
export function categorizeFile(fileName: string, mimeType = ''): FileCategory {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['doc', 'docx', 'odt', 'rtf', 'pages'].includes(ext) || mimeType.includes('word') || mimeType.includes('document')) {
    return 'document';
  }
  if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext) || mimeType.includes('sheet') || mimeType.includes('excel')) {
    return 'spreadsheet';
  }
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext) || mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'presentation';
  }
  if (ext === 'pdf' || mimeType.includes('pdf')) {
    return 'pdf';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'dmg', 'iso'].includes(ext) || mimeType.includes('zip') || mimeType.includes('archive')) {
    return 'archive';
  }
  if (['mp4', 'mov', 'webm', 'mkv', 'avi', 'flv', 'wmv'].includes(ext) || mimeType.startsWith('video/')) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext) || mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (
    [
      'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'md', 'xml',
      'c', 'cpp', 'cs', 'java', 'go', 'rs', 'php', 'rb', 'swift', 'sh', 'sql', 'yaml', 'yml'
    ].includes(ext)
  ) {
    return 'code';
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'psd', 'ai'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }

  return 'generic';
}

/**
 * Checks if a file item is a Markdown document (.md, .markdown, .mdown, etc.)
 */
export function isMarkdownFile(item: { fileName: string; fileExtension?: string }): boolean {
  const ext = (item.fileExtension || item.fileName.split('.').pop() || '').toLowerCase();
  return ['md', 'markdown', 'mdown', 'mkd', 'mdx'].includes(ext);
}

/**
 * Reads plain text content from a stored file blob in IndexedDB or dataUrl.
 */
export async function readFileText(item: FileCardItem): Promise<string> {
  try {
    let blob: Blob | null = null;
    if (item.blobKey) {
      blob = await getFileBlob(item.blobKey);
    }
    if (!blob && item.fileDataUrl) {
      const res = await fetch(item.fileDataUrl);
      blob = await res.blob();
    }
    if (!blob) return '';
    return await blob.text();
  } catch (err) {
    console.error('Failed to read text from file blob:', err);
    return '';
  }
}

/**
 * Writes updated text back to IndexedDB file blob and returns the new size in bytes.
 */
export async function saveFileText(
  item: FileCardItem,
  newText: string
): Promise<{ newBlobKey: string; size: number }> {
  const blobKey = item.blobKey || `blob-${item.id}`;
  const blob = new Blob([newText], { type: item.fileMime || 'text/markdown;charset=utf-8' });
  await saveFileBlob(blobKey, blob);
  return {
    newBlobKey: blobKey,
    size: blob.size,
  };
}

import JSZip from 'jszip';

/**
 * Resolves a Blob for any FileCardItem from IndexedDB, dataUrl, or markdown text.
 */
export async function resolveFileBlob(item: FileCardItem): Promise<Blob | null> {
  try {
    // 1. Check specified blobKey
    if (item.blobKey) {
      const blob = await getFileBlob(item.blobKey);
      if (blob) return item.fileMime ? blob.slice(0, blob.size, item.fileMime) : blob;
    }

    // 2. Check fallback ID-based blobKey
    if (item.id) {
      const fallbackBlob = await getFileBlob(`blob-${item.id}`);
      if (fallbackBlob) {
        return item.fileMime ? fallbackBlob.slice(0, fallbackBlob.size, item.fileMime) : fallbackBlob;
      }
    }

    // 3. Check fileDataUrl
    if (item.fileDataUrl) {
      if (item.fileDataUrl.startsWith('data:')) {
        const parts = item.fileDataUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : item.fileMime || 'application/octet-stream';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      } else {
        const res = await fetch(item.fileDataUrl);
        const blob = await res.blob();
        return item.fileMime ? blob.slice(0, blob.size, item.fileMime) : blob;
      }
    }

    return null;
  } catch (err) {
    console.error('Error resolving file blob:', err);
    return null;
  }
}

/**
 * Downloads a binary Blob directly to the user's computer.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 45000);
}

/**
 * Downloads a FileCardItem directly to the user's computer.
 */
export async function downloadFile(item: FileCardItem): Promise<boolean> {
  try {
    const blob = await resolveFileBlob(item);
    if (blob) {
      downloadBlob(blob, item.fileName);
      return true;
    }

    // Fallback: If we have an inline dataUrl, download directly
    if (item.fileDataUrl && item.fileDataUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = item.fileDataUrl;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    // Fallback: If Google Drive link exists, open it
    if (item.driveWebViewLink) {
      window.open(item.driveWebViewLink, '_blank', 'noopener,noreferrer');
      return true;
    }

    console.warn('No blob or data found to download for item:', item.fileName);
    return false;
  } catch (err) {
    console.error('Failed to download file:', err);
    return false;
  }
}

/**
 * Opens or downloads the file on the user's computer.
 */
export async function openFileWithDesktopApp(item: FileCardItem): Promise<boolean> {
  return downloadFile(item);
}

/**
 * Packages multiple files into a single .zip archive and triggers download.
 */
export async function downloadAllFilesAsZip(
  files: FileCardItem[],
  zipFileName = 'Files.zip'
): Promise<boolean> {
  if (!files || files.length === 0) return false;

  try {
    const zip = new JSZip();
    let hasAddedFiles = false;

    for (const file of files) {
      const blob = await resolveFileBlob(file);
      if (blob) {
        zip.file(file.fileName, blob);
        hasAddedFiles = true;
      } else if (file.fileDataUrl && file.fileDataUrl.startsWith('data:')) {
        const base64Data = file.fileDataUrl.split(',')[1];
        if (base64Data) {
          zip.file(file.fileName, base64Data, { base64: true });
          hasAddedFiles = true;
        }
      }
    }

    if (!hasAddedFiles) {
      // If none could be resolved as blobs, download them individually
      for (const file of files) {
        await downloadFile(file);
      }
      return true;
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const finalName = zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`;
    downloadBlob(zipBlob, finalName);
    return true;
  } catch (err) {
    console.error('Failed to create and download zip:', err);
    // Fallback to sequential download
    for (const file of files) {
      await downloadFile(file);
    }
    return false;
  }
}

/**
 * Downloads an image from its data URL or remote URL.
 */
export async function downloadImageUrl(url: string, fileName = 'image.png'): Promise<boolean> {
  try {
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    const res = await fetch(url);
    const blob = await res.blob();
    downloadBlob(blob, fileName);
    return true;
  } catch (err) {
    console.error('Failed to download image URL:', err);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }
}
