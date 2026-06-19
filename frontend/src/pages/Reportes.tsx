import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface ReporteRotacion {
    nombre: string
    marca: string
    unidadesVendidas: number
    totalGenerado: number
    porcentaje: number
    categoria: string
}

interface Demanda {
    producto: string
    categoria: string
    vecesSolicitado: number
    fecha: string
    vendedor: string
}

interface AjustePerdida {
    producto: string
    marca: string
    unidades: number
    causa: string
    valorEconomico: number
    fecha: string
    registradoPor: string
}

interface ReportePerdidas {
    totalGeneral: number
    subtotales: Record<string, number>
    detalle: AjustePerdida[]
}

interface ProductoReposicion {
    _id: string
    nombre: string
    categoria: string
    presentacion: string
    stockActual: number
    nivelMinimo: number
    cantidadSugerida: number
    critico: boolean
}

interface DemandaReposicion {
    producto: string
    vecesSolicitado: number
}

interface Reposicion {
    productos: ProductoReposicion[]
    demandaNoAtendida: DemandaReposicion[]
}

const API = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

const causaColor = (causa: string) => {
    if (causa === 'Robo o hurto') return 'bg-error/10 text-error'
    if (causa === 'Producto vencido') return 'bg-warning/10 text-warning'
    if (causa === 'Merma') return 'bg-primary/10 text-primary'
    if (causa === 'Error de conteo') return 'bg-muted/30 text-muted-foreground'
    return 'bg-muted/30 text-muted-foreground'
}

const rotacionColor = (categoria: string) => {
    if (categoria === 'Alta rotacion') return 'bg-success/10 text-success'
    if (categoria === 'Rotacion media') return 'bg-warning/10 text-warning'
    if (categoria === 'Baja rotacion') return 'bg-primary/10 text-primary'
    return 'bg-error/10 text-error'
}

