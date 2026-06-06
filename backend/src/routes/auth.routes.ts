import { Router } from 'express'
import { register, login, cambiarContrasena, logout } from '../controllers/auth.controller'
import { verificarToken } from '../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/cambiar-contrasena', verificarToken, cambiarContrasena)
router.post('/logout', verificarToken, logout)


export default router