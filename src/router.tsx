import { HashRouter, Routes, Route, Outlet } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard      from '@/pages/Dashboard'
import NuevaVenta     from '@/pages/NuevaVenta'
import Mesas          from '@/pages/Mesas'
import Historial      from '@/pages/Historial'
import Catalogo       from '@/pages/Catalogo'
import Clientes       from '@/pages/Clientes'
import Reportes       from '@/pages/Reportes'
import Configuracion  from '@/pages/Configuracion'
import CierreCaja     from '@/pages/CierreCaja'
import Ordenes        from '@/pages/Ordenes'
import PantallaCocina from '@/pages/PantallaCocina'
import FacturaPrint    from '@/pages/FacturaPrint'
import SelectorCajero  from '@/pages/SelectorCajero'
import { useCajeroStore } from '@/store'

// El selector de cajero solo debe pedirse para operar el POS (Layout).
// Pantalla Cocina y la impresión de factura se abren en una ventana nueva,
// que no comparte la selección de cajero de la pestaña principal (vive
// solo en memoria) — pedirla ahí también sería un paso extra sin sentido.
function RequireCajero() {
  const cajeroActivo = useCajeroStore((s) => s.cajeroActivo)
  if (!cajeroActivo) return <SelectorCajero />
  return <Outlet />
}

export default function Router() {
  return (
    <HashRouter>
      <Routes>
        {/* Pantalla de cocina: fullscreen, sin sidebar/topbar, sin pedir cajero */}
        <Route path="pantalla-cocina" element={<PantallaCocina />} />
        {/* Impresión de factura: ventana aparte, sin sidebar/topbar, sin pedir cajero */}
        <Route path="factura/:id" element={<FacturaPrint />} />

        <Route element={<RequireCajero />}>
          <Route element={<Layout />}>
            <Route index            element={<Dashboard />} />
            <Route path="nueva-venta"   element={<NuevaVenta />} />
            <Route path="mesas"         element={<Mesas />} />
            <Route path="ordenes"       element={<Ordenes />} />
            <Route path="historial"     element={<Historial />} />
            <Route path="catalogo"      element={<Catalogo />} />
            <Route path="clientes"      element={<Clientes />} />
            <Route path="reportes"      element={<Reportes />} />
            <Route path="cierre-caja"   element={<CierreCaja />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  )
}
