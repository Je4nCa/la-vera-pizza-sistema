import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { mesasRepository } from '@/repositories'
import { useCarritoStore, useUIStore } from '@/store'
import { cn } from '@/lib/utils'
import { Timer, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Mesa } from '@/types'

function tiempoOcupada(desde: string | null): string {
  if (!desde) return ''
  const diff = Date.now() - new Date(desde).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export default function Mesas() {
  const navigate  = useNavigate()
  const mesas     = useCollection<Mesa>(() => hCol('mesas'))
  const { showToast } = useUIStore()
  const { setMesaActiva } = useCarritoStore()
  const [selected, setSelected] = useState<Mesa | null>(null)

  async function ocuparMesa(mesa: Mesa) {
    await mesasRepository.actualizar(mesa.id, {
      ocupada: true,
      desde:   new Date().toISOString(),
      orden:   null,
    })
    setMesaActiva(mesa.num)
    navigate('/nueva-venta')
  }

  async function liberarMesa(mesa: Mesa) {
    await mesasRepository.actualizar(mesa.id, {
      ocupada: false,
      desde:   null,
      orden:   null,
    })
    setSelected(null)
    showToast(`Mesa ${mesa.num} liberada`, 'ok')
  }

  const ordenadas = [...(mesas ?? [])].sort((a, b) => a.num - b.num)

  return (
    <div className="space-y-6">
      {/* Leyenda */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-200 border border-green-400"/></span> Libre
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#C4432D] border border-[#C4432D]"/></span> Ocupada
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {ordenadas.map((mesa) => (
          <button
            key={mesa.id}
            onClick={() => setSelected(mesa)}
            className={cn(
              'rounded-2xl border-2 p-5 text-center transition-all hover:shadow-md active:scale-[0.97]',
              mesa.ocupada
                ? 'bg-[#C4432D]/8 border-[#C4432D]/40 hover:border-[#C4432D]'
                : 'bg-white border-border hover:border-[#1E2D24]/40',
              selected?.id === mesa.id && 'ring-2 ring-[#C4432D]'
            )}
          >
            <div className={cn(
              'font-serif text-4xl font-black mb-2',
              mesa.ocupada ? 'text-[#C4432D]' : 'text-[#1E2D24]'
            )}>{mesa.num}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Mesa
            </div>
            {mesa.ocupada && mesa.desde && (
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-[#C4432D] font-semibold">
                <Timer size={11}/> {tiempoOcupada(mesa.desde)}
              </div>
            )}
            {!mesa.ocupada && (
              <div className="mt-2 text-[11px] text-green-600 font-semibold">Libre</div>
            )}
          </button>
        ))}
      </div>

      {/* Panel de detalle de mesa seleccionada */}
      {selected && (
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6 max-w-sm animate-fade-in-up">
          <h2 className="font-serif text-xl text-primary mb-1">Mesa {selected.num}</h2>
          <div className={cn('text-sm font-semibold mb-4', selected.ocupada ? 'text-[#C4432D]' : 'text-green-600')}>
            {selected.ocupada ? '● Ocupada' : '● Libre'}
          </div>
          {selected.ocupada && selected.desde && (
            <p className="text-sm text-muted-foreground mb-4">
              Ocupada hace <strong>{tiempoOcupada(selected.desde)}</strong>
            </p>
          )}
          <div className="flex flex-col gap-2">
            {!selected.ocupada ? (
              <Button onClick={() => ocuparMesa(selected)}>
                <ShoppingCart size={14}/> Abrir Mesa y Nueva Venta
              </Button>
            ) : (
              <>
                <Button onClick={() => { setMesaActiva(selected.num); navigate('/nueva-venta') }}>
                  <ShoppingCart size={14}/> Ir a Nueva Venta
                </Button>
                <Button variant="outline" onClick={() => liberarMesa(selected)}>
                  <CheckCircle2 size={14}/> Liberar Mesa
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setSelected(null)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
