import { useEffect, useState, useMemo, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { isoFecha, cn } from '@/lib/utils'
import { desbloquearAudio, sonarOrdenLista } from '@/lib/sound'
import type { Orden, EstadoOrden } from '@/types'

const ESTADO_CONFIG: Record<EstadoOrden, {
  label: string; emoji: string; bg: string; border: string
  badgeBg: string; badgeColor: string; badgeBorder: string
  stripe: string; pulse?: boolean
}> = {
  recibida:   { label: 'Orden Recibida',       emoji: '📋', bg: '#1a2b35', border: 'rgba(212,163,90,.35)', badgeBg: 'rgba(212,163,90,.18)', badgeColor: '#D4A35A', badgeBorder: 'rgba(212,163,90,.4)',  stripe: '#D4A35A' },
  preparando: { label: 'Preparando',           emoji: '👨‍🍳', bg: '#2e1c1a', border: 'rgba(196,67,45,.45)',  badgeBg: 'rgba(196,67,45,.2)',   badgeColor: '#f08070', badgeBorder: 'rgba(196,67,45,.45)', stripe: '#C4432D', pulse: true },
  horneando:  { label: 'En el Horno',          emoji: '🔥', bg: '#2b1f0e', border: 'rgba(220,140,30,.5)',  badgeBg: 'rgba(220,140,30,.2)',  badgeColor: '#f0a040', badgeBorder: 'rgba(220,140,30,.5)', stripe: '#dc8c1e', pulse: true },
  listo:      { label: '¡Listo para Retirar!', emoji: '✅', bg: '#0e2416', border: 'rgba(60,180,90,.55)',  badgeBg: 'rgba(60,200,90,.2)',   badgeColor: '#5de882', badgeBorder: 'rgba(60,200,90,.5)',  stripe: '#3dcc6a' },
  entregado:  { label: 'Entregado',            emoji: '🎉', bg: '#111',    border: 'transparent',           badgeBg: 'transparent',          badgeColor: '#fff',    badgeBorder: 'transparent',           stripe: 'transparent' },
}

const TICKER = [
  'Masa Madre, Fermentación Lenta',
  'Ingredientes Reales, Sabor Auténtico',
  'Horneado a Alta Temperatura',
  'Hecho con Pasión en cada pizza',
  'Simple. Auténtica. Inolvidable.',
]

export default function PantallaCocina() {
  const ordenes = useCollection<Orden>(() => hCol('ordenes'))
  const [hora, setHora] = useState('')
  const [audioListo, setAudioListo] = useState(false)
  const [sonidoOn, setSonidoOn]     = useState(true)
  const hoy = isoFecha()

  // Detecta transiciones de estado → "listo" para disparar el sonido
  const estadosPrevios  = useRef<Map<string, EstadoOrden>>(new Map())
  const primeraCarga    = useRef(true)

  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!ordenes) return
    const anteriores = estadosPrevios.current
    if (!primeraCarga.current && audioListo && sonidoOn) {
      const huboNuevoListo = ordenes.some((o) => o.estado === 'listo' && anteriores.get(o.id) !== 'listo')
      if (huboNuevoListo) sonarOrdenLista()
    }
    primeraCarga.current = false
    estadosPrevios.current = new Map(ordenes.map((o) => [o.id, o.estado]))
  }, [ordenes, audioListo, sonidoOn])

  async function activarAudio() {
    await desbloquearAudio()
    setAudioListo(true)
  }

  const visibles = useMemo(() =>
    (ordenes ?? [])
      .filter((o) => o.creadoEn.startsWith(hoy) && o.estado !== 'entregado')
      .sort((a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime()),
    [ordenes, hoy]
  )

  return (
    <div
      className="min-h-screen flex flex-col bg-[#1E2D24]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 15% 20%, rgba(212,163,90,.06) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 85% 75%, rgba(196,67,45,.05) 0%, transparent 55%)',
      }}
    >
      {/* Overlay: activar audio (requiere un gesto del usuario en esta pantalla) */}
      {!audioListo && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <button
            onClick={activarAudio}
            className="flex flex-col items-center gap-4 bg-[#D4A35A] hover:bg-[#c99548] text-[#1E2D24] rounded-3xl px-16 py-12 transition-colors shadow-2xl"
          >
            <Volume2 size={56} />
            <span className="font-serif text-3xl font-black">Activar Sonido</span>
            <span className="text-sm font-semibold opacity-70">Tocá para avisar con sonido cuando una orden esté lista</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#222] px-14 py-5 flex items-center justify-between border-b-4 border-[#D4A35A] shrink-0">
        <div className="leading-none">
          <div className="font-serif text-[#D4A35A] text-sm tracking-[.22em] uppercase">— La —</div>
          <div className="font-serif text-[#F2ECE3] text-5xl font-black leading-[.88]">VERA</div>
          <div className="font-serif text-[#C4432D] text-xl font-bold tracking-[.18em] uppercase">— Pizza —</div>
        </div>
        <div className="font-serif text-[#D4A35A] text-4xl font-bold tracking-wide">{hora}</div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="font-serif text-[#F2ECE3] text-2xl font-bold mb-1.5">Simple. Auténtica. Inolvidable.</div>
            <div className="text-[#D4A35A] text-xs font-medium tracking-[.18em] uppercase">Masa madre, sabor que se siente</div>
          </div>
          {audioListo && (
            <button
              onClick={() => setSonidoOn((v) => !v)}
              className="text-[#F2ECE3]/50 hover:text-[#F2ECE3] transition-colors shrink-0"
              title={sonidoOn ? 'Silenciar avisos' : 'Activar avisos'}
            >
              {sonidoOn ? <Volume2 size={22}/> : <VolumeX size={22}/>}
            </button>
          )}
        </div>
      </div>

      {/* Grid de órdenes */}
      <div
        className="flex-1 p-14 grid gap-7 content-start"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}
      >
        {visibles.length === 0 ? (
          <div className="col-span-full text-center py-24">
            <div className="text-8xl mb-6 opacity-20">🌿</div>
            <p className="font-serif text-[#F2ECE3]/25 text-3xl">Las órdenes aparecerán aquí</p>
          </div>
        ) : visibles.map((o) => {
          const c = ESTADO_CONFIG[o.estado]
          return (
            <div
              key={o.id}
              className="rounded-2xl overflow-hidden relative animate-fade-in-up"
              style={{
                background: c.bg,
                border: `2px solid ${c.border}`,
                boxShadow: o.estado === 'listo' ? '0 0 30px rgba(60,200,90,.15), 0 4px 20px rgba(0,0,0,.3)' : undefined,
              }}
            >
              <div className="h-1.5 w-full" style={{ background: c.stripe }} />
              <div
                className="px-6 pt-4 pb-4 flex items-end justify-between border-b border-white/[.07]"
                style={{ background: 'rgba(0,0,0,.28)' }}
              >
                <div className="leading-none">
                  <span className="block text-[13px] text-[#F2ECE3]/40 uppercase tracking-wide mb-0.5">Orden</span>
                  <span className="font-serif text-[56px] font-black text-[#D4A35A] leading-none">#{o.num}</span>
                </div>
                <div className="text-5xl leading-none" style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,.15))' }}>
                  {c.emoji}
                </div>
              </div>
              <div className="px-6 pt-5 pb-7">
                <div
                  className="font-serif text-[#F2ECE3] text-3xl font-bold mb-1.5 leading-tight"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,.4)' }}
                >
                  {o.cliente}
                </div>
                <div className="text-sm text-[#F2ECE3]/50 font-medium mb-5">
                  {o.detalle || (o.mesa ? `Mesa ${o.mesa}` : 'Mostrador')}
                </div>
                <div
                  className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-base font-bold uppercase tracking-wide w-full"
                  style={{ background: c.badgeBg, color: c.badgeColor, border: `1.5px solid ${c.badgeBorder}` }}
                >
                  <span
                    className={cn('w-3.5 h-3.5 rounded-full shrink-0', c.pulse && 'animate-pulse')}
                    style={{ background: c.badgeColor }}
                  />
                  <span className="flex-1">{c.label}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ticker */}
      <div className="bg-[#C4432D] py-3 overflow-hidden whitespace-nowrap border-t-2 border-white/10 shrink-0">
        <div className="inline-block animate-lavera-ticker">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span
              key={i}
              className="text-sm font-semibold tracking-widest uppercase text-white/90 px-11 before:content-['🌿'] before:mr-3"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
