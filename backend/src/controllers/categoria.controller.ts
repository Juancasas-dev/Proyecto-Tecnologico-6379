import { Request, Response } from 'express'
import { Categoria } from '../models/categoria.model'
import { Producto } from '../models/producto.model'

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



export const eliminarCategoria = async (req: Request, res: Response) => {
  try {
    const productosConCategoria = await Producto.countDocuments({ 
      categoria: req.params.id as any  
    })
    if (productosConCategoria > 0) {
      res.status(400).json({ 
        mensaje: `No puedes eliminar esta categoría porque tiene ${productosConCategoria} productos asociados` 
      })
      return
    }
    await Categoria.findByIdAndDelete(req.params.id)
    res.json({ mensaje: 'Categoría eliminada correctamente' })
  } catch {
    res.status(500).json({ mensaje: 'Error al eliminar categoría' })
  }
}