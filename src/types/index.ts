export type ID = string

// ─── Producto ────────────────────────────────────────────────────────────────
export type CategoriaProducto = 'Pizzas' | 'Extras'
export type EstadoProducto    = 'activo' | 'inactivo'

export interface PreciosPizza {
  p:  number  // Pequeña
  m:  number  // Mediana
  g:  number  // Grande
  xl: number  // Extra Grande
}

export interface Producto {
  id:          ID
  nombre:      string
  categoria:   CategoriaProducto
  descripcion: string
  icono:       string
  codigo:      string
  sku:         string
  precio:      number          // precio base (menor tamaño o precio único)
  iva:         number          // 1 = 13%, 0 = exento
  precios?:    PreciosPizza    // solo para Pizzas
  stock:       number | ''     // '' = sin control de stock
  stockMin:    number | ''
  estado:      EstadoProducto
  creadoEn:    string
  actualizadoEn: string
}

// ─── Ítem del carrito / venta ────────────────────────────────────────────────
export interface ItemVenta {
  cartId:    string           // id único en el carrito (prodId o prodId_tamaño)
  id:        ID               // productId
  nombre:    string
  precio:    number
  iva:       number
  qty:       number
  icono:     string
  categoria: string
  tamano?:   string           // 'Pequeña' | 'Mediana' | 'Grande' | 'Extra Grande'
  nota?:     string
}

// ─── Venta ───────────────────────────────────────────────────────────────────
export type MetodoPago   = 'efectivo' | 'tarjeta' | 'sinpe'
export type EstadoVenta  = 'pagada' | 'anulada'

export interface Venta {
  id:            ID
  numFactura:    number
  codigoFactura: string
  fecha:         string       // ISO
  cliente:       string
  cedula:        string
  telefono:      string
  mesa:          number | null
  items:         ItemVenta[]
  subtotalNeto:  number
  iva:           number
  descuento:     number
  total:         number
  metodoPago:    MetodoPago
  estado:        EstadoVenta
  creadoEn:      string
}

// ─── Cliente ─────────────────────────────────────────────────────────────────
export type TipoCedula = 'fisica' | 'juridica' | 'dimex' | 'nite'

export interface Cliente {
  id:          ID
  nombre:      string
  cedula:      string
  tipo:        TipoCedula
  telefono:    string
  email:       string
  direccion:   string
  provincia:   string
  notas:       string
  creadoEn:    string
  actualizadoEn: string
}

// ─── Mesa ────────────────────────────────────────────────────────────────────
export interface Mesa {
  id:      ID       // 'mesa-1', 'mesa-2', etc.
  num:     number
  ocupada: boolean
  orden:   string | null
  desde:   string | null  // ISO cuando se ocupó
}

// ─── Config del negocio ──────────────────────────────────────────────────────
export interface ConfigNegocio {
  id:          ID           // siempre 'config'
  nombre:      string
  cedula:      string
  direccion:   string
  telefono:    string
  email:       string
  mensaje:     string
  iva:         number
  moneda:      'CRC' | 'USD'
  numInicial:  number
  prefijo:     string
  actividad:   string
  tipoCont:    string
  numMesas:    number
}
