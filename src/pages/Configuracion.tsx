import { useState, useEffect } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { configRepository, mesasRepository } from '@/repositories'
import { useUIStore } from '@/store'
import { sinUndefined } from '@/lib/utils'
import { Save, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ConfigNegocio } from '@/types'

type FormConfig = {
  nombre:     string
  cedula:     string
  direccion:  string
  telefono:   string
  email:      string
  mensaje:    string
  iva:        string
  prefijo:    string
  actividad:  string
  tipoCont:   string
  numMesas:   string
}

const DEFAULT: FormConfig = {
  nombre: 'La Vera Pizza', cedula: '', direccion: '', telefono: '', email: '',
  mensaje: '¡Gracias por su preferencia! Masa Madre, Sabor que se Siente.',
  iva: '13', prefijo: 'FV', actividad: '561101', tipoCont: '02', numMesas: '10',
}

export default function Configuracion() {
  const cfgList = useCollection<ConfigNegocio>(() => hCol('config'))
  const cfg = cfgList?.[0]
  const { showToast } = useUIStore()
  const [form, setForm] = useState<FormConfig>(DEFAULT)
  const [loading, setLoading] = useState(false)
  const [tab, setTab]       = useState<'negocio' | 'sistema' | 'datos'>('negocio')

  // Cargar configuración existente
  useEffect(() => {
    if (!cfg) return
    setForm({
      nombre:    cfg.nombre     ?? '',
      cedula:    cfg.cedula     ?? '',
      direccion: cfg.direccion  ?? '',
      telefono:  cfg.telefono   ?? '',
      email:     cfg.email      ?? '',
      mensaje:   cfg.mensaje    ?? '',
      iva:       String(cfg.iva ?? 13),
      prefijo:   cfg.prefijo    ?? 'FV',
      actividad: cfg.actividad  ?? '561101',
      tipoCont:  cfg.tipoCont   ?? '02',
      numMesas:  String(cfg.numMesas ?? 10),
    })
  }, [cfg])

  function upd(k: keyof FormConfig, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function guardar() {
    setLoading(true)
    try {
      const data = {
        nombre:    form.nombre,
        cedula:    form.cedula,
        direccion: form.direccion,
        telefono:  form.telefono,
        email:     form.email,
        mensaje:   form.mensaje,
        iva:       Number(form.iva) / 100,
        prefijo:   form.prefijo,
        actividad: form.actividad,
        tipoCont:  form.tipoCont,
        numMesas:  Number(form.numMesas) || 10,
        moneda:    'CRC' as const,
        numInicial: cfg?.numInicial ?? 1,
      }
      if (cfg) {
        await configRepository.actualizar(cfg.id, sinUndefined(data) as Partial<ConfigNegocio>)
      } else {
        const nuevo: ConfigNegocio = { id: 'config', ...data }
        await configRepository.crear(sinUndefined(nuevo) as unknown as ConfigNegocio)
      }
      showToast('Configuración guardada ✓', 'ok')
    } catch {
      showToast('Error al guardar', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function recrearMesas() {
    if (!confirm('¿Recrear las mesas? Esto borrará las mesas existentes.')) return
    setLoading(true)
    try {
      const num = Number(form.numMesas) || 10
      const existentes = await mesasRepository.obtenerTodos()
      await Promise.all(existentes.map((m) => mesasRepository.eliminar(m.id)))
      await mesasRepository.crearBulk(
        Array.from({ length: num }, (_, i) => ({
          id: `mesa-${i + 1}`, num: i + 1, ocupada: false, orden: null, desde: null,
        }))
      )
      showToast(`${num} mesas creadas ✓`, 'ok')
    } catch {
      showToast('Error al recrear mesas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const TABS = [
    { key: 'negocio' as const, label: 'Datos del Negocio' },
    { key: 'sistema' as const, label: 'Sistema POS' },
    { key: 'datos'   as const, label: 'Gestión de Datos' },
  ]

  const fieldCls = 'w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1E2D24]'
  const labelCls = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block'

  return (
    <div className="max-w-2xl space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Panel Negocio */}
      {tab === 'negocio' && (
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-serif text-lg text-primary">Información del Negocio</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre del negocio</label>
              <input className={fieldCls} value={form.nombre} onChange={(e) => upd('nombre', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Cédula / RUC</label>
              <input className={fieldCls} value={form.cedula} onChange={(e) => upd('cedula', e.target.value)} placeholder="3-101-XXXXXX" />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input className={fieldCls} value={form.telefono} onChange={(e) => upd('telefono', e.target.value)} placeholder="2222-2222" />
            </div>
            <div>
              <label className={labelCls}>Correo electrónico</label>
              <input className={fieldCls} value={form.email} onChange={(e) => upd('email', e.target.value)} placeholder="info@laverapi.com" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Dirección</label>
            <input className={fieldCls} value={form.direccion} onChange={(e) => upd('direccion', e.target.value)} placeholder="Dirección exacta del negocio" />
          </div>

          <div>
            <label className={labelCls}>Mensaje en factura</label>
            <textarea rows={2} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#1E2D24]"
              value={form.mensaje} onChange={(e) => upd('mensaje', e.target.value)} />
          </div>

          <Button onClick={guardar} disabled={loading} className="w-full">
            <Save size={14}/> {loading ? 'Guardando…' : 'Guardar Configuración'}
          </Button>
        </div>
      )}

      {/* Panel Sistema */}
      {tab === 'sistema' && (
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-serif text-lg text-primary">Configuración del Sistema</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Prefijo de facturas</label>
              <input className={fieldCls} value={form.prefijo} onChange={(e) => upd('prefijo', e.target.value)} placeholder="FV" />
            </div>
            <div>
              <label className={labelCls}>IVA (%)</label>
              <select className={fieldCls} value={form.iva} onChange={(e) => upd('iva', e.target.value)}>
                <option value="13">13% (estándar)</option>
                <option value="4">4% (reducido)</option>
                <option value="2">2% (reducido)</option>
                <option value="1">1% (reducido)</option>
                <option value="0">Exento</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Código de actividad</label>
              <input className={fieldCls} value={form.actividad} onChange={(e) => upd('actividad', e.target.value)} placeholder="561101" />
            </div>
            <div>
              <label className={labelCls}>Tipo de contribuyente</label>
              <select className={fieldCls} value={form.tipoCont} onChange={(e) => upd('tipoCont', e.target.value)}>
                <option value="01">01 - Física</option>
                <option value="02">02 - Jurídica</option>
                <option value="03">03 - DIMEX</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Número de mesas</label>
              <input type="number" min="1" max="50" className={fieldCls} value={form.numMesas} onChange={(e) => upd('numMesas', e.target.value)} />
            </div>
          </div>

          <Button onClick={guardar} disabled={loading} className="w-full">
            <Save size={14}/> {loading ? 'Guardando…' : 'Guardar Configuración'}
          </Button>
        </div>
      )}

      {/* Panel Datos */}
      {tab === 'datos' && (
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-serif text-lg text-primary">Gestión de Datos</h3>

          <div className="bg-[#FFF8E7] border border-[#D4A35A]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-[#D4A35A] font-semibold text-sm mb-2">
              <AlertTriangle size={15}/> Recrear Mesas
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Esto eliminará todas las mesas actuales y creará {form.numMesas} mesas nuevas. Las ventas no se verán afectadas.
            </p>
            <Button variant="outline" onClick={recrearMesas} disabled={loading}>
              <RefreshCw size={14}/> Recrear {form.numMesas} Mesas
            </Button>
          </div>

          <div className="bg-[#FEF2F2] border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-destructive font-semibold text-sm mb-2">
              <AlertTriangle size={15}/> Zona de Peligro
            </div>
            <p className="text-xs text-muted-foreground">
              Para eliminar todos los datos, hacelo directamente desde la consola de Firebase. Esta acción es irreversible.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
