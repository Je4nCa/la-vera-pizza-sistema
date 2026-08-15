import { useEffect, useMemo, useRef, useState } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import type { FotoPantalla, FotoPantallaData } from '@/types'

/** Milisegundos que se muestra cada foto (incluye el fundido) */
const DURACION = 7000
/** Debe coincidir con la duración de la transición de opacidad del CSS */
const FUNDIDO = 1200

export default function PantallaFotos() {
  const metas = useCollection<FotoPantalla>(() => hCol('fotos'))
  const datos = useCollection<FotoPantallaData>(() => hCol('fotosData'))
  const [indice, setIndice] = useState(0)
  // Foto que está saliendo: se mantiene opaca DEBAJO de la entrante mientras
  // dura el fundido, y se libera al terminar para que pueda volver a
  // aparecer con fundido cuando le toque de nuevo (caso de 2 fotos).
  const [saliente, setSaliente] = useState<number | null>(null)
  const indiceAnterior = useRef(0)

  // Une metadatos con la imagen completa; descarta las que todavía no llegaron
  const slides = useMemo(() => {
    if (!metas || !datos) return []
    const porId = new Map(datos.map((d) => [d.id, d.dataUrl]))
    return metas
      .filter((m) => m.activa && porId.has(m.id))
      .sort((a, b) => a.orden - b.orden)
      .map((m) => ({ id: m.id, url: porId.get(m.id)! }))
  }, [metas, datos])

  // Avance automático en bucle
  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setIndice((i) => (i + 1) % slides.length), DURACION)
    return () => clearInterval(t)
  }, [slides.length])

  // Marca la foto saliente al cambiar de índice y la libera al terminar el fundido
  useEffect(() => {
    const previa = indiceAnterior.current
    if (previa === indice) return
    indiceAnterior.current = indice
    setSaliente(previa)
    const t = setTimeout(() => setSaliente(null), FUNDIDO + 100)
    return () => clearTimeout(t)
  }, [indice])

  // Si se borran fotos y el índice queda fuera de rango
  useEffect(() => {
    if (indice >= slides.length) setIndice(0)
  }, [slides.length, indice])

  const cargando = metas === undefined || datos === undefined

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Capas de fotos: todas montadas, solo cambia la opacidad — el fundido
          es puro CSS y nunca se ve el parpadeo de una imagen cargando.

          La entrante aparece POR ENCIMA (z-index) mientras la anterior sigue
          opaca debajo. Si ambas cambiaran de opacidad a la vez quedarían
          semitransparentes durante el cruce y se vería la foto vieja a través
          de la nueva: dos imágenes superpuestas y un fondo desenfocado
          embarrado. Así el cambio es una revelación limpia. */}
      {slides.map((s, i) => {
        const activa = i === indice
        const sale   = i === saliente
        return (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
            style={{
              opacity: activa || sale ? 1 : 0,
              zIndex:  activa ? 2 : sale ? 1 : 0,
            }}
          >
            {/* Fondo desenfocado de la propia foto: evita las barras negras
                cuando la imagen no tiene la proporción de la pantalla */}
            <div
              className="absolute inset-0 bg-center bg-cover scale-110"
              style={{ backgroundImage: `url("${s.url}")`, filter: 'blur(36px) brightness(0.45)' }}
            />
            {/* Foto completa, sin recortar, con un zoom lento mientras está visible */}
            <img
              src={s.url}
              alt=""
              className={cn(
                'absolute inset-0 w-full h-full object-contain',
                activa && 'animate-lavera-kenburns',
              )}
            />
          </div>
        )
      })}

      {/* Estados sin contenido */}
      {!cargando && slides.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E2D24]">
          <div className="text-8xl mb-6 opacity-20">🌿</div>
          <p className="font-serif text-[#F2ECE3]/30 text-3xl">
            Agregá fotos desde el POS
          </p>
          <p className="text-[#F2ECE3]/20 text-sm mt-2 tracking-widest uppercase">
            Configuración · Fotos
          </p>
        </div>
      )}
      {cargando && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1E2D24]">
          <div className="font-serif text-[#F2ECE3]/40 text-2xl">Cargando…</div>
        </div>
      )}

      {/* Velo inferior para que el logo siempre se lea, sobre cualquier foto.
          z-10 obligatorio: las fotos usan z-index 1/2 para el fundido, así que
          sin esto el logo quedaría tapado por la foto activa. */}
      <div
        className="absolute inset-x-0 bottom-0 h-64 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.4) 45%, transparent)' }}
      />

      {/* Logo — siempre visible, por encima de todo */}
      <div className="absolute bottom-10 left-14 leading-none pointer-events-none z-10">
        <div className="font-serif text-[#D4A35A] text-base tracking-[.22em] uppercase drop-shadow-lg">
          — La —
        </div>
        <div className="font-serif text-[#F2ECE3] text-6xl font-black leading-[.88] drop-shadow-2xl">
          VERA
        </div>
        <div className="font-serif text-[#C4432D] text-2xl font-bold tracking-[.18em] uppercase drop-shadow-lg">
          — Pizza —
        </div>
        <div className="text-[#D4A35A] text-xs font-medium tracking-[.2em] uppercase mt-2 drop-shadow-lg">
          Masa madre, sabor que se siente
        </div>
      </div>

      {/* Indicador de posición */}
      {slides.length > 1 && (
        <div className="absolute bottom-12 right-14 flex gap-2 pointer-events-none z-10">
          {slides.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                i === indice ? 'w-7 bg-[#D4A35A]' : 'w-1.5 bg-white/35',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
