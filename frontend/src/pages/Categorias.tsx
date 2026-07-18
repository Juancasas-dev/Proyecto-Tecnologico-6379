import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Categoria {
  _id: string
  nombre: string
  descripcion?: string
  activo: boolean
  totalProductos?: number
}

const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem('token')

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })

  const headers = { Authorization: `Bearer ${getToken()}` }

  const cargarCategorias = async () => {
    try {
      setLoading(true)
      const [catRes, prodRes] = await Promise.all([
        axios.get(`${API}/categorias`, { headers }),
        axios.get(`${API}/productos`, { headers })
      ])

      const productos = prodRes.data
      const cats = catRes.data.map((c: Categoria) => ({
        ...c,
        totalProductos: productos.filter((p: any) => p.categoria?._id === c._id || p.categoria === c._id).length
      }))

      setCategorias(cats)
    } catch {
      console.error('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarCategorias() }, [])

  const abrirModalNuevo = () => {
    setEditando(null)
    setForm({ nombre: '', descripcion: '' })
    setFormError('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (cat: Categoria) => {
    setEditando(cat)
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' })
    setFormError('')
    setModalAbierto(true)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio')
      return
    }

    setFormLoading(true)
    try {
      if (editando) {
        await axios.patch(`${API}/categorias/${editando._id}`, form, { headers })
      } else {
        await axios.post(`${API}/categorias`, form, { headers })
      }
      setModalAbierto(false)
      cargarCategorias()
    } catch (error: any) {
      setFormError(error.response?.data?.mensaje || 'Error al guardar categoría')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEliminar = async (cat: Categoria) => {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return
    try {
      await axios.delete(`${API}/categorias/${cat._id}`, { headers })
      cargarCategorias()
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al eliminar categoría')
    }
  }

  const handleEstado = async (cat: Categoria) => {
    try {
      await axios.patch(`${API}/categorias/${cat._id}`, { activo: !cat.activo }, { headers })
      cargarCategorias()
    } catch {
      alert('Error al cambiar estado')
    }
  }

  const colorCategoria = (nombre: string) => {
    const colores: Record<string, string> = {
      'Perros': 'bg-blue-500/10 text-blue-400',
      'Gatos': 'bg-purple-500/10 text-purple-400',
      'Gallinas/Pollos/Patos': 'bg-yellow-500/10 text-yellow-400',
      'Cuyes/Conejos': 'bg-green-500/10 text-green-400',
      'Loros/Aves': 'bg-orange-500/10 text-orange-400',
    }
    return colores[nombre] || 'bg-primary/10 text-primary'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Categorías</h1>
          <p className="text-muted-foreground text-sm">{categorias.length} categorías registradas</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis transition"
        >
          <Icon icon="solar:add-circle-linear" height={18} />
          Nueva categoría
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map(cat => (
            <div key={cat._id} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${colorCategoria(cat.nombre)}`}>
                  {cat.nombre}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  cat.activo ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {cat.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              {cat.descripcion && (
                <p className="text-muted-foreground text-xs mb-3">{cat.descripcion}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Icon icon="solar:box-linear" className="text-muted-foreground" height={16} />
                <span className="text-sm text-muted-foreground">
                  {cat.totalProductos} producto{cat.totalProductos !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => abrirModalEditar(cat)}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEstado(cat)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition ${
                    cat.activo
                      ? 'border-warning text-warning hover:bg-warning/10'
                      : 'border-success text-success hover:bg-success/10'
                  }`}
                >
                  {cat.activo ? 'Desactivar' : 'Activar'}
                </button>
                {cat.totalProductos === 0 && (
                  <button
                    onClick={() => handleEliminar(cat)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-error text-error hover:bg-error/10 transition"
                  >
                    <Icon icon="solar:trash-bin-minimalistic-linear" height={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                {editando ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-foreground mb-1 block">Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Reptiles"
                  value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1 block">Descripción (opcional)</label>
                <input
                  type="text"
                  placeholder="Descripción de la categoría"
                  value={form.descripcion}
                  onChange={e => setForm({...form, descripcion: e.target.value})}
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
                />
              </div>

              {formError && <p className="text-error text-sm text-center">{formError}</p>}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis disabled:opacity-50 transition"
              >
                {formLoading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear categoría'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}