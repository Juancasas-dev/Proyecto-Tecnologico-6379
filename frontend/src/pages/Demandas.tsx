import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Demanda {
  _id: string
  producto: string
  categoria?: string
  stockActual: number
  vecessolicitado: number
  atendido: boolean
  createdAt: string
  registradoPor?: { nombre: string; username: string }
  productoRef?: { nombre: string; stock: number }
}

const API = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

export default function Demandas() {
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [loading, setLoading] = useState(true)
  const [verAtendidas, setVerAtendidas] = useState(false)
  const headers = { Authorization: `Bearer ${getToken()}` }
  const demandasMostradas = verAtendidas
  ? demandas
  : demandas.filter(d => !d.atendido)

  const cargarDemandas = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${API}/demandas`, { headers })
      setDemandas(data)
    } catch {
      console.error('Error al cargar demandas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDemandas() }, [])

  const handleAtender = async (id: string) => {
    try {
      await axios.patch(`${API}/demandas/${id}/atender`, {}, { headers })
      cargarDemandas()
    } catch {
      alert('Error al atender demanda')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-xl font-semibold text-foreground">Demandas Insatisfechas</h1>
    <p className="text-muted-foreground text-sm">
      {demandas.filter(d => !d.atendido).length} pendientes
    </p>
  </div>
  <button
    onClick={() => setVerAtendidas(!verAtendidas)}
    className="text-sm text-muted-foreground hover:text-foreground transition border border-border px-3 py-1.5 rounded-lg"
  >
    {verAtendidas ? 'Ocultar atendidas' : 'Ver atendidas'}
  </button>
</div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : demandasMostradas.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Icon icon="solar:clipboard-list-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
          <p className="text-muted-foreground">No hay demandas registradas</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Categoría</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Veces solicitado</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Registrado por</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
             {demandasMostradas.map((demanda, index) => (
                <tr key={demanda._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground text-sm">{demanda.producto}</p>
                    {demanda.productoRef && (
                      <p className="text-xs text-muted-foreground">En catálogo — Stock: {demanda.productoRef.stock}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-sm">
                    {demanda.categoria || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-bold ${
                      demanda.vecessolicitado >= 3 ? 'text-error' :
                      demanda.vecessolicitado >= 2 ? 'text-warning' : 'text-foreground'
                    }`}>
                      {demanda.vecessolicitado}x
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {demanda.registradoPor?.nombre || '—'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(demanda.createdAt).toLocaleString('es-PE')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      demanda.atendido
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {demanda.atendido ? 'Atendida' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {!demanda.atendido && (
                      <button
                        onClick={() => handleAtender(demanda._id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-success text-success hover:bg-success/10 transition"
                      >
                        Marcar atendida
                      </button>
                    )}
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