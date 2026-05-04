import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold text-white">
        Bienvenido, {usuario.nombre}
      </h1>
      <p className="text-gray-400 text-sm">
        Panel Técnico — Administrador del Sistema
      </p>
      <p className="text-gray-500 text-xs">
        Aquí irá la gestión técnica del sistema
      </p>
      <button
        onClick={cerrarSesion}
        className="mt-4 text-sm text-red-400 hover:text-red-500 transition"
      >
        Cerrar sesión
      </button>
    </div>
  )
}