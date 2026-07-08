import { Router } from 'express'
import {
  registrarIngreso,
  listarMercaderia,
  eliminarIngreso,
  actualizarIngreso,
  obtenerIngresoPorId,
  obtenerStock,          
  ajustarInventario,
  obtenerMovimientosTurno,
  listarHistorialAjustes
} from '../controllers/inventario.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'
import { registrarIngresoMasivo } from '../controllers/inventario.controller'


const router = Router()

router.post('/ingresos',       verificarToken, verificarRol('dueño'), registrarIngreso)
router.get('/ingresos',        verificarToken, verificarRol('dueño', 'vendedor'), listarMercaderia)
router.get('/stock/:productoId', verificarToken, obtenerStock)         
router.get('/ingresos/:id',    verificarToken, verificarRol('dueño', 'vendedor'), obtenerIngresoPorId)
router.put('/ingresos/:id',    verificarToken, verificarRol('dueño'), actualizarIngreso)
router.delete('/ingresos/:id', verificarToken, verificarRol('dueño'), eliminarIngreso)
router.post('/ajustes',verificarToken,verificarRol('dueño'),ajustarInventario)
router.get('/turno', verificarToken, obtenerMovimientosTurno)
router.get('/historial-ajustes', verificarToken, verificarRol('dueño'), listarHistorialAjustes)
router.post('/ingresos/masivo', verificarToken, verificarRol('dueño'), registrarIngresoMasivo)
export default router