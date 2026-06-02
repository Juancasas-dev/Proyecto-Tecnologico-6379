import { useState, useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import axios from 'axios'
import SidebarLayout from './vertical/sidebar/Sidebar'
import Header from './vertical/header/Header'

const FullLayout = () => {
  const [mostrarToast, setMostrarToast] = useState(false)
  const [totalAlertas, setTotalAlertas] = useState(0)

  useEffect(() => {
    const cargarAlertas = async () => {
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get('http://localhost:3000/api/alertas', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (data.length > 0) {
          setTotalAlertas(data.length)
          setMostrarToast(true)
          setTimeout(() => setMostrarToast(false), 5000)
        }
      } catch {
        console.error('Error al cargar alertas')
      }
    }
    cargarAlertas()
  }, [])

  return (
    <div className="flex w-full min-h-screen">

      {/* Toast notificación */}
      {mostrarToast && (
        <div className="fixed top-5 right-5 z-50 flex items-start gap-3 bg-card border border-warning rounded-xl shadow-lg p-4 max-w-sm">
          <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
            <Icon icon="solar:bell-bing-linear" className="text-warning" height={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Tienes {totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''} pendiente{totalAlertas !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Revisa la sección de alertas para más detalles
            </p>
            <Link
              to="/dashboard/alertas"
              onClick={() => setMostrarToast(false)}
              className="text-xs text-warning hover:underline mt-1 block"
            >
              Ver alertas →
            </Link>
          </div>
          <button
            onClick={() => setMostrarToast(false)}
            className="text-muted-foreground hover:text-foreground transition shrink-0"
          >
            <Icon icon="solar:close-circle-linear" height={18} />
          </button>
        </div>
      )}

      <div className="page-wrapper flex w-full">
        <div className="xl:block hidden">
          <SidebarLayout />
        </div>
        <div className="body-wrapper w-full bg-white dark:bg-dark xl:ml-[270px]">
          <Header />
          <div className="container mx-auto px-6 py-6">
            <main className="grow">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullLayout