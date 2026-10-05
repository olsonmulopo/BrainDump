import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { WorkspaceData } from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Critical: pass the provisioned firestoreDatabaseId
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Test Connection on application boot as required by Firebase integration skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Operating in local-first offline mode.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Save user profile to Firestore
 */
export async function saveUserProfile(user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }) {
  if (!user.uid || !user.email) return;
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save full workspace to Firestore for authenticated user
 */
export async function saveWorkspaceToFirestore(userId: string, workspace: WorkspaceData): Promise<void> {
  const workspaceId = `ws-${userId}`;
  const path = `workspaces/${workspaceId}`;
  try {
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    
    // Sanitize any undefined values before sending to Firestore
    const cleanWorkspace = JSON.parse(JSON.stringify(workspace));

    await setDoc(workspaceRef, {
      id: workspaceId,
      ownerId: userId,
      title: 'Brain Dump Workspace',
      version: cleanWorkspace.version || 2,
      currentBoardId: cleanWorkspace.currentBoardId || 'board-home',
      boards: cleanWorkspace.boards || {},
      items: cleanWorkspace.items || {},
      tabs: cleanWorkspace.tabs || [],
      settings: cleanWorkspace.settings || {},
      timeLogs: cleanWorkspace.timeLogs || [],
      trash: cleanWorkspace.trash || { items: {}, boards: {} },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load workspace from Firestore
 */
export async function loadWorkspaceFromFirestore(userId: string): Promise<WorkspaceData | null> {
  const workspaceId = `ws-${userId}`;
  const path = `workspaces/${workspaceId}`;
  try {
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const snap = await getDoc(workspaceRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      version: data.version || 2,
      currentBoardId: data.currentBoardId || 'board-home',
      boards: data.boards || {},
      items: data.items || {},
      tabs: data.tabs || [],
      settings: data.settings || {},
      timeLogs: data.timeLogs || [],
      trash: data.trash || { items: {}, boards: {} },
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Subscribe to realtime workspace changes on Firestore
 */
export function subscribeToWorkspace(
  userId: string,
  onUpdate: (workspace: WorkspaceData) => void,
  onError?: (error: any) => void
): () => void {
  const workspaceId = `ws-${userId}`;
  const path = `workspaces/${workspaceId}`;
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  
  return onSnapshot(
    workspaceRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const ws: WorkspaceData = {
          version: data.version || 2,
          currentBoardId: data.currentBoardId || 'board-home',
          boards: data.boards || {},
          items: data.items || {},
          tabs: data.tabs || [],
          settings: data.settings || {},
          timeLogs: data.timeLogs || [],
          trash: data.trash || { items: {}, boards: {} },
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        };
        onUpdate(ws);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
