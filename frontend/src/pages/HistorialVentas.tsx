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
  estado: 'completada' | 'anulada'
}

const API = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleString('es-PE')
}

export default function HistorialVentas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [busquedaBoleta, setBusquedaBoleta] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null)

  const headers = { Authorization: `Bearer ${getToken()}` }

  const cargarVentas = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (busquedaBoleta) params.numeroBoleta = busquedaBoleta
      if (fechaFiltro) params.fecha = fechaFiltro

      const { data } = await axios.get(`${API}/ventas`, { 
        headers,
        params
      })
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

  const totalDia = ventas
    .filter(v => v.estado === 'completada')
    .reduce((sum, v) => sum + v.total, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Historial de Ventas</h1>
          <p className="text-muted-foreground text-sm">
            {ventas.length} ventas — Total: S/ {totalDia.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <form onSubmit={handleBuscar} className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por N° boleta..."
          value={busquedaBoleta}
          onChange={e => setBusquedaBoleta(e.target.value)}
          className="rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
        />
        <input
          type="date"
          value={fechaFiltro}
          onChange={e => setFechaFiltro(e.target.value)}
          className="rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primaryemphasis transition"
        >
          <Icon icon="solar:magnifer-linear" height={16} />
          Buscar
        </button>
        {(busquedaBoleta || fechaFiltro) && (
          <button
            type="button"
            onClick={() => {
              setBusquedaBoleta('')
              setFechaFiltro('')
              setTimeout(cargarVentas, 100)
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Limpiar filtros
          </button>
        )}
      </form>

      {/* Tabla */}
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
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {formatearFecha(venta.fecha)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-foreground text-xs font-medium">
                      {venta.numeroBoleta || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {venta.items.length} producto{venta.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-foreground text-xs font-medium">{venta.vendedor?.nombre}</p>
                    <p className="text-muted-foreground text-xs">@{venta.vendedor?.username}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      venta.tipoPago === 'efectivo'
                        ? 'bg-success/10 text-success'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {venta.tipoPago === 'efectivo' ? '💵 Efectivo' : '📱 Transferencia'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-foreground text-sm">
                      S/ {venta.total.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      venta.estado === 'completada'
                        ? 'bg-success/10 text-success'
                        : 'bg-error/10 text-error'
                    }`}>
                      {venta.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setVentaDetalle(venta)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
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
              <button
                onClick={() => setVentaDetalle(null)}
                className="text-muted-foreground hover:text-foreground"
              >
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
            </div>

            <div className="border-t border-border pt-4 mb-4">
              <p className="text-sm font-medium text-foreground mb-3">Productos vendidos:</p>
              <div className="space-y-2">
                {ventaDetalle.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.nombre} x{item.cantidad}
                    </span>
                    <span className="text-foreground">S/ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-3 flex justify-between font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-primary text-lg">S/ {ventaDetalle.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}