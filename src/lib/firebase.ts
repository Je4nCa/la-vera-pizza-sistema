import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  enableNetwork,
  collection,
  doc,
  type Firestore,
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

// ─── Firestore con persistencia multi-pestaña ─────────────────────────────────
// El sistema abre varias pestañas del mismo origen a la vez a propósito
// (Nueva Venta / Órdenes en el POS + Pantalla Cocina en una ventana aparte),
// y todas necesitan recibir actualizaciones en tiempo real simultáneamente.
// persistentSingleTabManager NO sirve para esto: solo la pestaña "dueña" del
// IndexedDB recibe datos en vivo, y forceOwnership hace que cada pestaña
// nueva le quite la propiedad a la anterior, dejándola congelada.
// persistentMultipleTabManager sincroniza el cache entre todas las pestañas
// abiertas del mismo navegador.
function crearFirestore(): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    // Dev hot-reload: Firestore ya fue inicializado en este proceso
    console.warn('[Firebase] Firestore ya inicializado — usando instancia existente')
    return getFirestore(firebaseApp)
  }
}

export const firestore = crearFirestore()

// Asegurar que la red esté activa por si quedó deshabilitada en una sesión previa
enableNetwork(firestore).catch((e) => console.warn('[Firebase] enableNetwork:', e))

export const auth           = getAuth(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID ?? 'la-vera-pizza'

export const hCol = (name: string) =>
  collection(firestore, 'households', HOUSEHOLD_ID, name)

export const hDoc = (colName: string, id: string) =>
  doc(firestore, 'households', HOUSEHOLD_ID, colName, id)
