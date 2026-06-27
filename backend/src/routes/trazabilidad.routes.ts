import { Router } from 'express'
import { obtenerTrazabilidad } from '../controllers/trazabilidad.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()

router.get('/', verificarToken, verificarRol('dueño'), obtenerTrazabilidad)

export default router