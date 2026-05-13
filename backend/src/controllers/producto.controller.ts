import { Request, Response } from 'express'
import { Producto } from '../models/producto.model'

export const listarProductos = async (req: Request, res: Response) => {
  const { q } = req.query

  const filtro: any = q
    ? {
        $or: [
          { nombre: { $regex: String(q), $options: 'i' } },
          { marca:  { $regex: String(q), $options: 'i' } }
        ]
      }
    : {}

  const productos = await Producto.find(filtro)
    .populate('categoria', 'nombre')
    .select('nombre marca categoria tipo precio unidadMedida presentacion nivelMinimo activo')

  res.json(productos)
}

export const obtenerProducto = async (req: Request, res: Response) => {
  const producto = await Producto.findById(req.params.id)
    .populate('categoria', 'nombre')

  if (!producto) {
    res.status(404).json({ mensaje: 'Producto no encontrado' })
    return
  }
  res.json(producto)
}

export const crearProducto = async (req: Request, res: Response) => {
  const { nombre, marca, categoria, tipo, precio, unidadMedida, presentacion, nivelMinimo } = req.body

  const existe = await Producto.findOne({ nombre, marca, presentacion })
  if (existe) {
    res.status(409).json({ 
      mensaje: 'Producto duplicado',
      id: existe._id 
    })
    return
  }

  const producto = await Producto.create({
    nombre, marca, categoria, tipo, precio,
    unidadMedida, presentacion, nivelMinimo,
    creadoPor: (req as any).usuario.id
  })

  res.status(201).json({ mensaje: 'Producto creado', producto })
}

export const actualizarProducto = async (req: Request, res: Response) => {
  const { precio, nivelMinimo } = req.body

  const producto = await Producto.findByIdAndUpdate(
    req.params.id,
    { precio, nivelMinimo },
    { returnDocument: 'after' }
  )

  if (!producto) {
    res.status(404).json({ mensaje: 'Producto no encontrado' })
    return
  }

  res.json({ mensaje: 'Producto actualizado', producto })
}

export const cambiarEstadoProducto = async (req: Request, res: Response) => {
  const { activo } = req.body

  const producto = await Producto.findByIdAndUpdate(
    req.params.id,
    { activo },
    { returnDocument: 'after' }
  )

  if (!producto) {
    res.status(404).json({ mensaje: 'Producto no encontrado' })
    return
  }

  res.json({ 
    mensaje: `Producto ${activo ? 'activado' : 'desactivado'}`,
    producto 
  })
}