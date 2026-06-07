import { useState, useMemo } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { fmtColones, isoMes } from '@/lib/utils'
import type { Venta } from '@/types'

type Rango = 'hoy' | 'semana' | 'mes' | 'custom'

export default function Reportes() {
  const ventas = useCollection<Venta>(() => hCol('ventas'))
  const [rango, setRango] = useState<Rango>('mes')
  const [fechaInicio, setFechaInicio] = useState(isoMes() + '-01')
  const [fechaFin, setFechaFin]       = useState(new Date().toISOString().slice(0, 10))

  function rangoFechas() {
    const hoy = new Date()
    const iso  = (d: Date) => d.toISOString().slice(0, 10)
    if (rango === 'hoy') return { ini: iso(hoy), fin: iso(hoy) }
    if (rango === 'semana') {
      const inicio = new Date(hoy); inicio.setDate(hoy.getDate() - 6)
      return { ini: iso(inicio), fin: iso(hoy) }
    }
    if (rango === 'mes') {
      return { ini: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10), fin: iso(hoy) }
    }
    return { ini: fechaInicio, fin: fechaFin }
  }

  const { ini, fin } = rangoFechas()

  const filtradas = useMemo(() => {
    return (ventas ?? []).filter((v) => {
      const d = v.fecha.slice(0, 10)
      return d >= ini && d <= fin && v.estado !== 'anulada'
    })
  }, [ventas, ini, fin])

  const stats = useMemo(() => {
    const totalIngresos    = filtradas.reduce((s, v) => s + v.total, 0)
    const totalIva         = filtradas.reduce((s, v) => s + v.iva, 0)
    const totalDescuentos  = filtradas.reduce((s, v) => s + (v.descuento ?? 0), 0)
    const numVentas        = filtradas.length
    const promedio         = numVentas ? totalIngresos / numVentas : 0

    // Por método de pago
    const porMetodo: Record<string, { count: number; total: number }> = {}
    filtradas.forEach((v) => {
      if (!porMetodo[v.metodoPago]) porMetodo[v.metodoPago] = { count: 0, total: 0 }
      porMetodo[v.metodoPago].count += 1
      porMetodo[v.metodoPago].total += v.total
    })

    // Por día
    const porDia: Record<string, number> = {}
    filtradas.forEach((v) => {
      const d = v.fecha.slice(0, 10)
      porDia[d] = (porDia[d] ?? 0) + v.total
    })

    // Por categoría (top productos)
    const porProducto: Record<string, number> = {}
    filtradas.forEach((v) => v.items.forEach((i) => {
      porProducto[i.nombre] = (porProducto[i.nombre] ?? 0) + i.qty
    }))

    return { totalIngresos, totalIva, totalDescuentos, numVentas, promedio, porMetodo, porDia, porProducto }
  }, [filtradas])

  const topDias = Object.entries(stats.porDia).sort((a, b) => b[1] - a[1]).slice(0, 7)
  const topProds = Object.entries(stats.porProducto).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const RANGOS: { key: Rango; label: string }[] = [
    { key: 'hoy',    label: 'Hoy' },
    { key: 'semana', label: 'Esta semana' },
    { key: 'mes',    label: 'Este mes' },
    { key: 'custom', label: 'Personalizado' },
  ]

  return (
    <div className="space-y-6">
      {/* Selector de rango */}
      <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
        {RANGOS.map(({ key, label }) => (
          <button key={key} onClick={() => setRango(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${rango === key ? 'bg-[#1E2D24] border-[#1E2D24] text-white' : 'border-border text-muted-foreground hover:border-[#1E2D24]/40'}`}>
            {label}
          </button>
        ))}
        {rango === 'custom' && (
          <div className="flex gap-2 items-center ml-auto">
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            <span className="text-muted-foreground text-xs">→</span>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total ingresos',   value: fmtColones(stats.totalIngresos),   color: 'text-[#C4432D]' },
          { label: 'IVA cobrado',      value: fmtColones(stats.totalIva),         color: 'text-[#D4A35A]' },
          { label: 'Descuentos dados', value: fmtColones(stats.totalDescuentos),  color: 'text-muted-foreground' },
          { label: 'Nº de ventas',     value: String(stats.numVentas),            color: 'text-primary' },
          { label: 'Ticket promedio',  value: fmtColones(stats.promedio),          color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-border rounded-xl p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
            <div className={`font-serif text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Por método + top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Métodos de pago */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-serif text-base text-primary mb-4">Por Método de Pago</h3>
          {Object.keys(stats.porMetodo).length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.porMetodo).map(([metodo, { count, total }]) => (
                <div key={metodo}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold capitalize">{metodo}</span>
                    <span className="text-muted-foreground text-xs">{count} ventas · <span className="font-bold text-[#C4432D]">{fmtColones(total)}</span></span>
                  </div>
                  <div className="bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-[#C4432D] h-full rounded-full" style={{ width: `${(total / (stats.totalIngresos || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-serif text-base text-primary mb-4">Productos Más Vendidos</h3>
          {topProds.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin datos</p>
          ) : (
            <div className="space-y-2.5">
              {topProds.map(([nombre, qty], i) => (
                <div key={nombre} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{nombre}</span>
                      <span className="text-[#C4432D] font-bold shrink-0 ml-2">{qty}</span>
                    </div>
                    <div className="bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#D4A35A] h-full rounded-full" style={{ width: `${(qty / (topProds[0]?.[1] ?? 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ventas por día */}
      {topDias.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-serif text-base text-primary mb-4">Ingresos por Día</h3>
          <div className="space-y-2">
            {topDias.sort((a, b) => a[0].localeCompare(b[0])).map(([dia, total]) => (
              <div key={dia}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground text-xs">{dia}</span>
                  <span className="font-bold text-[#C4432D] text-sm">{fmtColones(total)}</span>
                </div>
                <div className="bg-secondary rounded-full h-2 overflow-hidden">
                  <div className="bg-[#1E2D24] h-full rounded-full" style={{ width: `${(total / Math.max(...Object.values(stats.porDia))) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
