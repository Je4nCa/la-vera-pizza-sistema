/**
 * Generates and removes sample sales so dashboards and reports can be demoed safely.
 */
import { nanoid } from 'nanoid'
import { productosRepository, ventasRepository, ordenesRepository } from '@/repositories'
import { calcularTotales } from '@/store'
import { sinUndefined } from '@/lib/utils'
import { siguienteNumeroOrden, formatearNumOrden } from '@/lib/contadorOrdenes'
import type { Producto, ItemVenta, Venta, Orden, MetodoPago, EstadoOrden } from '@/types'

const METODOS: MetodoPago[] = ['efectivo', 'tarjeta', 'sinpe']
const ESTADOS_ORDEN: EstadoOrden[] = ['recibida', 'preparando', 'horneando', 'listo']
const TAMANOS = [
  { key: 'p' as const,  label: 'Pequeña' },
  { key: 'm' as const,  label: 'Mediana' },
  { key: 'g' as const,  label: 'Grande' },
  { key: 'xl' as const, label: 'Extra Grande' },
]

function elegir<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function itemAleatorio(productos: Producto[]): ItemVenta | null {
  const prod = elegir(productos)
  if (!prod) return null
  if (prod.categoria === 'Pizzas' && prod.precios) {
    const t = elegir(TAMANOS)
    const precio = prod.precios[t.key]
    if (!precio) return null
    return {
      cartId: `${prod.id}_${t.key}`, id: prod.id,
      nombre: `${prod.nombre} (${t.label})`, precio, iva: prod.iva,
      qty: 1 + Math.floor(Math.random() * 2), icono: prod.icono, categoria: prod.categoria,
      tamano: t.label,
    }
  }
  return {
    cartId: prod.id, id: prod.id, nombre: prod.nombre, precio: prod.precio, iva: prod.iva,
    qty: 1 + Math.floor(Math.random() * 2), icono: prod.icono, categoria: prod.categoria,
  }
}

/**
 * Genera `cantidad` ventas de prueba con productos aleatorios del catálogo
 * (y su Orden correspondiente, para poder probar la Pantalla Cocina con
 * volumen). Quedan marcadas con esPrueba: true y NO cuentan en
 * Historial/Dashboard/Reportes.
 */
export async function generarVentasPrueba(cantidad: number): Promise<number> {
  const productos = (await productosRepository.obtenerTodos()).filter((p) => p.estado === 'activo')
  if (productos.length === 0) throw new Error('No hay productos activos en el catálogo')

  let creadas = 0
  for (let i = 0; i < cantidad; i++) {
    const numItems = 1 + Math.floor(Math.random() * 3)
    const items: ItemVenta[] = []
    for (let j = 0; j < numItems; j++) {
      const item = itemAleatorio(productos)
      if (item) items.push(item)
    }
    if (items.length === 0) continue

    const { subtotalNeto, ivaTotal, total } = calcularTotales(items, 0, 'monto')
    const numOrdenDia = await siguienteNumeroOrden()
    const numOrdenTxt = formatearNumOrden(numOrdenDia)
    const numFactura  = Date.now() + i
    const fecha       = new Date().toISOString()

    const venta: Venta = {
      id: nanoid(), numFactura, numOrdenDia,
      codigoFactura: `PRUEBA-${numOrdenTxt}`,
      fecha,
      cliente: `Cliente Prueba ${i + 1}`,
      cedula: '', telefono: '',
      mesa: Math.random() > 0.6 ? 1 + Math.floor(Math.random() * 8) : null,
      items, subtotalNeto, iva: ivaTotal, descuento: 0, total,
      metodoPago: elegir(METODOS),
      estado: 'pagada',
      cajeroId: 'test', cajeroNombre: 'AdminJC',
      creadoEn: fecha,
      esPrueba: true,
    }
    await ventasRepository.crear(sinUndefined(venta) as unknown as Venta)

    const detalleOrden = items.map((it) => `${it.nombre}${it.qty > 1 ? ` x${it.qty}` : ''}`).join(', ')
    const orden: Orden = {
      id: nanoid(), num: numOrdenTxt, ventaId: venta.id,
      cliente: venta.cliente, detalle: detalleOrden, mesa: venta.mesa,
      estado: elegir(ESTADOS_ORDEN),
      creadoEn: fecha, actualizadoEn: fecha,
      esPrueba: true,
    }
    await ordenesRepository.crear(sinUndefined(orden) as unknown as Orden)

    creadas++
  }
  return creadas
}

/** Elimina todas las ventas y órdenes marcadas como esPrueba: true */
export async function eliminarVentasPrueba(): Promise<{ ventas: number; ordenes: number }> {
  const [todasVentas, todasOrdenes] = await Promise.all([
    ventasRepository.obtenerTodos(),
    ordenesRepository.obtenerTodos(),
  ])
  const ventasPrueba  = todasVentas.filter((v) => v.esPrueba)
  const ordenesPrueba = todasOrdenes.filter((o) => o.esPrueba)

  await Promise.all([
    ...ventasPrueba.map((v) => ventasRepository.eliminar(v.id)),
    ...ordenesPrueba.map((o) => ordenesRepository.eliminar(o.id)),
  ])

  return { ventas: ventasPrueba.length, ordenes: ordenesPrueba.length }
}

