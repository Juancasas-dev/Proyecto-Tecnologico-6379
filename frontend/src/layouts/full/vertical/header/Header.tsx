import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import FullLogo from '../../shared/logo/FullLogo'
import Profile from './Profile'
import SidebarLayout from '../sidebar/Sidebar'
import { Sheet, SheetContent, SheetTitle } from '../../../../components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

const Header = () => {
  const [isSticky, setIsSticky] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50)
    const handleResize = () => { if (window.innerWidth > 1023) setIsOpen(false) }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <>
      <header className={`sticky top-0 z-[2] ${isSticky ? 'bg-white dark:bg-dark shadow-md' : 'bg-transparent'}`}>
        <nav className="py-4 px-6 flex justify-between items-center">
          <span
            onClick={() => setIsOpen(true)}
            className="xl:hidden flex justify-center items-center cursor-pointer text-foreground hover:text-primary"
          >
            <Icon icon="tabler:menu-2" height={20} />
          </span>

          <div className="hidden xl:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Sistema de Inventario — SIVWEB
            </span>
          </div>

          <div className="block xl:hidden">
            <FullLogo />
          </div>

          <div className="flex items-center gap-2">
            <Profile />
          </div>
        </nav>
      </header>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden>
            <SheetTitle>Menu</SheetTitle>
          </VisuallyHidden>
          <SidebarLayout onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default Header