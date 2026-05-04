import { Request, Response, NextFunction } from 'express'

export const verificarRol = (...rolesPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuario

    if (!rolesPermitidos.includes(usuario.rol)) {
      res.status(403).json({ mensaje: 'No tienes permiso para esta acción' })
      return
    }
    next()
  }
}