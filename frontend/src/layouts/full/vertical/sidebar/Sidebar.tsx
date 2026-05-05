import SidebarContent from './sidebaritems'
import SimpleBar from 'simplebar-react'
import { Icon } from '@iconify/react'
import FullLogo from '../../shared/logo/FullLogo'
import { Link, useLocation } from 'react-router-dom'
import { AMLogo, AMMenu, AMMenuItem, AMSidebar, AMSubmenu } from 'tailwind-sidebar'
import 'tailwind-sidebar/styles.css'
import 'simplebar-react/dist/simplebar.min.css'

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
          {renderSidebarItems(item.children, currentPath, onClose, true)}
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
        </AMMenuItem>
      </div>
    )
  })
}

const SidebarLayout = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation()
  const pathname = location.pathname

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
          {SidebarContent.map((section, index) => (
            <div key={index}>
              {renderSidebarItems(
                [
                  ...(section.heading ? [{ heading: section.heading }] : []),
                  ...(section.children || []),
                ],
                pathname,
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