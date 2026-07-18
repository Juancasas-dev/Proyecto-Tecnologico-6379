import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { Usuario } from '../models/usuario.model'
import { Auditoria } from '../models/auditoria.model'
import { enviarEmail } from '../config/email'

const MOTIVOS_DESACTIVACION = [
  'Renuncia',
  'Despido',
  'Cuenta Comprometida',
  'Finalización de contrato',
  'Otra causa'
]

export const listarUsuarios = async (req: Request, res: Response) => {
  const usuarios = await Usuario.find()
    .select('-password')
    .populate('creadoPor', 'nombre username')

  res.json(usuarios)
}

const validarDatosUsuario = (nombre: string, username: string, email: string, password: string) => {
  const errores: string[] = []

  if (!nombre || nombre.trim().length < 3 || nombre.trim().length > 50) {
    errores.push('El nombre debe tener entre 3 y 50 caracteres')
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
    errores.push('El nombre solo puede contener letras y espacios')
  }

  if (!username || username.length < 4 || username.length > 20) {
    errores.push('El usuario debe tener entre 4 y 20 caracteres')
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errores.push('El usuario solo puede contener letras, números y guión bajo')
  }

  const dominiosValidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com']
  const dominio = email.split('@')[1]?.toLowerCase()
  if (!dominio || !dominiosValidos.includes(dominio)) {
    errores.push('El email debe ser de un dominio válido (gmail, hotmail, outlook, yahoo, icloud, live)')
  }

  if (!password || password.length < 8) {
    errores.push('La contraseña debe tener al menos 8 caracteres')
  }

  return errores
}

// Reutilizable en edición de perfil (mismas reglas de nombre que en creación)
const validarNombre = (nombre: string) => {
  const errores: string[] = []
  if (nombre.trim().length < 3 || nombre.trim().length > 50) {
    errores.push('El nombre debe tener entre 3 y 50 caracteres')
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())) {
    errores.push('El nombre solo puede contener letras y espacios')
  }
  return errores
}

export const crearUsuario = async (req: Request, res: Response) => {
  const { nombre, username, email, password, rol } = req.body
  const adminId = (req as any).usuario.id

  const errores = validarDatosUsuario(nombre, username, email, password)
  if (errores.length > 0) {
    res.status(400).json({ mensaje: errores[0] })
    return
  }

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

  await enviarEmail(
    email,
    'Bienvenido a SIVWEB — Tus credenciales de acceso',
    `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
    <h2 style="color: #5d87ff;">Bienvenido a SIVWEB</h2>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>El administrador ha creado tu cuenta en el sistema de inventario SIVWEB.</p>
    
    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Tus credenciales de acceso:</strong></p>
      <p style="margin: 8px 0;">Usuario: <strong>${username}</strong></p>
      <p style="margin: 8px 0;">Contraseña temporal: <strong>${password}</strong></p>
    </div>

    <p>Por seguridad deberás <strong>cambiar tu contraseña</strong> al iniciar sesión por primera vez.</p>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; color: #856404;">
        ⚠️ <strong>Este enlace de activación es válido por 24 horas.</strong> 
        Si no accedes en ese tiempo, solicita al administrador que reenvíe tus credenciales.
      </p>
    </div>
    
    <a href="http://localhost:5173/login" 
       style="display: inline-block; background: #5d87ff; color: white; 
              padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
      Ir al sistema →
    </a>

    <p style="color: #999; font-size: 12px; margin-top: 24px;">
      Este es un mensaje automático del sistema SIVWEB. No respondas a este correo.
    </p>
  </div>
  `
  )

  const { password: _, ...usuarioSinPassword } = usuario.toObject()

  res.status(201).json({
    mensaje: 'Usuario creado y credenciales enviadas por email',
    usuario: usuarioSinPassword
  })
}


