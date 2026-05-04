import { useNavigate } from 'react-router-dom'
import Moderndash from '../components/dashboards/modern/Moderndash'

export default function Dashboard() {
  const navigate = useNavigate()

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-end p-4">
        <button
          onClick={cerrarSesion}
          className="text-sm text-red-400 hover:text-red-500 transition"
        >
          Cerrar sesión
        </button>
      </div>
      <Moderndash />
    </div>
  )
}