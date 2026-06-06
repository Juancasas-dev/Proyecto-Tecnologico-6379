import { uniqueId } from 'lodash'

export interface MenuItem {
  heading?: string
  name?: string
  icon?: string
  id?: number | string
  url?: string
  children?: MenuItem[]
  disabled?: boolean
}

const SidebarContent: MenuItem[] = [
  {
    heading: 'INICIO',
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/dashboard',
      },
    ],
  },
  {
    heading: 'INVENTARIO',
    children: [
      {
        name: 'Productos',
        icon: 'solar:box-linear',
        id: uniqueId(),
        url: '/dashboard/productos',
      },
      {
        name: 'Categorías',
        icon: 'solar:tag-linear',
        id: uniqueId(),
        url: '/dashboard/categorias',
      },
      {
        name: 'Mercaderia',
        icon: 'solar:arrow-up-linear',
        id: uniqueId(),
        url: '/dashboard/mercaderia',
      },
      {
        name: 'Alertas',
        icon: 'solar:bell-linear',
        id: uniqueId(),
        url: '/dashboard/alertas',
      },
      {
        name: 'Resumen de turno',
        icon: 'solar:history-linear',
        id: uniqueId(),
        url: '/dashboard/turno',
      },
    ],
  },
  {
    heading: 'VENTAS',
    children: [
      {
        name: 'Registrar venta',
        icon: 'solar:cart-large-2-linear',
        id: uniqueId(),
        url: '/dashboard/ventas',
      },
      {
        name: 'Historial',
        icon: 'solar:history-linear',
        id: uniqueId(),
        url: '/dashboard/historial-ventas',
      },
    ],
  },
  {
    heading: 'GESTIÓN',
    children: [
      {
        name: 'Usuarios',
        icon: 'solar:users-group-rounded-linear',
        id: uniqueId(),
        url: '/dashboard/usuarios',
      },
      {
        name: 'Reportes',
        icon: 'solar:chart-linear',
        id: uniqueId(),
        url: '/dashboard/reportes',
      },
      {
        name: 'Demandas',
        icon: 'solar:clipboard-list-linear',
        id: uniqueId(),
        url: '/dashboard/demandas',
      },
      {
        name: 'Ajustes',
        icon: 'solar:settings-linear',
        id: uniqueId(),
        url: '/dashboard/ajustes',
      },
    ],
  },
  {
    heading: 'CUENTA',
    children: [
      {
        name: 'Mi Perfil',
        icon: 'solar:user-circle-linear',
        id: uniqueId(),
        url: '/dashboard/perfil',
      },
    ],
  },
]

export default SidebarContent