export const cambiarEstado = async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    res.status(400).json({ mensaje: 'ID de usuario inválido' })
    return
  }

  const { activo, motivo, detalle } = req.body
  const adminId = (req as any).usuario.id

  if (activo === false) {
    if (!motivo || !MOTIVOS_DESACTIVACION.includes(motivo)) {
      res.status(400).json({ mensaje: 'Debe seleccionar un motivo válido de desactivación' })
      return
    }
    if (!detalle || detalle.trim().length < 10) {
      res.status(400).json({ mensaje: 'El detalle del motivo debe tener al menos 10 caracteres' })
      return
    }
  }

  const usuarioAnterior = await Usuario.findById(id)
  if (!usuarioAnterior) {
    res.status(404).json({ mensaje: 'Usuario no encontrado' })
    return
  }

  const camposDesactivacion: Record<string, any> = activo === false
    ? {
      motivoDesactivacion: motivo,
      detalleDesactivacion: detalle.trim(),
      fechaDesactivacion: new Date(),
      desactivadoPor: adminId
    }
    : {
      motivoDesactivacion: null,
      detalleDesactivacion: null,
      fechaDesactivacion: null,
      desactivadoPor: null
    }

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    {
      activo,
      tokenInvalidadoEn: activo === false ? new Date() : null,
      ...camposDesactivacion
    },
    { returnDocument: 'after' }
  ).select('-password')

  await Auditoria.create({
    usuarioModificadoId: id,
    accion: activo === false ? 'DESACTIVACION' : 'ACTIVACION',
    camposAlterados: activo === false
      ? { activo: { antes: usuarioAnterior.activo, despues: false }, motivo, detalle: detalle.trim() }
      : { activo: { antes: usuarioAnterior.activo, despues: true } },
    adminResponsableId: adminId,
    fechaHora: new Date()
  })

  res.json({
    mensaje: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
    usuario
  })
}


export const editarPerfil = async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    res.status(400).json({ mensaje: 'ID de usuario inválido' })
    return
  }

  const { nombre, email, telefono } = req.body
  const adminId = (req as any).usuario.id

  const usuario = await Usuario.findById(id)
  if (!usuario) {
    res.status(404).json({ mensaje: 'Usuario no encontrado' })
    return
  }
  if (telefono !== undefined && telefono !== null && telefono !== '') {
    if (!/^9\d{8}$/.test(telefono)) {
      res.status(400).json({ mensaje: 'El teléfono debe tener 9 dígitos y comenzar con 9' })
      return
    }
  }

  if (email && email.toLowerCase() !== usuario.email) {
    const existeEmail = await Usuario.findOne({
      email: email.toLowerCase(),
      _id: { $ne: id }
    })

    if (existeEmail) {
      res.status(409).json({
        campo: 'email',
        mensaje: 'El correo electrónico ingresado ya pertenece a otro usuario registrado en el sistema'
      })
      return
    }
  }

  if (nombre && nombre.trim() !== usuario.nombre) {
    const erroresNombre = validarNombre(nombre)
    if (erroresNombre.length > 0) {
      res.status(400).json({ mensaje: erroresNombre[0] })
      return
    }
  }

  const camposAlterados: Record<string, any> = {}

  if (nombre && nombre.trim() !== usuario.nombre) {
    camposAlterados.nombre = { antes: usuario.nombre, despues: nombre.trim() }
    usuario.nombre = nombre.trim()
  }

  if (telefono !== undefined && telefono !== usuario.telefono) {
    camposAlterados.telefono = { antes: usuario.telefono, despues: telefono || null }
    usuario.telefono = telefono || null
  }

  if (email && email.toLowerCase() !== usuario.email) {
    camposAlterados.email = { antes: usuario.email, despues: email.toLowerCase() }
    usuario.email = email.toLowerCase()
  }

  if (Object.keys(camposAlterados).length === 0) {
    const { password: _sinCambios, ...usuarioSinPassword } = usuario.toObject()
    res.json({ mensaje: 'No se detectaron cambios', usuario: usuarioSinPassword })
    return
  }

  try {
    await usuario.save()
  } catch (err: any) {

    if (err.code === 11000) {
      res.status(409).json({
        campo: 'email',
        mensaje: 'El correo electrónico ingresado ya pertenece a otro usuario registrado en el sistema'
      })
      return
    }
    throw err
  }

  await Auditoria.create({
    usuarioModificadoId: usuario._id,
    accion: 'EDICION_PERFIL',
    camposAlterados,
    adminResponsableId: adminId,
    fechaHora: new Date()
  })

  const { password: _, ...usuarioSinPassword } = usuario.toObject()

  res.json({
    mensaje: 'Perfil actualizado correctamente',
    usuario: usuarioSinPassword
  })
}

export const desbloquearUsuario = async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    res.status(400).json({ mensaje: 'ID de usuario inválido' })
    return
  }

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