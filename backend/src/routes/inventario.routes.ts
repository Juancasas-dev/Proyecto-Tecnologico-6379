import { Router } from 'express'
import {
  registrarIngreso,
  listarMercaderia,
  eliminarIngreso,
  actualizarIngreso,
  obtenerIngresoPorId,
  obtenerStock,          
  ajustarInventario
} from '../controllers/inventario.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'  

const router = Router()

router.post('/ingresos',       verificarToken, verificarRol('dueño'), registrarIngreso)
router.get('/ingresos',        verificarToken, verificarRol('dueño', 'vendedor'), listarMercaderia)
router.get('/stock/:productoId', verificarToken, obtenerStock)         
router.get('/ingresos/:id',    verificarToken, verificarRol('dueño', 'vendedor'), obtenerIngresoPorId)
router.put('/ingresos/:id',    verificarToken, verificarRol('dueño'), actualizarIngreso)
router.delete('/ingresos/:id', verificarToken, verificarRol('dueño'), eliminarIngreso)
router.post('/ajustes',verificarToken,verificarRol('dueño'),ajustarInventario)

export default router