export default function Reportes() {
    const [vista, setVista] = useState<'rotacion' | 'demanda' | 'perdidas' | 'reposicion'>('rotacion')
    const headers = { Authorization: `Bearer ${getToken()}` }

    // ── Rotación ─────────────────────────────────────────────────────────
    const [productos, setProductos] = useState<ReporteRotacion[]>([])
    const [filtroRotacion, setFiltroRotacion] = useState('todos')
    const [fechaInicioRotacion, setFechaInicioRotacion] = useState('')
    const [fechaFinRotacion, setFechaFinRotacion] = useState('')
    const [loadingRotacion, setLoadingRotacion] = useState(false)

    const cargarRotacion = async () => {
        try {
            setLoadingRotacion(true)
            const { data } = await axios.get(`${API}/reportes/rotacion`, {
                params: { inicio: fechaInicioRotacion, fin: fechaFinRotacion },
                headers
            })
            setProductos(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingRotacion(false)
        }
    }

    // ── Demanda insatisfecha ─────────────────────────────────────────────
    const [demandas, setDemandas] = useState<Demanda[]>([])
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [loadingDemanda, setLoadingDemanda] = useState(false)
    const [demandaConsultada, setDemandaConsultada] = useState(false)

    const cargarDemandas = async () => {
        try {
            setLoadingDemanda(true)
            const { data } = await axios.get(`${API}/reportes/demanda`, {
                params: { inicio: fechaInicio, fin: fechaFin },
                headers
            })
            setDemandas(data)
            setDemandaConsultada(true)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingDemanda(false)
        }
    }



    // ── Pérdidas (HU-22) ─────────────────────────────────────────────────
    const [perdidas, setPerdidas] = useState<ReportePerdidas | null>(null)
    const [fechaInicioPerdidas, setFechaInicioPerdidas] = useState('')
    const [fechaFinPerdidas, setFechaFinPerdidas] = useState('')
    const [causaFiltro, setCausaFiltro] = useState('todos')
    const [loadingPerdidas, setLoadingPerdidas] = useState(false)

    const cargarPerdidas = async () => {
        try {
            setLoadingPerdidas(true)
            const { data } = await axios.get(`${API}/reportes/perdidas`, {
                params: {
                    inicio: fechaInicioPerdidas,
                    fin: fechaFinPerdidas,
                    causa: causaFiltro
                },
                headers
            })
            setPerdidas(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingPerdidas(false)
        }
    }

    const exportarPDF = async (tipo: 'perdidas' | 'reposicion') => {
        try {
            const params = tipo === 'perdidas'
                ? { inicio: fechaInicioPerdidas, fin: fechaFinPerdidas, causa: causaFiltro }
                : { categoria: categoriaReposicion }

            const response = await axios.get(`${API}/reportes/${tipo}/pdf`, {
                params,
                headers,
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${tipo}-${new Date().toISOString().slice(0, 10)}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error('Error al exportar PDF', error)
            alert('No se pudo generar el PDF. Intenta de nuevo.')
        }
    }

    useEffect(() => {
        if (vista === 'perdidas' && perdidas) cargarPerdidas()
    }, [causaFiltro])

    // ── Reposición (HU-23) ───────────────────────────────────────────────
    const [reposicion, setReposicion] = useState<Reposicion | null>(null)
    const [categoriaReposicion, setCategoriaReposicion] = useState('todos')
    const [loadingReposicion, setLoadingReposicion] = useState(false)

    const cargarReposicion = async () => {
        try {
            setLoadingReposicion(true)
            const { data } = await axios.get(`${API}/reportes/reposicion`, {
                params: { categoria: categoriaReposicion },
                headers
            })
            setReposicion(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingReposicion(false)
        }
    }

    useEffect(() => {
        if (vista === 'rotacion') cargarRotacion()
        if (vista === 'reposicion') cargarReposicion()
        if (vista === 'demanda') { setDemandas([]); setDemandaConsultada(false) }
    }, [vista])

    useEffect(() => {
        if (vista === 'reposicion') cargarReposicion()
    }, [categoriaReposicion])

    const productosFiltrados = filtroRotacion === 'todos'
        ? productos
        : productos.filter(p => p.categoria === filtroRotacion)

    const formatearFecha = (fecha: string) =>
        new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">Reportería</h1>
                <p className="text-muted-foreground text-sm">Indicadores del negocio para tomar decisiones</p>
            </div>

            {/* Pestañas */}
            <div className="flex gap-1 mb-6 bg-muted/20 p-1 rounded-lg w-fit flex-wrap">
                {([
                    ['rotacion', 'Rotación'],
                    ['demanda', 'Demanda insatisfecha'],
                    ['perdidas', 'Pérdidas'],
                    ['reposicion', 'Reposición']
                ] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setVista(key)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${vista === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ═══════════ ROTACIÓN ═══════════ */}
            {vista === 'rotacion' && (
                <>
                    <div className="flex gap-2 mb-4 flex-wrap items-end">
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Desde</label>
                            <input type="date" value={fechaInicioRotacion}
                                onChange={e => setFechaInicioRotacion(e.target.value)}
                                className="rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Hasta</label>
                            <input type="date" value={fechaFinRotacion}
                                onChange={e => setFechaFinRotacion(e.target.value)}
                                className="rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary" />
                        </div>
                        <button onClick={cargarRotacion}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primaryemphasis transition">
                            Buscar
                        </button>
                    </div>

                    <div className="flex gap-2 mb-4 flex-wrap">
                        {[
                            ['todos', 'Todos'],
                            ['Alta rotacion', 'Alta'],
                            ['Rotacion media', 'Media'],
                            ['Baja rotacion', 'Baja'],
                            ['Sin movimiento', 'Sin movimiento']
                        ].map(([val, label]) => (
                            <button key={val} onClick={() => setFiltroRotacion(val)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filtroRotacion === val ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                    }`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {loadingRotacion ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto</th>
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Marca</th>
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Unidades</th>
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Total S/</th>
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">%</th>
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Categoría</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosFiltrados.map((p, i) => (
                                        <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="py-3 px-4 text-foreground">{p.nombre}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{p.marca}</td>
                                            <td className="py-3 px-4 text-foreground font-medium">{p.unidadesVendidas}</td>
                                            <td className="py-3 px-4 text-foreground">S/ {Number(p.totalGenerado).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{p.porcentaje?.toFixed(2)}%</td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rotacionColor(p.categoria)}`}>
                                                    {p.categoria}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════ DEMANDA INSATISFECHA ═══════════ */}
            {vista === 'demanda' && (
                <>
                    <div className="flex gap-2 mb-4 flex-wrap items-end">
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Desde</label>
                            <input type="date" value={fechaInicio}
                                onChange={e => setFechaInicio(e.target.value)}
                                className="rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Hasta</label>
                            <input type="date" value={fechaFin}
                                onChange={e => setFechaFin(e.target.value)}
                                className="rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary" />
                        </div>
                        <button onClick={cargarDemandas}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primaryemphasis transition">
                            Buscar
                        </button>
                    </div>

                    {loadingDemanda ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : !demandaConsultada ? (
                        <div className="bg-card border border-border rounded-lg p-12 text-center">
                            <Icon icon="solar:calendar-search-linear" className="text-muted-foreground mx-auto mb-3" height={36} />
                            <p className="text-muted-foreground text-sm">Selecciona un rango de fechas y haz clic en Buscar</p>
                        </div>
                    ) : demandas.length === 0 ? (
                        <div className="bg-card border border-border rounded-lg p-12 text-center">
                            <Icon icon="solar:inbox-linear" className="text-muted-foreground mx-auto mb-3" height={36} />
                            <p className="text-foreground font-medium mb-1">
                                No se registraron productos de demanda insatisfecha en este periodo.
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Esto puede indicar que el catálogo cubre bien la demanda actual de tus clientes.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto</th>
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Categoría</th>
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Veces solicitado</th>
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Vendedor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {demandas
                                        .sort((a, b) => b.vecesSolicitado - a.vecesSolicitado)
                                        .map((d, i) => (
                                            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                <td className="py-3 px-4 text-foreground font-medium">{d.producto}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{d.categoria}</td>
                                                <td className="py-3 px-4 text-foreground">{d.vecesSolicitado}</td>
                                                <td className="py-3 px-4 text-muted-foreground text-xs">
                                                    {new Date(d.fecha).toLocaleString('es-PE')}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{d.vendedor}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════ PÉRDIDAS (HU-22) ═══════════ */}
            {vista === 'perdidas' && (
                <>
                    <div className="flex gap-2 mb-4 flex-wrap items-end">
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Desde</label>
                            <input type="date" value={fechaInicioPerdidas}
                                onChange={e => setFechaInicioPerdidas(e.target.value)}
                                className="rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Hasta</label>
                            <input type="date" value={fechaFinPerdidas}
                                onChange={e => setFechaFinPerdidas(e.target.value)}
                                className="rounded-lg px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary" />
                        </div>
                        <button onClick={cargarPerdidas}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primaryemphasis transition">
                            Buscar
                        </button>
                        {perdidas && (
                            <button onClick={() => exportarPDF('perdidas')}
                                className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition flex items-center gap-2">
                                <Icon icon="solar:export-linear" height={16} />
                                Exportar PDF
                            </button>
                        )}
                    </div>

                    {loadingPerdidas ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : !perdidas ? (
                        <div className="bg-card border border-border rounded-lg p-12 text-center">
                            <Icon icon="solar:calendar-search-linear" className="text-muted-foreground mx-auto mb-3" height={36} />
                            <p className="text-muted-foreground text-sm">Selecciona un rango de fechas y haz clic en Buscar</p>
                        </div>
                    ) : (
                        <>
                            {/* Resumen totales */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                <div className="bg-card border border-border rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground mb-1">Total general</p>
                                    <p className="text-lg font-bold text-foreground">S/ {perdidas.totalGeneral.toFixed(2)}</p>
                                </div>
                                {Object.entries(perdidas.subtotales).map(([causa, valor]) => (
                                    <div key={causa} className="bg-card border border-border rounded-lg p-4">
                                        <p className="text-xs text-muted-foreground mb-1">{causa}</p>
                                        <p className="text-lg font-bold text-foreground">S/ {valor.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Filtro por causa */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                                {['todos', 'Robo o hurto', 'Merma', 'Producto vencido', 'Error de conteo'].map(c => (
                                    <button key={c} onClick={() => setCausaFiltro(c)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${causaFiltro === c ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                            }`}>
                                        {c === 'todos' ? 'Todas' : c}
                                    </button>
                                ))}
                            </div>

                            {perdidas.detalle.length === 0 ? (
                                <div className="bg-card border border-border rounded-lg p-12 text-center">
                                    <Icon icon="solar:shield-check-linear" className="text-success mx-auto mb-3" height={36} />
                                    <p className="text-foreground font-medium mb-1">
                                        No se registraron pérdidas en este periodo.
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        Esto puede indicar un buen control del inventario.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-card border border-border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Unidades</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Causa</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Valor S/</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Registrado por</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {perdidas.detalle.map((a, i) => (
                                                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                    <td className="py-3 px-4">
                                                        <p className="text-foreground font-medium">{a.producto}</p>
                                                        <p className="text-xs text-muted-foreground">{a.marca}</p>
                                                    </td>
                                                    <td className="py-3 px-4 text-foreground">{a.unidades}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${causaColor(a.causa)}`}>
                                                            {a.causa}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-error font-semibold">S/ {a.valorEconomico.toFixed(2)}</td>
                                                    <td className="py-3 px-4 text-muted-foreground text-xs">{formatearFecha(a.fecha)}</td>
                                                    <td className="py-3 px-4 text-muted-foreground">{a.registradoPor}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ═══════════ REPOSICIÓN (HU-23) ═══════════ */}
            {vista === 'reposicion' && (
                <>
                    <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                            {['todos', 'alimento', 'medicamento', 'equipamiento'].map(c => (
                                <button key={c} onClick={() => setCategoriaReposicion(c)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${categoriaReposicion === c ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                        }`}>
                                    {c === 'todos' ? 'Todos' : c}
                                </button>
                            ))}
                        </div>
                        {reposicion && reposicion.productos.length > 0 && (
                            <button onClick={() => exportarPDF('reposicion')}
                                className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition flex items-center gap-2">
                                <Icon icon="solar:export-linear" height={16} />
                                Exportar PDF
                            </button>
                        )}
                    </div>

                    {loadingReposicion ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : !reposicion || reposicion.productos.length === 0 ? (
                        <div className="bg-card border border-border rounded-lg p-12 text-center">
                            <Icon icon="solar:shield-check-linear" className="text-success mx-auto mb-3" height={36} />
                            <p className="text-foreground font-medium">No hay productos bajo el nivel mínimo</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto</th>
                                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Categoría</th>
                                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Presentación</th>
                                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Stock</th>
                                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mínimo</th>
                                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Sugerido</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reposicion.productos.map(p => (
                                            <tr key={p._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        {p.critico && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-error text-white">
                                                                CRÍTICO
                                                            </span>
                                                        )}
                                                        <span className="text-foreground font-medium">{p.nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{p.categoria}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{p.presentacion}</td>
                                                <td className={`py-3 px-4 font-semibold ${p.critico ? 'text-error' : 'text-warning'}`}>
                                                    {p.stockActual}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{p.nivelMinimo}</td>
                                                <td className="py-3 px-4 text-primary font-bold">{p.cantidadSugerida}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Demanda no atendida */}
                            {reposicion.demandaNoAtendida.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                        Demanda no atendida (últimos 30 días)
                                    </h3>
                                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Producto solicitado</th>
                                                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Veces pedido</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reposicion.demandaNoAtendida.map((d, i) => (
                                                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                        <td className="py-3 px-4 text-foreground">{d.producto}</td>
                                                        <td className="py-3 px-4 text-warning font-semibold">{d.vecesSolicitado}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    )
}