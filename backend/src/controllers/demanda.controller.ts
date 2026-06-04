import { Request, Response } from 'express'
import DemandaInsatisfecha from '../models/demandaInsatisfecha'
import { Producto } from '../models/producto.model'

export const registrarDemanda = async (req: Request, res: Response) => {
  try {
    const { producto, categoria, stockActual, productoId } = req.body
    const usuario = (req as any).usuario

    if (!producto || !producto.trim()) {
      return res.status(400).json({
        mensaje: 'El nombre del producto es obligatorio para guardar el registro'
      })
    }

    // verificar si ya existe demanda activa para ese producto
    const demandaExistente = await DemandaInsatisfecha.findOne({
      producto: producto,
      atendido: false
    })

    if (demandaExistente) {
      // incrementar contador
      demandaExistente.vecessolicitado += 1
      await demandaExistente.save()
      return res.status(200).json(demandaExistente)
    }

    // buscar si el producto existe en catálogo
    let productoRef = null
    if (productoId) {
      productoRef = productoId
    } else {
      const prod = await Producto.findOne({
        nombre: { $regex: producto, $options: 'i' }
      })
      if (prod) productoRef = prod._id
    }

    const nuevaDemanda = await DemandaInsatisfecha.create({
      producto,
      productoRef,
      categoria,
      stockActual,
      registradoPor: usuario?.id || usuario?._id || null
    })

    res.status(201).json(nuevaDemanda)
  } catch {
    res.status(500).json({ mensaje: 'Error al registrar demanda' })
  }
}

export const listarDemandas = async (req: Request, res: Response) => {
  try {
    const demandas = await DemandaInsatisfecha.find()
      .populate('registradoPor', 'nombre username')
      .populate('productoRef', 'nombre stock')
      .sort({ createdAt: -1 })
    res.json(demandas)
  } catch {
    res.status(500).json({ mensaje: 'Error al listar demandas' })
  }
}

export const atenderDemanda = async (req: Request, res: Response) => {
  try {
    const demanda = await DemandaInsatisfecha.findByIdAndUpdate(
      req.params.id,
      { atendido: true },
      { new: true }
    )
    if (!demanda) {
      return res.status(404).json({ mensaje: 'Demanda no encontrada' })
    }
    res.json({ mensaje: 'Demanda marcada como atendida' })
  } catch {
    res.status(500).json({ mensaje: 'Error al atender demanda' })
  }
}