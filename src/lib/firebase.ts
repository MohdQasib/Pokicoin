import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let db: any = null;
let auth: any = null;
let useFirebase = false;

if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "") {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    useFirebase = true;
    console.log("Firebase initialized successfully for Poki Koin Hub!");
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
} else {
  console.log("Using Mock/Local Database mode. Configure firebase-applet-config.json to sync with Firestore cloud backend.");
}

export { db, auth, useFirebase };

// Standard Firestore operation error handler defined in the Firebase Integration Skill
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || 'guest_user',
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || true,
    },
    operationType,
    path
  };
  console.error('Firestore Error Occurred: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
