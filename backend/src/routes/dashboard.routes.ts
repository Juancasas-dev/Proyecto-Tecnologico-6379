import { Router } from 'express'
import {
  obtenerResumen,
  obtenerEvolucion,
  obtenerDistribucionCategorias,
  obtenerProductosMasVendidos,
  obtenerBajoStock,
  obtenerValorInventario
} from '../controllers/dashboard.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()


router.get('/resumen', verificarToken, obtenerResumen)
router.get('/evolucion', verificarToken, obtenerEvolucion)
router.get('/categorias', verificarToken, obtenerDistribucionCategorias)
router.get('/productos-mas-vendidos', verificarToken, obtenerProductosMasVendidos)
router.get('/bajo-stock', verificarToken, obtenerBajoStock)
router.get('/valor-inventario', verificarToken, obtenerValorInventario)

export default router