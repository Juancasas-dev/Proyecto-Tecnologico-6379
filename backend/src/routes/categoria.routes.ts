import { Router } from 'express'
import { listarCategorias, crearCategoria, actualizarCategoria } from '../controllers/categoria.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()


router.get('/',      verificarToken, listarCategorias)
router.post('/',     verificarToken, verificarRol('dueño'), crearCategoria)
router.patch('/:id', verificarToken, verificarRol('dueño'), actualizarCategoria)

export default router