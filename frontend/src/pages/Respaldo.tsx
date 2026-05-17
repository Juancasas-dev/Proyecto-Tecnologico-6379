import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Backup {
  _id: string
  fecha: string
  estado: 'Exitoso' | 'Error'
  archivo: string
  mensaje: string
}

interface ConfiguracionBackup {
  frecuencia: 'diario' | 'semanal'
  hora: string
  activo: boolean
  proximoRespaldo?: string
}

const API = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

export default function Respaldo() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardandoConfig, setGuardandoConfig] = useState(false)
  const [config, setConfig] = useState<ConfiguracionBackup>({
    frecuencia: 'diario',
    hora: '02:00',
    activo: true
  })
  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null)

  const headers = { Authorization: `Bearer ${getToken()}` }

  const cargarDatos = async () => {
    try {
      const [histRes, configRes] = await Promise.all([
        axios.get(`${API}/backup/historial`, { headers }),
        axios.get(`${API}/backup/configuracion`, { headers })
      ])
      setBackups(histRes.data)
      if (configRes.data) {
        setConfig({
          frecuencia: configRes.data.frecuencia || 'diario',
          hora: configRes.data.hora || '02:00',
          activo: configRes.data.activo ?? true,
          proximoRespaldo: configRes.data.proximoRespaldo
        })
      }
    } catch (error) {
      console.error('Error al cargar datos', error)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const guardarConfiguracion = async () => {
    try {
      setGuardandoConfig(true)
      const res = await axios.post(`${API}/backup/configuracion`, config, { headers })
      setMensaje({ texto: res.data.mensaje || 'Configuración guardada correctamente', tipo: 'success' })
      cargarDatos()
    } catch {
      setMensaje({ texto: 'Error al guardar la configuración', tipo: 'error' })
    } finally {
      setGuardandoConfig(false)
      setTimeout(() => setMensaje(null), 3000)
    }
  }

  const generarBackup = async () => {
    try {
      setCargando(true)
      const response = await axios.get(`${API}/backup/generar`, {
        headers,
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `backup-${new Date().toISOString()}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setMensaje({ texto: 'Respaldo generado y descargado correctamente', tipo: 'success' })
      cargarDatos()
    } catch {
      setMensaje({ texto: 'Error al generar respaldo', tipo: 'error' })
    } finally {
      setCargando(false)
      setTimeout(() => setMensaje(null), 3000)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Gestión de Respaldos</h1>
          <p className="text-muted-foreground text-sm">Administra las copias de seguridad del sistema</p>
        </div>
        <button
          onClick={generarBackup}
          disabled={cargando}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis disabled:opacity-50 transition"
        >
          <Icon icon="solar:cloud-storage-linear" height={18} />
          {cargando ? 'Generando...' : 'Generar respaldo'}
        </button>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`rounded-lg px-4 py-3 mb-6 text-sm ${
          mensaje.tipo === 'success' 
            ? 'bg-success/10 text-success border border-success/20' 
            : 'bg-error/10 text-error border border-error/20'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Configuración automática */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Configuración Automática
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-foreground mb-1 block">Frecuencia</label>
            <select
              value={config.frecuencia}
              onChange={e => setConfig({...config, frecuencia: e.target.value as 'diario' | 'semanal'})}
              className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-card text-foreground outline-none focus:border-primary transition"
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-foreground mb-1 block">Hora de ejecución</label>
            <input
              type="time"
              value={config.hora}
              onChange={e => setConfig({...config, hora: e.target.value})}
              className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="activo"
            checked={config.activo}
            onChange={e => setConfig({...config, activo: e.target.checked})}
            className="w-4 h-4 accent-primary"
          />
          <label htmlFor="activo" className="text-sm text-foreground">
            Activar respaldo automático
          </label>
        </div>

        {config.proximoRespaldo && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-primary text-sm">
              <strong>Próximo respaldo:</strong>{' '}
              {new Date(config.proximoRespaldo).toLocaleString('es-PE')}
            </p>
          </div>
        )}

        <button
          onClick={guardarConfiguracion}
          disabled={guardandoConfig}
          className="flex items-center gap-2 bg-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          <Icon icon="solar:diskette-linear" height={18} />
          {guardandoConfig ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>

      {/* Historial */}
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Historial de Respaldos
      </h2>

      {backups.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Icon icon="solar:cloud-storage-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
          <p className="text-muted-foreground">No hay respaldos registrados aún</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Archivo</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup, index) => (
                <tr key={backup._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
                  <td className="py-3 px-4 text-foreground text-xs">{backup.archivo || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(backup.fecha).toLocaleString('es-PE')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      backup.estado === 'Exitoso'
                        ? 'bg-success/10 text-success'
                        : 'bg-error/10 text-error'
                    }`}>
                      {backup.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{backup.mensaje}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}