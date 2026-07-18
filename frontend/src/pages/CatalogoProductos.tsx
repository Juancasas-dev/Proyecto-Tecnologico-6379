import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'
import { useSearchParams, useNavigate } from 'react-router-dom'  // ← nuevo
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '../components/ui/select'
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'

interface Categoria {
    _id: string
    nombre: string
}

interface Producto {
    _id: string
    nombre: string
    marca: string
    categoria: Categoria
    tipo: string
    tipoProducto: 'alimento' | 'medicamento' | 'equipamiento'
    precio: number
    unidadMedida: string
    presentacion: string
    nivelMinimo: number
    stock: number
    activo: boolean
    proveedor?: { _id: string; nombre: string } | null
}

interface LoteInfo {
    productoId: string
    estadoCaducidad: 'normal' | 'proximo' | 'vencido'
    fechaVencimientoProxima: Date | null
}

const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem('token')
const getUsuario = () => JSON.parse(localStorage.getItem('usuario') || '{}')

export default function CatalogoProductos() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(true)
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState<SortingState>([])
    const [filtroTipo, setFiltroTipo] = useState<string>('todos')
    const [modalAbierto, setModalAbierto] = useState(false)
    const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
    const [formError, setFormError] = useState('')
    const [formLoading, setFormLoading] = useState(false)
    const [lotesPorProducto, setLotesPorProducto] = useState<Record<string, LoteInfo>>({})
    const [form, setForm] = useState({
        nombre: '', marca: '', categoria: '',
        tipo: '', precio: '', unidadMedida: '',
        presentacion: '', nivelMinimo: '0',
        tipoProducto: ''
    })
    const [camposError, setCamposError] = useState<string[]>([])
    const [productoDuplicadoId, setProductoDuplicadoId] = useState<string | null>(null)

    // ─── NUEVO ────────────────────────────────────────────────────────────
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    // ──────────────────────────────────────────────────────────────────────

    const colorCategoria = (nombre: string) => {
        const colores: Record<string, string> = {
            'Perros': 'bg-blue-500/10 text-blue-400',
            'Gatos': 'bg-purple-500/10 text-purple-400',
            'Gallinas/Pollos/Patos': 'bg-yellow-500/10 text-yellow-400',
            'Cuyes/Conejos': 'bg-green-500/10 text-green-400',
            'Loros/Aves': 'bg-orange-500/10 text-orange-400',
        }
        return colores[nombre] || 'bg-primary/10 text-primary'
    }

    const usuario = getUsuario()
    const esDueno = usuario.rol === 'dueño'
    const headers = { Authorization: `Bearer ${getToken()}` }

    const [modalDemanda, setModalDemanda] = useState(false)
    const [formDemanda, setFormDemanda] = useState({ producto: '', categoria: '' })
    const [errorDemanda, setErrorDemanda] = useState('')

    const cargarCaducidad = async (prods: Producto[]) => {
        const info: Record<string, LoteInfo> = {}
        await Promise.all(
            prods.map(async (p) => {
                try {
                    const { data } = await axios.get(`${API}/inventario/stock/${p._id}`, { headers })
                    const hoy = new Date()
                    const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
                    let estado: 'normal' | 'proximo' | 'vencido' = 'normal'
                    let fechaProxima = null

                    if (data.lotes && data.lotes.length > 0) {
                        const fechas = data.lotes
                            .map((l: any) => new Date(l.fechaVencimiento))
                            .sort((a: Date, b: Date) => a.getTime() - b.getTime())
                        fechaProxima = fechas[0]
                        if (fechas[0] < hoy) estado = 'vencido'
                        else if (fechas[0] < treintaDias) estado = 'proximo'
                    }
                    info[p._id] = { productoId: p._id, estadoCaducidad: estado, fechaVencimientoProxima: fechaProxima }
                } catch {
                    info[p._id] = { productoId: p._id, estadoCaducidad: 'normal', fechaVencimientoProxima: null }
                }
            })
        )
        setLotesPorProducto(info)
    }

    const cargarDatos = async () => {
        try {
            setLoading(true)
            const [prodRes, catRes] = await Promise.all([
                axios.get(`${API}/productos`, { headers }),
                axios.get(`${API}/categorias`, { headers })
            ])
            setProductos(prodRes.data)
            setCategorias(catRes.data)
            await cargarCaducidad(prodRes.data)
        } catch {
            console.error('Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }

    // ─── NUEVO: detectar params al cargar ────────────────────────────────
    useEffect(() => {
        cargarDatos().then(() => {
            const nombreParam = searchParams.get('nombre')
            const demandaId = searchParams.get('demandaId')

            if (nombreParam) {
                setForm({
                    nombre: nombreParam,
                    marca: '',
                    categoria: '',
                    tipo: '',
                    precio: '',
                    unidadMedida: '',
                    presentacion: '',
                    nivelMinimo: '0',
                    tipoProducto: ''
                })
                setProductoEditando(null)
                setFormError('')
                setCamposError([])
                if (demandaId) sessionStorage.setItem('demandaIdPendiente', demandaId)
                setModalAbierto(true)
            }
        })
    }, [])
    // ──────────────────────────────────────────────────────────────────────

    const abrirModalNuevo = () => {
        setProductoEditando(null)
        setForm({ nombre: '', marca: '', categoria: '', tipo: '', precio: '', unidadMedida: '', presentacion: '', nivelMinimo: '0', tipoProducto: '' })
        setFormError('')
        setModalAbierto(true)
    }

    const abrirModalEditar = (producto: Producto) => {
        setProductoEditando(producto)
        setForm({
            nombre: producto.nombre,
            marca: producto.marca,
            categoria: producto.categoria._id,
            tipo: producto.tipo,
            precio: String(producto.precio),
            unidadMedida: producto.unidadMedida,
            presentacion: producto.presentacion,
            nivelMinimo: String(producto.nivelMinimo),
            tipoProducto: producto.tipoProducto
        })
        setFormError('')
        setModalAbierto(true)
    }

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')
        setCamposError([])
        setProductoDuplicadoId(null)
        setFormLoading(true)

        if (!productoEditando) {
            const vacios: string[] = []
            if (!form.nombre) vacios.push('nombre')
            if (!form.marca) vacios.push('marca')
            if (!form.categoria) vacios.push('categoria')
            if (!form.tipo) vacios.push('tipo')
            if (!form.precio) vacios.push('precio')
            if (!form.presentacion) vacios.push('presentacion')
            if (!form.unidadMedida) vacios.push('unidadMedida')
            if (!form.tipoProducto) vacios.push('tipoProducto')

            if (vacios.length > 0) {
                setCamposError(vacios)
                setFormError('Completa los campos requeridos antes de guardar')
                setFormLoading(false)
                return
            }
        }

        try {
            if (productoEditando) {
                await axios.patch(`${API}/productos/${productoEditando._id}`, {
                    precio: Number(form.precio),
                    nivelMinimo: Number(form.nivelMinimo)
                }, { headers })
            } else {
                await axios.post(`${API}/productos`, {
                    ...form,
                    precio: Number(form.precio),
                    nivelMinimo: Number(form.nivelMinimo)
                }, { headers })

                // ─── NUEVO: marcar demanda como atendida si viene del flujo HU-21 ───
                const demandaIdPendiente = sessionStorage.getItem('demandaIdPendiente')
                if (demandaIdPendiente) {
                    try {
                        await axios.patch(`${API}/demandas/${demandaIdPendiente}/atender`, {}, { headers })
                    } catch {
                        // no es crítico si falla, el producto ya fue creado
                    } finally {
                        sessionStorage.removeItem('demandaIdPendiente')
                    }
                    setModalAbierto(false)
                    navigate('/dashboard/demandas')
                    return
                }
                // ────────────────────────────────────────────────────────────────────
            }

            setModalAbierto(false)
            cargarDatos()
        } catch (error: any) {
            if (error.response?.status === 409) {
                setFormError('Ya existe un producto con ese nombre, marca y presentación')
                setProductoDuplicadoId(error.response.data.id)
            } else {
                setFormError(error.response?.data?.mensaje || 'Error al guardar producto')
            }
        } finally {
            setFormLoading(false)
        }
    }

    const handleRegistrarDemanda = async (producto: Producto) => {
        try {
            await axios.post(`${API}/demandas`, {
                producto: producto.nombre,
                productoId: producto._id,
                categoria: producto.categoria?.nombre,
                stockActual: producto.stock
            }, { headers })
            alert('Demanda insatisfecha registrada correctamente')
        } catch (error: any) {
            const mensaje = error.response?.data?.mensaje
            alert(mensaje || 'Error al registrar demanda')
        }
    }

    const handleEstadoProducto = async (id: string, activo: boolean) => {
        try {
            await axios.patch(`${API}/productos/${id}/estado`, { activo }, { headers })
            cargarDatos()
        } catch {
            alert('Error al cambiar estado del producto')
        }
    }

    const columns = useMemo<ColumnDef<Producto>[]>(() => [
        {
            header: '#',
            cell: ({ row }) => (
                <span className="text-muted-foreground text-xs">{row.index + 1}</span>
            )
        },
        {
            accessorKey: 'nombre',
            header: 'Producto',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground text-sm">{row.original.nombre}</p>
                    <p className="text-xs text-muted-foreground">{row.original.marca}</p>
                </div>
            )
        },
        {
            accessorKey: 'categoria',
            header: 'Categoría',
            cell: ({ row }) => (
                <Badge className={`text-xs px-2 py-1 rounded-full ${colorCategoria(row.original.categoria?.nombre)}`}>
                    {row.original.categoria?.nombre || '—'}
                </Badge>
            )
        },
        {
            id: 'proveedor',
            header: 'Proveedor',
            cell: ({ row }: { row: any }) => (
                <span className="text-muted-foreground text-sm">
                    {row.original.proveedor?.nombre || '—'}
                </span>
            )
        },
        {
            accessorKey: 'tipo',
            header: 'Tipo',
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">{row.original.tipo}</span>
            )
        },
        {
            accessorKey: 'precio',
            header: 'Precio',
            cell: ({ row }) => (
                <span className="font-medium text-foreground text-sm">
                    S/ {row.original.precio.toFixed(2)}
                </span>
            )
        },
        {
            accessorKey: 'presentacion',
            header: 'Presentación',
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {row.original.presentacion} {row.original.unidadMedida}
                </span>
            )
        },
        {
            accessorKey: 'stock',
            header: 'Stock',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className={`font-medium text-sm ${row.original.stock === 0
                        ? 'text-error'
                        : row.original.stock <= row.original.nivelMinimo
                            ? 'text-warning'
                            : 'text-success'
                        }`}>
                        {row.original.stock === 0 ? 'Sin stock' : row.original.stock}
                    </span>
                    {row.original.stock === 0 && (
                        <button
                            onClick={() => handleRegistrarDemanda(row.original)}
                            className="text-xs bg-error/10 text-error border border-error/20 px-2 py-1 rounded-md hover:bg-error/20 transition whitespace-nowrap"
                        >
                            Registrar demanda
                        </button>
                    )}
                </div>
            )
        },
        {
            id: 'caducidad',
            header: 'Caducidad',
            cell: ({ row }) => {
                const info = lotesPorProducto[row.original._id]
                if (!info || row.original.stock === 0) return <span className="text-muted-foreground text-xs">—</span>
                return (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${info.estadoCaducidad === 'vencido' ? 'bg-error/10 text-error' :
                        info.estadoCaducidad === 'proximo' ? 'bg-warning/10 text-warning' :
                            'bg-success/10 text-success'
                        }`}>
                        {info.estadoCaducidad === 'vencido' ? 'Vencido' :
                            info.estadoCaducidad === 'proximo' ? 'Próx. vencer' : 'Normal'}
                    </span>
                )
            }
        },
        {
            accessorKey: 'nivelMinimo',
            header: 'Nivel Mín.',
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">{row.original.nivelMinimo}</span>
            )
        },
        {
            accessorKey: 'activo',
            header: 'Estado',
            cell: ({ row }) => (
                <Badge className={`text-xs px-2 py-1 rounded-full ${row.original.activo ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}>
                    {row.original.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            )
        },
        ...(esDueno ? [{
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => abrirModalEditar(row.original)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                        <Icon icon="solar:pen-new-square-linear" height={16} />
                    </button>
                    <button
                        onClick={() => handleEstadoProducto(row.original._id, !row.original.activo)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition ${row.original.activo
                            ? 'bg-error/10 text-error hover:bg-error/20'
                            : 'bg-success/10 text-success hover:bg-success/20'
                            }`}
                    >
                        <Icon icon={row.original.activo ? 'solar:eye-closed-linear' : 'solar:eye-linear'} height={16} />
                    </button>
                </div>
            )
        }] : [])
    ], [esDueno, lotesPorProducto])

    const productosFiltrados = useMemo(() => {
        return filtroTipo === 'todos'
            ? productos
            : productos.filter(p => p.tipoProducto === filtroTipo)
    }, [filtroTipo, productos])

    const table = useReactTable({
        data: productosFiltrados,
        columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        globalFilterFn: 'includesString',
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } }
    })

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Catálogo de Productos</h1>
                    <p className="text-muted-foreground text-sm">
                        {productosFiltrados.length} de {productos.length} productos
                    </p>
                </div>
                {esDueno && (
                    <button
                        onClick={abrirModalNuevo}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis transition"
                    >
                        <Icon icon="solar:add-circle-linear" height={18} />
                        Nuevo producto
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
                {['todos', 'alimento', 'medicamento', 'equipamiento'].map(tipo => (
                    <button
                        key={tipo}
                        onClick={() => setFiltroTipo(tipo)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filtroTipo === tipo
                            ? 'bg-primary text-white'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            }`}
                    >
                        {tipo === 'todos' ? 'Todos' :
                            tipo === 'alimento' ? 'Alimentos' :
                                tipo === 'medicamento' ? 'Medicamentos' : 'Equipamiento'}
                    </button>
                ))}
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre o marca..."
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                    className="w-full max-w-sm rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map(header => (
                                        <TableHead
                                            key={header.id}
                                            className="cursor-pointer select-none"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-1">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
                                                    header.column.getIsSorted() === 'asc'
                                                        ? <ArrowUp className="w-3 h-3" />
                                                        : header.column.getIsSorted() === 'desc'
                                                            ? <ArrowDown className="w-3 h-3" />
                                                            : <ChevronsUpDown className="w-3 h-3 opacity-40" />
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id} id={`producto-${row.original._id}`}>
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-3">
                                            <p className="text-muted-foreground">
                                                No se encontraron productos con ese nombre o código
                                            </p>
                                            {usuario.rol === 'vendedor' && (
                                                <button
                                                    onClick={() => {
                                                        setFormDemanda({ producto: globalFilter, categoria: '' })
                                                        setErrorDemanda('')
                                                        setModalDemanda(true)
                                                    }}
                                                    className="text-sm bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg hover:bg-primary/20 transition"
                                                >
                                                    Registrar como demanda insatisfecha
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-wrap gap-3">
                        <div className="flex gap-2">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="px-3 py-1.5 text-sm rounded-lg border border-border text-foreground disabled:opacity-40 hover:bg-muted/30 transition"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="px-3 py-1.5 text-sm rounded-lg border border-border text-foreground disabled:opacity-40 hover:bg-muted/30 transition"
                            >
                                Siguiente
                            </button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Filas:</span>
                            <Select
                                value={String(table.getState().pagination.pageSize)}
                                onValueChange={val => table.setPageSize(Number(val))}
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50].map(size => (
                                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal crear/editar */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
                                </h2>
                                {/* ─── NUEVO: indicador si viene de demanda ─── */}
                                {searchParams.get('demandaId') && !productoEditando && (
                                    <p className="text-xs text-primary mt-0.5">
                                        Nombre prellenado desde demanda insatisfecha
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem('demandaIdPendiente')
                                    setModalAbierto(false)
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Icon icon="solar:close-circle-linear" height={22} />
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} className="flex flex-col gap-4">
                            {!productoEditando && (
                                <>
                                    <div>
                                        <label className="text-sm text-foreground mb-1 block">Tipo de producto</label>
                                        <select value={form.tipoProducto} onChange={e => setForm({ ...form, tipoProducto: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-card text-foreground outline-none transition ${camposError.includes('tipoProducto') ? 'border-error' : 'border-border focus:border-primary'}`}>
                                            <option value="">Seleccionar</option>
                                            <option value="alimento">Alimento</option>
                                            <option value="medicamento">Medicamento</option>
                                            <option value="equipamiento">Equipamiento</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-foreground mb-1 block">Nombre</label>
                                        <input type="text" placeholder="Ricocan Adultos..." value={form.nombre}
                                            onChange={e => setForm({ ...form, nombre: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('nombre') ? 'border-error' : 'border-border focus:border-primary'}`} />
                                    </div>
                                    <div>
                                        <label className="text-sm text-foreground mb-1 block">Marca</label>
                                        <input type="text" placeholder="Ricocan" value={form.marca}
                                            onChange={e => setForm({ ...form, marca: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('marca') ? 'border-error' : 'border-border focus:border-primary'}`} />
                                    </div>
                                    <div>
                                        <label className="text-sm text-foreground mb-1 block">Categoría</label>
                                        <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-card text-foreground outline-none transition ${camposError.includes('categoria') ? 'border-error' : 'border-border focus:border-primary'}`}>
                                            <option value="">Seleccionar categoría</option>
                                            {categorias.map(c => (
                                                <option key={c._id} value={c._id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-foreground mb-1 block">Tipo</label>
                                        <input type="text" placeholder="Adulto, Cachorro..." value={form.tipo}
                                            onChange={e => setForm({ ...form, tipo: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('tipo') ? 'border-error' : 'border-border focus:border-primary'}`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm text-foreground mb-1 block">Presentación</label>
                                            <select value={form.presentacion} onChange={e => setForm({ ...form, presentacion: e.target.value })}
                                                className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-card text-foreground outline-none transition ${camposError.includes('presentacion') ? 'border-error' : 'border-border focus:border-primary'}`}>
                                                <option value="">Seleccionar</option>
                                                <option value="Bolsa">Bolsa</option>
                                                <option value="Saco">Saco</option>
                                                <option value="Lata">Lata</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm text-foreground mb-1 block">Unidad de medida</label>
                                            <input type="text" placeholder="3 kg, 500 g..." value={form.unidadMedida}
                                                onChange={e => setForm({ ...form, unidadMedida: e.target.value })}
                                                className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('unidadMedida') ? 'border-error' : 'border-border focus:border-primary'}`} />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-foreground mb-1 block">Precio (S/)</label>
                                    <input type="number" step="0.1" placeholder="0.00" value={form.precio}
                                        onChange={e => setForm({ ...form, precio: e.target.value })}
                                        className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('precio') ? 'border-error' : 'border-border focus:border-primary'}`} />
                                </div>
                                <div>
                                    <label className="text-sm text-foreground mb-1 block">Nivel mínimo</label>
                                    <input type="number" placeholder="0" value={form.nivelMinimo}
                                        onChange={e => setForm({ ...form, nivelMinimo: e.target.value })}
                                        className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
                                </div>
                            </div>

                            {formError && (
                                <div className="text-center">
                                    <p className="text-error text-sm">{formError}</p>
                                    {productoDuplicadoId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setModalAbierto(false)
                                                const elemento = document.getElementById(`producto-${productoDuplicadoId}`)
                                                elemento?.scrollIntoView({ behavior: 'smooth' })
                                            }}
                                            className="text-primary text-xs hover:underline mt-1"
                                        >
                                            Ver producto existente →
                                        </button>
                                    )}
                                </div>
                            )}

                            <button type="submit" disabled={formLoading}
                                className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis disabled:opacity-50 transition mt-1">
                                {formLoading ? 'Guardando...' : productoEditando ? 'Actualizar' : 'Crear producto'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal demanda insatisfecha */}
            {modalDemanda && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-semibold text-foreground">
                                Registrar demanda insatisfecha
                            </h2>
                            <button
                                onClick={() => setModalDemanda(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Icon icon="solar:close-circle-linear" height={22} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm text-foreground mb-1 block">
                                    Nombre del producto <span className="text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formDemanda.producto}
                                    onChange={e => setFormDemanda({ ...formDemanda, producto: e.target.value })}
                                    placeholder="Nombre del producto solicitado"
                                    className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${errorDemanda ? 'border-error' : 'border-border focus:border-primary'}`}
                                />
                                {errorDemanda && (
                                    <p className="text-error text-xs mt-1">{errorDemanda}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm text-foreground mb-1 block">
                                    Categoría <span className="text-muted-foreground">(opcional)</span>
                                </label>
                                <select
                                    value={formDemanda.categoria}
                                    onChange={e => setFormDemanda({ ...formDemanda, categoria: e.target.value })}
                                    className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-card text-foreground outline-none focus:border-primary transition"
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categorias.map(c => (
                                        <option key={c._id} value={c.nombre}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!formDemanda.producto.trim()) {
                                        setErrorDemanda('El nombre del producto es obligatorio para guardar el registro')
                                        return
                                    }
                                    try {
                                        await axios.post(`${API}/demandas`, {
                                            producto: formDemanda.producto,
                                            categoria: formDemanda.categoria,
                                            stockActual: 0
                                        }, { headers })
                                        setModalDemanda(false)
                                        alert('Demanda registrada correctamente')
                                    } catch (error: any) {
                                        setErrorDemanda(error.response?.data?.mensaje || 'Error al registrar demanda')
                                    }
                                }}
                                className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis transition"
                            >
                                Registrar demanda
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}