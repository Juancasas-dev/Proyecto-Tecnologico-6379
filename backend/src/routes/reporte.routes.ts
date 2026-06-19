import { Router } from 'express'
import {
  obtenerRotacionProductos,
  obtenerDemandaInsatisfecha,
  obtenerReportePerdidas,      
  obtenerReposicion,            
  exportarReposicionPDF,
  exportarPerdidasPDF
} from '../controllers/reporte.controller'

import { verificarToken } from '../middlewares/auth.middleware'
import { verificarRol } from '../middlewares/rol.middleware'

const router = Router()

router.get('/rotacion',verificarToken,verificarRol('dueño'),obtenerRotacionProductos)
router.get('/demanda',verificarToken,verificarRol('dueño'),obtenerDemandaInsatisfecha)
router.get('/perdidas', verificarToken, verificarRol('dueño'), obtenerReportePerdidas)
router.get('/reposicion', verificarToken, verificarRol('dueño'), obtenerReposicion)
router.get('/perdidas/pdf', verificarToken, verificarRol('dueño'), exportarPerdidasPDF)
router.get('/reposicion/pdf', verificarToken, verificarRol('dueño'), exportarReposicionPDF)
export default router