import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { ventasRepository } from '@/repositories'
import { fmtColones, cn } from '@/lib/utils'
import { Printer, X } from 'lucide-react'
import type { Venta, ConfigNegocio } from '@/types'

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta:  'Tarjeta',
  sinpe:    'SINPE Móvil',
}

// "Courier New" no incluye el glyph de ₡ (U+20A1) en muchos sistemas y se
// imprime como un símbolo roto — se priorizan fuentes monoespaciadas
// modernas con mejor cobertura Unicode, dejando Courier New como último recurso.
const FUENTE_TICKET = 'ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Courier New", monospace'

function horaFecha(fecha: Date) {
  return `${fecha.toLocaleDateString('es-CR')} ${fecha.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}`
}

// Mismo número que ve la Pantalla Cocina: los últimos 4 dígitos del
// numFactura (así se calculó Orden.num al crear la orden en NuevaVenta.tsx).
function numOrden(venta: Venta): string {
  return String(venta.numFactura).slice(-4)
}

function TicketCliente({ venta, cfg }: { venta: Venta; cfg?: ConfigNegocio }) {
  const fecha = new Date(venta.fecha)
  return (
    <div
      style={{
        width: '80mm', padding: '4mm 3mm',
        fontFamily: FUENTE_TICKET, fontSize: '11px', lineHeight: 1.45,
        background: '#fff', color: '#000',
      }}
    >
      {/* Encabezado del negocio */}
      <div className="text-center mb-2">
        <div style={{ fontSize: '16px', fontWeight: 900 }}>{cfg?.nombre || 'LA VERA PIZZA'}</div>
        {cfg?.cedula && <div>Céd. Jur: {cfg.cedula}</div>}
        {cfg?.direccion && <div>{cfg.direccion}</div>}
        {cfg?.telefono && <div>Tel: {cfg.telefono}</div>}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Número de orden — igual al que muestra la Pantalla Cocina */}
      <div className="text-center mb-2">
        <div style={{ fontSize: '10px' }}>ORDEN</div>
        <div style={{ fontSize: '26px', fontWeight: 900 }}>#{numOrden(venta)}</div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Datos de la venta */}
      <div>
        <div className="flex justify-between"><span>Comprobante:</span><strong>{venta.codigoFactura}</strong></div>
        <div className="flex justify-between"><span>Fecha:</span><span>{horaFecha(fecha)}</span></div>
        <div className="flex justify-between"><span>Cajero:</span><span>{venta.cajeroNombre || '—'}</span></div>
        {venta.mesa !== null && <div className="flex justify-between"><span>Mesa:</span><span>{venta.mesa}</span></div>}
        <div className="flex justify-between"><span>Cliente:</span><span className="text-right truncate max-w-[45mm]">{venta.cliente}</span></div>
        {venta.estado === 'anulada' && (
          <div className="text-center font-black mt-1" style={{ fontSize: '13px' }}>*** ANULADA ***</div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Items */}
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th className="text-left" style={{ fontSize: '10px' }}>Producto</th>
            <th className="text-center" style={{ fontSize: '10px' }}>Cant</th>
            <th className="text-right" style={{ fontSize: '10px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {venta.items.map((item, i) => (
            <tr key={i}>
              <td colSpan={3} style={{ paddingTop: i === 0 ? 0 : 3 }}>
                <div className="flex justify-between">
                  {/* item.nombre ya incluye el tamaño, ej. "Jamón (Mediana)" — no repetirlo */}
                  <span>{item.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span>{item.qty} x {fmtColones(item.precio)}</span>
                  <strong>{fmtColones(item.precio * item.qty)}</strong>
                </div>
                {item.nota && <div style={{ fontSize: '9px', fontStyle: 'italic' }}>· {item.nota}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2" />

      {/* Totales */}
      <div>
        <div className="flex justify-between"><span>Subtotal:</span><span>{fmtColones(venta.subtotalNeto)}</span></div>
        {venta.iva > 0 && <div className="flex justify-between"><span>IVA:</span><span>{fmtColones(venta.iva)}</span></div>}
        {venta.descuento > 0 && <div className="flex justify-between"><span>Descuento:</span><span>-{fmtColones(venta.descuento)}</span></div>}
        <div className="flex justify-between mt-1" style={{ fontSize: '15px', fontWeight: 900 }}>
          <span>TOTAL:</span><span>{fmtColones(venta.total)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Método de pago:</span><strong>{METODO_LABEL[venta.metodoPago] ?? venta.metodoPago}</strong>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Footer */}
      <div className="text-center" style={{ fontSize: '10px' }}>
        {cfg?.mensaje && <div className="mb-1">{cfg.mensaje}</div>}
        <div style={{ fontSize: '9px', opacity: 0.75 }}>
          Comprobante de venta interno — no es factura electrónica ante Hacienda
        </div>
      </div>
    </div>
  )
}

function TicketCocina({ venta }: { venta: Venta }) {
  const fecha = new Date(venta.fecha)
  return (
    <div
      style={{
        width: '80mm', padding: '4mm 3mm',
        fontFamily: FUENTE_TICKET, fontSize: '12px', lineHeight: 1.5,
        background: '#fff', color: '#000',
      }}
    >
      <div className="text-center mb-1" style={{ fontSize: '16px', fontWeight: 900 }}>
        COMANDA DE COCINA
      </div>

      {/* Número de orden — igual al que muestra la Pantalla Cocina, bien grande
          para que se identifique de un vistazo */}
      <div className="text-center mb-1">
        <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1 }}>#{numOrden(venta)}</div>
      </div>
      <div className="text-center mb-2" style={{ fontSize: '11px' }}>
        {horaFecha(fecha)}
      </div>

      <div className="border-t-2 border-black my-2" />

      <div style={{ fontSize: '13px' }}>
        <div className="flex justify-between"><span>Cajero:</span><span>{venta.cajeroNombre || '—'}</span></div>
        {venta.mesa !== null && (
          <div className="flex justify-between" style={{ fontSize: '15px', fontWeight: 900 }}>
            <span>MESA:</span><span>{venta.mesa}</span>
          </div>
        )}
        <div className="flex justify-between"><span>Cliente:</span><strong className="text-right truncate max-w-[45mm]">{venta.cliente}</strong></div>
      </div>

      <div className="border-t-2 border-black my-2" />

      {/* Items — sin precios, tamaño grande para leer rápido en cocina */}
      <div className="space-y-2">
        {venta.items.map((item, i) => (
          <div key={i}>
            <div className="flex gap-2" style={{ fontSize: '15px', fontWeight: 900 }}>
              <span>{item.qty}x</span>
              <span>{item.nombre}</span>
            </div>
            {item.nota && (
              <div style={{ fontSize: '12px', fontWeight: 700 }}>
                ⚠ NOTA: {item.nota}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t-2 border-black my-2" />

      <div className="text-center" style={{ fontSize: '10px', opacity: 0.7 }}>
        Solo para preparación — no incluye precios
      </div>
    </div>
  )
}

// Cuál de los dos tickets se está imprimiendo en este momento (o ninguno)
type Imprimiendo = 'cliente' | 'cocina' | null

export default function FacturaPrint() {
  const { id } = useParams<{ id: string }>()
  const [venta, setVenta]     = useState<Venta | null | undefined>(undefined)
  const configs   = useCollection<ConfigNegocio>(() => hCol('config'))
  const cfg       = configs?.[0]
  const autoIniciado = useRef(false)

  const [imprimiendo, setImprimiendo] = useState<Imprimiendo>(null)

  useEffect(() => {
    if (!id) { setVenta(null); return }
    ventasRepository.obtenerPorId(id)
      .then((v) => setVenta(v ?? null))
      .catch(() => setVenta(null))
  }, [id])

  // Arranca la secuencia automática: imprime el ticket del cliente primero
  useEffect(() => {
    if (autoIniciado.current) return
    if (venta && cfg) {
      autoIniciado.current = true
      setImprimiendo('cliente')
    }
  }, [venta, cfg])

  // Dispara window.print() cada vez que cambia qué se está imprimiendo.
  // Cada llamada a print() es un TRABAJO DE IMPRESIÓN independiente — así
  // la impresora corta el papel al final de cada uno, sin depender de que
  // el driver respete un salto de página dentro de un mismo trabajo.
  useEffect(() => {
    if (!imprimiendo) return
    const t = setTimeout(() => window.print(), 350)
    return () => clearTimeout(t)
  }, [imprimiendo])

  // Cuando el diálogo de impresión se cierra, sigue con el siguiente ticket
  // (cliente → cocina → listo). Los botones de reimpresión manual también
  // pasan por acá.
  useEffect(() => {
    function onAfterPrint() {
      setImprimiendo((actual) => (actual === 'cliente' ? 'cocina' : null))
    }
    window.addEventListener('afterprint', onAfterPrint)
    return () => window.removeEventListener('afterprint', onAfterPrint)
  }, [])

  function imprimirSolo(cual: 'cliente' | 'cocina') {
    if (imprimiendo) return
    setImprimiendo(cual)
  }

  if (venta === undefined) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Cargando factura…</div>
  }

  if (venta === null) {
    return <div className="p-8 text-center text-sm text-destructive">No se encontró esta factura</div>
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex flex-col items-center py-6 print:bg-white print:py-0 print:block">
      {/* Fuerza el tamaño físico de papel — 80mm, alto automático (rollo continuo) */}
      <style>{`
        @page { size: 80mm auto; margin: 0; }
        @media print {
          html, body { background: white !important; }
        }
        @media screen {
          .ticket-preview + .ticket-preview { margin-top: 24px; }
        }
      `}</style>

      {/* Barra de acciones — no se imprime */}
      <div className="print:hidden flex flex-wrap gap-2 mb-4 justify-center">
        <button
          onClick={() => imprimirSolo('cliente')}
          disabled={!!imprimiendo}
          className="flex items-center gap-1.5 bg-[#1E2D24] text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-[#1E2D24]/85 transition-colors disabled:opacity-50"
        >
          <Printer size={14}/> Ticket cliente
        </button>
        <button
          onClick={() => imprimirSolo('cocina')}
          disabled={!!imprimiendo}
          className="flex items-center gap-1.5 bg-[#C4432D] text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-[#C4432D]/85 transition-colors disabled:opacity-50"
        >
          <Printer size={14}/> Comanda cocina
        </button>
        <button
          onClick={() => window.close()}
          className="flex items-center gap-1.5 border border-border text-sm font-semibold rounded-xl px-4 py-2 hover:bg-secondary transition-colors"
        >
          <X size={14}/> Cerrar
        </button>
      </div>
      {imprimiendo && (
        <div className="print:hidden text-xs text-muted-foreground mb-3">
          Imprimiendo {imprimiendo === 'cliente' ? 'ticket del cliente' : 'comanda de cocina'}…
        </div>
      )}

      {/* Ticket 1: para el cliente (con precios). Se oculta en el trabajo de
          impresión que corresponde a la comanda de cocina. */}
      <div className={cn('ticket-preview shadow-lg print:shadow-none', imprimiendo === 'cocina' && 'print:hidden')}>
        <TicketCliente venta={venta} cfg={cfg} />
      </div>
      {/* Ticket 2: comanda de cocina (sin precios). Se oculta en el trabajo
          de impresión que corresponde al ticket del cliente. */}
      <div className={cn('ticket-preview shadow-lg print:shadow-none', imprimiendo === 'cliente' && 'print:hidden')}>
        <TicketCocina venta={venta} />
      </div>
    </div>
  )
}
