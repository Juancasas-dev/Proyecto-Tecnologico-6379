import { Request, Response } from 'express'
import DemandaInsatisfecha from '../models/demandaInsatisfecha'

export const registrarDemanda = async (req: Request, res: Response) => {
  try {
    const nuevaDemanda = await DemandaInsatisfecha.create({
      producto:    req.body.producto,
      categoria:   req.body.categoria,    
      stockActual: req.body.stockActual   
    })
    res.status(201).json(nuevaDemanda)
  } catch {
    res.status(500).json({ mensaje: 'Error al registrar demanda' })
  }
}

export const listarDemandas = async (req: Request, res: Response) => {
  try {
    const demandas = await DemandaInsatisfecha.find()
      .sort({ createdAt: -1 }) 
    res.json(demandas)
  } catch {
    res.status(500).json({ mensaje: 'Error al listar demandas' })
  }
}

