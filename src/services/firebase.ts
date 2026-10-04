import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Configuración combinada soportando variables de entorno o configuración predeterminada
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as Record<string, string | undefined>);

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId
};

let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(config) : getApp();
} catch (e) {
  console.warn('[GreenLens Firebase initialization warning]:', e);
  app = getApps().length > 0 ? getApp() : initializeApp(defaultFirebaseConfig);
}

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Base de datos de Firestore
export const db: Firestore = getFirestore(app, config.firestoreDatabaseId || undefined);

// Firebase Storage para fotos de perfil
export const storage: FirebaseStorage = getStorage(app);

export default app;


