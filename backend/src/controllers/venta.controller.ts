import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Venta } from '../models/venta.model'
import { Producto } from '../models/producto.model'
import { Mercaderia } from '../models/mercaderia.model'
import { HistorialInventario } from '../models/historialInventario.model'
import { Alerta } from '../models/alerta.model'

export const registrarVenta = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { items, tipoPago, tipoBoleta } = req.body  // ← tipoBoleta en vez de numeroBoleta
        const vendedor = (req as any).usuario.id

        if (!items || items.length === 0) {
            await session.abortTransaction()
            return res.status(400).json({ mensaje: 'La venta debe tener al menos un producto' })
        }

        if (!tipoBoleta || !['B', 'F'].includes(tipoBoleta)) {
            await session.abortTransaction()
            return res.status(400).json({ mensaje: 'Debes seleccionar Boleta o Factura' })
        }

         const prefijo = `${tipoBoleta}001-`
        const ultimaVenta = await Venta.findOne({
            numeroBoleta: { $regex: `^${prefijo}` }
        }).sort({ numeroBoleta: -1 }).session(session)

        let siguienteCorrelativo = '00000001'
       if (ultimaVenta?.numeroBoleta) {
    const correlativoActual = parseInt(ultimaVenta.numeroBoleta.split('-')[1] ?? '0')
    siguienteCorrelativo = String(correlativoActual + 1).padStart(8, '0')
}

        const numeroBoleta = `${prefijo}${siguienteCorrelativo}`

        const erroresStock: string[] = []
        const itemsCompletos = []

        for (const item of items) {
            const producto = await Producto.findById(item.productoId).session(session)

            if (!producto) {
                erroresStock.push(`Producto ${item.productoId} no encontrado`)
                continue
            }

            if (producto.stock < item.cantidad) {
                erroresStock.push(
                    `Stock insuficiente para "${producto.nombre}". Disponibles: ${producto.stock}`
                )
                continue
            }

            itemsCompletos.push({
                producto: producto._id,
                nombre: producto.nombre,
                cantidad: item.cantidad,
                precioUnitario: producto.precio,
                subtotal: producto.precio * item.cantidad
            })
        }

        if (erroresStock.length > 0) {
            await session.abortTransaction()
            return res.status(400).json({ mensaje: erroresStock[0], errores: erroresStock })
        }

        const total = itemsCompletos.reduce((sum, item) => sum + item.subtotal, 0)


        const ventaCreada = await (Venta as any).create([{
            items: itemsCompletos,
            total,
            tipoPago,
            numeroBoleta,
            vendedor,
            fecha: new Date()
        }], { session })

        const venta = ventaCreada[0]


        for (const item of itemsCompletos) {
            let cantidadRestante = item.cantidad

            const lotes = await Mercaderia.find({
                producto: item.producto as any,
                cantidadRestante: { $gt: 0 },
                bloqueado: { $ne: true } 

            })
                .sort({ fechaVencimiento: 1 })
                .session(session)

            for (const lote of lotes) {
                if (cantidadRestante <= 0) break

                if (lote.cantidadRestante >= cantidadRestante) {
                    lote.cantidadRestante -= cantidadRestante
                    cantidadRestante = 0
                } else {
                    cantidadRestante -= lote.cantidadRestante
                    lote.cantidadRestante = 0
                }

                await lote.save({ session })
            }


            const producto = await Producto.findById(item.producto).session(session)
            if (producto) {
                const stockAnterior = producto.stock
                producto.stock -= item.cantidad
                await producto.save({ session })


                await (HistorialInventario as any).create([{
                    productoId: item.producto,
                    tipo: 'venta',
                    cantidad: item.cantidad,
                    stockAnterior,
                    stockNuevo: producto.stock,
                    usuarioId: vendedor,
                    fecha: new Date(),
                    observaciones: `Venta registrada - ${tipoPago}`
                }], { session })
                if (producto.stock <= producto.nivelMinimo) {
                    const alertaExistente = await Alerta.findOne({
                        producto: item.producto,
                        activa: true,
                        tipo: 'stock_bajo'
                    }).session(session)

                    if (alertaExistente) {
                        alertaExistente.stockActual = producto.stock
                        await alertaExistente.save({ session })
                    } else {
                        await (Alerta as any).create([{
                            producto: item.producto,
                            stockActual: producto.stock,
                            nivelMinimo: producto.nivelMinimo,
                            tipo: 'stock_bajo'
                        }], { session })
                    }
                }
            }
        }

        await session.commitTransaction()

        res.status(201).json({
            mensaje: 'Venta registrada correctamente',
            venta
        })

    } catch (error: any) {
        await session.abortTransaction()
        res.status(500).json({ mensaje: 'Error al registrar venta' })
    } finally {
        session.endSession()
    }
}

