import { Router } from 'express'
import {
  listarProveedores,
  crearProveedor,
  editarProveedor,
  buscarProveedores
} from '../controllers/proveedor.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()

router.get('/', verificarToken, listarProveedores)
router.get('/buscar', verificarToken, buscarProveedores)
router.post('/', verificarToken, verificarRol('dueño'), crearProveedor)
router.patch('/:id', verificarToken, verificarRol('dueño'), editarProveedor)

export default router