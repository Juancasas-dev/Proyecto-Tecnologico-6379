import { Request, Response } from 'express'
import { Alerta } from '../models/alerta.model'

export const listarAlertas = async (req: Request, res: Response) => {
  try {
    const { tipo } = req.query
    const filtro: any = { activa: true }
    
    if (tipo) filtro.tipo = tipo  // 👈 agrega filtro por tipo

    const alertas = await Alerta.find(filtro)
      .populate('producto', 'nombre stock nivelMinimo')
      .sort({ createdAt: -1 })

    res.json(alertas)
  } catch {
    res.status(500).json({ mensaje: 'Error al listar alertas' })
  }
}

export const atenderAlerta = async (req: Request, res: Response) => {
  try {
    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      { activa: false },
      { new: true }
    )

    if (!alerta) {
      return res.status(404).json({ mensaje: 'Alerta no encontrada' })
    }

    res.json({ mensaje: 'Alerta atendida' })
  } catch {
    res.status(500).json({ mensaje: 'Error al atender alerta' })
  }
}