export const listarVentas = async (req: Request, res: Response) => {
    try {
        const { vendedor, fecha, producto, numeroBoleta } = req.query
        const filtro: any = {}

        if (vendedor) filtro.vendedor = vendedor
        if (numeroBoleta) {
            filtro.numeroBoleta = {
                $regex: numeroBoleta,
                $options: 'i'
            }
        }
        if (fecha) {
            const inicio = new Date(fecha as string)
            inicio.setUTCHours(5, 0, 0, 0)
            const fin = new Date(fecha as string)
            fin.setUTCHours(4, 59, 59, 999)
            fin.setDate(fin.getDate() + 1)
            filtro.fecha = { $gte: inicio, $lte: fin }
        }
        if (producto) filtro['items.producto'] = producto

        const ventas = await Venta.find(filtro)
            .populate('vendedor', 'nombre username')
            .sort({ fecha: -1 })

        res.json(ventas)
    } catch {
        res.status(500).json({ mensaje: 'Error al listar ventas' })
    }
}

export const agregarBoleta = async (req: Request, res: Response) => {
    try {
        const { numeroBoleta } = req.body

        const venta = await Venta.findByIdAndUpdate(
            req.params.id,
            { numeroBoleta },
            { returnDocument: 'after' }
        )

        if (!venta) {
            return res.status(404).json({ mensaje: 'Venta no encontrada' })
        }

        res.json({ mensaje: 'Número de boleta agregado', venta })
    } catch {
        res.status(500).json({ mensaje: 'Error al agregar boleta' })
    }
}

export const obtenerVenta = async (req: Request, res: Response) => {
    try {
        const venta = await Venta.findById(req.params.id)
            .populate('vendedor', 'nombre username')

        if (!venta) {
            return res.status(404).json({ mensaje: 'Venta no encontrada' })
        }

        res.json(venta)
    } catch {
        res.status(500).json({ mensaje: 'Error al obtener venta' })
    }
}

export const previewLotes = async (req: Request, res: Response) => {
    try {
        const { productoId, cantidad } = req.query

        if (!productoId || !cantidad) {
            return res.status(400).json({ mensaje: 'productoId y cantidad son requeridos' })
        }

        const cantidadSolicitada = Number(cantidad)
        const hoy = new Date()

        const lotes = await Mercaderia.find({
            producto: productoId as any,
            cantidadRestante: { $gt: 0 },
            bloqueado: { $ne: true }
        }).sort({ fechaVencimiento: 1 })

        const desglose: {
            loteId: string
            fechaVencimiento: Date | null
            cantidadDisponible: number
            cantidadDespachada: number
            diasRestantes: number | null
            proximoAVencer: boolean
        }[] = []

        let restante = cantidadSolicitada

        for (const lote of lotes) {
            if (restante <= 0) break

            const despachado = Math.min(lote.cantidadRestante, restante)
            restante -= despachado

            const diasRestantes = lote.fechaVencimiento
                ? Math.ceil((lote.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                : null

            desglose.push({
                loteId: String(lote._id),
                fechaVencimiento: lote.fechaVencimiento ?? null,
                cantidadDisponible: lote.cantidadRestante,
                cantidadDespachada: despachado,
                diasRestantes,
                proximoAVencer: diasRestantes !== null && diasRestantes <= 30
            })
        }

        res.json({
            productoId,
            cantidadSolicitada,
            stockDisponible: lotes.reduce((sum, l) => sum + l.cantidadRestante, 0),
            alcanza: restante === 0,
            desglose
        })

    } catch {
        res.status(500).json({ mensaje: 'Error al calcular preview de lotes' })
    }
}