const ProfileWelcome = () => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  return (
    <div className="relative flex items-center justify-between bg-lightsecondary rounded-lg p-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
          {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex flex-col gap-0.5">
          <h5 className="card-title">Bienvenido, {usuario.nombre} 👋</h5>
          <p className="text-muted-foreground text-sm">
            {usuario.rol === 'dueño' ? 'Revisa tu inventario' : 'Panel de ventas'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProfileWelcome