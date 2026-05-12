import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/usuario.model'

export const verificarToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    res.status(401).json({ mensaje: 'Token requerido' })
    return
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const usuario = await Usuario.findById(decoded.id)
    if (usuario?.tokenInvalidadoEn) {
      const tokenEmitidoEn = new Date(decoded.iat * 1000)
      if (tokenEmitidoEn < usuario.tokenInvalidadoEn) {
        res.status(401).json({ mensaje: 'Sesión invalidada, inicia sesión nuevamente' })
        return
      }
    };
    (req as any).usuario = decoded
    next()
  } catch {
    res.status(401).json({ mensaje: 'Token inválido' })
  }
}