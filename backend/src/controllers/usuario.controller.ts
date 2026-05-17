import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { Usuario } from '../models/usuario.model'
import { enviarEmail } from '../config/email'

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