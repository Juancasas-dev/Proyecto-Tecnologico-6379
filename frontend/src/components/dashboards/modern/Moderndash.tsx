import { useState, useEffect } from 'react'
import axios from 'axios'
import { Icon } from '@iconify/react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, XAxis as BXAxis, YAxis as BYAxis,
  Tooltip as BTooltip, ResponsiveContainer as BResponsiveContainer
} from 'recharts'

const API = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const COLORES_DONA = ['#5d87ff', '#49beff', '#13deb9', '#ffae1f', '#fa896b', '#6f42c1']

const PERIODOS = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Esta semana', value: 'semana' },
  { label: 'Este mes', value: 'mes' },
  { label: 'Este año', value: 'año' },
]

interface Resumen {
  totalVentas: number
  variacionVentas: number
  transacciones: number
  variacionTransacciones: number
  ticketPromedio: number
  variacionTicket: number
  totalPerdidas: number
  productosBajoStock: number
  alertasActivas: number
  proximosVencer: number
}

export default function Moderndash() {
  const [periodo, setPeriodo] = useState('mes')
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [evolucion, setEvolucion] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [masVendidos, setMasVendidos] = useState<any[]>([])
  const [bajoStock, setBajoStock] = useState<any[]>([])
  const [valorInventario, setValorInventario] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const headers = { Authorization: `Bearer ${getToken()}` }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [resRes, evRes, catRes, mvRes, bsRes, viRes] = await Promise.all([
        axios.get(`${API}/dashboard/resumen`, { params: { periodo }, headers }),
        axios.get(`${API}/dashboard/evolucion`, { params: { periodo }, headers }),
        axios.get(`${API}/dashboard/categorias`, { headers }),
        axios.get(`${API}/dashboard/productos-mas-vendidos`, { params: { periodo }, headers }),
        axios.get(`${API}/dashboard/bajo-stock`, { headers }),
        axios.get(`${API}/dashboard/valor-inventario`, { headers }),
      ])
      setResumen(resRes.data)
      setEvolucion(evRes.data)
      setCategorias(catRes.data)
      setMasVendidos(mvRes.data)
      setBajoStock(bsRes.data)
      setValorInventario(viRes.data)
    } catch {
      console.error('Error al cargar dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [periodo])

  const Variacion = ({ valor }: { valor: number }) => (
    <span className={`text-xs flex items-center gap-0.5 ${valor >= 0 ? 'text-success' : 'text-error'}`}>
      <Icon icon={valor >= 0 ? 'solar:arrow-up-linear' : 'solar:arrow-down-linear'} height={12} />
      {Math.abs(valor)}% vs periodo anterior
    </span>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header + selector de periodo */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard del negocio</h1>
          <p className="text-muted-foreground text-sm">Bienvenido, {usuario.nombre}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PERIODOS.map(p => (
            <button key={p.value} onClick={() => setPeriodo(p.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
                periodo === p.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted-foreground hover:border-primary'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tarjetas métricas CA-1 ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            label: 'Total ventas',
            valor: `S/ ${resumen?.totalVentas.toFixed(2)}`,
            variacion: resumen?.variacionVentas,
            color: 'text-primary', bg: 'bg-primary/10',
            icon: 'solar:wallet-money-linear'
          },
          {
            label: 'Transacciones',
            valor: resumen?.transacciones,
            variacion: resumen?.variacionTransacciones,
            color: 'text-success', bg: 'bg-success/10',
            icon: 'solar:chart-linear'
          },
          {
            label: 'Ticket promedio',
            valor: `S/ ${resumen?.ticketPromedio.toFixed(2)}`,
            variacion: resumen?.variacionTicket,
            color: 'text-warning', bg: 'bg-warning/10',
            icon: 'solar:tag-price-linear'
          },
          {
            label: 'Total pérdidas',
            valor: `S/ ${resumen?.totalPerdidas.toFixed(2)}`,
            variacion: null, color: 'text-error', bg: 'bg-error/10',
            icon: 'solar:danger-triangle-linear'
          },
          {
            label: 'Bajo stock mínimo',
            valor: resumen?.productosBajoStock,
            variacion: null, color: 'text-warning', bg: 'bg-warning/10',
            icon: 'solar:box-minimalistic-linear',
            link: '/dashboard/productos'
          },
          {
            label: 'Próximos a vencer',
            valor: resumen?.proximosVencer,
            variacion: null, color: 'text-error', bg: 'bg-error/10',
            icon: 'solar:calendar-mark-linear',
            link: '/dashboard/alertas'
          },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} rounded-lg p-4`}>
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-2">
              <Icon icon={card.icon} className={card.color} height={22} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{card.valor}</p>
            {card.variacion !== null && card.variacion !== undefined && (
              <Variacion valor={card.variacion} />
            )}
            {card.link && (
              <a href={card.link} className="text-xs text-primary hover:underline">
                ver productos →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* ─── Gráficos principales ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Evolución de ventas */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Evolución de ventas</h2>
          {evolucion.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground text-sm">Sin datos para este periodo</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucion}>
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Ventas']} />
                <Line type="monotone" dataKey="total" stroke="#5d87ff" strokeWidth={2}
                  dot={evolucion.length <= 5 ? { r: 4, fill: '#5d87ff' } : false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución por categoría */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Distribución por categoría</h2>
          {categorias.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground text-sm">Sin datos</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categorias} dataKey="stock" nameKey="categoria"
                  cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
                  {categorias.map((_, i) => (
                    <Cell key={i} fill={COLORES_DONA[i % COLORES_DONA.length]} />
                  ))}
                </Pie>
                <Legend formatter={(val) => <span style={{ fontSize: 11 }}>{val}</span>} />
                <Tooltip formatter={(val: any) => [`${val} uds.`, '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Productos más vendidos ───────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Productos más vendidos — {PERIODOS.find(p => p.value === periodo)?.label.toLowerCase()}
        </h2>
        {masVendidos.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-sm">Sin ventas en este periodo</p>
          </div>
        ) : (
          <BResponsiveContainer width="100%" height={masVendidos.length * 44 + 20}>
            <BarChart data={masVendidos} layout="vertical"
              margin={{ left: 160, right: 20, top: 5, bottom: 5 }}>
              <BXAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
              <BYAxis type="category" dataKey="nombre"
                tick={{ fontSize: 11, fill: '#888' }} width={155} />
              <BTooltip formatter={(val: any) => [`${val} uds.`, 'Vendidos']} />
              <Bar dataKey="cantidad" fill="#5d87ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </BResponsiveContainer>
        )}
      </div>

      {/* ─── CA-4: Inventario ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Productos bajo stock */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Productos bajo stock mínimo
          </h2>
          {bajoStock.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Icon icon="solar:shield-check-linear" className="text-success mx-auto mb-2" height={32} />
                <p className="text-muted-foreground text-sm">
                  Todos los productos tienen stock suficiente
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {bajoStock.map((p, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <p className="text-sm text-foreground">{p.nombre}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    p.critico ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                  }`}>
                    Stock: {p.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Valor estimado del inventario */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">
            Valor estimado del inventario
          </h2>
          {valorInventario && (
            <p className="text-2xl font-bold text-primary mb-4">
              S/ {valorInventario.totalGeneral.toLocaleString('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
              <span className="text-sm font-normal text-muted-foreground ml-2">en stock actual</span>
            </p>
          )}
          {!valorInventario || valorInventario.porCategoria.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground text-sm">Sin datos</p>
            </div>
          ) : (
            <BResponsiveContainer width="100%" height={180}>
              <BarChart data={valorInventario.porCategoria}
                margin={{ left: 0, right: 10, top: 5, bottom: 30 }}>
                <BXAxis dataKey="categoria" tick={{ fontSize: 9, fill: '#888' }}
                  angle={-20} textAnchor="end" />
                <BYAxis tick={{ fontSize: 10, fill: '#888' }}
                  tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
                <BTooltip
                  formatter={(val: any) => [`S/ ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Valor']} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {valorInventario.porCategoria.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORES_DONA[i % COLORES_DONA.length]} />
                  ))}
                </Bar>
              </BarChart>
            </BResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  )
}