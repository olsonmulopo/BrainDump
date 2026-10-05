import { WorkspaceData, GoogleDriveFileInfo } from '../types';

const FOLDER_NAME = 'VisualBoard Workspace';
const WORKSPACE_FILE_NAME = 'visual-boards-workspace.json';

/**
 * Searches for or creates the dedicated VisualBoard Workspace folder in Google Drive.
 */
export async function getOrCreateWorkspaceFolder(token: string): Promise<string> {
  const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to query Google Drive folder: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Finds existing workspace files in the folder.
 */
export async function listWorkspaceFiles(token: string, folderId: string): Promise<GoogleDriveFileInfo[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list Drive files: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Saves or updates workspace data to Google Drive.
 */
export async function saveWorkspaceToDrive(
  token: string,
  folderId: string,
  workspaceData: WorkspaceData,
  existingFileId?: string | null,
  customName?: string
): Promise<{ fileId: string; modifiedTime: string }> {
  const fileName = customName || WORKSPACE_FILE_NAME;
  const jsonContent = JSON.stringify(workspaceData, null, 2);

  // If existing file ID is provided, try updating it directly
  if (existingFileId) {
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    if (updateRes.ok) {
      const updatedData = await updateRes.json();
      return {
        fileId: existingFileId,
        modifiedTime: updatedData.modifiedTime || new Date().toISOString(),
      };
    }
  }

  // Check if file already exists in folder
  const query = encodeURIComponent(`name = '${fileName}' and '${folderId}' in parents and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const targetId = searchData.files[0].id;
      const patchRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${targetId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: jsonContent,
      });

      if (patchRes.ok) {
        const patchData = await patchRes.json();
        return {
          fileId: targetId,
          modifiedTime: patchData.modifiedTime || new Date().toISOString(),
        };
      }
    }
  }

  // Create multipart file in Google Drive
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonContent +
    closeDelimiter;

  const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!createRes.ok) {
    throw new Error(`Failed to upload to Google Drive: ${createRes.statusText}`);
  }

  const createdFile = await createRes.json();
  return {
    fileId: createdFile.id,
    modifiedTime: createdFile.modifiedTime || new Date().toISOString(),
  };
}

/**
 * Downloads workspace JSON from Google Drive.
 */
export async function loadWorkspaceFromDrive(token: string, fileId: string): Promise<WorkspaceData> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to read file from Google Drive: ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.boards || !data.items) {
    throw new Error('Selected Google Drive file is not a valid VisualBoard Workspace format.');
  }

  return data as WorkspaceData;
}

/**
 * Permanently deletes a file from Drive with user safety.
 */
export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete file from Google Drive: ${res.statusText}`);
  }
}

/**
 * Uploads an arbitrary file (Word, Excel, PDF, Zip, Video, etc.) to the Google Drive workspace folder.
 * Returns the Drive file ID and webViewLink.
 */
export async function uploadFileAttachmentToDrive(
  token: string,
  folderId: string,
  file: File | Blob,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink?: string }> {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const boundary = '-------' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const arrayBuffer = await file.arrayBuffer();
  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' });

  const bodyBlob = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadataBlob,
    delimiter,
    `Content-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`,
    arrayBuffer,
    closeDelimiter,
  ]);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: bodyBlob,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload file to Google Drive: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    fileId: data.id,
    webViewLink: data.webViewLink,
  };
}

