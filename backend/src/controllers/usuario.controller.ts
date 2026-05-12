import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { Usuario } from '../models/usuario.model'

export const listarUsuarios = async (req: Request, res: Response) => {
  const usuarios = await Usuario.find()
    .select('-password')  
    .populate('creadoPor', 'nombre username')

  res.json(usuarios)
}

export const crearUsuario = async (req: Request, res: Response) => {
  const { nombre, username, email, password, rol } = req.body
  const adminId = (req as any).usuario.id

  const existeUsername = await Usuario.findOne({ username })
  if (existeUsername) {
    res.status(400).json({ mensaje: 'El username ya está registrado' })
    return
  }

  const existeEmail = await Usuario.findOne({ email })
  if (existeEmail) {
    res.status(400).json({ mensaje: 'El email ya está registrado' })
    return
  }

  const hash = await bcrypt.hash(password, 10)

  const usuario = await Usuario.create({
    nombre,
    username,
    email,
    password: hash,
    rol,
    creadoPor: adminId,
    debeCambiarContrasena: true
  })

  const { password: _, ...usuarioSinPassword } = usuario.toObject()

  res.status(201).json({ 
    mensaje: 'Usuario creado correctamente',
    usuario: usuarioSinPassword
  })
}

export const cambiarEstado = async (req: Request, res: Response) => {
  const { id } = req.params
  const { activo } = req.body

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { 
      activo,
      tokenInvalidadoEn: activo === false ? new Date() : null
    },
    { returnDocument: 'after' } 
  ).select('-password')

  if (!usuario) {
    res.status(404).json({ mensaje: 'Usuario no encontrado' })
    return
  }

  res.json({ 
    mensaje: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
    usuario
  })
}


export const desbloquearUsuario = async (req: Request, res: Response) => {
  const { id } = req.params

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { 
      bloqueado: false,
      intentosFallidos: 0,
      fechaBloqueo: null
    },
    { returnDocument: 'after' }
  ).select('-password')

  if (!usuario) {
    res.status(404).json({ mensaje: 'Usuario no encontrado' })
    return
  }

  res.json({ 
    mensaje: 'Usuario desbloqueado correctamente',
    usuario
  })
}