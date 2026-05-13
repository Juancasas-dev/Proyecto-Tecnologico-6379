import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Producto } from '../models/producto.model'

dotenv.config()

async function migrateStock() {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) throw new Error('MONGO_URI no definida en .env')

    await mongoose.connect(mongoUri)
    console.log('✅ MongoDB conectado')

    // agrega stock: 0 a todos los productos que no tienen ese campo
    const result = await Producto.updateMany(
      { stock: { $exists: false } },
      { $set: { stock: 0 } }
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

migrateStock()