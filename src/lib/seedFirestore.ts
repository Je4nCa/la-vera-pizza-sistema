import { getDocs } from 'firebase/firestore'
import { hCol } from './firebase'
import { productosRepository, mesasRepository, configRepository, cajerosRepository } from '@/repositories'
import type { Producto, Mesa, ConfigNegocio, Cajero } from '@/types'

const P = { p: 3000, m: 4500, g: 9000, xl: 12000 }
const NOW = new Date().toISOString()

const PRODUCTOS_INICIALES: Producto[] = [
  // ── PIZZAS ──
  { id: 'piz1', nombre: 'Peperoni',          sku: 'PIZ-001', codigo: '7441001', precio: 3000, iva: 1, categoria: 'Pizzas', icono: '🍕', descripcion: 'Clásica, intensa y llena de sabor. (Salsa de tomate, mozzarella, pepperoni)', estado: 'activo', precios: { ...P }, stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'piz2', nombre: 'Jamón',             sku: 'PIZ-002', codigo: '7441002', precio: 3000, iva: 1, categoria: 'Pizzas', icono: '🍕', descripcion: 'Simple, tradicional y siempre deliciosa. (Salsa de tomate, mozzarella, jamón)', estado: 'activo', precios: { ...P }, stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'piz3', nombre: 'Margarita',         sku: 'PIZ-003', codigo: '7441003', precio: 3000, iva: 1, categoria: 'Pizzas', icono: '🍕', descripcion: 'La esencia de lo auténtico. (Salsa de tomate, mozzarella, albahaca fresca)', estado: 'activo', precios: { ...P }, stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'piz4', nombre: 'Hawaiana',          sku: 'PIZ-004', codigo: '7441004', precio: 3000, iva: 1, categoria: 'Pizzas', icono: '🍕', descripcion: 'Dulce, salada y tropical. (Salsa de tomate, mozzarella, jamón, piña)', estado: 'activo', precios: { ...P }, stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'piz5', nombre: 'Tocineta y Hongos', sku: 'PIZ-005', codigo: '7441005', precio: 3000, iva: 1, categoria: 'Pizzas', icono: '🍕', descripcion: 'Ahumada, jugosa y llena de carácter. (Salsa de tomate, mozzarella, tocineta, hongos)', estado: 'activo', precios: { ...P }, stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'piz6', nombre: 'Vegetariana',       sku: 'PIZ-006', codigo: '7441006', precio: 3000, iva: 1, categoria: 'Pizzas', icono: '🍕', descripcion: 'Fresca, colorida y saludable. (Salsa de tomate, mozzarella, pimientos, cebolla, hongos, aceitunas)', estado: 'activo', precios: { ...P }, stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'piz7', nombre: 'Pollo',             sku: 'PIZ-007', codigo: '7441007', precio: 3000, iva: 1, categoria: 'Pizzas', icono: '🍕', descripcion: 'Suave, jugosa y muy sabrosa. (Salsa de tomate, mozzarella, pollo, cebolla)', estado: 'activo', precios: { ...P }, stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'piz8', nombre: 'Carne Mechada',     sku: 'PIZ-008', codigo: '7441008', precio: 3000, iva: 1, categoria: 'Pizzas', icono: '🍕', descripcion: 'Nuestra versión local, para chuparse los dedos. (Salsa de tomate, mozzarella, carne mechada, cebolla)', estado: 'activo', precios: { ...P }, stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  // ── EXTRAS ──
  { id: 'ext1', nombre: 'Calzone',                           sku: 'EXT-001', codigo: '7442001', precio: 3000, iva: 1, categoria: 'Extras', icono: '🥙', descripcion: '', estado: 'activo', stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'ext2', nombre: 'Flauta de Pollo',                   sku: 'EXT-002', codigo: '7442002', precio: 2500, iva: 1, categoria: 'Extras', icono: '🌯', descripcion: '', estado: 'activo', stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'ext3', nombre: 'Flauta de Chorizo',                 sku: 'EXT-003', codigo: '7442003', precio: 2500, iva: 1, categoria: 'Extras', icono: '🌯', descripcion: '', estado: 'activo', stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'ext4', nombre: 'Pan de Mantequilla de Ajo y Queso', sku: 'EXT-004', codigo: '7442004', precio: 2500, iva: 1, categoria: 'Extras', icono: '🥖', descripcion: '', estado: 'activo', stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'ext5', nombre: 'Focaccia de Salmón',                sku: 'EXT-005', codigo: '7442005', precio: 5000, iva: 1, categoria: 'Extras', icono: '🍞', descripcion: '', estado: 'activo', stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'ext6', nombre: 'Focaccia de Frutos Rojos',          sku: 'EXT-006', codigo: '7442006', precio: 5000, iva: 1, categoria: 'Extras', icono: '🍞', descripcion: '', estado: 'activo', stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
  { id: 'ext7', nombre: 'Focaccia Cinnamon',                 sku: 'EXT-007', codigo: '7442007', precio: 5000, iva: 1, categoria: 'Extras', icono: '🍞', descripcion: '', estado: 'activo', stock: '', stockMin: '', creadoEn: NOW, actualizadoEn: NOW },
]

const CONFIG_INICIAL: ConfigNegocio = {
  id: 'config',
  nombre: 'La Vera Pizza',
  cedula: '3-101-XXXXXX',
  direccion: 'Heredia, Costa Rica',
  telefono: '2XXX-XXXX',
  email: 'info@laverapizza.com',
  mensaje: '¡Gracias por su visita! Masa Madre, Sabor que se Siente.',
  iva: 13,
  moneda: 'CRC',
  numInicial: 1,
  prefijo: 'LVP-',
  actividad: '5610 - Restaurantes',
  tipoCont: 'Persona Jurídica',
  numMesas: 10,
}

export const CAJEROS_DEFAULT: Cajero[] = [
  { id: 'cajero-1', nombre: 'AdminJC', activo: true, creadoEn: NOW },
  { id: 'cajero-2', nombre: 'Jeffry',  activo: true, creadoEn: NOW },
  { id: 'cajero-3', nombre: 'Andrea',  activo: true, creadoEn: NOW },
]

export async function seedCajerosDefault(): Promise<void> {
  await cajerosRepository.crearBulk(CAJEROS_DEFAULT)
}

export async function seedFirestoreIfEmpty(): Promise<void> {
  // Productos
  const prodSnap = await getDocs(hCol('productos'))
  if (prodSnap.empty) {
    await productosRepository.crearBulk(PRODUCTOS_INICIALES)
  }

  // Config
  const cfg = await configRepository.obtenerConfig()
  if (!cfg) {
    await configRepository.guardarConfig(CONFIG_INICIAL)
  }

  // Cajeros
  const cajerosSnap = await getDocs(hCol('cajeros'))
  if (cajerosSnap.empty) {
    await seedCajerosDefault()
  }

  // Mesas (10 por defecto)
  const mesasSnap = await getDocs(hCol('mesas'))
  if (mesasSnap.empty) {
    const mesas: Mesa[] = Array.from({ length: 10 }, (_, i) => ({
      id: `mesa-${i + 1}`,
      num: i + 1,
      ocupada: false,
      orden: null,
      desde: null,
    }))
    await mesasRepository.crearBulk(mesas)
  }
}
