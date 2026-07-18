import { useEffect, useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Producto {
  _id: string
  nombre: string
  marca: string
  stock: number
  tipoProducto: 'alimento' | 'medicamento' | 'equipamiento'
}

interface Proveedor {
  _id: string
  nombre: string
  ruc: string
}

interface Ingreso {
  _id: string
  producto: Producto
  cantidad: number
  fechaIngreso: string
  fechaVencimiento: string
  proveedor?: Proveedor
  numeroDocumento?: string
}

interface FilaMasivo {
  producto: string
  cantidad: string
  fechaVencimiento: string
}

const TIPOS_DOCUMENTO = [
  { label: 'Factura', prefijo: 'F' },
  { label: 'Boleta', prefijo: 'B' },
  { label: 'Guía de Remisión', prefijo: 'GR' },
]

const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem('token')
const getUsuario = () => JSON.parse(localStorage.getItem('usuario') || '{}')
const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-PE')

export default function Mercaderia() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [proveedoresLista, setProveedoresLista] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  // ─── Modal individual ─────────────────────────────────────────────────────
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Ingreso | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    producto: '',
    cantidad: '',
    fechaIngreso: '',
    fechaVencimiento: '',
    tipoDocumento: 'F',
    numeroDocumento: '',
    proveedor: ''
  })
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [mostrarProductos, setMostrarProductos] = useState(false)

  // ─── Modal masivo ─────────────────────────────────────────────────────────
  const [modalMasivo, setModalMasivo] = useState(false)
  const [masivoProveedorId, setMasivoProveedorId] = useState('')
  const [masivoProvNombre, setMasivoProvNombre] = useState('')
  const [masivoBusquedaProv, setMasivoBusquedaProv] = useState('')
  const [masivoMostrarProv, setMasivoMostrarProv] = useState(false)
  const [masivoTipoDoc, setMasivoTipoDoc] = useState('F')
  const [masivoNumeroDoc, setMasivoNumeroDoc] = useState('')
  const [masivoFilas, setMasivoFilas] = useState<FilaMasivo[]>([
    { producto: '', cantidad: '', fechaVencimiento: '' }
  ])
  const [masivoBusquedas, setMasivoBusquedas] = useState<string[]>([''])
  const [masivoMostrarLista, setMasivoMostrarLista] = useState<boolean[]>([false])
  const [masivoError, setMasivoError] = useState('')
  const [masivoLoading, setMasivoLoading] = useState(false)
  const [masivoExito, setMasivoExito] = useState<string | null>(null)

  const headers = { Authorization: `Bearer ${getToken()}` }
  const usuario = getUsuario()
  const esDueno = usuario.rol === 'dueño'

  // ─── Productos filtrados para modal individual ────────────────────────────
  const productosFiltrados = useMemo(() => {
    return filtroTipo === 'todos'
      ? productos
      : productos.filter(p => p.tipoProducto === filtroTipo)
  }, [filtroTipo, productos])

  const productosBuscados = useMemo(() => {
    if (!busquedaProducto.trim()) return productosFiltrados
    const q = busquedaProducto.toLowerCase()
    return productosFiltrados.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.marca.toLowerCase().includes(q)
    )
  }, [productosFiltrados, busquedaProducto])

  // ─── Proveedores filtrados para modal masivo ──────────────────────────────
  const proveedoresFiltrados = useMemo(() => {
    if (!masivoBusquedaProv.trim()) return proveedoresLista
    const q = masivoBusquedaProv.toLowerCase()
    return proveedoresLista.filter(p =>
      p.nombre.toLowerCase().includes(q) || p.ruc.includes(q)
    )
  }, [proveedoresLista, masivoBusquedaProv])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [prodRes, ingRes, provRes] = await Promise.all([
        axios.get(`${API}/productos`, { headers }),
        axios.get(`${API}/inventario/ingresos`, { headers }),
        axios.get(`${API}/proveedores`, { headers })
      ])
      setProductos(prodRes.data)
      setIngresos(ingRes.data)
      setProveedoresLista(provRes.data)
    } catch {
      console.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  // ─── Modal individual ─────────────────────────────────────────────────────
  const abrirModalNuevo = () => {
    setEditando(null)
    setForm({ producto: '', cantidad: '', fechaIngreso: '', fechaVencimiento: '', tipoDocumento: 'F', numeroDocumento: '', proveedor: '' })
    setBusquedaProducto('')
    setMostrarProductos(false)
    setFormError('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (ingreso: Ingreso) => {
    setEditando(ingreso)
    setForm({
      producto: ingreso.producto._id,
      cantidad: String(ingreso.cantidad),
      fechaIngreso: ingreso.fechaIngreso.split('T')[0],
      fechaVencimiento: ingreso.fechaVencimiento?.split('T')[0] || '',
      tipoDocumento: 'F',
      numeroDocumento: ingreso.numeroDocumento || '',
      proveedor: ingreso.proveedor?._id || ''
    })
    setFormError('')
    setModalAbierto(true)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (form.fechaVencimiento) {
      const fechaVenc = new Date(form.fechaVencimiento)
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
      if (fechaVenc < hoy) {
        setFormError('La fecha de vencimiento ingresada ya pasó.')
        return
      }
    }
    const regexDoc = /^\d{3}-\d{8}$/
    if (form.numeroDocumento.trim() && !regexDoc.test(form.numeroDocumento.trim())) {
      setFormError('Formato inválido. Usa el formato 001-00001234')
      return
    }
    setFormLoading(true)
    try {
      const numeroCompleto = form.numeroDocumento.trim()
        ? `${form.tipoDocumento}${form.numeroDocumento.trim()}`
        : ''
      if (editando) {
        await axios.put(`${API}/inventario/ingresos/${editando._id}`, {
          cantidad: Number(form.cantidad),
          fechaVencimiento: form.fechaVencimiento,
          proveedor: form.proveedor || null,
          numeroDocumento: numeroCompleto
        }, { headers })
      } else {
        await axios.post(`${API}/inventario/ingresos`, {
          producto: form.producto,
          cantidad: Number(form.cantidad),
          fechaIngreso: form.fechaIngreso,
          fechaVencimiento: form.fechaVencimiento,
          proveedor: form.proveedor || null,
          numeroDocumento: numeroCompleto
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

  // ─── Modal masivo ─────────────────────────────────────────────────────────
  const abrirModalMasivo = () => {
    setMasivoProveedorId('')
    setMasivoProvNombre('')
    setMasivoBusquedaProv('')
    setMasivoMostrarProv(false)
    setMasivoTipoDoc('F')
    setMasivoNumeroDoc('')
    setMasivoFilas([{ producto: '', cantidad: '', fechaVencimiento: '' }])
    setMasivoBusquedas([''])
    setMasivoMostrarLista([false])
    setMasivoError('')
    setMasivoExito(null)
    setModalMasivo(true)
  }

  const agregarFila = () => {
    setMasivoFilas(prev => [...prev, { producto: '', cantidad: '', fechaVencimiento: '' }])
    setMasivoBusquedas(prev => [...prev, ''])
    setMasivoMostrarLista(prev => [...prev, false])
  }

  const eliminarFila = (i: number) => {
    setMasivoFilas(prev => prev.filter((_, idx) => idx !== i))
    setMasivoBusquedas(prev => prev.filter((_, idx) => idx !== i))
    setMasivoMostrarLista(prev => prev.filter((_, idx) => idx !== i))
  }

  const actualizarFila = (i: number, campo: keyof FilaMasivo, valor: string) => {
    setMasivoFilas(prev => prev.map((f, idx) => idx === i ? { ...f, [campo]: valor } : f))
  }

  const handleIngresoMasivo = async () => {
    setMasivoError('')
    if (!masivoProveedorId) { setMasivoError('Selecciona un proveedor'); return }
    if (!masivoNumeroDoc.trim()) { setMasivoError('El número de documento es obligatorio'); return }
    if (masivoFilas.some(f => !f.producto || !f.cantidad || !f.fechaVencimiento)) {
      setMasivoError('Completa todos los campos de cada producto')
      return
    }
    const regexDoc = /^\d{3}-\d{8}$/
    if (!regexDoc.test(masivoNumeroDoc.trim())) {
      setMasivoError('Formato inválido. Usa el formato 001-00001234')
      return
    }
    setMasivoLoading(true)
    try {
      const { data } = await axios.post(`${API}/inventario/ingresos/masivo`, {
        proveedor: masivoProveedorId,
        numeroDocumento: `${masivoTipoDoc}${masivoNumeroDoc.trim()}`,
        items: masivoFilas.map(f => ({
          producto: f.producto,
          cantidad: Number(f.cantidad),
          fechaVencimiento: `${f.fechaVencimiento}T05:00:00.000Z`
        }))
      }, { headers })
      setMasivoExito(data.mensaje)
      cargarDatos()
      setTimeout(() => { setModalMasivo(false); setMasivoExito(null) }, 2500)
    } catch (error: any) {
      setMasivoError(error.response?.data?.mensaje || 'Error al registrar ingreso masivo')
    } finally {
      setMasivoLoading(false)
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
          <div className="flex gap-2">
            <button onClick={abrirModalMasivo}
              className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/10 transition">
              <Icon icon="solar:double-alt-arrow-up-linear" height={18} />
              Ingreso masivo
            </button>
            <button onClick={abrirModalNuevo}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis transition">
              <Icon icon="solar:add-circle-linear" height={18} />
              Registrar ingreso
            </button>
          </div>
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
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Proveedor</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Documento</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cantidad</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">F. Ingreso</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">F. Vencimiento</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Stock</th>
                {esDueno && <th className="text-left py-3 px-4 text-muted-foreground font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {ingresos.map((ingreso, index) => (
                <tr key={ingreso._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">{ingreso.producto?.nombre}</p>
                    <p className="text-xs text-muted-foreground">{ingreso.producto?.marca}</p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{ingreso.proveedor?.nombre || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{ingreso.numeroDocumento || '—'}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{ingreso.cantidad}</td>
                  <td className="py-3 px-4 text-muted-foreground">{formatearFecha(ingreso.fechaIngreso)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      !ingreso.fechaVencimiento ? 'bg-muted/10 text-muted-foreground'
                      : new Date(ingreso.fechaVencimiento) < new Date() ? 'bg-error/10 text-error'
                      : new Date(ingreso.fechaVencimiento) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'bg-warning/10 text-warning'
                      : 'bg-success/10 text-success'
                    }`}>
                      {ingreso.fechaVencimiento ? formatearFecha(ingreso.fechaVencimiento) : 'Sin fecha'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium text-sm ${ingreso.producto?.stock === 0 ? 'text-error' : 'text-success'}`}>
                      {ingreso.producto?.stock}
                    </span>
                  </td>
                  {esDueno && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => abrirModalEditar(ingreso)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition">
                          <Icon icon="solar:pen-new-square-linear" height={16} />
                        </button>
                        <button onClick={() => handleEliminar(ingreso._id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-error/10 text-error hover:bg-error/20 transition">
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

      {/* ─── Modal ingreso individual ──────────────────────────────────────── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
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
                  <label className="text-sm text-foreground mb-1 block">Tipo de producto</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {['todos', 'alimento', 'medicamento', 'equipamiento'].map(tipo => (
                      <button key={tipo} type="button"
                        onClick={() => {
                          setFiltroTipo(tipo)
                          setBusquedaProducto('')
                          setForm(f => ({ ...f, producto: '' }))
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${filtroTipo === tipo ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
                        {tipo === 'todos' ? 'Todos' : tipo === 'alimento' ? 'Alimentos' : tipo === 'medicamento' ? 'Medicamentos' : 'Equipamiento'}
                      </button>
                    ))}
                  </div>

                  <label className="text-sm text-foreground mb-1 block">Producto</label>
                  <div className="relative">
                    <input type="text"
                      placeholder="Escribe para buscar o despliega la lista..."
                      value={busquedaProducto}
                      onChange={e => {
                        setBusquedaProducto(e.target.value)
                        setForm(f => ({ ...f, producto: '' }))
                        setMostrarProductos(true)
                      }}
                      onFocus={() => setMostrarProductos(true)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />

                    {form.producto && (
                      <p className="text-xs text-primary mt-1">
                        ✓ {productos.find(p => p._id === form.producto)?.nombre}
                      </p>
                    )}

                    {mostrarProductos && !form.producto && (
                      <div className="absolute z-10 w-full bg-card border border-border rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                        {productosBuscados.length === 0 ? (
                          <p className="text-muted-foreground text-xs px-4 py-3">No se encontraron productos</p>
                        ) : (
                          productosBuscados.map(p => (
                            <button key={p._id} type="button"
                              onClick={() => {
                                setForm(f => ({ ...f, producto: p._id }))
                                setBusquedaProducto(p.nombre)
                                setMostrarProductos(false)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/30 transition border-b border-border last:border-0">
                              <p className="text-foreground">{p.nombre}</p>
                              <p className="text-xs text-muted-foreground">{p.marca} — Stock: {p.stock}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Proveedor */}
              <div>
                <label className="text-sm text-foreground mb-1 block">
                  Proveedor <span className="text-muted-foreground text-xs">(opcional)</span>
                </label>
                <select value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-card text-foreground outline-none focus:border-primary transition">
                  <option value="">Sin proveedor</option>
                  {proveedoresLista.map(p => (
                    <option key={p._id} value={p._id}>{p.nombre} — {p.ruc}</option>
                  ))}
                </select>
              </div>

              {/* Documento */}
              <div>
                <label className="text-sm text-foreground mb-1 block">
                  Documento de compra <span className="text-muted-foreground text-xs">(opcional)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  {TIPOS_DOCUMENTO.map(t => (
                    <button key={t.prefijo} type="button"
                      onClick={() => setForm({ ...form, tipoDocumento: t.prefijo })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${form.tipoDocumento === t.prefijo ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground bg-muted/30 px-3 py-2.5 rounded-lg border border-border">
                    {form.tipoDocumento}
                  </span>
                  <input type="text" value={form.numeroDocumento}
                    onChange={e => setForm({ ...form, numeroDocumento: e.target.value })}
                    placeholder="001-00001234" maxLength={12}
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
                </div>
              </div>

              <div>
                <label className="text-sm text-foreground mb-1 block">Cantidad</label>
                <input type="number" min="1" placeholder="0" value={form.cantidad}
                  onChange={e => setForm({ ...form, cantidad: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>

              {!editando && (
                <div>
                  <label className="text-sm text-foreground mb-1 block">Fecha de ingreso</label>
                  <input type="date" value={form.fechaIngreso ? form.fechaIngreso.split('T')[0] : ''}
                    onChange={e => setForm({ ...form, fechaIngreso: e.target.value ? `${e.target.value}T05:00:00.000Z` : '' })}
                    className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
                </div>
              )}

              <div>
                <label className="text-sm text-foreground mb-1 block">Fecha de vencimiento</label>
                <input type="date" value={form.fechaVencimiento?.split('T')[0] || ''}
                  onChange={e => setForm({ ...form, fechaVencimiento: e.target.value ? `${e.target.value}T05:00:00.000Z` : '' })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>

              {formError && <p className="text-error text-sm text-center">{formError}</p>}

              <button type="submit" disabled={formLoading}
                className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis disabled:opacity-50 transition mt-1">
                {formLoading ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar ingreso'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal ingreso masivo ──────────────────────────────────────────── */}
      {modalMasivo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Ingreso Masivo</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Registra múltiples productos en una sola operación</p>
              </div>
              <button onClick={() => setModalMasivo(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>

            {masivoExito ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Icon icon="solar:check-circle-linear" className="text-success" height={40} />
                </div>
                <p className="text-foreground font-semibold">{masivoExito}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">

                {/* ─── Proveedor con búsqueda ───────────────────────────── */}
                <div>
                  <label className="text-sm text-foreground mb-1 block">
                    Proveedor <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input type="text"
                      placeholder="Buscar proveedor por nombre o RUC..."
                      value={masivoBusquedaProv}
                      onChange={e => {
                        setMasivoBusquedaProv(e.target.value)
                        setMasivoProveedorId('')
                        setMasivoMostrarProv(true)
                      }}
                      onFocus={() => setMasivoMostrarProv(true)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />

                    {masivoProveedorId && (
                      <p className="text-xs text-primary mt-1">✓ {masivoProvNombre}</p>
                    )}

                    {masivoMostrarProv && !masivoProveedorId && (
                      <div className="absolute z-10 w-full bg-card border border-border rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                        {proveedoresFiltrados.length === 0 ? (
                          <p className="text-muted-foreground text-xs px-4 py-3">No se encontraron proveedores</p>
                        ) : (
                          proveedoresFiltrados.map(p => (
                            <button key={p._id} type="button"
                              onClick={() => {
                                setMasivoProveedorId(p._id)
                                setMasivoProvNombre(p.nombre)
                                setMasivoBusquedaProv(p.nombre)
                                setMasivoMostrarProv(false)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/30 transition border-b border-border last:border-0">
                              <p className="text-foreground font-medium">{p.nombre}</p>
                              <p className="text-xs text-muted-foreground">RUC: {p.ruc}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Documento */}
                <div>
                  <label className="text-sm text-foreground mb-1 block">
                    Documento de compra <span className="text-error">*</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    {TIPOS_DOCUMENTO.map(t => (
                      <button key={t.prefijo} type="button" onClick={() => setMasivoTipoDoc(t.prefijo)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${masivoTipoDoc === t.prefijo ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground bg-muted/30 px-3 py-2.5 rounded-lg border border-border">
                      {masivoTipoDoc}
                    </span>
                    <input type="text" value={masivoNumeroDoc}
                      onChange={e => setMasivoNumeroDoc(e.target.value)}
                      placeholder="001-00001234" maxLength={12}
                      className="flex-1 rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
                  </div>
                </div>

                {/* Filas de productos */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-foreground font-medium">Productos</label>
                    <button type="button" onClick={agregarFila}
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Icon icon="solar:add-circle-linear" height={14} />
                      Agregar producto
                    </button>
                  </div>
                  <div className="space-y-3">
                    {masivoFilas.map((fila, i) => {
                      const prodsBuscados = masivoBusquedas[i]?.trim()
                        ? productos
                            .filter(p => p.tipoProducto !== 'equipamiento')
                            .filter(p =>
                              p.nombre.toLowerCase().includes(masivoBusquedas[i].toLowerCase()) ||
                              p.marca.toLowerCase().includes(masivoBusquedas[i].toLowerCase())
                            )
                        : productos.filter(p => p.tipoProducto !== 'equipamiento')

                      return (
                        <div key={i} className="bg-muted/10 border border-border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground font-medium">Producto {i + 1}</span>
                            {masivoFilas.length > 1 && (
                              <button type="button" onClick={() => eliminarFila(i)}
                                className="text-error hover:opacity-70 transition">
                                <Icon icon="solar:close-circle-linear" height={16} />
                              </button>
                            )}
                          </div>

                          {/* Búsqueda + lista */}
                          <div className="relative mb-2">
                            <input type="text"
                              placeholder="Buscar producto..."
                              value={masivoBusquedas[i] || ''}
                              onChange={e => {
                                const nuevas = [...masivoBusquedas]
                                nuevas[i] = e.target.value
                                setMasivoBusquedas(nuevas)
                                actualizarFila(i, 'producto', '')
                                const lista = [...masivoMostrarLista]
                                lista[i] = true
                                setMasivoMostrarLista(lista)
                              }}
                              onFocus={() => {
                                const lista = [...masivoMostrarLista]
                                lista[i] = true
                                setMasivoMostrarLista(lista)
                              }}
                              className="w-full rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />

                            {fila.producto && (
                              <p className="text-xs text-primary mt-1">
                                ✓ {productos.find(p => p._id === fila.producto)?.nombre}
                              </p>
                            )}

                            {masivoMostrarLista[i] && !fila.producto && (
                              <div className="absolute z-10 w-full bg-card border border-border rounded-lg mt-1 shadow-lg max-h-36 overflow-y-auto">
                                {prodsBuscados.length === 0 ? (
                                  <p className="text-muted-foreground text-xs px-4 py-3">No se encontraron productos</p>
                                ) : (
                                  prodsBuscados.map(p => (
                                    <button key={p._id} type="button"
                                      onClick={() => {
                                        actualizarFila(i, 'producto', p._id)
                                        const nuevas = [...masivoBusquedas]
                                        nuevas[i] = p.nombre
                                        setMasivoBusquedas(nuevas)
                                        const lista = [...masivoMostrarLista]
                                        lista[i] = false
                                        setMasivoMostrarLista(lista)
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/30 transition border-b border-border last:border-0">
                                      <p className="text-foreground">{p.nombre}</p>
                                      <p className="text-xs text-muted-foreground">{p.marca} — Stock: {p.stock}</p>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          {/* Cantidad y fecha */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Cantidad</p>
                              <input type="number" min="1" placeholder="0"
                                value={fila.cantidad}
                                onChange={e => actualizarFila(i, 'cantidad', e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Fecha de vencimiento</p>
                              <input type="date" value={fila.fechaVencimiento}
                                onChange={e => actualizarFila(i, 'fechaVencimiento', e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {masivoError && <p className="text-error text-sm">{masivoError}</p>}

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setModalMasivo(false)}
                    className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/30 text-sm transition">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleIngresoMasivo} disabled={masivoLoading}
                    className="flex-1 h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis disabled:opacity-50 transition">
                    {masivoLoading ? 'Procesando...' : `Confirmar ingreso (${masivoFilas.length} producto${masivoFilas.length !== 1 ? 's' : ''})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}