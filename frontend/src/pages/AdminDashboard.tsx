import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  const statusCards = [
    {
      title: 'Base de Datos',
      status: 'Operativa',
      icon: 'solar:database-linear',
      color: 'text-success',
      bg: 'bg-success/10',
      dot: 'bg-success'
    },
    {
      title: 'Servidor',
      status: 'En línea',
      icon: 'solar:server-linear',
      color: 'text-primary',
      bg: 'bg-primary/10',
      dot: 'bg-primary'
    },
    {
      title: 'Último Respaldo',
      status: 'Hace 2 horas',
      icon: 'solar:shield-check-linear',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      dot: 'bg-secondary'
    },
    {
      title: 'Intentos Fallidos',
      status: '0 hoy',
      icon: 'solar:danger-linear',
      color: 'text-warning',
      bg: 'bg-warning/10',
      dot: 'bg-warning'
    },
  ]

  const acciones = [
    {
      title: 'Respaldos',
      desc: 'Generar y verificar copias de seguridad',
      icon: 'solar:cloud-storage-linear',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Logs de Actividad',
      desc: 'Auditar acciones por usuario y período',
      icon: 'solar:document-text-linear',
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: 'Seguridad',
      desc: 'Accesos fallidos y comportamientos inusuales',
      icon: 'solar:shield-keyhole-linear',
      color: 'text-error',
      bg: 'bg-error/10',
    },
    {
      title: 'Gestión de Accesos',
      desc: 'Desbloquear cuentas y resetear contraseñas',
      icon: 'solar:lock-keyhole-linear',
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      title: 'Recuperación',
      desc: 'Restaurar datos desde respaldos disponibles',
      icon: 'solar:restart-linear',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      title: 'Monitoreo',
      desc: 'Estado general de la aplicación y base de datos',
      icon: 'solar:chart-linear',
      color: 'text-info',
      bg: 'bg-info/10',
    },
  ]

  const logs = [
    { usuario: 'juangarayar', accion: 'Ingreso de mercadería', fecha: 'Hoy 09:30', tipo: 'success' },
    { usuario: 'josegarcia', accion: 'Login exitoso', fecha: 'Hoy 09:15', tipo: 'success' },
    { usuario: 'desconocido', accion: 'Intento de acceso fallido', fecha: 'Hoy 08:50', tipo: 'error' },
    { usuario: 'juangarayar', accion: 'Ajuste manual de stock', fecha: 'Ayer 17:20', tipo: 'warning' },
    { usuario: 'admin', accion: 'Respaldo generado', fecha: 'Ayer 02:00', tipo: 'success' },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-primary">SIVWEB</span>
          <span className="text-muted-foreground text-sm">— Panel Técnico</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {usuario.nombre?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{usuario.nombre}</p>
              <p className="text-xs text-muted-foreground capitalize">{usuario.rol}</p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-sm text-error hover:text-erroremphasis transition flex items-center gap-1"
          >
            <Icon icon="solar:logout-linear" height={16} />
            Salir
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">

        {/* Bienvenida */}
        <div className="bg-lightsecondary rounded-lg p-6 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
            {usuario.nombre?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <h5 className="text-lg font-semibold text-foreground">
              Bienvenido, {usuario.nombre} 🛠️
            </h5>
            <p className="text-muted-foreground text-sm">
              Panel de administración técnica del sistema
            </p>
          </div>
        </div>

        {/* Estado del sistema */}
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Estado del Sistema
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statusCards.map((card, i) => (
            <div key={i} className={`${card.bg} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <Icon icon={card.icon} className={`${card.color} text-2xl`} height={28} />
                <span className={`w-2 h-2 rounded-full ${card.dot}`}></span>
              </div>
              <p className="text-sm font-medium text-foreground">{card.title}</p>
              <p className={`text-sm font-semibold ${card.color}`}>{card.status}</p>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Acciones Técnicas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {acciones.map((accion, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-primary transition"
            >
              <div className={`${accion.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                <Icon icon={accion.icon} className={accion.color} height={24} />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{accion.title}</h3>
              <p className="text-xs text-muted-foreground">{accion.desc}</p>
            </div>
          ))}
        </div>

        {/* Logs recientes */}
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Logs de Actividad Reciente
        </h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Usuario</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Acción</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-foreground font-medium">{log.usuario}</td>
                  <td className="py-3 px-4 text-muted-foreground">{log.accion}</td>
                  <td className="py-3 px-4 text-muted-foreground">{log.fecha}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      log.tipo === 'success' ? 'bg-success/10 text-success' :
                      log.tipo === 'error'   ? 'bg-error/10 text-error' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {log.tipo === 'success' ? 'Exitoso' :
                       log.tipo === 'error'   ? 'Fallido' : 'Alerta'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}