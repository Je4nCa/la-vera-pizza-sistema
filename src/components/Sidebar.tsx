import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useUIStore, useCarritoStore, useCajeroStore } from '@/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingCart, Grid2x2, ClipboardList,
  Package, Users, BarChart2, Settings, LogOut, UserCircle2, Lock, ChefHat,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',              label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/nueva-venta',   label: 'Nueva Venta', icon: ShoppingCart },
  { to: '/mesas',         label: 'Mesas',       icon: Grid2x2 },
  { to: '/ordenes',       label: 'Órdenes',     icon: ChefHat },
  { to: '/historial',     label: 'Historial',   icon: ClipboardList },
  { to: '/catalogo',      label: 'Catálogo',    icon: Package },
  { to: '/clientes',      label: 'Clientes',    icon: Users },
  { to: '/reportes',      label: 'Reportes',    icon: BarChart2 },
  { to: '/cierre-caja',   label: 'Cierre Caja', icon: Lock },
  { to: '/configuracion', label: 'Config.',     icon: Settings },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const carritoItems  = useCarritoStore((s) => s.items)
  const totalItems    = carritoItems.reduce((sum, i) => sum + i.qty, 0)
  const navigate      = useNavigate()
  const { cajeroActivo, cerrarCajero } = useCajeroStore()

  async function handleLogout() {
    await signOut(auth)
    navigate('/')
  }

  return (
    <>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-[220px] bg-[#1E2D24] flex flex-col z-[100]',
          'transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="px-5 py-7 border-b border-white/10 text-center">
          <div className="text-[#C4432D] text-[10px] font-semibold tracking-[3px] uppercase">— La —</div>
          <div className="font-serif text-[#F2ECE3] text-4xl font-black leading-none">VERA</div>
          <div className="font-serif text-[#C4432D] text-base font-bold tracking-[2px]">PIZZA</div>
          <div className="text-[#D4A35A] text-[9px] tracking-[1.5px] mt-1.5 uppercase">Masa Madre, Sabor que se Siente</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-[1px]',
                  'border-l-[3px] transition-all duration-150',
                  isActive
                    ? 'bg-[#C4432D]/15 text-[#F2ECE3] border-[#C4432D]'
                    : 'text-[#F2ECE3]/70 border-transparent hover:bg-white/7 hover:text-[#F2ECE3]'
                )
              }
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {to === '/nueva-venta' && totalItems > 0 && (
                <span className="bg-[#C4432D] text-white text-[10px] font-bold rounded-xl px-1.5 py-0.5">
                  {totalItems}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 space-y-3">
          {/* Cajero activo */}
          {cajeroActivo && (
            <div className="bg-white/8 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <UserCircle2 size={14} className="text-[#D4A35A] shrink-0" />
                <span className="text-[#F2ECE3] text-xs font-semibold truncate">{cajeroActivo.nombre}</span>
              </div>
              <button
                onClick={cerrarCajero}
                className="text-[#F2ECE3]/40 text-[10px] uppercase tracking-wide hover:text-[#D4A35A] transition-colors"
              >
                Cambiar cajero
              </button>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#F2ECE3]/40 text-[10px] uppercase tracking-wide hover:text-[#F2ECE3]/70 transition-colors w-full"
          >
            <LogOut size={13} />
            Cerrar Sesión
          </button>
          <div className="text-[#F2ECE3]/25 text-[9px] text-center">
            Montevo Studio © | POS v2.0
          </div>
        </div>
      </aside>
    </>
  )
}
