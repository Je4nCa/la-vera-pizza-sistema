import { useState, useEffect, useCallback } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { fmtColones } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useCarritoStore, useUIStore, useCajeroStore, calcularTotales } from '@/store'
import { ventasRepository, mesasRepository } from '@/repositories'
import { sinUndefined } from '@/lib/utils'
import { nanoid } from 'nanoid'
import {
  Trash2, Plus, Minus, StickyNote, CreditCard, Banknote, Smartphone,
  Users, Tag, X, Scissors,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import type { Producto, ItemVenta, MetodoPago, Venta, Mesa, ConfigNegocio } from '@/types'

const TAMANOS = [
  { key: 'p',  label: 'Pequeña',     abbr: 'P' },
  { key: 'm',  label: 'Mediana',     abbr: 'M' },
  { key: 'g',  label: 'Grande',      abbr: 'G' },
  { key: 'xl', label: 'Extra Grande', abbr: 'XL' },
] as const
type TamanoKey = 'p' | 'm' | 'g' | 'xl'

// ─── Modal de tamaño de pizza ─────────────────────────────────────────────────
function ModalTamano({ prod, onSelect, onClose }: {
  prod: Producto
  onSelect: (key: TamanoKey, precio: number, label: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={18}/></button>
        <div className="text-center mb-5">
          <div className="text-3xl mb-2">{prod.icono}</div>
          <h2 className="font-serif text-xl text-primary">{prod.nombre}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Seleccioná el tamaño</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TAMANOS.map(({ key, label, abbr }) => {
            const precio = prod.precios?.[key]
            if (!precio) return null
            return (
              <button
                key={key}
                onClick={() => onSelect(key, precio, label)}
                className="border-2 border-border hover:border-[#C4432D] rounded-xl p-4 text-center transition-all hover:bg-[#C4432D]/5 group"
              >
                <div className="font-serif text-2xl font-black text-[#1E2D24] group-hover:text-[#C4432D]">{abbr}</div>
                <div className="text-xs text-muted-foreground font-medium">{label}</div>
                <div className="font-bold text-[#C4432D] text-sm mt-1">{fmtColones(precio)}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Modal de descuento ───────────────────────────────────────────────────────
function ModalDescuento({ onClose }: { onClose: () => void }) {
  const { descValor, descTipo, setDescuento } = useCarritoStore()
  const [val, setVal] = useState(String(descValor))
  const [tipo, setTipo] = useState<'monto' | 'porcent'>(descTipo)

  function apply() {
    setDescuento(Number(val) || 0, tipo)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 animate-fade-in-up">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={18}/></button>
        <h2 className="font-serif text-lg text-primary mb-5">Aplicar Descuento</h2>
        <div className="flex gap-2 mb-4">
          {(['monto', 'porcent'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={cn('flex-1 rounded-lg py-2 text-sm font-semibold border-2 transition-all',
                tipo === t ? 'border-[#C4432D] bg-[#C4432D]/5 text-[#C4432D]' : 'border-border text-muted-foreground'
              )}
            >
              {t === 'monto' ? '₡ Monto' : '% Porcentaje'}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="0"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full border-2 border-border rounded-xl px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:border-[#C4432D]"
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => { setDescuento(0, 'monto'); onClose() }}>Quitar</Button>
          <Button className="flex-1" onClick={apply}>Aplicar</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de cliente ─────────────────────────────────────────────────────────
function ModalCliente({ onClose }: { onClose: () => void }) {
  const { clienteNombre, clienteCedula, clienteTelefono, setCliente } = useCarritoStore()
  const [nombre, setNombre]     = useState(clienteNombre)
  const [cedula, setCedula]     = useState(clienteCedula)
  const [telefono, setTelefono] = useState(clienteTelefono)

  function apply() { setCliente(nombre, cedula, telefono); onClose() }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 animate-fade-in-up">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={18}/></button>
        <h2 className="font-serif text-lg text-primary mb-5">Datos del Cliente</h2>
        {[
          { label: 'Nombre', value: nombre,   onChange: setNombre,   placeholder: 'Nombre completo' },
          { label: 'Cédula', value: cedula,   onChange: setCedula,   placeholder: '0-0000-0000' },
          { label: 'Tel.',   value: telefono, onChange: setTelefono, placeholder: '8888-8888' },
        ].map(({ label, value, onChange, placeholder }) => (
          <div key={label} className="mb-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">{label}</label>
            <input
              value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]"
            />
          </div>
        ))}
        <Button className="w-full mt-2" onClick={apply}>Guardar</Button>
      </div>
    </div>
  )
}

// ─── Modal de split ───────────────────────────────────────────────────────────
function ModalSplit({ total, onClose }: { total: number; onClose: () => void }) {
  const { splitNum, setSplitNum } = useCarritoStore()

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 animate-fade-in-up text-center">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={18}/></button>
        <h2 className="font-serif text-lg text-primary mb-2">Dividir Cuenta</h2>
        <p className="text-xs text-muted-foreground mb-5">Total: {fmtColones(total)}</p>
        <div className="flex items-center justify-center gap-4 mb-5">
          <button onClick={() => setSplitNum(Math.max(2, splitNum - 1))} className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:border-[#C4432D] transition-colors text-xl font-bold">−</button>
          <span className="font-serif text-5xl font-black text-[#C4432D] w-16 text-center">{splitNum}</span>
          <button onClick={() => setSplitNum(Math.min(10, splitNum + 1))} className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:border-[#C4432D] transition-colors text-xl font-bold">+</button>
        </div>
        <div className="bg-secondary rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Cada persona paga</div>
          <div className="font-serif text-2xl font-bold text-[#C4432D]">{fmtColones(total / splitNum)}</div>
        </div>
        <Button className="w-full mt-4" onClick={onClose}>Listo</Button>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
// ─── Modal SINPE ──────────────────────────────────────────────────────────────
function ModalSinpe({ total, sinpeNumero, sinpeNombre, onClose }: {
  total: number; sinpeNumero: string; sinpeNombre: string; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 animate-fade-in-up text-center">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={18}/></button>
        <div className="text-[#1E2D24] font-serif text-lg font-bold mb-1">Pago por SINPE Móvil</div>
        <p className="text-xs text-muted-foreground mb-5">Transferir exactamente:</p>
        <div className="font-serif text-3xl font-black text-[#C4432D] mb-5">{fmtColones(total)}</div>

        {sinpeNumero ? (
          <>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={sinpeNumero} size={160} bgColor="transparent" fgColor="#1E2D24" level="M" />
            </div>
            <div className="bg-secondary rounded-xl px-4 py-3 mb-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Número SINPE</div>
              <div className="font-bold text-xl tracking-widest text-primary">{sinpeNumero}</div>
              {sinpeNombre && <div className="text-xs text-muted-foreground mt-0.5">{sinpeNombre}</div>}
            </div>
          </>
        ) : (
          <div className="bg-secondary rounded-xl p-4 mb-4 text-sm text-muted-foreground">
            Configurá el número SINPE en <strong>Configuración → Sistema POS</strong>
          </div>
        )}

        <Button className="w-full" onClick={onClose}>✓ Ya realizó el pago</Button>
      </div>
    </div>
  )
}

export default function NuevaVenta() {
  const productos = useCollection<Producto>(() => hCol('productos'))
  const mesas     = useCollection<Mesa>(() => hCol('mesas'))
  const configs   = useCollection<ConfigNegocio>(() => hCol('config'))
  const cfg       = configs?.[0]

  const {
    items, metodoPago, descValor, descTipo,
    clienteNombre, clienteCedula, clienteTelefono,
    mesaActiva, splitNum, splitVisible,
    agregarItem, incrementarItem, decrementarItem, eliminarItem,
    actualizarNota, limpiarCarrito,
    setMetodoPago, setMesaActiva, setSplitVisible,
  } = useCarritoStore()

  const { showToast } = useUIStore()
  const cajeroActivo  = useCajeroStore((s) => s.cajeroActivo)

  const [categoriaActiva, setCategoriaActiva] = useState<'Pizzas' | 'Extras'>('Pizzas')
  const [busqueda, setBusqueda] = useState('')
  const [modalTamano, setModalTamano]   = useState<Producto | null>(null)
  const [modalDesc, setModalDesc]       = useState(false)
  const [modalCliente, setModalCliente] = useState(false)
  const [modalSplit, setModalSplit]     = useState(false)
  const [modalSinpe, setModalSinpe]     = useState(false)
  const [notaActiva, setNotaActiva]     = useState<string | null>(null)
  const [procesando, setProcesando]     = useState(false)

  const { subtotalNeto, ivaTotal, descuento, total } = calcularTotales(items, descValor, descTipo)

  // Filtrar productos
  const prodsFiltrados = (productos ?? []).filter(
    (p) => p.estado === 'activo' &&
      p.categoria === categoriaActiva &&
      (busqueda === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  )

  // Keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F9') { e.preventDefault(); procesarVenta() }
  }, [items, procesando]) // eslint-disable-line

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  function clickProducto(prod: Producto) {
    if (prod.categoria === 'Pizzas' && prod.precios) {
      setModalTamano(prod)
    } else {
      const item: ItemVenta = {
        cartId:    prod.id,
        id:        prod.id,
        nombre:    prod.nombre,
        precio:    prod.precio,
        iva:       prod.iva,
        qty:       1,
        icono:     prod.icono,
        categoria: prod.categoria,
      }
      agregarItem(item)
    }
  }

  function selectTamano(key: TamanoKey, precio: number, label: string) {
    if (!modalTamano) return
    const cartId = `${modalTamano.id}_${key}`
    const item: ItemVenta = {
      cartId,
      id:        modalTamano.id,
      nombre:    `${modalTamano.nombre} (${label})`,
      precio,
      iva:       modalTamano.iva,
      qty:       1,
      icono:     modalTamano.icono,
      categoria: modalTamano.categoria,
      tamano:    label,
    }
    agregarItem(item)
    setModalTamano(null)
  }

  async function procesarVenta() {
    if (items.length === 0) { showToast('Carrito vacío', 'warning'); return }
    if (procesando) return
    setProcesando(true)
    try {
      // Número de factura: usa config ya cargada + timestamp para evitar getDocs
      const numFactura    = Date.now()
      const prefijo       = cfg?.prefijo ?? 'LVP'
      const codigoFactura = `${prefijo}-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${String(numFactura).slice(-4)}`

      const venta: Venta = {
        id:            nanoid(),
        numFactura,
        codigoFactura,
        fecha:         new Date().toISOString(),
        cliente:       clienteNombre || 'Público General',
        cedula:        clienteCedula,
        telefono:      clienteTelefono,
        mesa:          mesaActiva,
        items,
        subtotalNeto,
        iva:           ivaTotal,
        descuento,
        total,
        metodoPago,
        estado:        'pagada',
        cajeroId:      cajeroActivo?.id      ?? '',
        cajeroNombre:  cajeroActivo?.nombre  ?? 'Sin cajero',
        creadoEn:      new Date().toISOString(),
      }

      await ventasRepository.crear(sinUndefined(venta) as unknown as Venta)

      // Liberar mesa si aplica
      if (mesaActiva !== null) {
        const mesaId = `mesa-${mesaActiva}`
        await mesasRepository.actualizar(mesaId, { ocupada: false, desde: null, orden: null })
      }

      limpiarCarrito()
      showToast(`Venta ${codigoFactura} procesada ✓`, 'ok')
    } catch (err) {
      console.error(err)
      showToast('Error al procesar la venta', 'error')
    } finally {
      setProcesando(false)
    }
  }

  const metodos: { key: MetodoPago; icon: React.ReactNode; label: string }[] = [
    { key: 'efectivo', icon: <Banknote size={16}/>,    label: 'Efectivo' },
    { key: 'tarjeta',  icon: <CreditCard size={16}/>,  label: 'Tarjeta'  },
    { key: 'sinpe',    icon: <Smartphone size={16}/>,  label: 'SINPE'    },
  ]

  function handleMetodoPago(m: MetodoPago) {
    setMetodoPago(m)
    if (m === 'sinpe' && items.length > 0) setModalSinpe(true)
  }

  return (
    <div className="flex gap-0 -m-6 md:-m-8 h-[calc(100vh-80px)]">
      {/* ── Panel izquierdo: productos ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        {/* Barra de búsqueda + categorías */}
        <div className="bg-white border-b border-border p-4 space-y-3">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto…"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1E2D24]"
          />
          <div className="flex gap-2">
            {(['Pizzas', 'Extras'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2',
                  categoriaActiva === cat
                    ? 'bg-[#1E2D24] border-[#1E2D24] text-white'
                    : 'border-border text-muted-foreground hover:border-[#1E2D24]/40'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {prodsFiltrados.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-16">
              No hay productos en esta categoría
            </div>
          ) : prodsFiltrados.map((prod) => (
            <button
              key={prod.id}
              onClick={() => clickProducto(prod)}
              className="bg-white border-2 border-border hover:border-[#C4432D] rounded-xl p-3 text-left transition-all hover:shadow-md active:scale-[0.97] group"
            >
              <div className="text-3xl mb-2 text-center">{prod.icono}</div>
              <div className="font-semibold text-sm leading-tight text-primary line-clamp-2 group-hover:text-[#C4432D]">
                {prod.nombre}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {prod.categoria === 'Pizzas' && prod.precios
                  ? `desde ${fmtColones(prod.precios.p)}`
                  : fmtColones(prod.precio)
                }
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Panel derecho: carrito ─────────────────────────────────────────── */}
      <div className="w-[340px] shrink-0 flex flex-col bg-[#FAFAF9]">
        {/* Header carrito */}
        <div className="bg-[#1E2D24] text-white px-5 py-4 flex items-center justify-between">
          <span className="font-serif text-lg">Carrito</span>
          <div className="flex items-center gap-3">
            {/* Mesa selector */}
            <select
              value={mesaActiva ?? ''}
              onChange={(e) => setMesaActiva(e.target.value ? Number(e.target.value) : null)}
              className="bg-white/10 text-white text-xs border border-white/20 rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="">Sin mesa</option>
              {(mesas ?? []).map((m) => (
                <option key={m.id} value={m.num}>Mesa {m.num}</option>
              ))}
            </select>
            {items.length > 0 && (
              <button onClick={limpiarCarrito} className="text-white/60 hover:text-white transition-colors">
                <Trash2 size={15}/>
              </button>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm px-6">
              <div className="text-5xl mb-3">🍕</div>
              Tocá un producto para agregarlo
            </div>
          ) : items.map((item) => (
            <div key={item.cartId} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.icono}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] leading-tight truncate">{item.nombre}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtColones(item.precio)} c/u</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => decrementarItem(item.cartId)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                    <Minus size={11}/>
                  </button>
                  <span className="w-7 text-center font-bold text-sm">{item.qty}</span>
                  <button onClick={() => incrementarItem(item.cartId)} className="w-7 h-7 rounded-full bg-[#C4432D] text-white flex items-center justify-center hover:bg-[#C4432D]/80 transition-colors">
                    <Plus size={11}/>
                  </button>
                </div>
                <div className="text-[13px] font-bold text-[#C4432D] min-w-[60px] text-right">{fmtColones(item.precio * item.qty)}</div>
                <button onClick={() => setNotaActiva(notaActiva === item.cartId ? null : item.cartId)} className={cn('ml-1 transition-colors', item.nota ? 'text-[#D4A35A]' : 'text-muted-foreground hover:text-foreground')}>
                  <StickyNote size={13}/>
                </button>
                <button onClick={() => eliminarItem(item.cartId)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X size={13}/>
                </button>
              </div>
              {notaActiva === item.cartId && (
                <input
                  autoFocus
                  value={item.nota ?? ''}
                  onChange={(e) => actualizarNota(item.cartId, e.target.value)}
                  placeholder="Nota especial (sin cebolla, etc.)"
                  className="mt-2 w-full text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4A35A] bg-white"
                />
              )}
            </div>
          ))}
        </div>

        {/* Totales + acciones */}
        <div className="border-t border-border bg-white px-4 py-4 space-y-3">
          {/* Datos cliente + descuento */}
          <div className="flex gap-2">
            <button onClick={() => setModalCliente(true)} className="flex-1 flex items-center gap-1.5 text-[11px] text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-secondary transition-colors truncate">
              <Users size={12}/>
              <span className="truncate">{clienteNombre || 'Público General'}</span>
            </button>
            <button onClick={() => setModalDesc(true)} className="flex items-center gap-1.5 text-[11px] text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-secondary transition-colors">
              <Tag size={12}/>
              {descValor > 0 ? <span className="text-[#C4432D] font-bold">{descTipo === 'porcent' ? `${descValor}%` : fmtColones(descValor)}</span> : 'Dcto.'}
            </button>
            <button onClick={() => { setSplitVisible(true); setModalSplit(true) }} className="flex items-center gap-1.5 text-[11px] text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-secondary transition-colors">
              <Scissors size={12}/>
              {splitVisible ? <span className="text-[#D4A35A] font-bold">÷{splitNum}</span> : 'Split'}
            </button>
          </div>

          {/* Resumen */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{fmtColones(subtotalNeto + ivaTotal)}</span>
            </div>
            {ivaTotal > 0 && (
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>IVA (13%)</span>
                <span>{fmtColones(ivaTotal)}</span>
              </div>
            )}
            {descuento > 0 && (
              <div className="flex justify-between text-[#C4432D]">
                <span>Descuento</span>
                <span>-{fmtColones(descuento)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[17px] border-t border-border pt-2">
              <span className="font-serif">TOTAL</span>
              <span className="text-[#C4432D]">{fmtColones(total)}</span>
            </div>
            {splitVisible && <div className="text-center text-xs text-[#D4A35A] font-semibold">÷{splitNum} = {fmtColones(total / splitNum)} por persona</div>}
          </div>

          {/* Método de pago */}
          <div className="flex gap-2">
            {metodos.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => handleMetodoPago(key)}
                className={cn('flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5 border-2 transition-all text-[10px] font-semibold uppercase tracking-wide',
                  metodoPago === key
                    ? 'bg-[#1E2D24] border-[#1E2D24] text-white'
                    : 'border-border text-muted-foreground hover:border-[#1E2D24]/40'
                )}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Botón procesar */}
          <Button
            className="w-full h-14 text-base font-bold"
            onClick={procesarVenta}
            disabled={items.length === 0 || procesando}
          >
            {procesando ? 'Procesando…' : `Cobrar ${fmtColones(total)}`}
            {!procesando && <span className="ml-2 text-xs opacity-60 font-normal">[F9]</span>}
          </Button>
        </div>
      </div>

      {/* Modales */}
      {modalTamano && <ModalTamano prod={modalTamano} onSelect={selectTamano} onClose={() => setModalTamano(null)} />}
      {modalDesc    && <ModalDescuento onClose={() => setModalDesc(false)} />}
      {modalCliente && <ModalCliente onClose={() => setModalCliente(false)} />}
      {modalSplit   && <ModalSplit total={total} onClose={() => setModalSplit(false)} />}
      {modalSinpe   && (
        <ModalSinpe
          total={total}
          sinpeNumero={cfg?.sinpeNumero ?? ''}
          sinpeNombre={cfg?.sinpeNombre ?? ''}
          onClose={() => setModalSinpe(false)}
        />
      )}
    </div>
  )
}
