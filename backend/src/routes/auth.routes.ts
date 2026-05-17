import { Router } from 'express'
import { register, login, cambiarContrasena } from '../controllers/auth.controller'
import { verificarToken } from '../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/cambiar-contrasena', verificarToken, cambiarContrasena)



export default router