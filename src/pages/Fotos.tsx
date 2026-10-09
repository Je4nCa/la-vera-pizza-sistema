/**
 * Photo manager for the customer-facing screen: upload, reorder, toggle and remove images.
 */
import { useMemo, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { fotosRepository, fotosDataRepository } from '@/repositories'
import { comprimirImagen, fmtPeso } from '@/lib/imagen'
import { sinUndefined, cn } from '@/lib/utils'
import { useUIStore } from '@/store'
import { Tv, Trash2, ImagePlus, ArrowUp, ArrowDown, Eye, EyeOff, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FotoPantalla, FotoPantallaData } from '@/types'

export default function Fotos() {
  const fotos = useCollection<FotoPantalla>(() => hCol('fotos'))
  const { showToast } = useUIStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState<{ actual: number; total: number } | null>(null)

  const ordenadas = useMemo(
    () => [...(fotos ?? [])].sort((a, b) => a.orden - b.orden),
    [fotos],
  )

  async function subirArchivos(files: FileList) {
    const lista = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (lista.length === 0) {
      showToast('Seleccioná al menos una imagen', 'warning')
      return
    }

    let ordenBase = ordenadas.length > 0 ? Math.max(...ordenadas.map((f) => f.orden)) + 1 : 0
    let ok = 0

    for (let i = 0; i < lista.length; i++) {
      setSubiendo({ actual: i + 1, total: lista.length })
      const file = lista[i]
      try {
        const { dataUrl, thumb, peso } = await comprimirImagen(file)
        const id = nanoid()

        // Primero la imagen completa; si esto falla no queda un metadato huérfano
        const data: FotoPantallaData = { id, dataUrl }
        await fotosDataRepository.crear(sinUndefined(data) as unknown as FotoPantallaData)

        const meta: FotoPantalla = {
          id,
          nombre:   file.name,
          thumb,
          orden:    ordenBase++,
          activa:   true,
          peso,
          creadoEn: new Date().toISOString(),
        }
        await fotosRepository.crear(sinUndefined(meta) as unknown as FotoPantalla)
        ok++
      } catch (err) {
        console.error('[Fotos] Error al subir', file.name, err)
        showToast(
          err instanceof Error ? `${file.name}: ${err.message}` : `Error con ${file.name}`,
          'error',
        )
      }
    }

    setSubiendo(null)
    if (inputRef.current) inputRef.current.value = ''
    if (ok > 0) showToast(`${ok} foto${ok > 1 ? 's' : ''} agregada${ok > 1 ? 's' : ''} ✓`, 'ok')
  }

  async function eliminar(foto: FotoPantalla) {
    if (!confirm(`¿Eliminar "${foto.nombre}" de la pantalla?`)) return
    try {
      await Promise.all([
        fotosRepository.eliminar(foto.id),
        fotosDataRepository.eliminar(foto.id),
      ])
      showToast('Foto eliminada', 'ok')
    } catch (err) {
      console.error(err)
      showToast('Error al eliminar la foto', 'error')
    }
  }

  async function toggleActiva(foto: FotoPantalla) {
    try {
      await fotosRepository.actualizar(foto.id, { activa: !foto.activa })
    } catch (err) {
      console.error(err)
      showToast('Error al actualizar la foto', 'error')
    }
  }

  /** Intercambia el campo `orden` con el vecino, para mover la foto en la secuencia */
  async function mover(foto: FotoPantalla, dir: -1 | 1) {
    const i = ordenadas.findIndex((f) => f.id === foto.id)
    const vecino = ordenadas[i + dir]
    if (!vecino) return
    try {
      await Promise.all([
        fotosRepository.actualizar(foto.id,   { orden: vecino.orden }),
        fotosRepository.actualizar(vecino.id, { orden: foto.orden }),
      ])
    } catch (err) {
      console.error(err)
      showToast('Error al reordenar', 'error')
    }
  }

  function abrirPantalla() {
    const url = window.location.href.split('#')[0] + '#/pantalla-fotos'
    const w = window.open(url, 'lavera_fotos', 'width=1920,height=1080')
    if (!w) showToast('Permití las ventanas emergentes para abrir la pantalla', 'warning')
  }

  const activas = ordenadas.filter((f) => f.activa).length

  return (
    <div className="max-w-4xl space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-serif text-xl text-primary">Fotos de la Pantalla</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activas} de {ordenadas.length} activas · se muestran en orden, en bucle
          </p>
        </div>
        <Button onClick={abrirPantalla}>
          <Tv size={14}/> Abrir Pantalla
        </Button>
      </div>

      {/* Zona de carga */}
      <div className="bg-white border-2 border-dashed border-border rounded-xl p-6 text-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && subirArchivos(e.target.files)}
        />
        <ImagePlus size={32} className="mx-auto mb-3 text-muted-foreground" />
        <Button onClick={() => inputRef.current?.click()} disabled={!!subiendo}>
          {subiendo
            ? `Subiendo ${subiendo.actual} de ${subiendo.total}…`
            : 'Agregar Fotos'}
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Desde el celular podés tomar la foto en el momento o elegirla de la galería.
          Se comprimen solas antes de guardarse.
        </p>
      </div>

      {/* Lista */}
      {fotos === undefined ? (
        <div className="bg-white border border-border rounded-xl py-16 text-center text-muted-foreground">
          Cargando fotos…
        </div>
      ) : ordenadas.length === 0 ? (
        <div className="bg-white border border-border rounded-xl py-16 text-center text-muted-foreground">
          <Images size={36} className="mx-auto mb-3 opacity-40" />
          Todavía no hay fotos en la pantalla
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordenadas.map((foto, i) => (
            <div
              key={foto.id}
              className={cn(
                'bg-white border border-border rounded-xl overflow-hidden transition-opacity',
                !foto.activa && 'opacity-50',
              )}
            >
              <div className="relative aspect-video bg-secondary">
                <img src={foto.thumb} alt={foto.nombre} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                  #{i + 1}
                </span>
                {!foto.activa && (
                  <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold rounded-full px-2 py-0.5">
                    Oculta
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="text-xs font-semibold truncate" title={foto.nombre}>{foto.nombre}</div>
                <div className="text-[11px] text-muted-foreground mb-3">{fmtPeso(foto.peso)}</div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => mover(foto, -1)}
                    disabled={i === 0}
                    className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 transition-colors"
                    title="Mover antes"
                  >
                    <ArrowUp size={13}/>
                  </button>
                  <button
                    onClick={() => mover(foto, 1)}
                    disabled={i === ordenadas.length - 1}
                    className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 transition-colors"
                    title="Mover después"
                  >
                    <ArrowDown size={13}/>
                  </button>
                  <button
                    onClick={() => toggleActiva(foto)}
                    className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors ml-auto"
                    title={foto.activa ? 'Ocultar de la pantalla' : 'Mostrar en la pantalla'}
                  >
                    {foto.activa ? <Eye size={13}/> : <EyeOff size={13}/>}
                  </button>
                  <button
                    onClick={() => eliminar(foto)}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
