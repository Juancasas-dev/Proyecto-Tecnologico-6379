import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold text-gray-800">
        Bienvenido, {usuario.nombre}
      </h1>
      <p className="text-gray-400 text-sm">
        Sistema de Inventario
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