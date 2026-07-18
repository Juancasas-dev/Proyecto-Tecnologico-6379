import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

interface Backup {
  _id: string
  fecha: string
  estado: 'Exitoso' | 'Error'
  archivo: string
  mensaje: string
  tipo: 'manual' | 'automatico'
}

interface ConfiguracionBackup {
  frecuencia: 'diario' | 'semanal'
  hora: string
  activo: boolean
  proximoRespaldo?: string
}

interface ResumenBackup {
  ultimoExitoso: string | null
  tiempoTranscurrido: string
  estaVencido: boolean
  ultimoFallo: boolean
  estadoGeneral: string
  frecuenciaConfig: string
}

const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem('token')

export default function Respaldo() {
  const navigate = useNavigate()
  const [backups, setBackups] = useState<Backup[]>([])
  const [resumen, setResumen] = useState<ResumenBackup | null>(null)
  const [cargando, setCargando] = useState(false)
  const [guardandoConfig, setGuardandoConfig] = useState(false)
  const [config, setConfig] = useState<ConfiguracionBackup>({
    frecuencia: 'diario',
    hora: '02:00',
    activo: true
  })
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null)

  // ─── CA-04: modal error ───────────────────────────────────────────────────
  const [modalError, setModalError] = useState<Backup | null>(null)

  const headers = { Authorization: `Bearer ${getToken()}` }

  const cargarDatos = async () => {
    try {
      const [histRes, configRes, resumenRes] = await Promise.all([
        axios.get(`${API}/backup/historial`, { headers }),
        axios.get(`${API}/backup/configuracion`, { headers }),
        axios.get(`${API}/backup/resumen`, { headers })   // ← nuevo
      ])
      setBackups(histRes.data)
      setResumen(resumenRes.data)
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
        headers, responseType: 'blob'
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition">
            <Icon icon="solar:arrow-left-linear" height={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Gestión de Respaldos</h1>
            <p className="text-muted-foreground text-sm">Administra las copias de seguridad del sistema</p>
          </div>
        </div>
        <button onClick={generarBackup} disabled={cargando}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis disabled:opacity-50 transition">
          <Icon icon="solar:cloud-storage-linear" height={18} />
          {cargando ? 'Generando...' : 'Generar respaldo'}
        </button>
      </div>


      {/* Mensaje */}
      {mensaje && (
        <div className={`rounded-lg px-4 py-3 mb-6 text-sm ${mensaje.tipo === 'success'
            ? 'bg-success/10 text-success border border-success/20'
            : 'bg-error/10 text-error border border-error/20'
          }`}>
          {mensaje.texto}
        </div>
      )}

      {/* ─── CA-02: Resumen del último respaldo ─────────────────────────── */}
      {resumen && (
        <div className={`rounded-lg p-5 mb-6 border ${resumen.ultimoFallo || resumen.estaVencido
            ? 'bg-error/5 border-error/30'
            : 'bg-success/5 border-success/30'
          }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${resumen.ultimoFallo || resumen.estaVencido ? 'bg-error/10' : 'bg-success/10'
              }`}>
              <Icon
                icon={resumen.ultimoFallo || resumen.estaVencido
                  ? 'solar:danger-triangle-linear'
                  : 'solar:shield-check-linear'}
                className={resumen.ultimoFallo || resumen.estaVencido ? 'text-error' : 'text-success'}
                height={22}
              />
            </div>
            <div>
              <p className={`text-sm font-semibold ${resumen.ultimoFallo || resumen.estaVencido ? 'text-error' : 'text-success'
                }`}>
                {resumen.estadoGeneral}
              </p>
              <p className="text-xs text-muted-foreground">
                Último exitoso: {resumen.ultimoExitoso
                  ? new Date(resumen.ultimoExitoso).toLocaleString('es-PE')
                  : 'Nunca'}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm font-medium text-foreground">{resumen.tiempoTranscurrido}</p>
              <p className="text-xs text-muted-foreground capitalize">Frecuencia: {resumen.frecuenciaConfig}</p>
            </div>
          </div>

          {/* CA-03: alerta vencido */}
          {resumen.estaVencido && (
            <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-center gap-2">
              <Icon icon="solar:danger-circle-linear" className="text-error" height={18} />
              <p className="text-error text-sm font-medium">
                El respaldo lleva más de {resumen.frecuenciaConfig === 'semanal' ? '7 días' : '24 horas'} sin ejecutarse.
                Se recomienda generar uno manualmente.
              </p>
            </div>
          )}
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────────── */}

      {/* Configuración automática */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Configuración Automática
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-foreground mb-1 block">Frecuencia</label>
            <select value={config.frecuencia}
              onChange={e => setConfig({ ...config, frecuencia: e.target.value as 'diario' | 'semanal' })}
              className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-card text-foreground outline-none focus:border-primary transition">
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-foreground mb-1 block">Hora de ejecución</label>
            <input type="time" value={config.hora}
              onChange={e => setConfig({ ...config, hora: e.target.value })}
              className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="activo" checked={config.activo}
            onChange={e => setConfig({ ...config, activo: e.target.checked })}
            className="w-4 h-4 accent-primary" />
          <label htmlFor="activo" className="text-sm text-foreground">Activar respaldo automático</label>
        </div>
        {config.proximoRespaldo && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-primary text-sm">
              <strong>Próximo respaldo:</strong>{' '}
              {new Date(config.proximoRespaldo).toLocaleString('es-PE')}
            </p>
          </div>
        )}
        <button onClick={guardarConfiguracion} disabled={guardandoConfig}
          className="flex items-center gap-2 bg-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
          <Icon icon="solar:diskette-linear" height={18} />
          {guardandoConfig ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>

      {/* ─── CA-01: Historial con columna Tipo ──────────────────────────── */}
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
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup, index) => (
                <tr key={backup._id}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 ${backup.estado === 'Error' ? 'bg-error/5' : ''
                    }`}>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
                  <td className="py-3 px-4 text-foreground text-xs">{backup.archivo || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(backup.fecha).toLocaleString('es-PE')}
                  </td>
                  {/* CA-01: columna tipo */}
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${backup.tipo === 'automatico'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/30 text-muted-foreground'
                      }`}>
                      {backup.tipo === 'automatico' ? 'Automático' : 'Manual'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${backup.estado === 'Exitoso'
                        ? 'bg-success/10 text-success'
                        : 'bg-error/10 text-error'
                      }`}>
                      {backup.estado}
                    </span>
                  </td>
                  {/* CA-04: botón ver error */}
                  <td className="py-3 px-4">
                    {backup.estado === 'Error' ? (
                      <button
                        onClick={() => setModalError(backup)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-error/10 text-error hover:bg-error/20 transition">
                        <Icon icon="solar:eye-linear" height={16} />
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">{backup.mensaje}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────────── */}

      {/* CA-04: Modal detalle error */}
      {modalError && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                  <Icon icon="solar:danger-triangle-linear" className="text-error" height={18} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Detalle del error</h3>
              </div>
              <button onClick={() => setModalError(null)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha</span>
                <span className="text-foreground">{new Date(modalError.fecha).toLocaleString('es-PE')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo</span>
                <span className="text-foreground capitalize">{modalError.tipo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Archivo</span>
                <span className="text-foreground">{modalError.archivo || '—'}</span>
              </div>
            </div>
            <div className="bg-error/5 border border-error/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Mensaje de error:</p>
              <p className="text-sm text-error break-words">{modalError.mensaje}</p>
            </div>
            <button onClick={() => setModalError(null)}
              className="w-full mt-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/30 text-sm transition">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}