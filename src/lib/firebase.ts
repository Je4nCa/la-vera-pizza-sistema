import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
} from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)

// Persistencia local: writes van al IndexedDB primero → se ven instantáneos
export const firestore = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

export const auth           = getAuth(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID ?? 'la-vera-pizza'

export const hCol = (name: string) =>
  collection(firestore, 'households', HOUSEHOLD_ID, name)

export const hDoc = (colName: string, id: string) =>
  doc(firestore, 'households', HOUSEHOLD_ID, colName, id)
