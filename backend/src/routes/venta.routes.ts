import { Router } from 'express'
import {
  registrarVenta,
  listarVentas,
  agregarBoleta,
  obtenerVenta,
  previewLotes,
  anularVenta,
  modificarVenta
} from '../controllers/venta.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()

router.post('/',             verificarToken, verificarRol('vendedor', 'dueño'), registrarVenta)
router.get('/',              verificarToken, verificarRol('vendedor', 'dueño'), listarVentas)
router.get('/preview-lotes', verificarToken, previewLotes)                       
router.get('/:id',           verificarToken, verificarRol('vendedor', 'dueño'), obtenerVenta)
router.patch('/:id/boleta',  verificarToken, verificarRol('vendedor', 'dueño'), agregarBoleta)
router.patch('/:id/anular',  verificarToken, verificarRol('vendedor', 'dueño'), anularVenta)
router.patch('/:id/modificar',verificarToken, verificarRol('vendedor', 'dueño'), modificarVenta)

export default router