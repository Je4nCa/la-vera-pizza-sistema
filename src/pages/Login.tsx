import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

export default function Login() {
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleGoogle() {
    setCargando(true)
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch {
      setError('No se pudo iniciar sesión. Intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1E2D24] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Brand */}
        <div className="text-center">
          <div className="text-[#C4432D] text-sm font-semibold tracking-[4px] uppercase mb-1">— La —</div>
          <div className="font-serif text-[#F2ECE3] text-7xl font-black leading-none">VERA</div>
          <div className="font-serif text-[#C4432D] text-2xl font-bold tracking-[3px] uppercase">PIZZA</div>
          <div className="text-[#D4A35A] text-xs tracking-[2px] uppercase mt-2">Masa Madre, Sabor que se Siente</div>
          <div className="mt-6 text-[#F2ECE3]/60 text-sm">Sistema de Facturación</div>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={cargando}
          className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-white text-gray-800 font-semibold text-sm shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {cargando ? 'Ingresando…' : 'Continuar con Google'}
        </button>

        {error && <p className="text-[#C4432D] text-sm text-center bg-white/10 rounded-lg px-4 py-2">{error}</p>}

        <p className="text-[#F2ECE3]/30 text-xs text-center">
          Montevo Studio © 2025
        </p>
      </div>
    </div>
  )
}
