import { Router } from 'express'
import { register, login, cambiarContrasena, logout,olvidePassword,resetPassword,validarToken } from '../controllers/auth.controller'
import { verificarToken } from '../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/cambiar-contrasena', verificarToken, cambiarContrasena)
router.post('/logout', verificarToken, logout)
router.post('/olvide-password', olvidePassword)
router.post('/reset-password', resetPassword)
router.get('/validar-token/:token', validarToken)

export default router