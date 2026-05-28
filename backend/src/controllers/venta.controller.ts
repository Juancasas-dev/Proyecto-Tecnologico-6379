import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Venta } from '../models/venta.model'
import { Producto } from '../models/producto.model'
import { Mercaderia } from '../models/mercaderia.model'
import { HistorialInventario } from '../models/historialInventario.model'

export const registrarVenta = async (req: Request, res: Response) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { items, tipoPago, numeroBoleta } = req.body
        const vendedor = (req as any).usuario.id

        if (!items || items.length === 0) {
            await session.abortTransaction()
            return res.status(400).json({ mensaje: 'La venta debe tener al menos un producto' })
        }


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
            numeroBoleta: numeroBoleta || null,
            vendedor,
            fecha: new Date()
        }], { session })

        const venta = ventaCreada[0]


        for (const item of itemsCompletos) {
            let cantidadRestante = item.cantidad

            const lotes = await Mercaderia.find({
                producto: item.producto as any,
                cantidadRestante: { $gt: 0 }
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