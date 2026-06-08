import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { seedFirestoreIfEmpty } from '@/lib/seedFirestore'
import Login          from '@/pages/Login'
import SelectorCajero from '@/pages/SelectorCajero'
import Router         from '@/router'
import { useCajeroStore } from '@/store'

const ALLOWED_EMAILS = (import.meta.env.VITE_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean)

export default function App() {
  const [user,    setUser]    = useState<User | null | undefined>(undefined)
  const [allowed, setAllowed] = useState(false)
  const cajeroActivo = useCajeroStore((s) => s.cajeroActivo)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) { setAllowed(false); return }

      const email = u.email?.toLowerCase() ?? ''
      const ok = ALLOWED_EMAILS.length === 0 || ALLOWED_EMAILS.includes(email)
      setAllowed(ok)

      if (ok) {
        // Fire-and-forget: no bloquea la UI mientras siembra datos iniciales
        seedFirestoreIfEmpty().catch((e) => console.error('Seed error', e))
      }
    })
    return unsub
  }, [])

  // Cargando autenticación
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#1E2D24] flex items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-[#F2ECE3] text-5xl font-black mb-2">VERA</div>
          <div className="text-[#D4A35A] text-xs tracking-[2px]">Cargando…</div>
        </div>
      </div>
    )
  }

  // No autenticado
  if (!user) return <Login />

  // Autenticado pero no autorizado
  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#1E2D24] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="font-serif text-[#F2ECE3] text-5xl font-black mb-4">VERA</div>
          <div className="bg-white/10 rounded-2xl p-6">
            <div className="text-[#C4432D] text-4xl mb-3">⛔</div>
            <h2 className="text-[#F2ECE3] font-semibold mb-2">Acceso no autorizado</h2>
            <p className="text-[#F2ECE3]/60 text-sm mb-4">
              Tu cuenta <strong className="text-[#F2ECE3]/80">{user.email}</strong> no tiene acceso a este sistema.
            </p>
            <button
              onClick={() => auth.signOut()}
              className="bg-[#C4432D] text-white text-sm font-semibold rounded-xl px-6 py-2.5 hover:bg-[#C4432D]/80 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!cajeroActivo) return <SelectorCajero />

  return <Router />
}
