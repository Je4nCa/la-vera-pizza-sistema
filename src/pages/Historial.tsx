import { useState, useMemo } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { ventasRepository } from '@/repositories'
import { useUIStore } from '@/store'
import { fmtColones, fmtFecha, isoFecha } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Search, Ban, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Venta } from '@/types'

export default function Historial() {
  const ventas = useCollection<Venta>(() => hCol('ventas'))
  const { showToast } = useUIStore()

  const [busqueda, setBusqueda] = useState('')
  const [filtroFecha, setFiltroFecha] = useState(isoFecha())
  const [filtroMetodo, setFiltroMetodo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [expandida, setExpandida] = useState<string | null>(null)

  const filtradas = useMemo(() => {
    let list = [...(ventas ?? [])]
    if (filtroFecha) list = list.filter((v) => v.fecha.startsWith(filtroFecha))
    if (filtroMetodo) list = list.filter((v) => v.metodoPago === filtroMetodo)
    if (filtroEstado) list = list.filter((v) => (v.estado ?? 'pagada') === filtroEstado)
    if (busqueda) {
      const q = busqueda.toLowerCase()
      list = list.filter((v) => v.codigoFactura.toLowerCase().includes(q) || v.cliente.toLowerCase().includes(q))
    }
    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [ventas, busqueda, filtroFecha, filtroMetodo, filtroEstado])

  const totalFiltrado = filtradas.filter((v) => v.estado !== 'anulada').reduce((s, v) => s + v.total, 0)

  async function anularVenta(venta: Venta) {
    if (!confirm(`¿Anular la factura ${venta.codigoFactura}?`)) return
    try {
      await ventasRepository.actualizar(venta.id, { estado: 'anulada' })
      showToast(`Factura ${venta.codigoFactura} anulada`, 'warning')
    } catch {
      showToast('Error al anular la factura', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar factura o cliente…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-[#1E2D24]"
          />
        </div>
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]"
        />
        <select
          value={filtroMetodo}
          onChange={(e) => setFiltroMetodo(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]"
        >
          <option value="">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="sinpe">SINPE</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]"
        >
          <option value="">Todos los estados</option>
          <option value="pagada">Pagadas</option>
          <option value="anulada">Anuladas</option>
        </select>
      </div>

      {/* Resumen */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{filtradas.length} facturas</span>
        <span className="font-bold text-[#C4432D]">Total: {fmtColones(totalFiltrado)}</span>
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No hay ventas con estos filtros</div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((venta) => (
            <div key={venta.id} className={cn('bg-white border border-border rounded-xl overflow-hidden transition-all', venta.estado === 'anulada' && 'opacity-60')}>
              {/* Fila principal */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-secondary/50"
                onClick={() => setExpandida(expandida === venta.id ? null : venta.id)}
              >
                <div className="font-serif text-[15px] text-primary min-w-[90px]">{venta.codigoFactura}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{venta.cliente}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtFecha(venta.fecha)}</div>
                </div>
                {venta.mesa !== null && (
                  <Badge variant="gris" className="text-[10px]">Mesa {venta.mesa}</Badge>
                )}
                <Badge variant={venta.metodoPago === 'efectivo' ? 'default' : venta.metodoPago === 'tarjeta' ? 'dorado' : 'gris'} className="text-[10px]">
                  {venta.metodoPago}
                </Badge>
                <Badge variant={venta.estado === 'anulada' ? 'destructive' : 'default'} className="text-[10px]">
                  {venta.estado ?? 'pagada'}
                </Badge>
                <div className="font-bold text-[15px] text-[#C4432D] min-w-[80px] text-right shrink-0">
                  {fmtColones(venta.total)}
                </div>
                {expandida === venta.id ? <ChevronUp size={15} className="text-muted-foreground shrink-0"/> : <ChevronDown size={15} className="text-muted-foreground shrink-0"/>}
              </div>

              {/* Detalle expandido */}
              {expandida === venta.id && (
                <div className="border-t border-border bg-secondary/30 px-5 py-4 space-y-3 animate-fade-in-up">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        <th className="text-left pb-2">Producto</th>
                        <th className="text-center pb-2">Cant.</th>
                        <th className="text-right pb-2">Precio</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {venta.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-1.5">
                            {item.icono} {item.nombre}
                            {item.nota && <div className="text-[10px] text-muted-foreground italic">nota: {item.nota}</div>}
                          </td>
                          <td className="text-center py-1.5">{item.qty}</td>
                          <td className="text-right py-1.5">{fmtColones(item.precio)}</td>
                          <td className="text-right py-1.5 font-semibold">{fmtColones(item.precio * item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-border text-sm">
                      <tr>
                        <td colSpan={3} className="pt-2 text-muted-foreground text-xs">IVA incluido</td>
                        <td className="pt-2 text-right font-bold text-[#C4432D]">{fmtColones(venta.total)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {venta.estado !== 'anulada' && (
                    <div className="flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => anularVenta(venta)}>
                        <Ban size={13}/> Anular Factura
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
