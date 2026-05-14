import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Producto {
  _id: string
  nombre: string
  marca: string
  stock: number
}

interface Ingreso {
  _id: string
  producto: Producto
  cantidad: number
  fechaIngreso: string
  fechaVencimiento: string
}

const API = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')
const getUsuario = () => JSON.parse(localStorage.getItem('usuario') || '{}')

const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-PE')
}

export default function Mercaderia() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Ingreso | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    producto: '',
    cantidad: '',
    fechaIngreso: '',
    fechaVencimiento: ''
  })

  const usuario = getUsuario()
  const esDueno = usuario.rol === 'dueño'
  const headers = { Authorization: `Bearer ${getToken()}` }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [prodRes, ingRes] = await Promise.all([
        axios.get(`${API}/productos`, { headers }),
        axios.get(`${API}/inventario/ingresos`, { headers })
      ])
      setProductos(prodRes.data)
      setIngresos(ingRes.data)
    } catch {
      console.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const abrirModalNuevo = () => {
    setEditando(null)
    setForm({ producto: '', cantidad: '', fechaIngreso: '', fechaVencimiento: '' })
    setFormError('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (ingreso: Ingreso) => {
    setEditando(ingreso)
    setForm({
      producto: ingreso.producto._id,
      cantidad: String(ingreso.cantidad),
      fechaIngreso: ingreso.fechaIngreso.split('T')[0],
      fechaVencimiento: ingreso.fechaVencimiento.split('T')[0]
    })
    setFormError('')
    setModalAbierto(true)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      if (editando) {
        await axios.put(`${API}/inventario/ingresos/${editando._id}`, {
          cantidad: Number(form.cantidad),
          fechaVencimiento: form.fechaVencimiento
        }, { headers })
      } else {
        await axios.post(`${API}/inventario/ingresos`, {
          producto: form.producto,
          cantidad: Number(form.cantidad),
          fechaIngreso: form.fechaIngreso,
          fechaVencimiento: form.fechaVencimiento
        }, { headers })
      }
      setModalAbierto(false)
      cargarDatos()
    } catch (error: any) {
      setFormError(error.response?.data?.mensaje || 'Error al guardar ingreso')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este ingreso? Se revertirá el stock.')) return
    try {
      await axios.delete(`${API}/inventario/ingresos/${id}`, { headers })
      cargarDatos()
    } catch {
      alert('Error al eliminar ingreso')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Ingreso de Mercadería</h1>
          <p className="text-muted-foreground text-sm">{ingresos.length} ingresos registrados</p>
        </div>
        {esDueno && (
          <button
            onClick={abrirModalNuevo}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis transition"
          >
            <Icon icon="solar:add-circle-linear" height={18} />
            Registrar ingreso
          </button>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ingresos.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Icon icon="solar:box-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
          <p className="text-muted-foreground">No hay ingresos registrados aún</p>
          {esDueno && (
            <button
              onClick={abrirModalNuevo}
              className="mt-4 text-primary text-sm hover:underline"
            >
              Registrar primer ingreso
            </button>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cantidad</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha Ingreso</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha Vencimiento</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Stock actual</th>
                {esDueno && (
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {ingresos.map((ingreso, index) => (
                <tr key={ingreso._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-foreground">{ingreso.producto?.nombre}</p>
                      <p className="text-xs text-muted-foreground">{ingreso.producto?.marca}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-foreground">{ingreso.cantidad}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {formatearFecha(ingreso.fechaIngreso)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      new Date(ingreso.fechaVencimiento) < new Date()
                        ? 'bg-error/10 text-error'
                        : new Date(ingreso.fechaVencimiento) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? 'bg-warning/10 text-warning'
                        : 'bg-success/10 text-success'
                    }`}>
                      {formatearFecha(ingreso.fechaVencimiento)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium text-sm ${
                      ingreso.producto?.stock === 0
                        ? 'text-error'
                        : 'text-success'
                    }`}>
                      {ingreso.producto?.stock}
                    </span>
                  </td>
                  {esDueno && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirModalEditar(ingreso)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition"
                        >
                          <Icon icon="solar:pen-new-square-linear" height={16} />
                        </button>
                        <button
                          onClick={() => handleEliminar(ingreso._id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-error/10 text-error hover:bg-error/20 transition"
                        >
                          <Icon icon="solar:trash-bin-minimalistic-linear" height={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                {editando ? 'Editar Ingreso' : 'Registrar Ingreso'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="flex flex-col gap-4">
              {!editando && (
                <div>
                  <label className="text-sm text-foreground mb-1 block">Producto</label>
                  <select
                    value={form.producto}
                    onChange={e => setForm({...form, producto: e.target.value})}
                    required
                    className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-card text-foreground outline-none focus:border-primary transition"
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.nombre} — Stock actual: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm text-foreground mb-1 block">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={form.cantidad}
                  onChange={e => setForm({...form, cantidad: e.target.value})}
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
                />
              </div>

              {!editando && (
                <div>
                  <label className="text-sm text-foreground mb-1 block">Fecha de ingreso</label>
                  <input
                    type="date"
                    value={form.fechaIngreso}
                    onChange={e => setForm({...form, fechaIngreso: e.target.value})}
                    required
                    className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-foreground mb-1 block">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={e => setForm({...form, fechaVencimiento: e.target.value})}
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
                />
              </div>

              {formError && (
                <p className="text-error text-sm text-center">{formError}</p>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis disabled:opacity-50 transition mt-1"
              >
                {formLoading ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar ingreso'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}