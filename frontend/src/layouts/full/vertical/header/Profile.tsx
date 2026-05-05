import { Icon } from '@iconify/react'
import { profileDD } from './data'
import SimpleBar from 'simplebar-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import { Button } from '../../../../components/ui/button'

const Profile = () => {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  return (
    <div className="relative ps-1 sm:ps-15 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer w-9 h-9 bg-primary text-white font-bold text-sm">
            {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[200px] pb-4 pt-3 rounded-sm">
          <div className="px-4 pb-3">
            <p className="text-sm font-semibold text-foreground">{usuario.nombre}</p>
            <p className="text-xs text-muted-foreground capitalize">{usuario.rol}</p>
          </div>
          <DropdownMenuSeparator />
          <SimpleBar>
            {profileDD.map((item, index) => (
              <DropdownMenuItem
                key={index}
                asChild
                className="px-4 py-2 flex items-center gap-3 cursor-pointer"
              >
                <Link to={item.url}>
                  <Icon icon={item.icon} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{item.title}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </SimpleBar>
          <DropdownMenuSeparator className="my-2" />
          <div className="px-4">
            <Button
              onClick={cerrarSesion}
              variant="outline"
              className="w-full rounded-md text-sm"
            >
              Cerrar sesión
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Profile