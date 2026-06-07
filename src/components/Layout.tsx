import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import ToastContainer from './Toast'
import { useUIStore } from '@/store'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

const PAGE_TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/nueva-venta':   'Nueva Venta',
  '/mesas':         'Gestión de Mesas',
  '/historial':     'Historial de Ventas',
  '/catalogo':      'Catálogo de Productos',
  '/clientes':      'Clientes',
  '/reportes':      'Reportes',
  '/configuracion': 'Configuración',
}

export default function Layout() {
  const { toggleSidebar } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()
  const title = PAGE_TITLES[location.pathname] ?? 'La Vera Pizza'
  const [fecha, setFecha] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const opts: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      const hora = now.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
      setFecha(now.toLocaleDateString('es-CR', opts) + ' · ' + hora)
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:ml-[220px] min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu size={22} className="text-primary" />
            </button>
            <h1 className="font-serif text-[22px] text-primary">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block bg-[#F2ECE3] text-primary border border-border rounded-full px-3.5 py-1 text-xs font-medium">
              {fecha}
            </span>
            <Button size="sm" onClick={() => navigate('/nueva-venta')}>
              <Plus size={14} /> Nueva Venta
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 animate-fade-in-up">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
