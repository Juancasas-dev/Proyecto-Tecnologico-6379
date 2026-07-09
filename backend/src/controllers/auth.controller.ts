import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/usuario.model'
import crypto from 'crypto'
import { enviarEmail } from '../config/email'

export const register = async (req: Request, res: Response) => {
  const { nombre, username, email, password, rol } = req.body

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
    nombre, username, email, password: hash, rol
  })

  res.status(201).json({ mensaje: 'Usuario creado', id: usuario._id })
}

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body

  const usuario = await Usuario.findOne({ username })

  if (!usuario) {
    res.status(401).json({ mensaje: 'Credenciales inválidas' })
    return
  }
  if (usuario.bloqueado) {
    res.status(403).json({
      mensaje: 'Cuenta bloqueada por múltiples intentos fallidos. Contacta al administrador.'
    })
    return
  }
  const passwordOk = await bcrypt.compare(password, usuario.password)
  if (!passwordOk) {
    usuario.intentosFallidos += 1

    if (usuario.intentosFallidos >= 3) {
      usuario.bloqueado = true
      usuario.fechaBloqueo = new Date()
      await usuario.save()

      console.log(`ALERTA: cuenta ${username} bloqueada por intentos fallidos`)

      res.status(403).json({
        mensaje: 'Cuenta bloqueada por múltiples intentos fallidos.'
      })
      return
    }

    await usuario.save()
    res.status(401).json({
      mensaje: `Credenciales inválidas. Intentos restantes: ${3 - usuario.intentosFallidos}`
    })
    return
  }

  usuario.intentosFallidos = 0
  usuario.bloqueado = false
  await usuario.save()

  const tiempoSesion = usuario.rol === 'dueño' ? '12h' : '8h'
  const token = jwt.sign(
  { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
  process.env.JWT_SECRET!,
  { expiresIn: tiempoSesion }
)

  res.json({
    token,
    usuario: {
      nombre: usuario.nombre,
      username: usuario.username,
      rol: usuario.rol,
      debeCambiarContrasena: usuario.debeCambiarContrasena  
    }
  })
}

export const cambiarContrasena = async (req: Request, res: Response) => {
  const { nuevaContrasena } = req.body
  const usuarioId = (req as any).usuario.id

  if (!nuevaContrasena || nuevaContrasena.length < 8) {
    res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' })
    return
  }

  const hash = await bcrypt.hash(nuevaContrasena, 10)

  await Usuario.findByIdAndUpdate(usuarioId, {
    password: hash,
    debeCambiarContrasena: false
  })

  res.json({ mensaje: 'Contraseña actualizada correctamente' })
}

export const logout = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario
    await Usuario.findByIdAndUpdate(
      usuario.id || usuario._id,
      { ultimoLogout: new Date() }
    )
    res.json({ mensaje: 'Sesión cerrada correctamente' })
  } catch {
    res.status(500).json({ mensaje: 'Error al cerrar sesión' })
  }
}
export const olvidePassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    const usuario = await Usuario.findOne({ email })

    
    if (!usuario) {
      return res.json({
        mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación en breve.'
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    usuario.resetToken = token
    usuario.resetTokenExpira = new Date(Date.now() + 30 * 60 * 1000)
    await usuario.save()

    const enlace = `http://localhost:5173/auth/reset-password?token=${token}`

    
    await enviarEmail(
      usuario.email,
      'Recuperación de contraseña — SIVWEB',
      `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #5d87ff;">Recuperación de contraseña</h2>
        <p>Hola <strong>${usuario.nombre}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña en SIVWEB.</p>
        <p>Haz clic en el botón para continuar. Este enlace es válido por <strong>30 minutos</strong>.</p>
        <a href="${enlace}"
           style="display: inline-block; background: #5d87ff; color: white;
                  padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
          Restablecer contraseña →
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          Si no solicitaste este cambio, ignora este correo.
          Este enlace expirará en 30 minutos.
        </p>
      </div>
      `
    )
    

    return res.json({
      mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación en breve.'
    })
  } catch {
    res.status(500).json({ mensaje: 'Error al generar recuperación' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body

    const usuario = await Usuario.findOne({
      resetToken: token,
      resetTokenExpira: { $gt: new Date() }
    })

    if (!usuario) {
      return res.status(400).json({
        mensaje: 'Este enlace ha expirado. Por favor, solicita uno nuevo desde la pantalla de inicio de sesión.'
      })
    }

    if (usuario.rol === 'vendedor') {
      const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
      if (!regex.test(password)) {
        return res.status(400).json({
          mensaje: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.'
        })
      }
    }

    if (usuario.rol === 'dueño' || usuario.rol === 'admin') {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{10,}$/
      if (!regex.test(password)) {
        return res.status(400).json({
          mensaje: 'Debe tener mínimo 10 caracteres, mayúscula, minúscula, número y carácter especial.'
        })
      }

      const igual = await bcrypt.compare(password, usuario.password)
      if (igual) {
        return res.status(400).json({
          mensaje: 'La nueva contraseña no puede ser igual a tu contraseña anterior. Por favor, elige una diferente.'
        })
      }
    }

    usuario.password = await bcrypt.hash(password, 10)
    usuario.resetToken = null
    usuario.resetTokenExpira = null
    await usuario.save()

    
    await enviarEmail(
      usuario.email,
      'Contraseña actualizada — SIVWEB',
      `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #5d87ff;">Contraseña actualizada</h2>
        <p>Hola <strong>${usuario.nombre}</strong>,</p>
        <p>Tu contraseña de SIVWEB fue actualizada exitosamente.</p>
        <p>Si no realizaste este cambio, contacta al administrador de inmediato.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          Este es un mensaje automático del sistema SIVWEB.
        </p>
      </div>
      `
    )
   

    res.json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' })
  } catch {
    res.status(500).json({ mensaje: 'Error al cambiar contraseña' })
  }
}

export const validarToken = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string

    const usuario = await Usuario.findOne({
      resetToken: token,
      resetTokenExpira: { $gt: new Date() }
    })

    if (!usuario) {
      return res.status(400).json({
        mensaje: 'Este enlace ha expirado. Por favor, solicita uno nuevo desde la pantalla de inicio de sesión.'
      })
    }

    res.json({ rol: usuario.rol })
  } catch {
    res.status(500).json({ mensaje: 'Error al validar token' })
  }
}