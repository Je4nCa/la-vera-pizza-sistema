import { useEffect, useRef } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { useCajeroStore } from '@/store'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { seedCajerosDefault } from '@/lib/seedFirestore'
import { LogOut, UserCircle2 } from 'lucide-react'
import type { Cajero } from '@/types'

export default function SelectorCajero() {
  const cajeros         = useCollection<Cajero>(() => hCol('cajeros'))
  const setCajeroActivo = useCajeroStore((s) => s.setCajeroActivo)
  const sembrado        = useRef(false)

  // Si carga y está vacío, siembra los cajeros por defecto
  useEffect(() => {
    if (cajeros !== undefined && cajeros.length === 0 && !sembrado.current) {
      sembrado.current = true
      seedCajerosDefault().catch(console.error)
    }
  }, [cajeros])

  const activos = (cajeros ?? [])
    .filter((c) => c.activo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const cargando = cajeros === undefined

  return (
    <div className="min-h-screen bg-[#1E2D24] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="text-[#C4432D] text-[11px] font-semibold tracking-[4px] uppercase mb-1">— La —</div>
          <div className="font-serif text-[#F2ECE3] text-6xl font-black leading-none">VERA</div>
          <div className="font-serif text-[#C4432D] text-xl font-bold tracking-[3px] uppercase">PIZZA</div>
          <div className="text-[#D4A35A] text-xs tracking-[2px] uppercase mt-3">
            {cargando ? 'Un momento…' : '¿Quién atiende hoy?'}
          </div>
        </div>

        {/* Estados */}
        {cargando ? (
          /* Skeleton mientras carga */
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse h-[104px]" />
            ))}
          </div>
        ) : activos.length === 0 ? (
          /* Vacío — sembrando o sin cajeros */
          <div className="text-center bg-white/5 rounded-2xl p-8 space-y-3">
            <div className="text-3xl">⏳</div>
            <div className="text-[#F2ECE3]/70 text-sm">
              Creando cajeros por defecto…
            </div>
            <div className="text-[#F2ECE3]/30 text-xs">
              Si esto tarda más de unos segundos, recargá la página.
            </div>
          </div>
        ) : (
          /* Grid de cajeros */
          <div className="grid grid-cols-2 gap-3">
            {activos.map((cajero) => (
              <button
                key={cajero.id}
                onClick={() => setCajeroActivo(cajero)}
                className="group bg-white/8 hover:bg-[#C4432D] border border-white/10 hover:border-[#C4432D] rounded-2xl p-6 text-center transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex justify-center mb-3">
                  <UserCircle2
                    size={44}
                    className="text-[#F2ECE3]/40 group-hover:text-white transition-colors"
                  />
                </div>
                <div className="font-semibold text-[#F2ECE3] text-sm leading-tight">
                  {cajero.nombre}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Cerrar sesión */}
        <button
          onClick={() => signOut(auth)}
          className="mt-10 flex items-center gap-2 mx-auto text-[#F2ECE3]/30 text-xs hover:text-[#F2ECE3]/60 transition-colors"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
