import { Request, Response } from 'express'
import { Alerta } from '../models/alerta.model'

export const listarAlertas = async (req: Request, res: Response) => {
  try {
    const { tipo } = req.query
    const filtro: any = { activa: true }

    if (tipo) filtro.tipo = tipo

    const alertas = await Alerta.find(filtro)
      .populate('producto', 'nombre stock nivelMinimo')
      .populate('mercaderia', 'fechaVencimiento cantidadRestante cantidad fechaIngreso') 
      .sort({ createdAt: -1 })

    res.json(alertas)
  } catch {
    res.status(500).json({ mensaje: 'Error al listar alertas' })
  }
}

export const atenderAlerta = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).usuario.id  

    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      {
        activa: false,
        atendidaPor: usuarioId,                 
        fechaAtencion: new Date()               
      },
      { new: true }
    )

    if (!alerta) {
      return res.status(404).json({ mensaje: 'Alerta no encontrada' })
    }

    res.json({ mensaje: 'Alerta atendida', alerta })
  } catch {
    res.status(500).json({ mensaje: 'Error al atender alerta' })
  }
}


export const historialAlertas = async (req: Request, res: Response) => {
  try {
    const alertas = await Alerta.find({ activa: false })
      .populate('producto', 'nombre')
      .populate('mercaderia', 'fechaVencimiento cantidadRestante')
      .populate('atendidaPor', 'nombre username')
      .sort({ fechaAtencion: -1 })

    res.json(alertas)
  } catch {
    res.status(500).json({ mensaje: 'Error al obtener historial' })
  }
}