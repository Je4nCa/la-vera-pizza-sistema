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

// Con pocas órdenes, tarjetas grandes y cómodas de leer de lejos. A medida
// que hay más órdenes activas a la vez, las tarjetas se van achicando para
// que quepan todas en pantalla sin necesidad de hacer scroll.
function densidadPara(n: number) {
  if (n <= 6)  return { minCard: 360, gap: 28, padding: 56, orderNum: 56, emoji: 48, clientName: 30, detail: 14, badge: 16, badgePad: '14px 22px', stripe: 6, top: '16px 24px' }
  if (n <= 12) return { minCard: 280, gap: 20, padding: 36, orderNum: 40, emoji: 36, clientName: 22, detail: 13, badge: 13, badgePad: '10px 16px', stripe: 5, top: '12px 20px' }
  if (n <= 20) return { minCard: 220, gap: 14, padding: 24, orderNum: 30, emoji: 26, clientName: 17, detail: 11, badge: 11, badgePad: '8px 14px',  stripe: 4, top: '10px 16px' }
  return         { minCard: 180, gap: 10, padding: 16, orderNum: 22, emoji: 20, clientName: 14, detail: 10, badge: 10, badgePad: '6px 12px',  stripe: 3, top: '8px 12px' }
}

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

  const d = densidadPara(visibles.length)

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

      {/* Grid de órdenes — la densidad (tamaño de tarjeta/letra) se recalcula
          según cuántas órdenes activas hay, para que todas quepan sin scroll */}
      <div
        className="flex-1 grid content-start transition-all duration-300"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${d.minCard}px, 1fr))`, gap: d.gap, padding: d.padding }}
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
              <div style={{ height: d.stripe, width: '100%', background: c.stripe }} />
              <div
                className="flex items-end justify-between border-b border-white/[.07]"
                style={{ background: 'rgba(0,0,0,.28)', padding: d.top }}
              >
                <div className="leading-none">
                  <span className="block text-[#F2ECE3]/40 uppercase tracking-wide mb-0.5" style={{ fontSize: Math.max(10, d.detail - 2) }}>Orden</span>
                  <span className="font-serif font-black text-[#D4A35A] leading-none" style={{ fontSize: d.orderNum }}>#{o.num}</span>
                </div>
                <div className="leading-none" style={{ fontSize: d.emoji, filter: 'drop-shadow(0 0 12px rgba(255,255,255,.15))' }}>
                  {c.emoji}
                </div>
              </div>
              <div style={{ padding: d.top }}>
                <div
                  className="font-serif text-[#F2ECE3] font-bold leading-tight mb-1.5"
                  style={{ fontSize: d.clientName, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}
                >
                  {o.cliente}
                </div>
                <div className="text-[#F2ECE3]/50 font-medium mb-4" style={{ fontSize: d.detail }}>
                  {o.detalle || (o.mesa ? `Mesa ${o.mesa}` : 'Mostrador')}
                </div>
                <div
                  className="flex items-center gap-3 rounded-xl font-bold uppercase tracking-wide w-full"
                  style={{ background: c.badgeBg, color: c.badgeColor, border: `1.5px solid ${c.badgeBorder}`, padding: d.badgePad, fontSize: d.badge }}
                >
                  <span
                    className={cn('rounded-full shrink-0', c.pulse && 'animate-pulse')}
                    style={{ background: c.badgeColor, width: Math.max(8, d.badge - 4), height: Math.max(8, d.badge - 4) }}
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
