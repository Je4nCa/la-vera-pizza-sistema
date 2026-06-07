import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ItemVenta, MetodoPago } from '@/types'

interface CarritoStore {
  items:        ItemVenta[]
  metodoPago:   MetodoPago
  descValor:    number
  descTipo:     'monto' | 'porcent'
  clienteNombre: string
  clienteCedula: string
  clienteTelefono: string
  mesaActiva:   number | null
  splitNum:     number
  splitVisible: boolean

  // Computed helpers (calculados en componentes, no en store)
  agregarItem:       (item: ItemVenta) => void
  incrementarItem:   (cartId: string) => void
  decrementarItem:   (cartId: string) => void
  eliminarItem:      (cartId: string) => void
  actualizarNota:    (cartId: string, nota: string) => void
  limpiarCarrito:    () => void
  setMetodoPago:     (m: MetodoPago) => void
  setDescuento:      (val: number, tipo: 'monto' | 'porcent') => void
  setCliente:        (nombre: string, cedula: string, telefono: string) => void
  setMesaActiva:     (num: number | null) => void
  setSplitNum:       (n: number) => void
  setSplitVisible:   (v: boolean) => void
}

export const useCarritoStore = create<CarritoStore>()(
  devtools(
    (set) => ({
      items:           [],
      metodoPago:      'efectivo',
      descValor:       0,
      descTipo:        'monto',
      clienteNombre:   '',
      clienteCedula:   '',
      clienteTelefono: '',
      mesaActiva:      null,
      splitNum:        2,
      splitVisible:    false,

      agregarItem: (item) =>
        set((s) => {
          const ex = s.items.find((i) => i.cartId === item.cartId)
          if (ex) return { items: s.items.map((i) => i.cartId === item.cartId ? { ...i, qty: i.qty + 1 } : i) }
          return { items: [...s.items, item] }
        }, false, 'agregarItem'),

      incrementarItem: (cartId) =>
        set((s) => ({ items: s.items.map((i) => i.cartId === cartId ? { ...i, qty: i.qty + 1 } : i) }), false, 'incrementarItem'),

      decrementarItem: (cartId) =>
        set((s) => {
          const item = s.items.find((i) => i.cartId === cartId)
          if (!item) return s
          if (item.qty <= 1) return { items: s.items.filter((i) => i.cartId !== cartId) }
          return { items: s.items.map((i) => i.cartId === cartId ? { ...i, qty: i.qty - 1 } : i) }
        }, false, 'decrementarItem'),

      eliminarItem: (cartId) =>
        set((s) => ({ items: s.items.filter((i) => i.cartId !== cartId) }), false, 'eliminarItem'),

      actualizarNota: (cartId, nota) =>
        set((s) => ({ items: s.items.map((i) => i.cartId === cartId ? { ...i, nota } : i) }), false, 'actualizarNota'),

      limpiarCarrito: () =>
        set({
          items: [], descValor: 0, descTipo: 'monto',
          clienteNombre: '', clienteCedula: '', clienteTelefono: '',
          metodoPago: 'efectivo', mesaActiva: null,
          splitNum: 2, splitVisible: false,
        }, false, 'limpiarCarrito'),

      setMetodoPago:   (metodoPago)       => set({ metodoPago }, false, 'setMetodoPago'),
      setDescuento:    (descValor, descTipo) => set({ descValor, descTipo }, false, 'setDescuento'),
      setCliente:      (n, c, t)          => set({ clienteNombre: n, clienteCedula: c, clienteTelefono: t }, false, 'setCliente'),
      setMesaActiva:   (mesaActiva)       => set({ mesaActiva }, false, 'setMesaActiva'),
      setSplitNum:     (splitNum)         => set({ splitNum }, false, 'setSplitNum'),
      setSplitVisible: (splitVisible)     => set({ splitVisible }, false, 'setSplitVisible'),
    }),
    { name: 'carrito' }
  )
)

// ─── Selector de totales ──────────────────────────────────────────────────────
export function calcularTotales(items: ItemVenta[], descValor: number, descTipo: 'monto' | 'porcent') {
  let subtotalNeto = 0
  let ivaTotal = 0
  items.forEach((item) => {
    const total = item.precio * item.qty
    if (item.iva === 1) {
      const neto = total / 1.13
      subtotalNeto += neto
      ivaTotal += total - neto
    } else if (item.iva > 0) {
      const neto = total / (1 + item.iva)
      subtotalNeto += neto
      ivaTotal += total - neto
    } else {
      subtotalNeto += total
    }
  })
  const base = subtotalNeto + ivaTotal
  const descuento = descTipo === 'porcent' ? base * (descValor / 100) : descValor
  const total = Math.max(0, base - descuento)
  return { subtotalNeto, ivaTotal, descuento, total }
}
