import { Router } from 'express'
import { registrarDemanda, listarDemandas } from '../controllers/demanda.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()

router.post('/', verificarToken, verificarRol('vendedor', 'dueño'), registrarDemanda)
router.get('/',  verificarToken, verificarRol('dueño'), listarDemandas)

export default router