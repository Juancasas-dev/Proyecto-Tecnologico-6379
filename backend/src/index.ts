import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db'
import authRoutes from './routes/auth.routes'
import usuarioRoutes from './routes/usuario.routes'

dotenv.config()
connectDB()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuarioRoutes)

app.listen(3000, () => console.log('Servidor en puerto 3000'))