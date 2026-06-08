import { useState, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { fmtColones, isoMes } from '@/lib/utils'
import { useUIStore } from '@/store'
import type { Venta } from '@/types'

type Rango = 'hoy' | 'semana' | 'mes' | 'custom'

function chartOpts(dark: boolean) {
  const textColor = dark ? 'rgba(240,230,215,0.7)' : 'rgba(30,45,36,0.6)'
  const gridColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
      y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
    },
  } as const
}

export default function Reportes() {
  const ventas = useCollection<Venta>(() => hCol('ventas'))
  const { darkMode } = useUIStore()
  const [rango, setRango]             = useState<Rango>('mes')
  const [fechaInicio, setFechaInicio] = useState(isoMes() + '-01')
  const [fechaFin, setFechaFin]       = useState(new Date().toISOString().slice(0, 10))
  const [filtroCajero, setFiltroCajero] = useState('')

  const cajerosList = useMemo(() => {
    const map = new Map<string, string>()
    ;(ventas ?? []).forEach((v) => { if (v.cajeroId) map.set(v.cajeroId, v.cajeroNombre) })
    return [...map.entries()]
  }, [ventas])

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
      if (d < ini || d > fin || v.estado === 'anulada') return false
      if (filtroCajero && v.cajeroId !== filtroCajero) return false
      return true
    })
  }, [ventas, ini, fin, filtroCajero])

  const stats = useMemo(() => {
    const totalIngresos    = filtradas.reduce((s, v) => s + v.total, 0)
    const totalIva         = filtradas.reduce((s, v) => s + v.iva, 0)
    const totalDescuentos  = filtradas.reduce((s, v) => s + (v.descuento ?? 0), 0)
    const numVentas        = filtradas.length
    const promedio         = numVentas ? totalIngresos / numVentas : 0

    const porMetodo: Record<string, { count: number; total: number }> = {}
    filtradas.forEach((v) => {
      if (!porMetodo[v.metodoPago]) porMetodo[v.metodoPago] = { count: 0, total: 0 }
      porMetodo[v.metodoPago].count += 1
      porMetodo[v.metodoPago].total += v.total
    })

    const porDia: Record<string, number> = {}
    filtradas.forEach((v) => {
      const d = v.fecha.slice(0, 10)
      porDia[d] = (porDia[d] ?? 0) + v.total
    })

    const porProducto: Record<string, number> = {}
    filtradas.forEach((v) => v.items.forEach((i) => {
      porProducto[i.nombre] = (porProducto[i.nombre] ?? 0) + i.qty
    }))

    const porCajero: Record<string, { nombre: string; count: number; total: number }> = {}
    filtradas.forEach((v) => {
      const key = v.cajeroId || 'sin-cajero'
      if (!porCajero[key]) porCajero[key] = { nombre: v.cajeroNombre || 'Sin cajero', count: 0, total: 0 }
      porCajero[key].count += 1
      porCajero[key].total += v.total
    })

    return { totalIngresos, totalIva, totalDescuentos, numVentas, promedio, porMetodo, porDia, porProducto, porCajero }
  }, [filtradas])

  const topProds = Object.entries(stats.porProducto).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Datos para gráfica de ingresos por día
  const diasOrdenados = Object.entries(stats.porDia).sort((a, b) => a[0].localeCompare(b[0]))
  const chartDias = {
    labels: diasOrdenados.map(([d]) => {
      const fecha = new Date(d + 'T12:00:00')
      return fecha.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' })
    }),
    values: diasOrdenados.map(([, t]) => t),
  }

  // Datos para gráfica de top productos
  const topProdsChart = Object.entries(stats.porProducto).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const chartProds = {
    labels: topProdsChart.map(([n]) => n.length > 18 ? n.slice(0, 17) + '…' : n),
    values: topProdsChart.map(([, q]) => q),
  }

  const opts = chartOpts(darkMode)

  const RANGOS: { key: Rango; label: string }[] = [
    { key: 'hoy',    label: 'Hoy' },
    { key: 'semana', label: 'Esta semana' },
    { key: 'mes',    label: 'Este mes' },
    { key: 'custom', label: 'Personalizado' },
  ]

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
        {RANGOS.map(({ key, label }) => (
          <button key={key} onClick={() => setRango(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${rango === key ? 'bg-[#1E2D24] border-[#1E2D24] text-white' : 'border-border text-muted-foreground hover:border-[#1E2D24]/40'}`}>
            {label}
          </button>
        ))}
        {rango === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
            <span className="text-muted-foreground text-xs">→</span>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
          </div>
        )}
        {cajerosList.length > 0 && (
          <select value={filtroCajero} onChange={(e) => setFiltroCajero(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none ml-auto">
            <option value="">Todos los cajeros</option>
            {cajerosList.map(([id, nombre]) => (
              <option key={id} value={id}>{nombre}</option>
            ))}
          </select>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total ingresos',   value: fmtColones(stats.totalIngresos),   color: 'text-[#C4432D]' },
          { label: 'IVA cobrado',      value: fmtColones(stats.totalIva),        color: 'text-[#D4A35A]' },
          { label: 'Descuentos dados', value: fmtColones(stats.totalDescuentos), color: 'text-muted-foreground' },
          { label: 'Nº de ventas',     value: String(stats.numVentas),           color: 'text-primary' },
          { label: 'Ticket promedio',  value: fmtColones(stats.promedio),        color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-border rounded-xl p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
            <div className={`font-serif text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por día */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-serif text-base text-primary mb-4">Ingresos por Día</h3>
          {chartDias.labels.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Sin datos</p>
          ) : (
            <div className="h-52">
              <Bar
                data={{
                  labels: chartDias.labels,
                  datasets: [{ data: chartDias.values, backgroundColor: 'rgba(196,67,45,0.75)', borderRadius: 5, borderSkipped: false }],
                }}
                options={opts}
              />
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-serif text-base text-primary mb-4">Productos Más Vendidos</h3>
          {chartProds.labels.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Sin datos</p>
          ) : (
            <div className="h-52">
              <Bar
                data={{
                  labels: chartProds.labels,
                  datasets: [{ data: chartProds.values, backgroundColor: 'rgba(212,163,90,0.8)', borderRadius: 5, borderSkipped: false }],
                }}
                options={{ ...opts, indexAxis: 'y' as const }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Por método + por cajero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {Object.keys(stats.porCajero).length > 0 && (
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-serif text-base text-primary mb-4">Ventas por Cajero</h3>
            <div className="space-y-3">
              {Object.entries(stats.porCajero).sort((a, b) => b[1].total - a[1].total).map(([, { nombre, count, total }]) => (
                <div key={nombre}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{nombre}</span>
                    <span className="text-muted-foreground text-xs">{count} ventas · <span className="font-bold text-[#C4432D]">{fmtColones(total)}</span></span>
                  </div>
                  <div className="bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-[#1E2D24] h-full rounded-full" style={{ width: `${(total / (stats.totalIngresos || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {topProds.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-serif text-base text-primary mb-4">Detalle de Productos</h3>
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
        </div>
      )}
    </div>
  )
}
