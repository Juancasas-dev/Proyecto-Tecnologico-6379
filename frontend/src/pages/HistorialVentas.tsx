import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface ItemVenta {
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface Venta {
  _id: string
  items: ItemVenta[]
  total: number
  tipoPago: 'efectivo' | 'transferencia'
  numeroBoleta?: string
  vendedor: { nombre: string; username: string }
  fecha: string
  estado: 'completada' | 'anulada' | 'modificada'  // ← agregado modificada
  motivo?: string
  fechaAnulacion?: string
  usuarioAccion?: { nombre: string; username: string }
}

const MOTIVOS_ANULAR = ['Error de registro', 'Devolucion total', 'Producto defectuoso', 'Otro']

const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem('token')
const getUsuario = () => JSON.parse(localStorage.getItem('usuario') || '{}')

const formatearFecha = (fecha: string) => new Date(fecha).toLocaleString('es-PE')

export default function HistorialVentas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [busquedaBoleta, setBusquedaBoleta] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null)

  // ─── NUEVO: estado modal anular desde historial (CA-4) ─────────────────
  const [modalAnular, setModalAnular] = useState(false)
  const [motivoAnular, setMotivoAnular] = useState('')
  const [anulando, setAnulando] = useState(false)
  const [errorAnular, setErrorAnular] = useState('')
  // ──────────────────────────────────────────────────────────────────────

  const headers = { Authorization: `Bearer ${getToken()}` }
  const usuario = getUsuario()
  const esDueno = usuario.rol === 'dueño'

  const cargarVentas = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (busquedaBoleta) params.numeroBoleta = busquedaBoleta
      if (fechaFiltro) params.fecha = fechaFiltro

      const { data } = await axios.get(`${API}/ventas`, { headers, params })
      setVentas(data)
    } catch {
      console.error('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarVentas() }, [])

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    cargarVentas()
  }

  // ─── NUEVO: anular desde historial (CA-4) ──────────────────────────────
  const handleAnular = async () => {
    if (!motivoAnular) { setErrorAnular('Debes seleccionar un motivo'); return }
    if (!ventaDetalle) return
    setAnulando(true); setErrorAnular('')
    try {
      await axios.patch(`${API}/ventas/${ventaDetalle._id}/anular`, { motivo: motivoAnular }, { headers })
      setModalAnular(false)
      setMotivoAnular('')
      setVentaDetalle(null)
      cargarVentas()
    } catch (e: any) {
      setErrorAnular(e.response?.data?.mensaje || 'Error al anular')
    } finally {
      setAnulando(false)
    }
  }
  // ──────────────────────────────────────────────────────────────────────

  const totalDia = ventas
    .filter(v => v.estado === 'completada' || v.estado === 'modificada')
    .reduce((sum, v) => sum + v.total, 0)

  const colorEstado = (estado: string) => {
    if (estado === 'completada') return 'bg-success/10 text-success'
    if (estado === 'anulada') return 'bg-error/10 text-error'
    return 'bg-warning/10 text-warning'  // modificada
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Historial de Ventas</h1>
          <p className="text-muted-foreground text-sm">
            {ventas.length} ventas — Total neto: S/ {totalDia.toFixed(2)}
          </p>
        </div>
      </div>

      <form onSubmit={handleBuscar} className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="Buscar por N° boleta..."
          value={busquedaBoleta} onChange={e => setBusquedaBoleta(e.target.value)}
          className="rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
        <input type="date" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)}
          className="rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
        <button type="submit"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primaryemphasis transition">
          <Icon icon="solar:magnifer-linear" height={16} />
          Buscar
        </button>
        {(busquedaBoleta || fechaFiltro) && (
          <button type="button"
            onClick={() => { setBusquedaBoleta(''); setFechaFiltro(''); setTimeout(cargarVentas, 100) }}
            className="text-sm text-muted-foreground hover:text-foreground transition">
            Limpiar filtros
          </button>
        )}
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ventas.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Icon icon="solar:history-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
          <p className="text-muted-foreground">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">N° Boleta</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Productos</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Vendedor</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pago</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Total</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta, index) => (
                <tr key={venta._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{formatearFecha(venta.fecha)}</td>
                  <td className="py-3 px-4">
                    <span className="text-foreground text-xs font-medium">{venta.numeroBoleta || '—'}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {venta.items.length} producto{venta.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-foreground text-xs font-medium">{venta.vendedor?.nombre}</p>
                    <p className="text-muted-foreground text-xs">@{venta.vendedor?.username}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${venta.tipoPago === 'efectivo' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                      {venta.tipoPago === 'efectivo' ? '💵 Efectivo' : '📱 Transferencia'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold text-sm ${venta.estado === 'anulada' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      S/ {venta.total.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorEstado(venta.estado)}`}>
                      {venta.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => setVentaDetalle(venta)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition">
                      <Icon icon="solar:eye-linear" height={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle */}
      {ventaDetalle && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-foreground">Detalle de venta</h2>
              <button onClick={() => setVentaDetalle(null)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">N° Boleta</span>
                <span className="text-foreground font-medium">{ventaDetalle.numeroBoleta || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha</span>
                <span className="text-foreground">{formatearFecha(ventaDetalle.fecha)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vendedor</span>
                <span className="text-foreground">{ventaDetalle.vendedor?.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pago</span>
                <span className="text-foreground capitalize">{ventaDetalle.tipoPago}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estado</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorEstado(ventaDetalle.estado)}`}>
                  {ventaDetalle.estado}
                </span>
              </div>
              {/* Motivo si fue anulada o modificada */}
              {ventaDetalle.motivo && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Motivo</span>
                  <span className="text-foreground">{ventaDetalle.motivo}</span>
                </div>
              )}
              {ventaDetalle.fechaAnulacion && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fecha anulación</span>
                  <span className="text-foreground">{formatearFecha(ventaDetalle.fechaAnulacion)}</span>
                </div>
              )}
              {ventaDetalle.usuarioAccion && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ejecutado por</span>
                  <span className="text-foreground">{ventaDetalle.usuarioAccion.nombre}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4 mb-4">
              <p className="text-sm font-medium text-foreground mb-3">Productos vendidos:</p>
              <div className="space-y-2">
                {ventaDetalle.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.nombre} x{item.cantidad}</span>
                    <span className="text-foreground">S/ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-3 flex justify-between font-semibold mb-4">
              <span className="text-foreground">Total</span>
              <span className="text-primary text-lg">S/ {ventaDetalle.total.toFixed(2)}</span>
            </div>

            {/* ─── NUEVO: botón anular para dueño (CA-4) ─────────────────── */}
            {esDueno && ventaDetalle.estado !== 'anulada' && (
              <button
                onClick={() => { setMotivoAnular(''); setErrorAnular(''); setModalAnular(true) }}
                className="w-full py-2 rounded-lg bg-error/10 text-error border border-error/30 text-sm font-medium hover:bg-error/20 transition">
                Anular venta
              </button>
            )}
            {/* ──────────────────────────────────────────────────────────── */}
          </div>
        </div>
      )}

      {/* ─── NUEVO: Modal anular desde historial (CA-4) ─────────────────── */}
      {modalAnular && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-semibold text-foreground">Anular venta</h3>
              <button onClick={() => setModalAnular(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona el motivo. Los productos volverán al stock.
            </p>
            <div className="space-y-2 mb-4">
              {MOTIVOS_ANULAR.map(m => (
                <label key={m} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${motivoAnular === m ? 'border-error bg-error/5' : 'border-border hover:border-error/50'}`}>
                  <input type="radio" name="motivoAnularHistorial" value={m}
                    checked={motivoAnular === m} onChange={() => setMotivoAnular(m)} className="accent-error" />
                  <span className="text-sm text-foreground">{m}</span>
                </label>
              ))}
            </div>
            {errorAnular && <p className="text-error text-sm mb-3">{errorAnular}</p>}
            <div className="flex gap-2">
              <button onClick={() => setModalAnular(false)}
                className="flex-1 border border-border text-muted-foreground py-2 rounded-lg text-sm hover:bg-muted/30 transition">
                Cancelar
              </button>
              <button onClick={handleAnular} disabled={anulando}
                className="flex-1 bg-error text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
                {anulando ? 'Anulando...' : 'Confirmar anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}