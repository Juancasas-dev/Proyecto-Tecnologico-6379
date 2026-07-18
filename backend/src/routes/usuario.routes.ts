import { Router } from 'express'
import { 
  listarUsuarios, 
  crearUsuario, 
  cambiarEstado,
  desbloquearUsuario,
  editarPerfil
} from '../controllers/usuario.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()

router.get('/',                    verificarToken, verificarRol('dueño'), listarUsuarios)
router.post('/',                   verificarToken, verificarRol('dueño'), crearUsuario)
router.patch('/:id/estado',        verificarToken, verificarRol('dueño'), cambiarEstado)
router.patch('/:id/desbloquear',   verificarToken, verificarRol('dueño'), desbloquearUsuario)
router.patch('/:id/editar',        verificarToken, verificarRol('dueño'), editarPerfil) 

export default router