import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Producto {
  _id: string
  nombre: string
  marca: string
  stock: number
  precio: number
  tipoProducto: 'alimento' | 'medicamento' | 'equipamiento'
}

interface Historial {
  _id: string
  tipo: string
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  fecha: string
  observaciones?: string
  productoId?: { nombre: string; marca: string }
  usuarioId?: { nombre: string; username: string }
}



const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem('token')

const causasSalida = [
  'Merma',
  'Robo o hurto',
  'Producto vencido',
  'Error de conteo',
  'Otra'
]

const causasEntrada = [
  'Stock encontrado no registrado',
  'Devolución de cliente'
]

export default function AjusteStock() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [productoId, setProductoId] = useState('')
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('salida')
  const [cantidad, setCantidad] = useState('')
  const [causa, setCausa] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [mostrarResumen, setMostrarResumen] = useState(false)
  const [historial, setHistorial] = useState<Historial[]>([])
  const headers = { Authorization: `Bearer ${getToken()}` }

  const productoSeleccionado = productos.find(p => p._id === productoId)
  const causas = tipo === 'salida' ? causasSalida : causasEntrada
  const valorEconomico = productoSeleccionado
    ? Number(cantidad || 0) * productoSeleccionado.precio
    : 0
  const stockResultante = productoSeleccionado
    ? tipo === 'salida'
      ? productoSeleccionado.stock - Number(cantidad || 0)
      : productoSeleccionado.stock + Number(cantidad || 0)
    : 0

const cargarHistorial = async () => {
  try {
    const { data } = await axios.get(`${API}/inventario/historial-ajustes`, { headers })
    setHistorial(data)
  } catch {
    console.error('Error al cargar historial')
  }
}

