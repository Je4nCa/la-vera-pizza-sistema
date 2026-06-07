import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { fmtColones, fmtFecha, isoFecha, isoMes } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Venta, Producto } from '@/types'

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <div className={`font-serif text-[28px] font-bold ${color ?? 'text-primary'}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const ventas    = useCollection<Venta>(() => hCol('ventas'))
  const productos = useCollection<Producto>(() => hCol('productos'))

  const hoy = isoFecha()
  const mes = isoMes()

  const { ventasHoy, ingresosHoy, ivaHoy, totalMes } = useMemo(() => {
    const activas = (ventas ?? []).filter((v) => v.estado !== 'anulada')
    const vHoy = activas.filter((v) => v.fecha.startsWith(hoy))
    const vMes = activas.filter((v) => v.fecha.startsWith(mes))
    return {
      ventasHoy:   vHoy.length,
      ingresosHoy: vHoy.reduce((s, v) => s + v.subtotalNeto, 0),
      ivaHoy:      vHoy.reduce((s, v) => s + v.iva, 0),
      totalMes:    vMes.reduce((s, v) => s + v.total, 0),
    }
  }, [ventas, hoy, mes])

  const recientes = useMemo(() =>
    [...(ventas ?? [])].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 8),
    [ventas]
  )

  const topProductos = useMemo(() => {
    const conteo: Record<string, number> = {}
    ;(ventas ?? []).filter((v) => v.estado !== 'anulada').forEach((v) =>
      v.items.forEach((i) => { conteo[i.nombre] = (conteo[i.nombre] ?? 0) + i.qty })
    )
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [ventas])

  const alertasStock = useMemo(() =>
    (productos ?? []).filter((p) => {
      if (p.estado === 'inactivo' || p.stock === '') return false
      const s = Number(p.stock)
      const min = p.stockMin !== '' ? Number(p.stockMin) : 5
      return s <= min
    }),
    [productos]
  )

  return (
    <div className="space-y-6">
      {/* Alertas de stock */}
      {alertasStock.length > 0 && (
        <div className="bg-destructive/7 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-destructive text-xs font-bold uppercase tracking-wide mb-3">
            <AlertTriangle size={14} /> Productos con stock bajo
          </div>
          <div className="flex flex-wrap gap-2">
            {alertasStock.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5 bg-white border border-destructive/30 text-destructive text-xs font-semibold rounded-full px-3 py-1">
                {p.icono} {p.nombre}
                <span className="bg-destructive text-white rounded-full px-1.5 py-0.5 text-[10px]">{p.stock}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ventas Hoy"     value={String(ventasHoy)}        sub="facturas emitidas" />
        <StatCard label="Ingresos Hoy"   value={fmtColones(ingresosHoy)}  sub="antes de impuestos" color="text-[#C4432D]" />
        <StatCard label="IVA Cobrado Hoy" value={fmtColones(ivaHoy)}      sub="13% sobre gravados"  color="text-[#D4A35A]" />
        <StatCard label="Total Mes"      value={fmtColones(totalMes)}     sub="ingresos del mes" />
      </div>

      {/* Recientes + Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/historial')}>Ver todas</Button>
          </CardHeader>
          <CardContent className="pt-2">
            {recientes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay ventas aún</p>
            ) : (
              <div className="space-y-0">
                {recientes.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                    <div className="font-serif text-[15px] text-primary min-w-[70px]">{v.codigoFactura}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{v.cliente}</div>
                      <div className="text-[11px] text-muted-foreground">{fmtFecha(v.fecha)} · {v.metodoPago}</div>
                    </div>
                    <div className="font-bold text-[15px] text-[#C4432D] shrink-0">{fmtColones(v.total)}</div>
                    <Badge variant={v.estado === 'anulada' ? 'destructive' : 'default'} className="text-[9px]">
                      {v.estado ?? 'pagada'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {topProductos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos aún</p>
            ) : (
              <div className="space-y-3 pt-2">
                {topProductos.map(([nombre, qty]) => (
                  <div key={nombre}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium truncate">{nombre}</span>
                      <span className="text-[#C4432D] font-bold shrink-0 ml-2">{qty} uds.</span>
                    </div>
                    <div className="bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#C4432D] h-full rounded-full transition-all duration-700"
                        style={{ width: `${(qty / (topProductos[0]?.[1] ?? 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
