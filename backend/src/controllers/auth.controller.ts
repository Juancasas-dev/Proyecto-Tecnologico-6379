import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/usuario.model'

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

  const token = jwt.sign(
    { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  )

  res.json({ 
    token, 
    usuario: { 
      nombre: usuario.nombre, 
      username: usuario.username,
      rol: usuario.rol 
    } 
  })
}