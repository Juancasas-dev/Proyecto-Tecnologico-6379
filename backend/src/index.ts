import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
import authRoutes from './routes/auth.routes'
import usuarioRoutes from './routes/usuario.routes'
import categoriaRoutes from './routes/categoria.routes'
import productoRoutes from './routes/producto.routes'
import inventarioRoutes from './routes/inventario.routes'
import backupRoutes from './routes/backup.routes'
import demandaRoutes from './routes/demanda.routes'
import ventaRoutes from './routes/venta.routes'
import { Venta } from './models/venta.model' 
import alertaRoutes from './routes/alerta.routes'
import { iniciarAlertasCron } from './services/alerta-cron.service'
import reporteRoutes from './routes/reporte.routes'
import trazabilidadRoutes from './routes/trazabilidad.routes'
import proveedorRoutes from './routes/proveedor.routes'

dotenv.config()
connectDB().then(() => {
  Venta.syncIndexes() 
   iniciarAlertasCron()  
})

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/categorias', categoriaRoutes)
app.use('/api/productos', productoRoutes)
app.use('/api/inventario', inventarioRoutes) 
app.use('/api/backup', backupRoutes)
app.use('/api/demandas', demandaRoutes)
app.use('/api/ventas', ventaRoutes)
app.use('/api/alertas', alertaRoutes)
app.use('/api/reportes', reporteRoutes)
app.use('/api/trazabilidad', trazabilidadRoutes)
app.use('/api/proveedores', proveedorRoutes)
app.listen(3000, () => console.log('Servidor en puerto 3000'))