interface ProfileType {
  title: string
  subtitle: string
  icon: string
  url: string
}

const profileDD: ProfileType[] = [
  {
    title: 'Mi Perfil',
    subtitle: 'Configuración de cuenta',
    icon: 'tabler:user',
    url: '/dashboard/perfil',
  },
  {
    title: 'Cambiar Contraseña',
    subtitle: 'Actualizar credenciales',
    icon: 'tabler:lock',
    url: '/dashboard/cambiar-password',
  },
]

export { profileDD }