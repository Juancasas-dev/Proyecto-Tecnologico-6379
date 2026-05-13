import { Router } from 'express'
import { listarCategorias, crearCategoria, actualizarCategoria } from '../controllers/categoria.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()

// todos pueden ver categorías
router.get('/',      verificarToken, listarCategorias)
// solo el dueño puede crear y editar
router.post('/',     verificarToken, verificarRol('dueño'), crearCategoria)
router.patch('/:id', verificarToken, verificarRol('dueño'), actualizarCategoria)

export default router