import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Toast {
  id:      string
  mensaje: string
  tipo:    'ok' | 'error' | 'warning'
}

interface UIStore {
  sidebarOpen: boolean
  toasts:      Toast[]
  setSidebarOpen: (v: boolean) => void
  toggleSidebar:  () => void
  showToast:      (mensaje: string, tipo?: Toast['tipo']) => void
  removeToast:    (id: string) => void
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      sidebarOpen: false,
      toasts:      [],

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }, false, 'setSidebarOpen'),
      toggleSidebar:  ()            => set((s) => ({ sidebarOpen: !s.sidebarOpen }), false, 'toggleSidebar'),

      showToast: (mensaje, tipo = 'ok') =>
        set((s) => {
          const id = Date.now().toString()
          setTimeout(() => s.removeToast(id), 3500)
          return { toasts: [...s.toasts, { id, mensaje, tipo }] }
        }, false, 'showToast'),

      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }), false, 'removeToast'),
    }),
    { name: 'ui' }
  )
)