useEffect(() => { 
  cargarProductos()
  cargarHistorial()
}, [])


  // resetear causa cuando cambia tipo
  useEffect(() => { setCausa('') }, [tipo])

  const cargarProductos = async () => {
    try {
      const { data } = await axios.get(`${API}/productos`, { headers })
      setProductos(data)
    } catch {
      setError('Error al cargar productos')
    }
  }

  const productosFiltrados = filtroTipo === 'todos'
    ? productos
    : productos.filter(p => p.tipoProducto === filtroTipo)

  const handlePreConfirmar = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!productoId) { setError('Selecciona un producto'); return }
    if (!cantidad || Number(cantidad) <= 0) { setError('Ingresa una cantidad válida'); return }
    if (!causa.trim()) {
      setError('Debes seleccionar la causa del ajuste para continuar. Este campo es obligatorio.')
      return
    }
    if (tipo === 'salida' && productoSeleccionado && Number(cantidad) > productoSeleccionado.stock) {
      setError('No hay stock suficiente para realizar el ajuste')
      return
    }

    setMostrarResumen(true)
  }

  const handleConfirmar = async () => {
    try {
      setLoading(true)
      await axios.post(`${API}/inventario/ajustes`, {
        productoId,
        tipo,
        cantidad: Number(cantidad),
        causa
      }, { headers })

      setMensaje('Ajuste realizado correctamente')
      setMostrarResumen(false)
      setProductoId('')
      setCantidad('')
      setCausa('')
      cargarProductos()
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al realizar ajuste')
      setMostrarResumen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Ajuste Manual de Inventario</h1>
        <p className="text-muted-foreground text-sm">Corrige el stock con justificación documentada</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Formulario */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Formulario de ajuste
          </h2>

          <form onSubmit={handlePreConfirmar} className="flex flex-col gap-4">

            {/* Tipo de ajuste */}
            <div>
              <label className="text-sm text-foreground mb-2 block">Tipo de ajuste</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('salida')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                    tipo === 'salida'
                      ? 'bg-error text-white border-error'
                      : 'border-border text-muted-foreground hover:border-error'
                  }`}
                >
                  <Icon icon="solar:arrow-down-linear" height={16} className="inline mr-1" />
                  Salida
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('entrada')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                    tipo === 'entrada'
                      ? 'bg-success text-white border-success'
                      : 'border-border text-muted-foreground hover:border-success'
                  }`}
                >
                  <Icon icon="solar:arrow-up-linear" height={16} className="inline mr-1" />
                  Entrada
                </button>
              </div>
            </div>

            {/* Filtro tipo producto */}
            <div>
              <label className="text-sm text-foreground mb-2 block">Filtrar por tipo</label>
              <div className="flex gap-2 flex-wrap">
                {['todos', 'alimento', 'medicamento', 'equipamiento'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setFiltroTipo(t); setProductoId('') }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      filtroTipo === t
                        ? 'bg-primary text-white'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {t === 'todos' ? 'Todos' :
                     t === 'alimento' ? 'Alimentos' :
                     t === 'medicamento' ? 'Medicamentos' : 'Equipamiento'}
                  </button>
                ))}
              </div>
            </div>

            {/* Producto */}
            <div>
              <label className="text-sm text-foreground mb-1 block">Producto</label>
              <select
                value={productoId}
                onChange={e => setProductoId(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-card text-foreground outline-none focus:border-primary transition"
              >
                <option value="">Seleccionar producto</option>
                {productosFiltrados.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.nombre} — Stock: {p.stock}
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label className="text-sm text-foreground mb-1 block">Cantidad</label>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
              />
            </div>

            {/* Causa */}
            <div>
              <label className="text-sm text-foreground mb-1 block">
                Causa <span className="text-error">*</span>
              </label>
              <select
                value={causa}
                onChange={e => setCausa(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-card text-foreground outline-none focus:border-primary transition"
              >
                <option value="">Seleccionar causa</option>
                {causas.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-error text-sm">{error}</p>}
            {mensaje && (
              <div className="bg-success/10 border border-success/20 rounded-lg px-4 py-3">
                <p className="text-success text-sm">{mensaje}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 rounded-lg text-white font-medium text-sm disabled:opacity-50 transition ${
                tipo === 'salida' ? 'bg-error hover:opacity-90' : 'bg-success hover:opacity-90'
              }`}
            >
              Ver resumen del ajuste
            </button>
          </form>
        </div>

        {/* Panel info producto */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Información del producto
          </h2>

          {!productoSeleccionado ? (
            <div className="text-center py-12">
              <Icon icon="solar:box-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
              <p className="text-muted-foreground text-sm">Selecciona un producto para ver su información</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Producto</p>
                <p className="font-semibold text-foreground">{productoSeleccionado.nombre}</p>
                <p className="text-xs text-muted-foreground">{productoSeleccionado.marca}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Stock actual</p>
                  <p className="text-2xl font-bold text-foreground">{productoSeleccionado.stock}</p>
                </div>
                <div className="bg-muted/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Precio unitario</p>
                  <p className="text-2xl font-bold text-foreground">S/ {productoSeleccionado.precio.toFixed(2)}</p>
                </div>
              </div>

              {cantidad && Number(cantidad) > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-lg p-3 ${
                      tipo === 'salida' ? 'bg-error/10' : 'bg-success/10'
                    }`}>
                      <p className="text-xs text-muted-foreground mb-1">Stock resultante</p>
                      <p className={`text-2xl font-bold ${
                        tipo === 'salida' ? 'text-error' : 'text-success'
                      }`}>
                        {stockResultante}
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Impacto económico</p>
                      <p className="text-lg font-bold text-primary">S/ {valorEconomico.toFixed(2)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal resumen confirmación */}
      {mostrarResumen && productoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-foreground">Confirmar ajuste</h2>
              <button onClick={() => setMostrarResumen(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                  tipo === 'salida' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                }`}>
                  {tipo === 'salida' ? 'Salida' : 'Entrada'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Producto</span>
                <span className="text-foreground font-medium">{productoSeleccionado.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cantidad</span>
                <span className="text-foreground font-medium">{cantidad} unidades</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Causa</span>
                <span className="text-foreground font-medium">{causa}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock actual</span>
                <span className="text-foreground font-medium">{productoSeleccionado.stock}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock resultante</span>
                <span className={`font-bold ${tipo === 'salida' ? 'text-error' : 'text-success'}`}>
                  {stockResultante}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-3">
                <span className="text-muted-foreground">Impacto económico</span>
                <span className="text-primary font-bold">S/ {valorEconomico.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarResumen(false)}
                className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/30 text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={loading}
                className={`flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition ${
                  tipo === 'salida' ? 'bg-error hover:opacity-90' : 'bg-success hover:opacity-90'
                }`}
              >
                {loading ? 'Procesando...' : 'Confirmar ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Historial de ajustes */}
<div className="mt-8">
  <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
    Historial de ajustes
  </h2>

  {historial.length === 0 ? (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <Icon icon="solar:history-linear" className="text-muted-foreground mx-auto mb-3" height={32} />
      <p className="text-muted-foreground text-sm">No hay ajustes registrados</p>
    </div>
  ) : (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tipo</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cantidad</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Stock anterior</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Stock nuevo</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Causa</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Usuario</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((h, index) => (
            <tr key={h._id} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
              <td className="py-3 px-4">
                <p className="font-medium text-foreground text-sm">{h.productoId?.nombre || '—'}</p>
                <p className="text-xs text-muted-foreground">{h.productoId?.marca || ''}</p>
              </td>
              <td className="py-3 px-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  h.tipo === 'ajuste_entrada' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {h.tipo === 'ajuste_entrada' ? 'Entrada' : 'Salida'}
                </span>
              </td>
              <td className="py-3 px-4 text-foreground font-medium">{h.cantidad}</td>
              <td className="py-3 px-4 text-muted-foreground">{h.stockAnterior}</td>
              <td className="py-3 px-4 text-foreground font-medium">{h.stockNuevo}</td>
              <td className="py-3 px-4 text-muted-foreground text-xs">
                {h.observaciones?.split(' - ')[1] || '—'}
              </td>
              <td className="py-3 px-4 text-muted-foreground text-xs">
                {h.usuarioId?.nombre || '—'}
              </td>
              <td className="py-3 px-4 text-muted-foreground text-xs">
                {new Date(h.fecha).toLocaleString('es-PE')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
    </div>
  )
}