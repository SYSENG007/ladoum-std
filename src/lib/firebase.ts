import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// ------------------------------------------------------------------
// 🔧 CONFIGURATION
// ------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyCPWe47xDtBobs-WoS7n7usna4xUZ58Dp4",
    authDomain: "ladoum-std.firebaseapp.com",
    projectId: "ladoum-std",
    storageBucket: "ladoum-std.firebasestorage.app",
    messagingSenderId: "496190871744",
    appId: "1:496190871744:web:06474f5ad80ac5ac9c7525",
    measurementId: "G-GLL995T9J8"
};

// 1. Initialize App
const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore
const db = getFirestore(app);

// 3. Enable offline persistence
enableIndexedDbPersistence(db)
    .then(() => {
        console.log('[Firebase] Offline persistence enabled');
    })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.warn('[Firebase] Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            // The current browser doesn't support persistence
            console.warn('[Firebase] Persistence not supported by browser');
        } else {
            console.error('[Firebase] Persistence error:', err);
        }
    });

export { db };
export const auth = getAuth(app);
export const storage = getStorage(app);
