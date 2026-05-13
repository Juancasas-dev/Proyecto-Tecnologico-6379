import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
import authRoutes from './routes/auth.routes'
import usuarioRoutes from './routes/usuario.routes'
import categoriaRoutes from './routes/categoria.routes'
import productoRoutes from './routes/producto.routes'

dotenv.config()
connectDB()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/categorias', categoriaRoutes)
app.use('/api/productos', productoRoutes)

app.listen(3000, () => console.log('Servidor en puerto 3000'))