import { Outlet } from 'react-router-dom'
import SidebarLayout from './vertical/sidebar/Sidebar'
import Header from './vertical/header/Header'

const FullLayout = () => {
  return (
    <div className="flex w-full min-h-screen">
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