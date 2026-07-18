import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem('token')

interface ProductoVenta {
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface Resumen {
  totalBruto: number
  totalAnulado: number
  totalNeto: number
  ticketPromedio: number
  transacciones: number
  desgloseMotivoAnulado: Record<string, number>
}

interface Detalle {
  _id: string
  fecha: string
  vendedor: string
  productos: ProductoVenta[]
  total: number
  estado: string
  motivo: string | null
  fechaAnulacion: string | null
  fechaModificacion: string | null
  usuarioAccion: string
}

interface Vendedor {
  _id: string
  nombre: string
  username: string
}

const colorEstado = (estado: string) => {
  if (estado === 'completada') return 'bg-success/10 text-success'
  if (estado === 'anulada') return 'bg-error/10 text-error'
  return 'bg-warning/10 text-warning'
}

export default function Trazabilidad() {
  const [datos, setDatos] = useState<{ resumen: Resumen; detalle: Detalle[] } | null>(null)
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [estado, setEstado] = useState('')
  const [producto, setProducto] = useState('')
  const [vendedor, setVendedor] = useState('')
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [cargando, setCargando] = useState(false)
  const [consultado, setConsultado] = useState(false)

  const headers = { Authorization: `Bearer ${getToken()}` }

  useEffect(() => {
    // Cargar lista de vendedores para el select
    axios.get(`${API}/usuarios`, { headers })
      .then(({ data }) => setVendedores(data.filter((u: any) => u.rol === 'vendedor' || u.rol === 'dueño')))
      .catch(() => {})
  }, [])

  const buscar = async () => {
    setCargando(true)
    try {
      const { data } = await axios.get(`${API}/trazabilidad`, {
        params: { inicio, fin, estado, producto, vendedor },
        headers
      })
      setDatos(data)
      setConsultado(true)
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const limpiarFiltros = () => {
    setInicio(''); setFin(''); setEstado('')
    setProducto(''); setVendedor('')
    setDatos(null); setConsultado(false)
  }

  const sinResultados = consultado && datos?.detalle.length === 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Trazabilidad de ventas</h1>
        <p className="text-muted-foreground text-sm">Auditoría completa de operaciones por usuario y fecha</p>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Desde</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Hasta</label>
            <input type="date" value={fin} onChange={e => setFin(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Vendedor</label>
            <select value={vendedor} onChange={e => setVendedor(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm border border-border bg-card text-foreground outline-none focus:border-primary">
              <option value="">Todos</option>
              {vendedores.map(v => (
                <option key={v._id} value={v._id}>{v.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm border border-border bg-card text-foreground outline-none focus:border-primary">
              <option value="">Todos</option>
              <option value="completada">Completada</option>
              <option value="anulada">Anulada</option>
              <option value="modificada">Modificada</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Producto</label>
            <input placeholder="Buscar producto..." value={producto}
              onChange={e => setProducto(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary" />
          </div>
          <button onClick={buscar} disabled={cargando}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis disabled:opacity-50 transition">
            <Icon icon="solar:magnifer-linear" height={16} />
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
          {consultado && (
            <button onClick={limpiarFiltros}
              className="text-sm text-muted-foreground hover:text-foreground transition">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {!consultado && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Icon icon="solar:shield-check-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
          <p className="text-muted-foreground text-sm">Selecciona filtros y haz clic en Buscar para ver las operaciones</p>
        </div>
      )}

      {datos && (
        <>
          {/* Resumen CA-1 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total bruto', valor: `S/ ${datos.resumen.totalBruto.toFixed(2)}`, color: 'text-foreground' },
              { label: 'Total anulado', valor: `S/ ${datos.resumen.totalAnulado.toFixed(2)}`, color: 'text-error' },
              { label: 'Total neto', valor: `S/ ${datos.resumen.totalNeto.toFixed(2)}`, color: 'text-success' },
              { label: 'Ticket promedio', valor: `S/ ${datos.resumen.ticketPromedio.toFixed(2)}`, color: 'text-foreground' },
              { label: 'Transacciones', valor: String(datos.resumen.transacciones), color: 'text-foreground' },
            ].map(({ label, valor, color }) => (
              <div key={label} className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{valor}</p>
              </div>
            ))}
          </div>

          {/* CA-4: desglose por motivo cuando hay anuladas */}
          {estado === 'anulada' && datos.resumen.desgloseMotivoAnulado && (
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-foreground mb-3">Desglose de anulaciones por motivo</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(datos.resumen.desgloseMotivoAnulado).map(([motivo, total]) => (
                  <div key={motivo} className="bg-error/5 border border-error/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{motivo}</p>
                    <p className="text-sm font-bold text-error">S/ {total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CA-3: sin resultados */}
          {sinResultados ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Icon icon="solar:inbox-linear" className="text-muted-foreground mx-auto mb-3" height={36} />
              <p className="text-foreground font-medium">No se encontraron operaciones para los filtros aplicados</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Vendedor</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Productos</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Total</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Motivo</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Acción por</th>
                      {/* CA-4: columna fecha acción solo si hay anuladas/modificadas */}
                      {(estado === 'anulada' || estado === 'modificada' || estado === '') && (
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha acción</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {datos.detalle.map((v) => (
                      <tr key={v._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(v.fecha).toLocaleString('es-PE')}
                        </td>
                        <td className="py-3 px-4 text-foreground">{v.vendedor}</td>
                        <td className="py-3 px-4">
                          <ul className="space-y-0.5">
                            {v.productos?.map((p, i) => (
                              <li key={i} className="text-xs text-foreground">
                                {p.nombre} × {p.cantidad}
                                <span className="text-muted-foreground ml-1">
                                  (S/ {p.precioUnitario?.toFixed(2)})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          S/ {v.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorEstado(v.estado)}`}>
                            {v.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {v.motivo || '—'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {v.usuarioAccion || '—'}
                        </td>
                        {(estado === 'anulada' || estado === 'modificada' || estado === '') && (
                          <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                            {v.estado === 'anulada' && v.fechaAnulacion
                              ? new Date(v.fechaAnulacion).toLocaleString('es-PE')
                              : v.estado === 'modificada' && v.fechaModificacion
                              ? new Date(v.fechaModificacion).toLocaleString('es-PE')
                              : '—'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}