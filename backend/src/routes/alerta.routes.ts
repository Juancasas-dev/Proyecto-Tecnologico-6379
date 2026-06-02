import { Router } from 'express'
import { listarAlertas, atenderAlerta } from '../controllers/alerta.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()

router.get('/',              verificarToken, listarAlertas)
router.patch('/:id/atender', verificarToken, verificarRol('dueño', 'vendedor'), atenderAlerta)

export default router