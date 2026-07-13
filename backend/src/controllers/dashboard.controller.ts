import { Request, Response } from 'express'
import { Venta } from '../models/venta.model'
import { Producto } from '../models/producto.model'
import { HistorialInventario } from '../models/historialInventario.model'
import { Alerta } from '../models/alerta.model'
import { Mercaderia } from '../models/mercaderia.model'
import { Categoria } from '../models/categoria.model'

// ─── Utilidad: rango de fechas según periodo ──────────────────────────────────
const obtenerRango = (periodo: string) => {
    const ahora = new Date()
    const inicio = new Date()

    switch (periodo) {
        case 'hoy':
            inicio.setUTCHours(5, 0, 0, 0)
            break
        case 'semana':
            inicio.setDate(ahora.getDate() - 7)
            inicio.setUTCHours(5, 0, 0, 0)
            break
        case 'mes':
            inicio.setDate(1)
            inicio.setUTCHours(5, 0, 0, 0)
            break
        case 'año':
            inicio.setMonth(0, 1)
            inicio.setUTCHours(5, 0, 0, 0)
            break
        default:
            inicio.setDate(1)
            inicio.setUTCHours(5, 0, 0, 0)
    }

    return { inicio, fin: ahora }
}

//  Resumen principal con filtro de periodo ────────────────────
export const obtenerResumen = async (req: Request, res: Response) => {
    try {
        const periodo = String(req.query.periodo || 'mes')
        const { inicio, fin } = obtenerRango(periodo)

        // Periodo anterior para comparar
        const diffMs = fin.getTime() - inicio.getTime()
        const inicioPrevio = new Date(inicio.getTime() - diffMs)
        const finPrevio = new Date(inicio)

        const [ventasActual, ventasPrevio, historialPerdidas, alertasActivas, mercaderiaProxima] =
            await Promise.all([
                Venta.find({ fecha: { $gte: inicio, $lte: fin }, estado: { $ne: 'anulada' } }),
                Venta.find({ fecha: { $gte: inicioPrevio, $lte: finPrevio }, estado: { $ne: 'anulada' } }),
                HistorialInventario.find({
                    fecha: { $gte: inicio, $lte: fin },
                    tipo: { $in: ['ajuste_salida', 'ajuste'] },
                }),
                Alerta.find({ activa: true }),
                Mercaderia.find({
                    fechaVencimiento: {
                        $gte: new Date(),
                        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    },
                    bloqueado: false,
                    cantidadRestante: { $gt: 0 }
                })
            ])

        const totalVentas = ventasActual.reduce((s, v) => s + v.total, 0)
        const totalVentasPrevio = ventasPrevio.reduce((s, v) => s + v.total, 0)
        const transacciones = ventasActual.length
        const transaccionesPrevio = ventasPrevio.length
        const ticketPromedio = transacciones > 0 ? totalVentas / transacciones : 0
        const ticketPromedioP = transaccionesPrevio > 0 ? totalVentasPrevio / transaccionesPrevio : 0
        const totalPerdidas = historialPerdidas.reduce((s, h) => s + (h.valorEconomico || 0), 0)

        const productosBajoStock = await Producto.find({ activo: true }).then(prods =>
            prods.filter(p => p.stock <= p.nivelMinimo).length
        )

        const variacion = (actual: number, previo: number) => {
            if (previo === 0) return actual > 0 ? 100 : 0
            return Math.round(((actual - previo) / previo) * 100)
        }

        res.json({
            totalVentas,
            variacionVentas: variacion(totalVentas, totalVentasPrevio),
            transacciones,
            variacionTransacciones: variacion(transacciones, transaccionesPrevio),
            ticketPromedio: Math.round(ticketPromedio * 100) / 100,
            variacionTicket: variacion(ticketPromedio, ticketPromedioP),
            totalPerdidas,
            productosBajoStock,
            alertasActivas: alertasActivas.length,
            proximosVencer: mercaderiaProxima.length
        })
    } catch {
        res.status(500).json({ mensaje: 'Error al obtener resumen' })
    }
}

