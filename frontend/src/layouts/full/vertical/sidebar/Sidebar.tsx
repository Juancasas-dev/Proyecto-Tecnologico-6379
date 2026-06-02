import { useState, useEffect } from 'react'
import SidebarContent from './sidebaritems'
import SimpleBar from 'simplebar-react'
import { Icon } from '@iconify/react'
import FullLogo from '../../shared/logo/FullLogo'
import { Link, useLocation } from 'react-router-dom'
import { AMLogo, AMMenu, AMMenuItem, AMSidebar, AMSubmenu } from 'tailwind-sidebar'
import 'tailwind-sidebar/styles.css'
import 'simplebar-react/dist/simplebar.min.css'
import axios from 'axios'

interface SidebarItemType {
  heading?: string
  id?: number | string
  name?: string
  icon?: string
  url?: string
  children?: SidebarItemType[]
  disabled?: boolean
}

const renderSidebarItems = (
  items: SidebarItemType[],
  currentPath: string,
  totalAlertas: number,
  onClose?: () => void,
  isSubItem: boolean = false,
) => {
  return items.map((item, index) => {
    const isSelected = currentPath === item?.url
    const iconElement = item.icon ? (
      <Icon icon={item.icon} height={21} width={21} />
    ) : (
      <Icon icon="ri:checkbox-blank-circle-line" height={9} width={9} />
    )

    if (item.heading) {
      return (
        <div className="mb-1" key={`heading-${index}`}>
          <AMMenu
            subHeading={item.heading}
            ClassName="leading-21 text-sidebar-foreground font-bold uppercase text-xs"
          />
        </div>
      )
    }

    if (item.children?.length) {
      return (
        <AMSubmenu
          key={item.id}
          icon={iconElement}
          title={item.name}
          ClassName="mt-0.5 text-sidebar-foreground"
        >
          {renderSidebarItems(item.children, currentPath, totalAlertas, onClose, true)}
        </AMSubmenu>
      )
    }

    return (
      <div key={item.id} onClick={onClose}>
        <AMMenuItem
          icon={iconElement}
          isSelected={isSelected}
          link={item.url || undefined}
          component={Link}
          className={`mt-0.5 text-sidebar-foreground ${
            isSubItem && isSelected ? '!bg-transparent !text-primary' : ''
          }`}
        >
          <span className="truncate flex-1">{item.name}</span>
          {item.url === '/dashboard/alertas' && totalAlertas > 0 && (
            <span className="ml-2 bg-error text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {totalAlertas}
            </span>
          )}
        </AMMenuItem>
      </div>
    )
  })
}

const SidebarLayout = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation()
  const pathname = location.pathname
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const [totalAlertas, setTotalAlertas] = useState(0)

  useEffect(() => {
    const cargarAlertas = async () => {
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get('http://localhost:3000/api/alertas', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setTotalAlertas(data.length)
      } catch {
        console.error('Error al cargar alertas')
      }
    }
    cargarAlertas()
  }, [])

  const menuFiltrado = usuario.rol === 'vendedor'
    ? SidebarContent.filter(s => s.heading !== 'GESTIÓN')
    : SidebarContent

  return (
    <AMSidebar
      collapsible="none"
      animation={true}
      showProfile={false}
      width="270px"
      showTrigger={false}
      className="fixed left-0 top-0 border border-border bg-sidebar z-10 h-screen"
    >
      <div className="px-6 py-4 flex items-center">
        <AMLogo component={Link} href="/" img="">
          <FullLogo />
        </AMLogo>
      </div>

      <SimpleBar className="h-[calc(100vh-80px)]">
        <div className="px-6">
          {menuFiltrado.map((section, index) => (
            <div key={index}>
              {renderSidebarItems(
                [
                  ...(section.heading ? [{ heading: section.heading }] : []),
                  ...(section.children || []),
                ],
                pathname,
                totalAlertas,
                onClose,
              )}
            </div>
          ))}
        </div>
      </SimpleBar>
    </AMSidebar>
  )
}

export default SidebarLayout