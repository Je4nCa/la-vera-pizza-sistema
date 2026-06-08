import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard     from '@/pages/Dashboard'
import NuevaVenta    from '@/pages/NuevaVenta'
import Mesas         from '@/pages/Mesas'
import Historial     from '@/pages/Historial'
import Catalogo      from '@/pages/Catalogo'
import Clientes      from '@/pages/Clientes'
import Reportes      from '@/pages/Reportes'
import Configuracion from '@/pages/Configuracion'
import CierreCaja    from '@/pages/CierreCaja'

export default function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index            element={<Dashboard />} />
          <Route path="nueva-venta"   element={<NuevaVenta />} />
          <Route path="mesas"         element={<Mesas />} />
          <Route path="historial"     element={<Historial />} />
          <Route path="catalogo"      element={<Catalogo />} />
          <Route path="clientes"      element={<Clientes />} />
          <Route path="reportes"      element={<Reportes />} />
          <Route path="cierre-caja"   element={<CierreCaja />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
