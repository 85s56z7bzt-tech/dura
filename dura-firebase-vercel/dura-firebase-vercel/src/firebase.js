import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

export const app = firebaseEnabled ? initializeApp(firebaseConfig) : null;
export const auth = firebaseEnabled ? getAuth(app) : null;
export const db = firebaseEnabled ? getFirestore(app) : null;

const LOCAL_USER_KEY = 'dura-local-user';
const LOCAL_DB_KEY = 'dura-local-db';

function getLocalDb() {
  const raw = localStorage.getItem(LOCAL_DB_KEY);
  if (!raw) {
    const initial = {
      patients: [],
      duraRecords: [],
      serviceRecords: [],
      nursingSummaries: [],
      medicationDispatches: []
    };
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw);
}

function setLocalDb(next) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(next));
}

export function subscribeAuth(callback) {
  if (firebaseEnabled) {
    return onAuthStateChanged(auth, callback);
  }
  const emit = () => callback(JSON.parse(localStorage.getItem(LOCAL_USER_KEY) || 'null'));
  emit();
  window.addEventListener('dura-auth-changed', emit);
  return () => window.removeEventListener('dura-auth-changed', emit);
}

export async function login(email, password) {
  if (firebaseEnabled) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }
  const user = { uid: 'local-demo-user', email, displayName: '示範護理師' };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('dura-auth-changed'));
  return user;
}

export async function register(email, password, displayName = '護理師') {
  if (firebaseEnabled) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return cred.user;
  }
  const user = { uid: 'local-demo-user', email, displayName };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('dura-auth-changed'));
  return user;
}

export async function logout() {
  if (firebaseEnabled) return signOut(auth);
  localStorage.removeItem(LOCAL_USER_KEY);
  window.dispatchEvent(new Event('dura-auth-changed'));
}

export async function listCollection(name) {
  if (firebaseEnabled) {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
  }
  return getLocalDb()[name] || [];
}

export async function saveDocument(name, payload, fixedId) {
  if (firebaseEnabled) {
    if (fixedId) {
      await setDoc(doc(db, name, fixedId), {
        ...payload,
        updatedAt: serverTimestamp(),
        updatedAtMs: Date.now()
      }, { merge: true });
      return fixedId;
    }
    const ref = await addDoc(collection(db, name), {
      ...payload,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    });
    return ref.id;
  }
  const data = getLocalDb();
  const next = { ...data };
  const id = fixedId || `${name}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const current = next[name] || [];
  const index = current.findIndex((item) => item.id === id);
  const docData = fixedId
    ? { ...payload, id, updatedAtMs: Date.now() }
    : { ...payload, id, createdAtMs: Date.now() };
  if (index >= 0) {
    current[index] = { ...current[index], ...docData };
  } else {
    current.push(docData);
  }
  next[name] = current;
  setLocalDb(next);
  return id;
}

export function getBackendName() {
  return firebaseEnabled ? 'Firebase Firestore / Auth' : '本機示範模式 localStorage';
}
