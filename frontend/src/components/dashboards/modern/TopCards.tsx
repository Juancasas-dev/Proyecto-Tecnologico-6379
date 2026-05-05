import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import { Link } from 'react-router-dom'
import {
  IconPackage,
  IconAlertTriangle,
  IconCategory,
  IconUsers,
  IconArrowUp,
  IconClipboardList
} from '@tabler/icons-react'
import 'swiper/css'

const TopCards = () => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  const todasLasCards = [
    {
      key: 'productos',
      title: 'Productos',
      desc: '0',
      icon: <IconPackage size={40} />,
      bgcolor: 'bg-primary/10',
      textclr: 'text-primary',
      url: '/dashboard/productos',
      roles: ['dueño', 'vendedor', 'admin']
    },
    {
      key: 'stock-bajo',
      title: 'Stock Bajo',
      desc: '0',
      icon: <IconAlertTriangle size={40} />,
      bgcolor: 'bg-error/10',
      textclr: 'text-error',
      url: '/dashboard/productos',
      roles: ['dueño', 'vendedor', 'admin']
    },
    {
      key: 'categorias',
      title: 'Categorías',
      desc: '0',
      icon: <IconCategory size={40} />,
      bgcolor: 'bg-success/10',
      textclr: 'text-success',
      url: '/dashboard/categorias',
      roles: ['dueño', 'vendedor', 'admin']
    },
    {
      key: 'usuarios',
      title: 'Usuarios',
      desc: '0',
      icon: <IconUsers size={40} />,
      bgcolor: 'bg-warning/10',
      textclr: 'text-warning',
      url: '/dashboard/usuarios',
      roles: ['dueño', 'admin']  // vendedor NO ve esto
    },
    {
      key: 'ingresos',
      title: 'Ingresos',
      desc: '0',
      icon: <IconArrowUp size={40} />,
      bgcolor: 'bg-secondary/10',
      textclr: 'text-secondary',
      url: '/dashboard/ingresos',
      roles: ['dueño', 'admin']  // vendedor NO ve esto
    },
    {
      key: 'ajustes',
      title: 'Ajustes',
      desc: '0',
      icon: <IconClipboardList size={40} />,
      bgcolor: 'bg-info/10',
      textclr: 'text-info',
      url: '/dashboard/ajustes',
      roles: ['dueño', 'admin']  // vendedor NO ve esto
    },
  ]

  // filtra según rol del usuario
  const cards = todasLasCards.filter(card =>
    card.roles.includes(usuario.rol)
  )

  return (
    <Swiper
      slidesPerView={6}
      spaceBetween={24}
      loop={true}
      grabCursor={true}
      speed={5000}
      autoplay={{ delay: 0, disableOnInteraction: false }}
      modules={[Autoplay]}
      breakpoints={{
        0:    { slidesPerView: 1, spaceBetween: 10 },
        640:  { slidesPerView: 2, spaceBetween: 14 },
        768:  { slidesPerView: 3, spaceBetween: 18 },
        1030: { slidesPerView: 4, spaceBetween: 18 },
        1200: { slidesPerView: 6, spaceBetween: 24 },
      }}
      className="mySwiper"
    >
      {cards.map(item => (
        <SwiperSlide key={item.key}>
          <Link to={item.url}>
            <div className={`rounded-lg p-4 ${item.bgcolor} border-none shadow-none`}>
              <div className="text-center hover:scale-105 transition-all ease-in-out">
                <div className={`flex justify-center mb-3 ${item.textclr}`}>
                  {item.icon}
                </div>
                <p className={`font-semibold ${item.textclr} mb-1`}>{item.title}</p>
                <h5 className={`text-lg font-semibold ${item.textclr}`}>{item.desc}</h5>
              </div>
            </div>
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

export { TopCards }