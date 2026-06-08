import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/lib/chartSetup'

// Aplica el modo oscuro guardado antes del primer render
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark')
}

// ─── Limpia IndexedDB de Firebase si quedó de una build con persistencia ───────
// Esto se ejecuta UNA vez por usuario (gateado con localStorage).
// Si no lo limpiamos, el SDK de Firestore ve el IDB antiguo y cada setDoc
// queda colgado esperando sincronizar con ese cache — nunca resuelve la promesa.
const IDB_CLEAN_KEY = 'fs_idb_clean_v5'

async function limpiarFirestoreIdb(): Promise<void> {
  if (localStorage.getItem(IDB_CLEAN_KEY)) return
  try {
    if ('databases' in indexedDB) {
      const dbs = await (indexedDB as IDBFactory & { databases(): Promise<{ name?: string }[]> }).databases()
      for (const { name } of dbs) {
        if (name && (name.includes('firestore') || name.includes('firebase'))) {
          await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(name)
            req.onsuccess  = () => resolve()
            req.onerror    = () => resolve()
            req.onblocked  = () => resolve()
          })
        }
      }
    }
  } catch {
    // Si falla la limpieza, seguimos igual — mejor no bloquear el arranque
  } finally {
    localStorage.setItem(IDB_CLEAN_KEY, '1')
  }
}

async function bootstrap() {
  await limpiarFirestoreIdb()

  // Importamos App DESPUÉS de la limpieza para que Firebase se inicialice
  // sobre un IndexedDB limpio
  const { default: App } = await import('@/App')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()
