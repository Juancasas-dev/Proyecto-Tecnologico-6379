import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Proveedor {
  _id: string
  nombre: string
  ruc: string
  telefono: string
  direccion: string
  activo: boolean
}

const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem('token')

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null)
  const [form, setForm] = useState({ nombre: '', ruc: '', telefono: '', direccion: '' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const headers = { Authorization: `Bearer ${getToken()}` }

  const cargarProveedores = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${API}/proveedores`, { headers })
      setProveedores(data)
    } catch {
      console.error('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarProveedores() }, [])

  const abrirModalNuevo = () => {
    setProveedorEditando(null)
    setForm({ nombre: '', ruc: '', telefono: '', direccion: '' })
    setFormError('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (proveedor: Proveedor) => {
    setProveedorEditando(proveedor)
    setForm({
      nombre: proveedor.nombre,
      ruc: proveedor.ruc,
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || ''
    })
    setFormError('')
    setModalAbierto(true)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio'); return }
    if (!form.ruc.trim()) { setFormError('El RUC es obligatorio'); return }

    setFormLoading(true)
    try {
      if (proveedorEditando) {
        await axios.patch(`${API}/proveedores/${proveedorEditando._id}`, form, { headers })
      } else {
        await axios.post(`${API}/proveedores`, form, { headers })
      }
      setModalAbierto(false)
      cargarProveedores()
    } catch (error: any) {
      setFormError(error.response?.data?.mensaje || 'Error al guardar proveedor')
    } finally {
      setFormLoading(false)
    }
  }

  const proveedoresFiltrados = useMemo(() => {
    if (!busqueda) return proveedores
    const q = busqueda.toLowerCase()
    return proveedores.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.ruc.includes(q)
    )
  }, [proveedores, busqueda])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Proveedores</h1>
          <p className="text-muted-foreground text-sm">
            {proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''} registrado{proveedores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={abrirModalNuevo}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis transition">
          <Icon icon="solar:add-circle-linear" height={18} />
          Nuevo proveedor
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <input type="text" placeholder="Buscar por nombre o RUC..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full max-w-sm rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Icon icon="solar:box-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
          <p className="text-muted-foreground">
            {busqueda ? 'No se encontraron proveedores con esa búsqueda' : 'No hay proveedores registrados aún'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nombre</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">RUC</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Teléfono</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Dirección</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedoresFiltrados.map((proveedor, index) => (
                <tr key={proveedor._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">{proveedor.nombre}</p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{proveedor.ruc}</td>
                  <td className="py-3 px-4 text-muted-foreground">{proveedor.telefono || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{proveedor.direccion || '—'}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => abrirModalEditar(proveedor)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition">
                      <Icon icon="solar:pen-new-square-linear" height={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                {proveedorEditando ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h2>
              <button onClick={() => setModalAbierto(false)}
                className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-foreground mb-1 block">
                  Nombre <span className="text-error">*</span>
                </label>
                <input type="text" value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del proveedor"
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>

              <div>
                <label className="text-sm text-foreground mb-1 block">
                  RUC <span className="text-error">*</span>
                </label>
                <input type="text" value={form.ruc}
                  onChange={e => setForm({ ...form, ruc: e.target.value })}
                  placeholder="20123456789"
                  maxLength={11}
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>

              <div>
                <label className="text-sm text-foreground mb-1 block">
                  Teléfono <span className="text-muted-foreground text-xs">(opcional)</span>
                </label>
                <input type="text" value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                  placeholder="987654321"
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>

              <div>
                <label className="text-sm text-foreground mb-1 block">
                  Dirección <span className="text-muted-foreground text-xs">(opcional)</span>
                </label>
                <input type="text" value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Av. Principal 123, Lima"
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>

              {formError && (
                <p className="text-error text-sm">{formError}</p>
              )}

              <button type="submit" disabled={formLoading}
                className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis disabled:opacity-50 transition mt-1">
                {formLoading ? 'Guardando...' : proveedorEditando ? 'Actualizar' : 'Registrar proveedor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}