import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Movimiento {
  _id: string
  tipo: 'ingreso' | 'venta' | 'ajuste_entrada' | 'ajuste_salida' | 'ajuste'
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

const textoTipo = (tipo: string) => {
  if (tipo === 'ingreso') return 'Ingreso de mercadería'
  if (tipo === 'venta') return 'Venta'
  if (tipo === 'ajuste_entrada') return 'Ajuste entrada'
  if (tipo === 'ajuste_salida') return 'Ajuste salida'
  return 'Ajuste'
}

const colorTipo = (tipo: string) => {
  if (tipo === 'ingreso') return 'bg-primary/10 text-primary'
  if (tipo === 'venta') return 'bg-success/10 text-success'
  if (tipo === 'ajuste_entrada') return 'bg-warning/10 text-warning'
  if (tipo === 'ajuste_salida') return 'bg-error/10 text-error'
  return 'bg-muted/10 text-muted-foreground'
}

const iconoTipo = (tipo: string) => {
  if (tipo === 'ingreso') return 'solar:arrow-up-linear'
  if (tipo === 'venta') return 'solar:cart-large-2-linear'
  if (tipo === 'ajuste_entrada') return 'solar:add-circle-linear'
  if (tipo === 'ajuste_salida') return 'solar:minus-circle-linear'
  return 'solar:settings-linear'
}

export default function ResumenTurno() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [desde, setDesde] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${getToken()}` }

  useEffect(() => {
    const cargarMovimientos = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(`${API}/inventario/turno`, { headers })
        setMovimientos(data.movimientos)
        setDesde(data.desde)
      } catch {
        console.error('Error al cargar movimientos')
      } finally {
        setLoading(false)
      }
    }
    cargarMovimientos()
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Resumen de Turno</h1>
        {desde && (
          <p className="text-muted-foreground text-sm mt-1">
            Movimientos desde tu última sesión:{' '}
            <span className="text-foreground font-medium">
              {new Date(desde).toLocaleString('es-PE')}
            </span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : movimientos.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Icon icon="solar:history-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
          <p className="text-foreground font-medium mb-1">
            No se registraron movimientos desde tu última sesión
          </p>
          {desde && (
            <p className="text-muted-foreground text-sm">
              Último cierre de sesión: {new Date(desde).toLocaleString('es-PE')}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cantidad</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Stock anterior</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Stock nuevo</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Usuario</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov, index) => (
                <tr key={mov._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorTipo(mov.tipo)}`}>
                        <Icon icon={iconoTipo(mov.tipo)} height={14} />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorTipo(mov.tipo)}`}>
                        {textoTipo(mov.tipo)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground text-sm">
                      {mov.productoId?.nombre || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mov.productoId?.marca || ''}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-foreground font-medium">{mov.cantidad}</td>
                  <td className="py-3 px-4 text-muted-foreground">{mov.stockAnterior}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{mov.stockNuevo}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {mov.usuarioId?.nombre || '—'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(mov.fecha).toLocaleString('es-PE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}