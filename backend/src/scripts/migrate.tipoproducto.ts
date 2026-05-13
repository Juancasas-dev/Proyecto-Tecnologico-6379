import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Producto } from '../models/producto.model'

dotenv.config()

async function migrateTipoProducto() {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) throw new Error('MONGO_URI no definida en .env')

    await mongoose.connect(mongoUri)
    console.log('✅ MongoDB conectado')

    // actualizar alimentos — los que no tienen tipoProducto
    const result = await Producto.updateMany(
      { tipoProducto: { $exists: false } },
      { $set: { tipoProducto: 'alimento' } }
    )

    console.log(`✅ Productos actualizados: ${result.modifiedCount}`)

    await mongoose.disconnect()
    console.log('✅ Desconectado')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

migrateTipoProducto()