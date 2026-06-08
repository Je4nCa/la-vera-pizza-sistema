import { useMemo } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { fmtColones, isoFecha } from '@/lib/utils'
import { useCajeroStore } from '@/store'
import { Printer, LogOut, Banknote, CreditCard, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Venta } from '@/types'

export default function CierreCaja() {
  const cajeroActivo  = useCajeroStore((s) => s.cajeroActivo)
  const cerrarCajero  = useCajeroStore((s) => s.cerrarCajero)
  const ventas        = useCollection<Venta>(() => hCol('ventas'))
  const hoy           = isoFecha()
  const ahora         = new Date().toLocaleString('es-CR', { dateStyle: 'full', timeStyle: 'short' })

  const ventasTurno = useMemo(() =>
    (ventas ?? [])
      .filter((v) =>
        v.estado !== 'anulada' &&
        v.fecha.startsWith(hoy) &&
        v.cajeroId === cajeroActivo?.id
      )
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    [ventas, hoy, cajeroActivo]
  )

  const resumen = useMemo(() => ({
    efectivo: ventasTurno.filter((v) => v.metodoPago === 'efectivo').reduce((s, v) => s + v.total, 0),
    tarjeta:  ventasTurno.filter((v) => v.metodoPago === 'tarjeta').reduce((s, v) => s + v.total, 0),
    sinpe:    ventasTurno.filter((v) => v.metodoPago === 'sinpe').reduce((s, v) => s + v.total, 0),
    total:    ventasTurno.reduce((s, v) => s + v.total, 0),
    num:      ventasTurno.length,
    promedio: ventasTurno.length ? ventasTurno.reduce((s, v) => s + v.total, 0) / ventasTurno.length : 0,
  }), [ventasTurno])

  function imprimir() { window.print() }

  return (
    <div className="max-w-xl space-y-6">
      {/* Info del turno */}
      <div className="bg-[#1E2D24] text-white rounded-2xl p-6">
        <div className="text-[#D4A35A] text-xs uppercase tracking-widest mb-2">Turno activo</div>
        <div className="font-serif text-3xl font-black">{cajeroActivo?.nombre ?? '—'}</div>
        <div className="text-white/50 text-sm mt-1">{ahora}</div>
      </div>

      {/* Resumen */}
      <div className="bg-white border border-border rounded-xl p-5 print-receipt" id="receipt">
        {/* Header impresión */}
        <div className="hidden print:block text-center mb-4 border-b border-gray-200 pb-3">
          <div className="font-bold text-lg">LA VERA PIZZA</div>
          <div className="text-sm text-gray-500">Cierre de Turno</div>
          <div className="text-xs text-gray-400">{ahora}</div>
          <div className="text-sm font-semibold mt-1">Cajero: {cajeroActivo?.nombre}</div>
        </div>

        <h2 className="font-serif text-lg text-primary mb-4 print:hidden">Resumen del Día</h2>

        {/* Totales por método */}
        <div className="space-y-3 mb-5">
          {[
            { label: 'Efectivo', value: resumen.efectivo, icon: <Banknote size={16} className="text-green-500"/> },
            { label: 'Tarjeta',  value: resumen.tarjeta,  icon: <CreditCard size={16} className="text-blue-500"/> },
            { label: 'SINPE',    value: resumen.sinpe,    icon: <Smartphone size={16} className="text-[#D4A35A]"/> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-dashed border-border">
              <div className="flex items-center gap-2 text-sm font-medium">
                {icon} {label}
              </div>
              <span className="font-bold">{fmtColones(value)}</span>
            </div>
          ))}
        </div>

        {/* Total general */}
        <div className="bg-secondary rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total del turno</div>
              <div className="font-serif text-3xl font-black text-[#C4432D]">{fmtColones(resumen.total)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Ventas: <strong>{resumen.num}</strong></div>
              <div className="text-xs text-muted-foreground">Promedio: <strong>{fmtColones(resumen.promedio)}</strong></div>
            </div>
          </div>
        </div>

        {/* Detalle de ventas */}
        {ventasTurno.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">No hay ventas en este turno aún</p>
        ) : (
          <div className="space-y-0">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Detalle de {resumen.num} ventas</div>
            {ventasTurno.map((v) => (
              <div key={v.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0 text-sm">
                <span className="font-serif text-[13px] text-primary w-20 shrink-0">{v.codigoFactura}</span>
                <span className="flex-1 truncate text-xs text-muted-foreground">
                  {new Date(v.fecha).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })} · {v.cliente}
                </span>
                <Badge variant={v.metodoPago === 'efectivo' ? 'default' : v.metodoPago === 'tarjeta' ? 'dorado' : 'gris'} className="text-[9px] shrink-0">
                  {v.metodoPago}
                </Badge>
                <span className="font-bold text-[13px] text-[#C4432D] shrink-0 w-20 text-right">{fmtColones(v.total)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer impresión */}
        <div className="hidden print:block text-center mt-4 pt-3 border-t border-gray-200 text-xs text-gray-400">
          Sistema La Vera Pizza · POS v2.0
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 no-print">
        <Button variant="outline" onClick={imprimir} className="flex-1">
          <Printer size={14}/> Imprimir / Exportar
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm('¿Cerrar el turno y salir? Tendrás que seleccionar cajero de nuevo.')) {
              cerrarCajero()
            }
          }}
          className="flex-1"
        >
          <LogOut size={14}/> Cerrar Turno
        </Button>
      </div>
    </div>
  )
}
