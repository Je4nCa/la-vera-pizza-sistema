import { initializeApp } from 'firebase/app'
import { getFirestore, enableNetwork, collection, doc } from 'firebase/firestore'
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

// ─── Firestore sin persistencia local ─────────────────────────────────────────
// El sistema abre varias pestañas del mismo origen a propósito (Nueva Venta /
// Órdenes en el POS + Pantalla Cocina en una ventana aparte). onSnapshot ya
// entrega tiempo real a cada pestaña de forma independiente hablando
// directo con el servidor — no hace falta ningún tabManager para eso.
//
// Los tabManagers de persistencia (single o multiple) coordinan un cache
// local en IndexedDB ENTRE pestañas antes de confirmar cada escritura, lo
// cual agrega latencia variable y a veces bloqueos cuando hay varias
// pestañas abiertas a la vez — justo el síntoma de "a veces tarda, a veces
// no cambia" que reportó el negocio. Sin persistencia, cada escritura va
// directo al servidor sin esa coordinación extra.
export const firestore = getFirestore(firebaseApp)

// Asegurar que la red esté activa por si quedó deshabilitada en una sesión previa
enableNetwork(firestore).catch((e) => console.warn('[Firebase] enableNetwork:', e))

export const auth           = getAuth(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID ?? 'la-vera-pizza'

export const hCol = (name: string) =>
  collection(firestore, 'households', HOUSEHOLD_ID, name)

export const hDoc = (colName: string, id: string) =>
  doc(firestore, 'households', HOUSEHOLD_ID, colName, id)
