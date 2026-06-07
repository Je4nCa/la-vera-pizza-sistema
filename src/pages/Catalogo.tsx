import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useCollection } from '@/hooks/useCollection'
import { hCol } from '@/lib/firebase'
import { productosRepository } from '@/repositories'
import { useUIStore } from '@/store'
import { sinUndefined, fmtColones } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Plus, X, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Producto, CategoriaProducto, PreciosPizza } from '@/types'

type FormState = {
  nombre:      string
  categoria:   CategoriaProducto
  descripcion: string
  icono:       string
  codigo:      string
  precio:      string
  iva:         string
  stock:       string
  stockMin:    string
  estado:      'activo' | 'inactivo'
  precios:     { p: string; m: string; g: string; xl: string }
}

const EMPTY: FormState = {
  nombre: '', categoria: 'Pizzas', descripcion: '', icono: '🍕',
  codigo: '', precio: '', iva: '1', stock: '', stockMin: '',
  estado: 'activo', precios: { p: '', m: '', g: '', xl: '' },
}

function ProdModal({ initial, editId, onClose }: {
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
      const precios: PreciosPizza | undefined = form.categoria === 'Pizzas' ? {
        p:  Number(form.precios.p)  || 0,
        m:  Number(form.precios.m)  || 0,
        g:  Number(form.precios.g)  || 0,
        xl: Number(form.precios.xl) || 0,
      } : undefined

      const base = {
        nombre:       form.nombre.trim(),
        categoria:    form.categoria,
        descripcion:  form.descripcion.trim(),
        icono:        form.icono || '🍕',
        codigo:       form.codigo.trim(),
        sku:          form.codigo.trim(),
        precio:       Number(form.precio) || 0,
        iva:          Number(form.iva) || 0,
        stock:        form.stock === '' ? '' as const : Number(form.stock),
        stockMin:     form.stockMin === '' ? '' as const : Number(form.stockMin),
        estado:       form.estado,
        actualizadoEn: new Date().toISOString(),
        ...(precios ? { precios } : {}),
      }

      if (editId) {
        await productosRepository.actualizar(editId, sinUndefined(base) as Partial<Producto>)
        showToast('Producto actualizado', 'ok')
      } else {
        const nuevo: Producto = {
          id: nanoid(),
          creadoEn: new Date().toISOString(),
          ...base,
        }
        await productosRepository.crear(sinUndefined(nuevo) as unknown as Producto)
        showToast('Producto creado', 'ok')
      }
      onClose()
    } catch {
      showToast('Error al guardar', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-fade-in-up">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={18}/></button>
        <h2 className="font-serif text-xl text-primary mb-5">{editId ? 'Editar Producto' : 'Nuevo Producto'}</h2>

        <div className="space-y-4">
          {/* Nombre + emoji */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Nombre *</label>
              <input value={form.nombre} onChange={(e) => upd('nombre', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]" placeholder="Nombre del producto" />
            </div>
            <div className="w-20">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Ícono</label>
              <input value={form.icono} onChange={(e) => upd('icono', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-2xl text-center focus:outline-none focus:border-[#1E2D24]" />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Categoría</label>
            <div className="flex gap-2">
              {(['Pizzas', 'Extras'] as CategoriaProducto[]).map((c) => (
                <button key={c} onClick={() => upd('categoria', c)}
                  className={cn('flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-all',
                    form.categoria === c ? 'border-[#C4432D] bg-[#C4432D]/5 text-[#C4432D]' : 'border-border text-muted-foreground'
                  )}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Precios de pizza */}
          {form.categoria === 'Pizzas' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Precios por tamaño</label>
              <div className="grid grid-cols-4 gap-2">
                {(['p', 'm', 'g', 'xl'] as const).map((k) => (
                  <div key={k}>
                    <div className="text-[10px] text-center text-muted-foreground mb-1 uppercase">{k === 'p' ? 'Pequeña' : k === 'm' ? 'Mediana' : k === 'g' ? 'Grande' : 'X-Grande'}</div>
                    <input
                      type="number" min="0" value={form.precios[k]}
                      onChange={(e) => upd('precios', { ...form.precios, [k]: e.target.value })}
                      className="w-full border border-border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-[#1E2D24]"
                      placeholder="₡0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Precio base + IVA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                {form.categoria === 'Pizzas' ? 'Precio base (P)' : 'Precio'}
              </label>
              <input type="number" min="0" value={form.precio} onChange={(e) => upd('precio', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]" placeholder="₡0" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">IVA</label>
              <select value={form.iva} onChange={(e) => upd('iva', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]">
                <option value="1">13% (gravado)</option>
                <option value="0">Exento</option>
                <option value="0.04">4% (reducido)</option>
                <option value="0.02">2% (reducido)</option>
                <option value="0.01">1% (reducido)</option>
              </select>
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Stock (vacío = sin control)</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => upd('stock', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]" placeholder="—" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Stock mínimo</label>
              <input type="number" min="0" value={form.stockMin} onChange={(e) => upd('stockMin', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E2D24]" placeholder="5" />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Descripción</label>
            <textarea rows={2} value={form.descripcion} onChange={(e) => upd('descripcion', e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1E2D24]" placeholder="Ingredientes, descripción…" />
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</label>
            <button onClick={() => upd('estado', form.estado === 'activo' ? 'inactivo' : 'activo')}
              className={cn('flex items-center gap-2 text-sm font-semibold', form.estado === 'activo' ? 'text-green-600' : 'text-muted-foreground')}>
              {form.estado === 'activo' ? <ToggleRight size={22}/> : <ToggleLeft size={22}/>}
              {form.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </button>
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

export default function Catalogo() {
  const productos = useCollection<Producto>(() => hCol('productos'))
  const { showToast } = useUIStore()
  const [modal, setModal] = useState<{ open: boolean; editId: string | null; initial: FormState }>({
    open: false, editId: null, initial: EMPTY,
  })
  const [filtro, setFiltro] = useState<'todos' | 'Pizzas' | 'Extras'>('todos')

  function abrirNuevo() {
    setModal({ open: true, editId: null, initial: EMPTY })
  }

  function abrirEditar(p: Producto) {
    setModal({
      open: true,
      editId: p.id,
      initial: {
        nombre:      p.nombre,
        categoria:   p.categoria,
        descripcion: p.descripcion,
        icono:       p.icono,
        codigo:      p.codigo ?? '',
        precio:      String(p.precio),
        iva:         String(p.iva),
        stock:       p.stock === '' ? '' : String(p.stock),
        stockMin:    p.stockMin === '' ? '' : String(p.stockMin),
        estado:      p.estado,
        precios: {
          p:  String(p.precios?.p  ?? ''),
          m:  String(p.precios?.m  ?? ''),
          g:  String(p.precios?.g  ?? ''),
          xl: String(p.precios?.xl ?? ''),
        },
      },
    })
  }

  async function toggleEstado(p: Producto) {
    await productosRepository.actualizar(p.id, { estado: p.estado === 'activo' ? 'inactivo' : 'activo' })
    showToast(p.estado === 'activo' ? 'Producto desactivado' : 'Producto activado', 'ok')
  }

  const lista = (productos ?? []).filter((p) => filtro === 'todos' || p.categoria === filtro)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(['todos', 'Pizzas', 'Extras'] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              className={cn('px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
                filtro === f ? 'bg-[#1E2D24] border-[#1E2D24] text-white' : 'border-border text-muted-foreground hover:border-[#1E2D24]/40'
              )}>
              {f === 'todos' ? 'Todos' : f}
            </button>
          ))}
        </div>
        <Button onClick={abrirNuevo}><Plus size={14}/> Nuevo Producto</Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lista.map((p) => (
          <div key={p.id} className={cn('bg-white border border-border rounded-xl p-4 transition-all hover:shadow-md', p.estado === 'inactivo' && 'opacity-60')}>
            <div className="flex items-start gap-3">
              <div className="text-3xl">{p.icono}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-tight">{p.nombre}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={p.categoria === 'Pizzas' ? 'destructive' : 'dorado'} className="text-[9px]">{p.categoria}</Badge>
                  <Badge variant={p.estado === 'activo' ? 'default' : 'gris'} className="text-[9px]">{p.estado}</Badge>
                </div>
                {p.precios ? (
                  <div className="text-[11px] text-muted-foreground mt-1">
                    P:{fmtColones(p.precios.p)} · M:{fmtColones(p.precios.m)} · G:{fmtColones(p.precios.g)} · XL:{fmtColones(p.precios.xl)}
                  </div>
                ) : (
                  <div className="text-sm font-bold text-[#C4432D] mt-1">{fmtColones(p.precio)}</div>
                )}
                {p.stock !== '' && (
                  <div className="text-[11px] text-muted-foreground">Stock: {p.stock}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => abrirEditar(p)}>
                <Edit2 size={12}/> Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleEstado(p)}>
                {p.estado === 'activo' ? <ToggleRight size={16} className="text-green-500"/> : <ToggleLeft size={16} className="text-muted-foreground"/>}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <ProdModal initial={modal.initial} editId={modal.editId} onClose={() => setModal((p) => ({ ...p, open: false }))} />
      )}
    </div>
  )
}
