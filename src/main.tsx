import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/lib/chartSetup'

// Aplica el modo oscuro guardado antes del primer render
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark')
}

// ─── Limpieza única del IndexedDB de Firestore ────────────────────────────────
// Borra cualquier IDB antiguo de Firebase (de versiones previas con configs
// rotas o con un tabManager de persistencia) antes de que el SDK se inicialice.
// Clave v9 = boot sin persistencia local (getFirestore simple). Los
// tabManagers anteriores (single-tab, multiple-tab) dejaban IDB con
// coordinación entre pestañas que causaba escrituras lentas/inconsistentes.
const IDB_CLEAN_KEY = 'fs_idb_clean_v9'

async function limpiarFirestoreIdb(): Promise<void> {
  if (localStorage.getItem(IDB_CLEAN_KEY)) return
  try {
    if ('databases' in indexedDB) {
      type IdbEntry = { name?: string }
      const dbs: IdbEntry[] = await (indexedDB as unknown as {
        databases(): Promise<IdbEntry[]>
      }).databases()
      await Promise.all(
        dbs
          .filter(({ name }) => name && (name.includes('firestore') || name.includes('firebase')))
          .map(({ name }) =>
            new Promise<void>((res) => {
              const req = indexedDB.deleteDatabase(name!)
              req.onsuccess = req.onerror = req.onblocked = () => res()
            })
          )
      )
    }
  } catch {
    // Si falla la limpieza no bloqueamos el arranque
  } finally {
    localStorage.setItem(IDB_CLEAN_KEY, '1')
  }
}

async function bootstrap() {
  // 1. Limpiar IDB viejo ANTES de que Firebase se inicialice
  await limpiarFirestoreIdb()

  // 2. Importar App dinámicamente para que firebase.ts se evalúe
  //    sobre un IndexedDB limpio
  const { default: App } = await import('@/App')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()
