import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'
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
}

const API = 'http://localhost:3000/api'
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
    const [form, setForm] = useState({
        nombre: '', marca: '', categoria: '',
        tipo: '', precio: '', unidadMedida: '',
        presentacion: '', nivelMinimo: '0',
        tipoProducto: ''
    })
    const [camposError, setCamposError] = useState<string[]>([])
    const [productoDuplicadoId, setProductoDuplicadoId] = useState<string | null>(null)
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

    const cargarDatos = async () => {
        try {
            setLoading(true)
            const [prodRes, catRes] = await Promise.all([
                axios.get(`${API}/productos`, { headers }),
                axios.get(`${API}/categorias`, { headers })
            ])
            setProductos(prodRes.data)
            setCategorias(catRes.data)
        } catch {
            console.error('Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { cargarDatos() }, [])

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
                <span className={`font-medium text-sm ${row.original.stock === 0
                    ? 'text-error'
                    : row.original.stock <= row.original.nivelMinimo
                        ? 'text-warning'
                        : 'text-success'
                    }`}>
                    {row.original.stock}
                </span>
            )
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
                <Badge className={`text-xs px-2 py-1 rounded-full ${row.original.activo
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'
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
    ], [esDueno])

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

    const handleEstadoProducto = async (id: string, activo: boolean) => {
        try {
            await axios.patch(`${API}/productos/${id}/estado`, { activo }, { headers })
            cargarDatos()
        } catch {
            alert('Error al cambiar estado del producto')
        }
    }

    return (
        <div>
            {/* Header */}
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

            {/* Filtros por tipo */}
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

            {/* Buscador */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre o marca..."
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                    className="w-full max-w-sm rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition"
                />
            </div>

            {/* Tabla */}
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
                                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                                        No se encontraron productos
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Paginación */}
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
                            <h2 className="text-lg font-semibold text-foreground">
                                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button onClick={() => setModalAbierto(false)} className="text-muted-foreground hover:text-foreground">
                                <Icon icon="solar:close-circle-linear" height={22} />
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} className="flex flex-col gap-4">

                            {!productoEditando && (
                                <>
                                    <div>
                                        <label className="text-sm text-foreground mb-1 block">Tipo de producto</label>
                                        <select value={form.tipoProducto} onChange={e => setForm({ ...form, tipoProducto: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-card text-foreground outline-none transition ${camposError.includes('tipoProducto') ? 'border-error' : 'border-border focus:border-primary'
                                                }`}>
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
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('nombre') ? 'border-error' : 'border-border focus:border-primary'
                                                }`} />
                                    </div>
                                    <div>
                                        <label className="text-sm text-foreground mb-1 block">Marca</label>
                                        <input type="text" placeholder="Ricocan" value={form.marca}
                                            onChange={e => setForm({ ...form, marca: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('marca') ? 'border-error' : 'border-border focus:border-primary'
                                                }`} />
                                    </div>
                                    <div>
                                        <label className="text-sm text-foreground mb-1 block">Categoría</label>
                                        <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-card text-foreground outline-none transition ${camposError.includes('categoria') ? 'border-error' : 'border-border focus:border-primary'
                                                }`}>
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
                                            className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('tipo') ? 'border-error' : 'border-border focus:border-primary'
                                                }`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm text-foreground mb-1 block">Presentación</label>
                                            <select value={form.presentacion} onChange={e => setForm({ ...form, presentacion: e.target.value })}
                                                className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-card text-foreground outline-none transition ${camposError.includes('presentacion') ? 'border-error' : 'border-border focus:border-primary'
                                                    }`}>
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
                                                className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('unidadMedida') ? 'border-error' : 'border-border focus:border-primary'
                                                    }`} />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-foreground mb-1 block">Precio (S/)</label>
                                    <input type="number" step="0.1" placeholder="0.00" value={form.precio}
                                        onChange={e => setForm({ ...form, precio: e.target.value })}
                                        className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${camposError.includes('precio') ? 'border-error' : 'border-border focus:border-primary'
                                            }`} />
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
        </div>
    )
}