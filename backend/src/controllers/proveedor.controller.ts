import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Proveedor } from '../models/proveedor.model'

export const listarProveedores = async (req: Request, res: Response) => {
  try {
    const { busqueda } = req.query
    const filtro: any = {}

    if (busqueda) {
      filtro.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { ruc: { $regex: busqueda, $options: 'i' } }
      ]
    }

    const proveedores = await Proveedor.find(filtro).sort({ nombre: 1 })
    res.json(proveedores)
  } catch {
    res.status(500).json({ mensaje: 'Error al listar proveedores' })
  }
}

export const crearProveedor = async (req: Request, res: Response) => {
  try {
    const { nombre, ruc, telefono, direccion } = req.body

    if (!nombre?.trim()) {
      return res.status(400).json({ mensaje: 'El nombre es obligatorio' })
    }
    if (!ruc?.trim()) {
      return res.status(400).json({ mensaje: 'El RUC es obligatorio' })
    }

    const existe = await Proveedor.findOne({ ruc: ruc.trim() })
    if (existe) {
      return res.status(409).json({ mensaje: 'Ya existe un proveedor registrado con este RUC' })
    }

    const proveedor = await Proveedor.create({
      nombre: nombre.trim(),
      ruc: ruc.trim(),
      telefono: telefono?.trim() || '',
      direccion: direccion?.trim() || ''
    })

    res.status(201).json(proveedor)
  } catch {
    res.status(500).json({ mensaje: 'Error al crear proveedor' })
  }
}

export const editarProveedor = async (req: Request, res: Response) => {
  try {
    const { nombre, ruc, telefono, direccion, activo } = req.body
    const id = String(req.params.id)  

    if (ruc) {
      const existe = await Proveedor.findOne({
        ruc: ruc.trim(),
        _id: { $ne: new mongoose.Types.ObjectId(id) }
      })
      if (existe) {
        return res.status(409).json({ mensaje: 'Ya existe un proveedor registrado con este RUC' })
      }
    }

    const proveedor = await Proveedor.findByIdAndUpdate(
      id,
      {
        ...(nombre && { nombre: nombre.trim() }),
        ...(ruc && { ruc: ruc.trim() }),
        ...(telefono !== undefined && { telefono: telefono.trim() }),
        ...(direccion !== undefined && { direccion: direccion.trim() }),
        ...(activo !== undefined && { activo })
      },
      { new: true }
    )

    if (!proveedor) {
      return res.status(404).json({ mensaje: 'Proveedor no encontrado' })
    }

    res.json(proveedor)
  } catch {
    res.status(500).json({ mensaje: 'Error al editar proveedor' })
  }
}

export const buscarProveedores = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '')  
    if (!q) return res.json([])

    const proveedores = await Proveedor.find({
      activo: true,
      $or: [
        { nombre: { $regex: q, $options: 'i' } },
        { ruc: { $regex: q, $options: 'i' } }
      ]
    }).limit(10).sort({ nombre: 1 })

    res.json(proveedores)
  } catch {
    res.status(500).json({ mensaje: 'Error al buscar proveedores' })
  }
}