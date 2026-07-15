import { useMemo } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { ordenesRepository } from '@/repositories'
import { isoFecha } from '@/lib/utils'
import { useUIStore } from '@/store'
import { Tv, Trash2, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Orden, EstadoOrden } from '@/types'

const ESTADOS: { key: EstadoOrden; label: string; emoji: string }[] = [
  { key: 'recibida',   label: 'Orden Recibida',      emoji: '📋' },
  { key: 'preparando', label: 'Preparando',           emoji: '👨‍🍳' },
  { key: 'horneando',  label: 'En el Horno',          emoji: '🔥' },
  { key: 'listo',      label: '¡Listo para Retirar!', emoji: '✅' },
  { key: 'entregado',  label: 'Entregado',            emoji: '🎉' },
]

export default function Ordenes() {
  const ordenes = useCollection<Orden>(() => hCol('ordenes'))
  const { showToast } = useUIStore()
  const hoy = isoFecha()

  const activas = useMemo(() =>
    (ordenes ?? [])
      .filter((o) => o.creadoEn.startsWith(hoy) && o.estado !== 'entregado')
      .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()),
    [ordenes, hoy]
  )

  async function cambiarEstado(o: Orden, estado: EstadoOrden) {
    try {
      await ordenesRepository.actualizar(o.id, { estado, actualizadoEn: new Date().toISOString() })
    } catch (err) {
      console.error(err)
      showToast('Error al actualizar la orden', 'error')
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Quitar esta orden de la pantalla?')) return
    try {
      await ordenesRepository.eliminar(id)
    } catch (err) {
      console.error(err)
      showToast('Error al eliminar la orden', 'error')
    }
  }

  function abrirPantalla() {
    const url = window.location.href.split('#')[0] + '#/pantalla-cocina'
    const w = window.open(url, 'lavera_pantalla', 'width=1920,height=1080')
    if (!w) showToast('Permití las ventanas emergentes para abrir la pantalla', 'warning')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-primary">Órdenes de Hoy</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se generan automáticamente al procesar una venta en Nueva Venta
          </p>
        </div>
        <Button onClick={abrirPantalla}>
          <Tv size={14}/> Abrir Pantalla Cocina
        </Button>
      </div>

      {ordenes === undefined ? (
        <div className="bg-white border border-border rounded-xl py-16 text-center text-muted-foreground">
          Cargando órdenes…
        </div>
      ) : activas.length === 0 ? (
        <div className="bg-white border border-border rounded-xl py-16 text-center text-muted-foreground">
          <ChefHat size={36} className="mx-auto mb-3 opacity-40" />
          No hay órdenes activas todavía
        </div>
      ) : (
        <div className="space-y-3">
          {activas.map((o) => (
            <div key={o.id} className="bg-white border border-border rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="font-serif text-2xl font-black text-[#D4A35A] w-14 text-center shrink-0">
                #{o.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-primary truncate">{o.cliente}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {o.detalle || (o.mesa ? `Mesa ${o.mesa}` : 'Sin detalle')}
                </div>
              </div>
              <select
                value={o.estado}
                onChange={(e) => cambiarEstado(o, e.target.value as EstadoOrden)}
                className="border-2 border-[#D4A35A] rounded-lg px-3 py-2 text-xs font-semibold text-primary bg-secondary focus:outline-none shrink-0"
              >
                {ESTADOS.map((e) => (
                  <option key={e.key} value={e.key}>{e.emoji} {e.label}</option>
                ))}
              </select>
              <button
                onClick={() => eliminar(o.id)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                title="Quitar de la pantalla"
              >
                <Trash2 size={16}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
