import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Cajero } from '@/types'

interface CajeroStore {
  cajeroActivo: Cajero | null
  setCajeroActivo: (cajero: Cajero) => void
  cerrarCajero:    () => void
}

export const useCajeroStore = create<CajeroStore>()(
  devtools(
    (set) => ({
      cajeroActivo: null,
      setCajeroActivo: (cajeroActivo) => set({ cajeroActivo }, false, 'setCajeroActivo'),
      cerrarCajero:    ()             => set({ cajeroActivo: null }, false, 'cerrarCajero'),
    }),
    { name: 'cajero' }
  )
)
