import { Request, Response } from 'express'
import { Categoria } from '../models/categoria.model'

export const listarCategorias = async (req: Request, res: Response) => {
  const categorias = await Categoria.find({ activo: true })
  res.json(categorias)
}

export const crearCategoria = async (req: Request, res: Response) => {
  const { nombre, descripcion } = req.body

  const existe = await Categoria.findOne({ nombre })
  if (existe) {
    res.status(409).json({ mensaje: 'La categoría ya existe' })
    return
  }

  const categoria = await Categoria.create({ nombre, descripcion })
  res.status(201).json({ mensaje: 'Categoría creada', categoria })
}

export const actualizarCategoria = async (req: Request, res: Response) => {
  const { nombre, descripcion, activo } = req.body

  const categoria = await Categoria.findByIdAndUpdate(
    req.params.id,
    { nombre, descripcion, activo },
    { returnDocument: 'after' }
  )

  if (!categoria) {
    res.status(404).json({ mensaje: 'Categoría no encontrada' })
    return
  }

  res.json({ mensaje: 'Categoría actualizada', categoria })
}