/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { UserProfile, AppSettings, DailyLog } from "../types";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Firestore with custom database ID if provided
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== ""
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

export interface UserDocData {
  uid: string;
  user: UserProfile;
  settings: AppSettings;
  logs: DailyLog[];
  city?: string;
  updatedAt: string;
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * Register with Email and Password
 */
export async function signUpWithEmail(name: string, email: string, pass: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName: name });
  }
  return userCredential.user;
}

/**
 * Sign Out
 */
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Get user document from Firestore (doc ID = auth UID)
 */
export async function getUserDocument(uid: string): Promise<UserDocData | null> {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserDocData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user document from Firestore:", error);
    return null;
  }
}

/**
 * Save / Update entire user document in Firestore immediately (doc ID = auth UID)
 */
export async function saveUserDocument(
  uid: string,
  userProfile: UserProfile,
  settings: AppSettings,
  logs: DailyLog[],
  city: string = "Sialkot"
): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    const payload: UserDocData = {
      uid,
      user: userProfile,
      settings,
      logs,
      city,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    console.error("Error saving user document to Firestore:", error);
  }
}

/**
 * Save user city directly to Firestore document under users/{uid} in field `city`
 */
export async function saveUserCity(uid: string, city: string): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { city, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Error saving city to Firestore:", error);
  }
}

/**
 * Subscribe to user document changes in Firestore for real-time syncing
 */
export function subscribeToUserDocument(
  uid: string,
  onData: (data: UserDocData) => void
) {
  const userRef = doc(db, "users", uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as UserDocData);
      }
    },
    (err) => {
      console.error("Realtime subscription error:", err);
    }
  );
}

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface ChatMessageData {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

/**
 * Get user chat history from Firestore at users/{uid}/assistant/chatHistory
 */
export async function getUserChatHistory(uid: string): Promise<ChatMessageData[] | null> {
  if (!uid) return null;
  const path = `users/${uid}/assistant/chatHistory`;
  try {
    const chatRef = doc(db, "users", uid, "assistant", "chatHistory");
    const snap = await getDoc(chatRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.messages)) {
        return data.messages as ChatMessageData[];
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Save user chat history to Firestore at users/{uid}/assistant/chatHistory
 */
export async function saveUserChatHistory(uid: string, messages: ChatMessageData[]): Promise<void> {
  if (!uid) return;
  const path = `users/${uid}/assistant/chatHistory`;
  try {
    const chatRef = doc(db, "users", uid, "assistant", "chatHistory");
    await setDoc(
      chatRef,
      {
        uid,
        messages,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to user chat history in Firestore for real-time loading
 */
export function subscribeToUserChatHistory(
  uid: string,
  onData: (messages: ChatMessageData[]) => void
) {
  if (!uid) return () => {};
  const path = `users/${uid}/assistant/chatHistory`;
  const chatRef = doc(db, "users", uid, "assistant", "chatHistory");
  return onSnapshot(
    chatRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.messages)) {
          onData(data.messages as ChatMessageData[]);
        } else {
          onData([]);
        }
      } else {
        onData([]);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

export { onAuthStateChanged };
