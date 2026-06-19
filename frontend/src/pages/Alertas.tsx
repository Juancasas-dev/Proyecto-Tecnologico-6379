import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Mercaderia {
    _id: string
    fechaVencimiento: string | null
    cantidadRestante: number
    cantidad: number
    fechaIngreso: string
}

interface Alerta {
    _id: string
    stockActual: number
    nivelMinimo: number
    tipo: 'stock_bajo' | 'proximo_vencer' | 'vencido'
    createdAt: string
    producto?: {
        _id: string
        nombre: string
        stock: number
        nivelMinimo: number
    }

    mercaderia?: Mercaderia
    atendidaPor?: {
        _id: string
        nombre: string
        username: string
    }
    fechaAtencion?: string

}

const API = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

export default function Alertas() {
    const [alertas, setAlertas] = useState<Alerta[]>([])
    const [historial, setHistorial] = useState<Alerta[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingHistorial, setLoadingHistorial] = useState(false)
    const [filtro, setFiltro] = useState<string>('todos')

    const [vista, setVista] = useState<'activas' | 'historial'>('activas')


    const headers = { Authorization: `Bearer ${getToken()}` }

    const cargarAlertas = async () => {
        try {
            setLoading(true)
            const params: any = {}
            if (filtro !== 'todos') params.tipo = filtro

            const { data } = await axios.get(`${API}/alertas`, { headers, params })

            const ordenUrgencia: Record<string, number> = {
                vencido: 0,
                stock_bajo: 1,
                proximo_vencer: 2
            }

            const ordenadas = data.sort((a: any, b: any) =>
                (ordenUrgencia[a.tipo] ?? 3) - (ordenUrgencia[b.tipo] ?? 3)
            )

            setAlertas(ordenadas)
        } catch {
            console.error('Error al cargar alertas')
        } finally {
            setLoading(false)
        }
    }


    const cargarHistorial = async () => {
        try {
            setLoadingHistorial(true)
            const { data } = await axios.get(`${API}/alertas/historial`, { headers })
            setHistorial(data)
        } catch {
            console.error('Error al cargar historial')
        } finally {
            setLoadingHistorial(false)
        }
    }


    useEffect(() => { cargarAlertas() }, [filtro])

    useEffect(() => {
        if (vista === 'historial') cargarHistorial()
    }, [vista])

    const handleAtender = async (id: string) => {
        try {
            await axios.patch(`${API}/alertas/${id}/atender`, {}, { headers })
            setAlertas(prev => prev.filter(a => a._id !== id))
        } catch {
            alert('Error al atender alerta')
        }
    }

    const colorAlerta = (tipo: string) => {
        if (tipo === 'vencido') return 'border-error bg-error/5'
        if (tipo === 'proximo_vencer') return 'border-warning bg-warning/5'
        return 'border-warning bg-warning/5'
    }

    const iconoAlerta = (tipo: string) => {
        if (tipo === 'vencido') return 'solar:danger-linear'
        if (tipo === 'proximo_vencer') return 'solar:calendar-linear'
        return 'solar:box-minimalistic-linear'
    }

    const textoTipo = (tipo: string) => {
        if (tipo === 'vencido') return 'Producto vencido'
        if (tipo === 'proximo_vencer') return 'Próximo a vencer'
        return 'Stock bajo'
    }

    const colorTipo = (tipo: string) => {
        if (tipo === 'vencido') return 'bg-error/10 text-error'
        if (tipo === 'proximo_vencer') return 'bg-warning/10 text-warning'
        return 'bg-warning/10 text-warning'
    }

    const formatearFecha = (fecha: string | null | undefined) => {
        if (!fecha) return 'Sin fecha'
        return new Date(fecha).toLocaleDateString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
    }


    const renderAlerta = (alerta: Alerta, esHistorial = false) => (
        <div key={alerta._id} className={`border rounded-lg p-5 ${esHistorial ? 'border-border bg-muted/10 opacity-75' : colorAlerta(alerta.tipo)}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${esHistorial ? 'bg-muted/20 text-muted-foreground' : colorTipo(alerta.tipo)}`}>
                        <Icon icon={iconoAlerta(alerta.tipo)} height={20} />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">
                            {alerta.producto?.nombre || 'Producto'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${esHistorial ? 'bg-muted/30 text-muted-foreground' : colorTipo(alerta.tipo)}`}>
                                {textoTipo(alerta.tipo)}
                            </span>
                            {/* BLOQUEADO badge solo en vencidos */}
                            {alerta.tipo === 'vencido' && !esHistorial && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-error text-white">
                                    BLOQUEADO
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {!esHistorial && (
                    <button
                        onClick={() => handleAtender(alerta._id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-success text-success hover:bg-success/10 transition"
                    >
                        Marcar atendida
                    </button>
                )}

                {esHistorial && alerta.fechaAtencion && (
                    <span className="text-xs text-muted-foreground">
                        Atendida {formatearFecha(alerta.fechaAtencion)}
                    </span>
                )}
            </div>

            {/* Info del lote para proximo_vencer y vencido */}
            {(alerta.tipo === 'proximo_vencer' || alerta.tipo === 'vencido') && alerta.mercaderia && (
                <div className="mt-3 bg-card rounded-lg p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Lote afectado</p>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Vencimiento</p>
                            <p className="text-sm font-semibold text-foreground">
                                {formatearFecha(alerta.mercaderia.fechaVencimiento)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Unidades en lote</p>
                            <p className={`text-sm font-semibold ${alerta.tipo === 'vencido' ? 'text-error' : 'text-warning'}`}>
                                {alerta.mercaderia.cantidadRestante}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Ingresado</p>
                            <p className="text-sm font-semibold text-foreground">
                                {formatearFecha(alerta.mercaderia.fechaIngreso)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info de stock para stock_bajo */}
            {alerta.tipo === 'stock_bajo' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-card rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Stock actual</p>
                        <p className="text-lg font-bold text-error">{alerta.stockActual}</p>
                    </div>
                    <div className="bg-card rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Nivel mínimo</p>
                        <p className="text-lg font-bold text-foreground">{alerta.nivelMinimo}</p>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-muted-foreground">
                    Generada: {new Date(alerta.createdAt).toLocaleString('es-PE')}
                </p>
                {esHistorial && alerta.atendidaPor && (
                    <p className="text-xs text-muted-foreground">
                        Atendida por: <span className="font-medium text-foreground">{alerta.atendidaPor.nombre}</span>
                    </p>
                )}
            </div>
        </div>
    )
 

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Alertas</h1>
                    <p className="text-muted-foreground text-sm">
                        {vista === 'activas'
                            ? `${alertas.length} alerta${alertas.length !== 1 ? 's' : ''} activa${alertas.length !== 1 ? 's' : ''}`
                            : `${historial.length} alerta${historial.length !== 1 ? 's' : ''} atendida${historial.length !== 1 ? 's' : ''}`
                        }
                    </p>
                </div>
            </div>

            {/* ─── NUEVO: pestañas activas / historial ──────────────────── */}
            <div className="flex gap-1 mb-6 bg-muted/20 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setVista('activas')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${vista === 'activas' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Activas
                </button>
                <button
                    onClick={() => setVista('historial')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${vista === 'historial' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Historial
                </button>
            </div>
            {/* ──────────────────────────────────────────────────────────── */}

            {/* Filtros — solo en vista activas */}
            {vista === 'activas' && (
                <div className="flex gap-2 mb-6 flex-wrap">
                    {['todos', 'stock_bajo', 'proximo_vencer', 'vencido'].map(tipo => (
                        <button
                            key={tipo}
                            onClick={() => setFiltro(tipo)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filtro === tipo
                                ? 'bg-primary text-white'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                }`}
                        >
                            {tipo === 'todos' ? 'Todas' :
                                tipo === 'stock_bajo' ? 'Stock bajo' :
                                    tipo === 'proximo_vencer' ? 'Próx. vencer' : 'Vencidos'}
                        </button>
                    ))}
                </div>
            )}

            {/* Lista activas */}
            {vista === 'activas' && (
                loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : alertas.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                        <Icon icon="solar:bell-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
                        <p className="text-muted-foreground">No hay alertas activas</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {alertas.map(a => renderAlerta(a, false))}
                    </div>
                )
            )}

            {/* Lista historial */}
            {vista === 'historial' && (
                loadingHistorial ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : historial.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                        <Icon icon="solar:history-linear" className="text-muted-foreground mx-auto mb-3" height={40} />
                        <p className="text-muted-foreground">No hay alertas atendidas aún</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {historial.map(a => renderAlerta(a, true))}
                    </div>
                )
            )}
        </div>
    )
}