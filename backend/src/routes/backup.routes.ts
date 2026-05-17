import { Router } from 'express'
import {
  generarBackup,
  listarBackups,
  obtenerConfiguracionBackup,
  guardarConfiguracionBackup
} from '../controllers/backup.controller'
import { verificarToken } from '../middlewares/auth.middleware'

const router = Router()

router.get('/generar', verificarToken, generarBackup)

router.get('/historial', verificarToken, listarBackups)

router.get('/configuracion', verificarToken, obtenerConfiguracionBackup)

router.post('/configuracion', verificarToken, guardarConfiguracionBackup)

export default router