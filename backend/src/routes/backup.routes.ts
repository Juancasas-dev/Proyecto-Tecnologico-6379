import { Router } from 'express'
import {
  generarBackupManual,
  listarBackups,
  obtenerConfiguracionBackup,
  guardarConfiguracionBackup
} from '../controllers/backup.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { obtenerResumenBackup } from '../controllers/backup.controller'

const router = Router()

router.get('/generar', verificarToken, generarBackupManual)

router.get('/historial', verificarToken, listarBackups)

router.get('/configuracion', verificarToken, obtenerConfiguracionBackup)

router.post('/configuracion', verificarToken, guardarConfiguracionBackup)

router.get('/resumen', verificarToken, obtenerResumenBackup)

export default router