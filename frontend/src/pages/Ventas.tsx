import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Producto {
    _id: string
    nombre: string
    marca: string
    precio: number
    stock: number
    nivelMinimo: number
    tipoProducto: 'alimento' | 'medicamento' | 'equipamiento'
}

interface LoteInfo {
    estadoCaducidad: 'normal' | 'proximo' | 'vencido'
    fechaVencimientoProxima: Date | null
}

interface LoteDesglose {
    loteId: string
    fechaVencimiento: string | null
    cantidadDisponible: number
    cantidadDespachada: number
    diasRestantes: number | null
    proximoAVencer: boolean
}

interface PreviewLotes {
    stockDisponible: number
    alcanza: boolean
    desglose: LoteDesglose[]
}

interface ItemVenta {
    productoId: string
    nombre: string
    marca: string
    precio: number
    cantidad: number
    subtotal: number
    stockDisponible: number
    stockInsuficiente: boolean
}

const MOTIVOS_ANULAR = ['Error de registro', 'Devolucion total', 'Producto defectuoso', 'Otro']
const MOTIVOS_MODIFICAR = ['Error de registro', 'Cambio de producto por solicitud del cliente', 'Producto defectuoso', 'Otro']

const API = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

export default function Ventas() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroTipo, setFiltroTipo] = useState('todos')
    const [carrito, setCarrito] = useState<ItemVenta[]>([])
    const [tipoPago, setTipoPago] = useState<'efectivo' | 'transferencia'>('efectivo')
    const [tipoBoleta, setTipoBoleta] = useState<'B' | 'F'>('B')
    const [loading, setLoading] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [ventaExitosa, setVentaExitosa] = useState<any>(null)
    const [error, setError] = useState('')
    const [alertasStock, setAlertasStock] = useState<Array<{
        nombre: string
        stockActual: number
        nivelMinimo: number
    }>>([])
    const [previewsPorProducto, setPreviewsPorProducto] = useState<Record<string, PreviewLotes>>({})
    const [lotesPorProducto, setLotesPorProducto] = useState<Record<string, LoteInfo>>({})

    // ─── Estados modales anular ───────────────────────────────────────────
    const [modalAnular, setModalAnular] = useState(false)
    const [motivoAnular, setMotivoAnular] = useState('')
    const [anulando, setAnulando] = useState(false)
    const [errorAnular, setErrorAnular] = useState('')

    // ─── Estados modales modificar ────────────────────────────────────────
    const [modalModificar, setModalModificar] = useState(false)
    const [motivoModificar, setMotivoModificar] = useState('')
    const [itemsModificar, setItemsModificar] = useState<{
        productoId: string
        nombre: string
        cantidad: number
        precio: number
    }[]>([])
    const [modificando, setModificando] = useState(false)
    const [errorModificar, setErrorModificar] = useState('')

    const headers = { Authorization: `Bearer ${getToken()}` }

    useEffect(() => { cargarProductos() }, [])

    const cargarProductos = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get(`${API}/productos`, { headers })
            const prods = data.filter((p: Producto) => p.stock > 0)
            setProductos(prods)
            await cargarCaducidad(prods)
        } catch {
            console.error('Error al cargar productos')
        } finally {
            setLoading(false)
        }
    }

    const cargarCaducidad = async (prods: Producto[]) => {
        const info: Record<string, LoteInfo> = {}
        await Promise.all(
            prods.map(async (p) => {
                try {
                    const { data } = await axios.get(`${API}/inventario/stock/${p._id}`, { headers })
                    const hoy = new Date()
                    const dosSemanas = new Date(hoy.getTime() + 14 * 24 * 60 * 60 * 1000)
                    const unMes = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
                    let estado: 'normal' | 'proximo' | 'vencido' = 'normal'
                    if (data.lotes && data.lotes.length > 0) {
                        const fechas = data.lotes
                            .map((l: any) => new Date(l.fechaVencimiento))
                            .sort((a: Date, b: Date) => a.getTime() - b.getTime())
                        if (fechas[0] < hoy) estado = 'vencido'
                        else if (fechas[0] < dosSemanas) estado = 'vencido'
                        else if (fechas[0] < unMes) estado = 'proximo'
                    }
                    info[p._id] = { estadoCaducidad: estado, fechaVencimientoProxima: data.lotes?.[0]?.fechaVencimiento || null }
                } catch {
                    info[p._id] = { estadoCaducidad: 'normal', fechaVencimientoProxima: null }
                }
            })
        )
        setLotesPorProducto(info)
    }

    const cargarPreviewLotes = async (productoId: string, cantidad: number) => {
        try {
            const { data } = await axios.get(`${API}/ventas/preview-lotes`, {
                params: { productoId, cantidad }, headers
            })
            setPreviewsPorProducto(prev => ({ ...prev, [productoId]: data }))
        } catch {
            console.error('Error al cargar preview de lotes')
        }
    }

    const productosFiltrados = useMemo(() => {
        const filtrados = productos.filter(p => {
            const coincideTipo = filtroTipo === 'todos' || p.tipoProducto === filtroTipo
            const coincideBusqueda =
                p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.marca.toLowerCase().includes(busqueda.toLowerCase())
            return coincideTipo && coincideBusqueda
        })
        return filtrados.sort((a, b) => {
            const orden: Record<string, number> = { vencido: 0, proximo: 1, normal: 2 }
            const estadoA = lotesPorProducto[a._id]?.estadoCaducidad || 'normal'
            const estadoB = lotesPorProducto[b._id]?.estadoCaducidad || 'normal'
            return orden[estadoA] - orden[estadoB]
        })
    }, [productos, filtroTipo, busqueda, lotesPorProducto])

    const agregarAlCarrito = (producto: Producto) => {
        const infoLote = lotesPorProducto[producto._id]
        if (infoLote?.estadoCaducidad === 'vencido' && infoLote?.fechaVencimientoProxima &&
            new Date(infoLote.fechaVencimientoProxima) < new Date()) {
            setError('No se puede vender un producto vencido')
            setTimeout(() => setError(''), 3000)
            return
        }
        setCarrito(prev => {
            const existe = prev.find(i => i.productoId === producto._id)
            const nuevaCantidad = existe ? existe.cantidad + 1 : 1
            cargarPreviewLotes(producto._id, nuevaCantidad)
            if (existe) {
                return prev.map(i => i.productoId === producto._id
                    ? { ...i, cantidad: nuevaCantidad, subtotal: nuevaCantidad * i.precio, stockInsuficiente: nuevaCantidad > i.stockDisponible }
                    : i)
            }
            return [...prev, {
                productoId: producto._id, nombre: producto.nombre, marca: producto.marca,
                precio: producto.precio, cantidad: 1, subtotal: producto.precio,
                stockDisponible: producto.stock, stockInsuficiente: false
            }]
        })
    }

    const cambiarCantidad = (productoId: string, cantidad: number) => {
        if (cantidad <= 0) { eliminarDelCarrito(productoId); return }
        cargarPreviewLotes(productoId, cantidad)
        setCarrito(prev => prev.map(i => i.productoId === productoId
            ? { ...i, cantidad, subtotal: cantidad * i.precio, stockInsuficiente: cantidad > i.stockDisponible }
            : i))
    }

    const eliminarDelCarrito = (productoId: string) => {
        setCarrito(prev => prev.filter(i => i.productoId !== productoId))
        setPreviewsPorProducto(prev => { const n = { ...prev }; delete n[productoId]; return n })
    }

    const total = carrito.reduce((sum, i) => sum + i.subtotal, 0)
    const hayStockInsuficiente = carrito.some(i => i.stockInsuficiente)

    const handleConfirmar = async () => {
        if (carrito.length === 0) return
        if (hayStockInsuficiente) { setError('Corrige los productos con stock insuficiente antes de confirmar'); return }
        setProcesando(true); setError('')
        try {
            const { data } = await axios.post(`${API}/ventas`, {
                items: carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
                tipoPago, tipoBoleta
            }, { headers })
            setVentaExitosa(data.venta)
            const alertas: Array<{ nombre: string; stockActual: number; nivelMinimo: number }> = []
            for (const item of carrito) {
                const prod = productos.find(p => p._id === item.productoId)
                if (prod) {
                    const nuevoStock = prod.stock - item.cantidad
                    if (nuevoStock <= prod.nivelMinimo) alertas.push({ nombre: item.nombre, stockActual: nuevoStock, nivelMinimo: prod.nivelMinimo || 0 })
                }
            }
            if (alertas.length > 0) {
                setAlertasStock(prev => {
                    const nuevas = [...prev]
                    for (const alerta of alertas) {
                        const existe = nuevas.findIndex(a => a.nombre === alerta.nombre)
                        if (existe >= 0) nuevas[existe].stockActual = alerta.stockActual
                        else nuevas.push(alerta)
                    }
                    return nuevas.sort((a, b) => a.stockActual - b.stockActual)
                })
            }
            setCarrito([]); setPreviewsPorProducto({}); setTipoPago('efectivo'); setTipoBoleta('B')
            cargarProductos()
        } catch (error: any) {
            setError(error.response?.data?.mensaje || 'Error al registrar venta')
        } finally {
            setProcesando(false)
        }
    }

    // ─── Anular ───────────────────────────────────────────────────────────
    const handleAnular = async () => {
        if (!motivoAnular) { setErrorAnular('Debes seleccionar un motivo'); return }
        setAnulando(true); setErrorAnular('')
        try {
            await axios.patch(`${API}/ventas/${ventaExitosa._id}/anular`, { motivo: motivoAnular }, { headers })
            setModalAnular(false); setMotivoAnular('')
            setVentaExitosa(null);
            cargarProductos()
        } catch (e: any) {
            setErrorAnular(e.response?.data?.mensaje || 'Error al anular')
        } finally {
            setAnulando(false)
        }
    }

    // ─── Modificar ────────────────────────────────────────────────────────
    const abrirModalModificar = () => {
        setItemsModificar(ventaExitosa.items.map((i: any) => ({
            productoId: i.producto?._id || i.producto || i._id,
            nombre: i.nombre, cantidad: i.cantidad, precio: i.precioUnitario
        })))
        setMotivoModificar(''); setErrorModificar(''); setModalModificar(true)
    }

    const handleModificar = async () => {
        if (!motivoModificar) { setErrorModificar('Debes seleccionar un motivo'); return }
        if (itemsModificar.some(i => i.cantidad <= 0)) { setErrorModificar('Todas las cantidades deben ser mayores a 0'); return }
        setModificando(true); setErrorModificar('')
        try {
            const { data } = await axios.patch(`${API}/ventas/${ventaExitosa._id}/modificar`, {
                items: itemsModificar.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })),
                motivo: motivoModificar
            }, { headers })
            setModalModificar(false)
            setVentaExitosa(data.venta)
            cargarProductos()
        } catch (e: any) {
            setErrorModificar(e.response?.data?.mensaje || 'Error al modificar')
        } finally {
            setModificando(false)
        }
    }

    const formatearFecha = (fecha: string | null) => {
        if (!fecha) return 'Sin fecha'
        return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Panel izquierdo — productos */}
            <div className="lg:col-span-2">
                <div className="mb-4">
                    <h1 className="text-xl font-semibold text-foreground mb-4">Registrar Venta</h1>
                    <div className="flex gap-2 mb-3 flex-wrap">
                        {['todos', 'alimento', 'medicamento', 'equipamiento'].map(tipo => (
                            <button key={tipo} onClick={() => setFiltroTipo(tipo)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filtroTipo === tipo ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
                                {tipo === 'todos' ? 'Todos' : tipo === 'alimento' ? 'Alimentos' : tipo === 'medicamento' ? 'Medicamentos' : 'Equipamiento'}
                            </button>
                        ))}
                    </div>
                    <input type="text" placeholder="Buscar por nombre o marca..."
                        value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : productosFiltrados.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground text-sm">No se encontraron productos con ese nombre o código</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {productosFiltrados.map(producto => (
                            <div key={producto._id}
                                className={`bg-card border rounded-lg p-4 transition ${lotesPorProducto[producto._id]?.estadoCaducidad === 'vencido' &&
                                        lotesPorProducto[producto._id]?.fechaVencimientoProxima &&
                                        new Date(lotesPorProducto[producto._id]!.fechaVencimientoProxima!) < new Date()
                                        ? 'border-error opacity-50 cursor-not-allowed'
                                        : lotesPorProducto[producto._id]?.estadoCaducidad === 'vencido'
                                            ? 'border-error cursor-pointer hover:border-error/80'
                                            : lotesPorProducto[producto._id]?.estadoCaducidad === 'proximo'
                                                ? 'border-warning cursor-pointer hover:border-warning/80'
                                                : 'border-border cursor-pointer hover:border-primary'
                                    }`}
                                onClick={() => agregarAlCarrito(producto)}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-foreground text-sm">{producto.nombre}</p>
                                        <p className="text-xs text-muted-foreground">{producto.marca}</p>
                                    </div>
                                    <Icon icon="solar:add-circle-linear" className="text-primary" height={20} />
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-primary font-semibold text-sm">S/ {producto.precio.toFixed(2)}</span>
                                    <span className={`text-xs ${producto.stock === 0 ? 'text-error' : producto.stock <= 5 ? 'text-warning' : 'text-success'}`}>
                                        Stock: {producto.stock}
                                    </span>
                                </div>
                                {lotesPorProducto[producto._id]?.estadoCaducidad === 'vencido' && (
                                    lotesPorProducto[producto._id]?.fechaVencimientoProxima &&
                                        new Date(lotesPorProducto[producto._id]!.fechaVencimientoProxima!) < new Date()
                                        ? <span className="text-xs text-error font-medium">Producto vencido</span>
                                        : <span className="text-xs text-error font-medium">Vence en menos de 2 semanas</span>
                                )}
                                {lotesPorProducto[producto._id]?.estadoCaducidad === 'proximo' && (
                                    <span className="text-xs text-warning font-medium">Vence en menos de 1 mes</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Panel derecho — carrito */}
            <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg p-5 sticky top-6">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Resumen de venta</h2>
                    {carrito.length === 0 ? (
                        <div className="text-center py-8">
                            <Icon icon="solar:cart-large-2-linear" className="text-muted-foreground mx-auto mb-2" height={32} />
                            <p className="text-muted-foreground text-sm">Agrega productos a la venta</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 mb-4 max-h-[28rem] overflow-y-auto">
                                {carrito.map(item => {
                                    const preview = previewsPorProducto[item.productoId]
                                    return (
                                        <div key={item.productoId} className={`p-3 rounded-lg border ${item.stockInsuficiente ? 'border-error bg-error/5' : 'border-border'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-sm font-medium text-foreground">{item.nombre}</p>
                                                <button onClick={() => eliminarDelCarrito(item.productoId)}
                                                    className="text-muted-foreground hover:text-error transition">
                                                    <Icon icon="solar:close-circle-linear" height={16} />
                                                </button>
                                            </div>
                                            {item.stockInsuficiente && (
                                                <p className="text-xs text-error mb-1">Stock insuficiente. Disponibles: {item.stockDisponible}</p>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}
                                                        className="w-6 h-6 rounded-full bg-muted/30 text-foreground flex items-center justify-center hover:bg-muted/50 transition text-xs">-</button>
                                                    <span className="text-sm font-medium text-foreground w-6 text-center">{item.cantidad}</span>
                                                    <button onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}
                                                        className="w-6 h-6 rounded-full bg-muted/30 text-foreground flex items-center justify-center hover:bg-muted/50 transition text-xs">+</button>
                                                </div>
                                                <span className="text-sm font-semibold text-foreground">S/ {item.subtotal.toFixed(2)}</span>
                                            </div>
                                            {preview && preview.desglose.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-border/50">
                                                    <p className="text-xs text-muted-foreground mb-1 font-medium">Despacho:</p>
                                                    <div className="space-y-1">
                                                        {preview.desglose.map(lote => (
                                                            <div key={lote.loteId} className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-xs text-foreground">
                                                                    • {lote.cantidadDespachada} ud. — vence {formatearFecha(lote.fechaVencimiento)}
                                                                </span>
                                                                {lote.proximoAVencer && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-warning font-medium">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
                                                                        Prox. vencer
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {!preview.alcanza && <p className="text-xs text-error mt-1">Stock insuficiente en lotes vigentes</p>}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="border-t border-border pt-3 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-foreground">Total</span>
                                    <span className="text-xl font-bold text-primary">S/ {total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm text-foreground mb-2 block">Tipo de pago</label>
                                <div className="flex gap-2">
                                    {(['efectivo', 'transferencia'] as const).map(tipo => (
                                        <button key={tipo} onClick={() => setTipoPago(tipo)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${tipoPago === tipo ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                                            {tipo === 'efectivo' ? '💵 Efectivo' : '📱 Transferencia'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm text-foreground mb-2 block">Tipo de comprobante</label>
                                <div className="flex gap-2">
                                    {(['B', 'F'] as const).map(tipo => (
                                        <button key={tipo} onClick={() => setTipoBoleta(tipo)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${tipoBoleta === tipo ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                                            {tipo === 'B' ? '🧾 Boleta' : '📄 Factura'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    El número se genera automáticamente ({tipoBoleta}001-XXXXXXXX)
                                </p>
                            </div>

                            {error && <p className="text-error text-sm text-center mb-3">{error}</p>}

                            <button onClick={handleConfirmar}
                                disabled={procesando || hayStockInsuficiente || carrito.length === 0}
                                className="w-full h-11 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primaryemphasis disabled:opacity-50 transition">
                                {procesando ? 'Procesando...' : `Confirmar venta — S/ ${total.toFixed(2)}`}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Banner alertas stock crítico */}
            {alertasStock.length > 0 && (
                <div className="fixed top-5 right-5 z-50 max-w-sm w-full">
                    <div className="bg-card border-2 border-warning rounded-xl shadow-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Icon icon="solar:danger-triangle-linear" className="text-warning" height={20} />
                            </div>
                            <p className="font-semibold text-foreground text-sm">Alerta de Stock Crítico</p>
                        </div>
                        <div className="space-y-2 mb-4">
                            {alertasStock.map((alerta, i) => (
                                <div key={i} className="bg-warning/10 rounded-lg px-3 py-2">
                                    <p className="text-sm font-medium text-foreground">{alerta.nombre}</p>
                                    <p className="text-xs text-warning">{alerta.stockActual} unidades restantes — Mínimo: {alerta.nivelMinimo}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setAlertasStock([])}
                            className="w-full py-2 rounded-lg bg-warning text-white text-sm font-medium hover:opacity-90 transition">
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {/* Modal venta exitosa */}
            {ventaExitosa && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                            <Icon icon="solar:check-circle-linear" className="text-success" height={40} />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground mb-2">¡Venta registrada!</h2>

                        <div className="bg-muted/20 rounded-lg p-4 mb-4 text-left">
                            {ventaExitosa.items?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">{item.nombre} x{item.cantidad}</span>
                                    <span className="text-foreground">S/ {item.subtotal?.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                                <span className="text-foreground">Total</span>
                                <span className="text-primary">S/ {ventaExitosa.total?.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 capitalize">Pago: {ventaExitosa.tipoPago}</p>
                            {ventaExitosa.numeroBoleta && (
                                <p className="text-xs text-primary font-medium mt-1">Comprobante: {ventaExitosa.numeroBoleta}</p>
                            )}

                            {/* Botones anular y modificar */}
                            {ventaExitosa.estado !== 'anulada' && (
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => { setMotivoAnular(''); setErrorAnular(''); setModalAnular(true) }}
                                        className="flex-1 bg-error/10 text-error border border-error/30 py-2 rounded-lg text-sm font-medium hover:bg-error/20 transition">
                                        Anular venta
                                    </button>
                                    <button
                                        onClick={abrirModalModificar}
                                        className="flex-1 bg-warning/10 text-warning border border-warning/30 py-2 rounded-lg text-sm font-medium hover:bg-warning/20 transition">
                                        Modificar
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => { setVentaExitosa(null); }}
                            className="w-full h-11 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primaryemphasis transition mb-4">
                            Cerrar
                        </button>


                    </div>
                </div>
            )}

            {/* Modal Anular */}
            {modalAnular && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-lg font-semibold text-foreground">Anular venta</h3>
                            <button onClick={() => setModalAnular(false)} className="text-muted-foreground hover:text-foreground">
                                <Icon icon="solar:close-circle-linear" height={22} />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Selecciona el motivo. Los productos volverán al stock.</p>
                        <div className="space-y-2 mb-4">
                            {MOTIVOS_ANULAR.map(m => (
                                <label key={m} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${motivoAnular === m ? 'border-error bg-error/5' : 'border-border hover:border-error/50'}`}>
                                    <input type="radio" name="motivoAnular" value={m} checked={motivoAnular === m}
                                        onChange={() => setMotivoAnular(m)} className="accent-error" />
                                    <span className="text-sm text-foreground">{m}</span>
                                </label>
                            ))}
                        </div>
                        {errorAnular && <p className="text-error text-sm mb-3">{errorAnular}</p>}
                        <div className="flex gap-2">
                            <button onClick={() => setModalAnular(false)}
                                className="flex-1 border border-border text-muted-foreground py-2 rounded-lg text-sm hover:bg-muted/30 transition">
                                Cancelar
                            </button>
                            <button onClick={handleAnular} disabled={anulando}
                                className="flex-1 bg-error text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
                                {anulando ? 'Anulando...' : 'Confirmar anulación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Modificar */}
            {modalModificar && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-lg font-semibold text-foreground">Modificar venta</h3>
                            <button onClick={() => setModalModificar(false)} className="text-muted-foreground hover:text-foreground">
                                <Icon icon="solar:close-circle-linear" height={22} />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Ajusta las cantidades y selecciona el motivo.</p>

                        <div className="space-y-2 mb-4">
                            {itemsModificar.map((item, i) => (
                                <div key={i} className="flex items-center justify-between border border-border rounded-lg p-3">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{item.nombre}</p>
                                        <p className="text-xs text-muted-foreground">S/ {item.precio?.toFixed(2)} c/u</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setItemsModificar(prev => prev.map((it, idx) => idx === i ? { ...it, cantidad: Math.max(1, it.cantidad - 1) } : it))}
                                            className="w-7 h-7 rounded-full bg-muted/30 text-foreground flex items-center justify-center hover:bg-muted/50 text-sm font-bold">−</button>
                                        <span className="text-sm font-semibold text-foreground w-6 text-center">{item.cantidad}</span>
                                        <button onClick={() => setItemsModificar(prev => prev.map((it, idx) => idx === i ? { ...it, cantidad: it.cantidad + 1 } : it))}
                                            className="w-7 h-7 rounded-full bg-muted/30 text-foreground flex items-center justify-center hover:bg-muted/50 text-sm font-bold">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm font-medium text-foreground mb-2">Motivo del cambio</p>
                        <div className="space-y-2 mb-4">
                            {MOTIVOS_MODIFICAR.map(m => (
                                <label key={m} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${motivoModificar === m ? 'border-warning bg-warning/5' : 'border-border hover:border-warning/50'}`}>
                                    <input type="radio" name="motivoModificar" value={m} checked={motivoModificar === m}
                                        onChange={() => setMotivoModificar(m)} className="accent-warning" />
                                    <span className="text-sm text-foreground">{m}</span>
                                </label>
                            ))}
                        </div>

                        {errorModificar && <p className="text-error text-sm mb-3">{errorModificar}</p>}
                        <div className="flex gap-2">
                            <button onClick={() => setModalModificar(false)}
                                className="flex-1 border border-border text-muted-foreground py-2 rounded-lg text-sm hover:bg-muted/30 transition">
                                Cancelar
                            </button>
                            <button onClick={handleModificar} disabled={modificando}
                                className="flex-1 bg-warning text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
                                {modificando ? 'Guardando...' : 'Confirmar cambio'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}