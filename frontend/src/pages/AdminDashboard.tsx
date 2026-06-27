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

  const acciones = [
    {
      title: 'Respaldos',
      desc: 'Generar, monitorear y verificar copias de seguridad',
      icon: 'solar:cloud-storage-linear',
      color: 'text-primary',
      bg: 'bg-primary/10',
      url: '/admin/respaldos',
      disponible: true
    },
    {
      title: 'Logs de Actividad',
      desc: 'Auditar acciones por usuario y período',
      icon: 'solar:document-text-linear',
      color: 'text-success',
      bg: 'bg-success/10',
      url: null,
      disponible: false
    },
    {
      title: 'Seguridad',
      desc: 'Accesos fallidos y comportamientos inusuales',
      icon: 'solar:shield-keyhole-linear',
      color: 'text-error',
      bg: 'bg-error/10',
      url: null,
      disponible: false
    },
    {
      title: 'Gestión de Accesos',
      desc: 'Desbloquear cuentas y resetear contraseñas',
      icon: 'solar:lock-keyhole-linear',
      color: 'text-warning',
      bg: 'bg-warning/10',
      url: null,
      disponible: false
    },
    {
      title: 'Recuperación',
      desc: 'Restaurar datos desde respaldos disponibles',
      icon: 'solar:restart-linear',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      url: null,
      disponible: false
    },
    {
      title: 'Monitoreo',
      desc: 'Estado general de la aplicación y base de datos',
      icon: 'solar:chart-linear',
      color: 'text-primary',
      bg: 'bg-primary/10',
      url: null,
      disponible: false
    },
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
          <button onClick={cerrarSesion}
            className="text-sm text-error hover:text-erroremphasis transition flex items-center gap-1">
            <Icon icon="solar:logout-linear" height={16} />
            Salir
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">

        {/* Bienvenida */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6 flex items-center gap-4">
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

        {/* Módulos */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Módulos Técnicos
          </h2>
          <span className="text-xs text-muted-foreground">
            1 disponible · 5 próximamente
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {acciones.map((accion, i) => (
            <div key={i}
              onClick={() => accion.url && navigate(accion.url)}
              className={`bg-card border rounded-lg p-5 transition relative ${
                accion.disponible
                  ? 'border-border cursor-pointer hover:border-primary hover:shadow-sm'
                  : 'border-border opacity-50 cursor-not-allowed'
              }`}>
              {/* Badge próximamente */}
              {!accion.disponible && (
                <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                  Próximamente
                </span>
              )}
              <div className={`${accion.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                <Icon icon={accion.icon} className={accion.color} height={24} />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{accion.title}</h3>
              <p className="text-xs text-muted-foreground">{accion.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}