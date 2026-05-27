import { Request, Response } from 'express'
import { Mercaderia } from '../models/mercaderia.model'
import { Producto } from '../models/producto.model'
import { HistorialInventario } from '../models/historialInventario.model'


export const registrarIngreso = async (req: Request, res: Response) => {
  try {
    const { producto, cantidad, fechaIngreso, fechaVencimiento } = req.body
    const usuario = (req as any).usuario

    if (!producto || !cantidad || !fechaVencimiento) {
      return res.status(400).json({
        mensaje: 'Producto, cantidad y fecha de vencimiento son obligatorios'
      })
    }
    
     if (new Date(fechaVencimiento) < new Date()) {
      return res.status(400).json({ 
        mensaje: 'La fecha de vencimiento ingresada ya pasó. Verifica la fecha antes de continuar.'
      })
    }

    if (cantidad <= 0) {
      return res.status(400).json({
        mensaje: 'La cantidad debe ser mayor a cero'
      })
    }

    const productoExiste = await Producto.findById(producto)

    if (!productoExiste) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      })
    }

    const nuevaMercaderia = await Mercaderia.create({
      producto,
      cantidad,
      cantidadRestante: cantidad,
      fechaIngreso: fechaIngreso || new Date(),
      fechaVencimiento,
      creadoPor: usuario?.id || null 
    })

    productoExiste.stock = (productoExiste.stock || 0) + Number(cantidad)
    await productoExiste.save()

    await HistorialInventario.create({
  productoId: producto,
  tipo: 'ingreso',
  cantidad: Number(cantidad),
  stockAnterior: productoExiste.stock - Number(cantidad),
  stockNuevo: productoExiste.stock,
  usuarioId: usuario?.id,
  fecha: new Date(),
  observaciones: `Ingreso de ${cantidad} unidades`
})

    return res.status(201).json({
      mensaje: 'Ingreso registrado correctamente',
      mercaderia: nuevaMercaderia,
      nuevoStock: productoExiste.stock
    })
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar ingreso' })
  }
}


export const listarMercaderia = async (_req: Request, res: Response) => {
  try {
    const ingresos = await Mercaderia.find()
      .populate('producto', 'nombre marca stock')
      .sort({ createdAt: -1 })

    res.json(ingresos)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar ingresos' })
  }
}


export const obtenerIngresoPorId = async (req: Request, res: Response) => {
  try {
    const ingreso = await Mercaderia.findById(req.params.id)
      .populate('producto', 'nombre marca stock')

    if (!ingreso) {
      return res.status(404).json({ mensaje: 'Ingreso no encontrado' })
    }

    res.json(ingreso)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ingreso' })
  }
}


export const eliminarIngreso = async (req: Request, res: Response) => {
  try {
    const ingreso = await Mercaderia.findById(req.params.id)

    if (!ingreso) {
      return res.status(404).json({ mensaje: 'Ingreso no encontrado' })
    }

    const producto = await Producto.findById(ingreso.producto)

    if (producto) {
      producto.stock -= ingreso.cantidad
      if (producto.stock < 0) producto.stock = 0
      await producto.save()
    }

    await ingreso.deleteOne()

    res.json({ mensaje: 'Ingreso eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar ingreso' })
  }
}


export const actualizarIngreso = async (req: Request, res: Response) => {
  try {
    const { cantidad, fechaVencimiento } = req.body

    const ingreso = await Mercaderia.findById(req.params.id)

    if (!ingreso) {
      return res.status(404).json({ mensaje: 'Ingreso no encontrado' })
    }

    const producto = await Producto.findById(ingreso.producto)

    if (producto) {
      // revertir stock anterior
      producto.stock -= ingreso.cantidad

      // aplicar nuevo stock
      producto.stock += Number(cantidad)

      await producto.save()
    }

    ingreso.cantidad = cantidad
    ingreso.cantidadRestante = cantidad
    ingreso.fechaVencimiento = fechaVencimiento

    await ingreso.save()

    res.json({
      mensaje: 'Ingreso actualizado correctamente',
      ingreso
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar ingreso' })
  }
}

export const obtenerStock = async (req: Request, res: Response) => {
  try {
    const { productoId } = req.params

    const lotes = await Mercaderia.find({ 
      producto: productoId as any,
      cantidadRestante: { $gt: 0 }
    }).select('cantidadRestante fechaVencimiento')

    const stockTotal = lotes.reduce((sum, lote) => sum + lote.cantidadRestante, 0)

    res.json({ 
      productoId, 
      stockTotal, 
      lotes: lotes.map(l => ({
        cantidadRestante: l.cantidadRestante,
        fechaVencimiento: l.fechaVencimiento
      }))
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calcular stock' })
  }
}