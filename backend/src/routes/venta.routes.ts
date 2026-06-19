import { Router } from 'express'
import {
  registrarVenta,
  listarVentas,
  agregarBoleta,
  obtenerVenta,
  previewLotes
} from '../controllers/venta.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()

router.post('/',             verificarToken, verificarRol('vendedor', 'dueño'), registrarVenta)
router.get('/',              verificarToken, verificarRol('vendedor', 'dueño'), listarVentas)
router.get('/preview-lotes', verificarToken, previewLotes)                       
router.get('/:id',           verificarToken, verificarRol('vendedor', 'dueño'), obtenerVenta)
router.patch('/:id/boleta',  verificarToken, verificarRol('vendedor', 'dueño'), agregarBoleta)

export default router