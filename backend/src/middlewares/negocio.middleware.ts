import { Request, Response, NextFunction } from 'express'

export const soloNegocio = (req: Request, res: Response, next: NextFunction) => {
  const usuario = (req as any).usuario

  if (usuario.rol === 'admin') {
    // registrar intento en log (por ahora solo console)
    console.log(`SEGURIDAD: admin ${usuario.nombre} intentó acceder a ${req.originalUrl} - ${new Date()}`)
    
    res.status(403).json({ 
      mensaje: 'Acceso denegado. No tienes permiso para acceder a este módulo.',
      url: req.originalUrl,
      usuario: usuario.nombre,
      fecha: new Date()
    })
    return
  }
  next()
}