import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { ventasRepository } from '@/repositories'
import { fmtColones } from '@/lib/utils'
import { Printer, X } from 'lucide-react'
import type { Venta, ConfigNegocio } from '@/types'

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta:  'Tarjeta',
  sinpe:    'SINPE Móvil',
}

export default function FacturaPrint() {
  const { id } = useParams<{ id: string }>()
  const [venta, setVenta]     = useState<Venta | null | undefined>(undefined)
  const configs   = useCollection<ConfigNegocio>(() => hCol('config'))
  const cfg       = configs?.[0]
  const impreso   = useRef(false)

  useEffect(() => {
    if (!id) { setVenta(null); return }
    ventasRepository.obtenerPorId(id)
      .then((v) => setVenta(v ?? null))
      .catch(() => setVenta(null))
  }, [id])

  // Auto-imprimir apenas la factura y la config estén listas
  useEffect(() => {
    if (impreso.current) return
    if (venta && cfg) {
      impreso.current = true
      const t = setTimeout(() => window.print(), 350)
      return () => clearTimeout(t)
    }
  }, [venta, cfg])

  if (venta === undefined) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Cargando factura…</div>
  }

  if (venta === null) {
    return <div className="p-8 text-center text-sm text-destructive">No se encontró esta factura</div>
  }

  const fecha = new Date(venta.fecha)

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex flex-col items-center py-6 print:bg-white print:py-0 print:block">
      {/* Fuerza el tamaño físico de papel — 80mm, alto automático (rollo continuo) */}
      <style>{`
        @page { size: 80mm auto; margin: 0; }
        @media print {
          html, body { background: white !important; }
        }
      `}</style>

      {/* Barra de acciones — no se imprime */}
      <div className="print:hidden flex gap-2 mb-4">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-[#1E2D24] text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-[#1E2D24]/85 transition-colors"
        >
          <Printer size={14}/> Imprimir de nuevo
        </button>
        <button
          onClick={() => window.close()}
          className="flex items-center gap-1.5 border border-border text-sm font-semibold rounded-xl px-4 py-2 hover:bg-secondary transition-colors"
        >
          <X size={14}/> Cerrar
        </button>
      </div>

      {/* Ticket — 80mm de ancho, texto monoespaciado, negro sobre blanco SIEMPRE
          (estilos inline a propósito: el modo oscuro global sobreescribe
          .bg-white con los colores del tema con !important, y un recibo
          térmico no debe respetar el modo oscuro del cajero) */}
      <div
        className="shadow-lg print:shadow-none"
        style={{
          width: '80mm', padding: '4mm 3mm',
          // "Courier New" no incluye el glyph de ₡ (U+20A1) en muchos sistemas
          // y se imprime como un símbolo roto — se priorizan fuentes
          // monoespaciadas modernas con mejor cobertura Unicode, y Courier
          // New queda solo como último recurso.
          fontFamily: 'ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Courier New", monospace',
          fontSize: '11px', lineHeight: 1.45,
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

        {/* Datos de la venta */}
        <div>
          <div className="flex justify-between"><span>Comprobante:</span><strong>{venta.codigoFactura}</strong></div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{fecha.toLocaleDateString('es-CR')} {fecha.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
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
    </div>
  )
}
