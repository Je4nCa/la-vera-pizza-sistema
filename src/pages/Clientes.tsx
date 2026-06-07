import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { clientesRepository } from '@/repositories'
import { useUIStore } from '@/store'
import { sinUndefined } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Plus, X, Edit2, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Cliente, TipoCedula } from '@/types'

type FormState = {
  nombre:    string
  cedula:    string
  tipo:      TipoCedula
  telefono:  string
  email:     string
  direccion: string
  provincia: string
  notas:     string
}

const EMPTY: FormState = {
  nombre: '', cedula: '', tipo: 'fisica', telefono: '', email: '', direccion: '', provincia: '', notas: '',
}

function ClienteModal({ initial, editId, onClose }: {
  initial: FormState
  editId:  string | null
  onClose: () => void
}) {
  const { showToast } = useUIStore()
  const [form, setForm] = useState<FormState>(initial)
  const [loading, setLoading] = useState(false)

  function upd<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function save() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio', 'warning'); return }
    setLoading(true)
    try {
      const data = {
        nombre:    form.nombre.trim(),
        cedula:    form.cedula.trim(),
        tipo:      form.tipo,
        telefono:  form.telefono.trim(),
        email:     form.email.trim(),
        direccion: form.direccion.trim(),
        provincia: form.provincia.trim(),
        notas:     form.notas.trim(),
        actualizadoEn: new Date().toISOString(),
      }
      if (editId) {
        await clientesRepository.actualizar(editId, sinUndefined(data) as Partial<Cliente>)
        showToast('Cliente actualizado', 'ok')
      } else {
        const nuevo: Cliente = { id: nanoid(), creadoEn: new Date().toISOString(), ...data }
        await clientesRepository.crear(sinUndefined(nuevo) as unknown as Cliente)
        showToast('Cliente creado', 'ok')
      }
      onClose()
    } catch {
      showToast('Error al guardar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const PROVINCIAS = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón']
  const TIPOS: { key: TipoCedula; label: string }[] = [
    { key: 'fisica',   label: 'Física'   },
    { key: 'juridica', label: 'Jurídica' },
    { key: 'dimex',    label: 'DIMEX'    },
    { key: 'nite',     label: 'NITE'     },
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-fade-in-up">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={18}/></button>
        <h2 className="font-serif text-xl text-primary mb-5">{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nombre completo *', key: 'nombre' as const, placeholder: 'Nombre' },
              { label: 'Número de cédula',  key: 'cedula' as const, placeholder: '0-0000-0000' },
              { label: 'Teléfono',          key: 'telefono' as const, placeholder: '8888-8888' },
              { label: 'Correo electrónico', key: 'email' as const, placeholder: 'correo@ejemplo.com' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">{label}</label>
                <input value={form[key]} onChange={(e) => upd(key, e.target.value)} placeholder={placeholder}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Tipo de cédula</label>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS.map(({ key, label }) => (
                <button key={key} onClick={() => upd('tipo', key)}
                  className={cn('py-2 rounded-lg border-2 text-xs font-semibold transition-all',
                    form.tipo === key ? 'border-[#C4432D] bg-[#C4432D]/5 text-[#C4432D]' : 'border-border text-muted-foreground'
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Provincia</label>
              <select value={form.provincia} onChange={(e) => upd('provincia', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]">
                <option value="">— Seleccionar —</option>
                {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Dirección</label>
              <input value={form.direccion} onChange={(e) => upd('direccion', e.target.value)} placeholder="Dirección exacta"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Notas</label>
            <textarea rows={2} value={form.notas} onChange={(e) => upd('notas', e.target.value)} placeholder="Alergias, preferencias…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1E2D24]" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={save} disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </div>
  )
}

export default function Clientes() {
  const clientes = useCollection<Cliente>(() => hCol('clientes'))
  const { showToast } = useUIStore()
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editId: string | null; initial: FormState }>({
    open: false, editId: null, initial: EMPTY,
  })

  const filtrados = (clientes ?? []).filter((c) =>
    busqueda === '' ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cedula.includes(busqueda) ||
    c.telefono.includes(busqueda)
  ).sort((a, b) => a.nombre.localeCompare(b.nombre))

  function abrirNuevo() { setModal({ open: true, editId: null, initial: EMPTY }) }

  function abrirEditar(c: Cliente) {
    setModal({
      open: true, editId: c.id,
      initial: { nombre: c.nombre, cedula: c.cedula, tipo: c.tipo, telefono: c.telefono, email: c.email, direccion: c.direccion, provincia: c.provincia, notas: c.notas },
    })
  }

  async function eliminar(c: Cliente) {
    if (!confirm(`¿Eliminar a ${c.nombre}?`)) return
    try {
      await clientesRepository.eliminar(c.id)
      showToast('Cliente eliminado', 'warning')
    } catch {
      showToast('Error al eliminar', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente…"
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#1E2D24]" />
        </div>
        <Button onClick={abrirNuevo}><Plus size={14}/> Nuevo Cliente</Button>
      </div>

      <div className="text-xs text-muted-foreground">{filtrados.length} clientes</div>

      {/* Tabla */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No hay clientes registrados</div>
        ) : (
          <div className="divide-y divide-border">
            {filtrados.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#1E2D24] text-white font-serif text-lg font-bold flex items-center justify-center shrink-0">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.nombre}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {c.cedula && `${c.cedula} · `}{c.telefono && `${c.telefono} · `}{c.email || 'Sin correo'}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground hidden sm:block">{c.provincia}</div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => abrirEditar(c)}><Edit2 size={14}/></Button>
                  <Button variant="ghost" size="icon" onClick={() => eliminar(c)} className="hover:text-destructive"><Trash2 size={14}/></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal.open && (
        <ClienteModal initial={modal.initial} editId={modal.editId} onClose={() => setModal((p) => ({ ...p, open: false }))} />
      )}
    </div>
  )
}
