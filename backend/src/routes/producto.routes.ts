import { Router } from 'express'
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  cambiarEstadoProducto
} from '../controllers/producto.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'


const router = Router()

router.get('/',      verificarToken, verificarRol('dueño', 'vendedor'), listarProductos)
router.get('/:id',   verificarToken, verificarRol('dueño', 'vendedor'), obtenerProducto)
router.post('/',     verificarToken, verificarRol('dueño'), crearProducto)
router.patch('/:id', verificarToken, verificarRol('dueño'), actualizarProducto)
router.patch('/:id/estado', verificarToken, verificarRol('dueño'), cambiarEstadoProducto)

export default router