// ─── Evolución de ventas (gráfico línea) ─────────────────────────────────────
export const obtenerEvolucion = async (req: Request, res: Response) => {
    try {
        const periodo = String(req.query.periodo || 'mes')
        const { inicio, fin } = obtenerRango(periodo)

        const ventas = await Venta.find({
            fecha: { $gte: inicio, $lte: fin },
            estado: { $ne: 'anulada' }
        }).sort({ fecha: 1 })

        // Agrupar por día
        const porDia: Record<string, number> = {}
        for (const v of ventas) {
            const dia = new Date(v.fecha).toLocaleDateString('es-PE', {
                day: '2-digit', month: '2-digit'
            })
            porDia[dia] = (porDia[dia] || 0) + v.total
        }

        const datos = Object.entries(porDia).map(([fecha, total]) => ({ fecha, total }))
        res.json(datos)
    } catch {
        res.status(500).json({ mensaje: 'Error al obtener evolución' })
    }
}

// ─── Distribución por categoría (gráfico dona) ───────────────────────────────
export const obtenerDistribucionCategorias = async (_req: Request, res: Response) => {
    try {
        const categorias = await Categoria.find()
        const productos = await Producto.find({ activo: true }).populate('categoria', 'nombre')

        const distribucion = categorias.map(cat => {
            const prods = productos.filter(p => String((p.categoria as any)?._id) === String(cat._id))
            const totalStock = prods.reduce((s, p) => s + p.stock, 0)
            return { categoria: cat.nombre, stock: totalStock }
        }).filter(d => d.stock > 0)

        res.json(distribucion)
    } catch {
        res.status(500).json({ mensaje: 'Error al obtener distribución' })
    }
}

// ─── Productos más vendidos ───────────────────────────────────────────────────
export const obtenerProductosMasVendidos = async (req: Request, res: Response) => {
    try {
        const periodo = String(req.query.periodo || 'mes')
        const { inicio, fin } = obtenerRango(periodo)

        const ventas = await Venta.find({
            fecha: { $gte: inicio, $lte: fin },
            estado: { $ne: 'anulada' }
        })

        const conteo: Record<string, { nombre: string; cantidad: number }> = {}
        for (const v of ventas) {
            for (const item of v.items) {
                if (!item.nombre) continue
                if (!conteo[item.nombre]) {
                    conteo[item.nombre] = { nombre: item.nombre, cantidad: 0 }
                }
                conteo[item.nombre]!.cantidad += item.cantidad
            }
        }

        const resultado = Object.values(conteo)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 8)

        res.json(resultado)
    } catch {
        res.status(500).json({ mensaje: 'Error al obtener productos más vendidos' })
    }
}

// ─── CA-4: Productos bajo stock ───────────────────────────────────────────────
export const obtenerBajoStock = async (_req: Request, res: Response) => {
    try {
        const productos = await Producto.find({ activo: true }).populate('categoria', 'nombre')
        const bajoStock = productos
            .filter(p => p.stock <= p.nivelMinimo)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 8)
            .map(p => ({
                nombre: p.nombre,
                stock: p.stock,
                nivelMinimo: p.nivelMinimo,
                critico: p.stock === 0
            }))

        res.json(bajoStock)
    } catch {
        res.status(500).json({ mensaje: 'Error al obtener productos bajo stock' })
    }
}

// ─── CA-4: Valor estimado del inventario por categoría ───────────────────────
export const obtenerValorInventario = async (_req: Request, res: Response) => {
    try {
        const categorias = await Categoria.find()
        const productos = await Producto.find({ activo: true }).populate('categoria', 'nombre')

        const valorPorCategoria = categorias.map(cat => {
            const prods = productos.filter(p => String((p.categoria as any)?._id) === String(cat._id))
            const valor = prods.reduce((s, p) => s + (p.stock * p.precio), 0)
            return { categoria: cat.nombre, valor: Math.round(valor * 100) / 100 }
        }).filter(d => d.valor > 0)

        const totalGeneral = valorPorCategoria.reduce((s, d) => s + d.valor, 0)

        res.json({ totalGeneral: Math.round(totalGeneral * 100) / 100, porCategoria: valorPorCategoria })
    } catch {
        res.status(500).json({ mensaje: 'Error al obtener valor de inventario' })
    }
}