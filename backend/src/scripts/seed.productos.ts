import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Producto } from '../models/producto.model'
import { Categoria } from '../models/categoria.model'

dotenv.config()

const productosData = [
  // PERROS
  { nombre: 'Ricocan Adultos Razas Pequeñas', marca: 'Ricocan', categoria: 'Perros', tipo: 'Adulto', presentacion: 'Bolsa', unidadMedida: '3 kg', precio: 29.9, nivelMinimo: 5 },
  { nombre: 'Ricocan Adultos Razas Grandes', marca: 'Ricocan', categoria: 'Perros', tipo: 'Adulto', presentacion: 'Saco', unidadMedida: '15 kg', precio: 99.9, nivelMinimo: 5 },
  { nombre: 'Ricocan Cachorros', marca: 'Ricocan', categoria: 'Perros', tipo: 'Cachorro', presentacion: 'Bolsa', unidadMedida: '5 kg', precio: 44.9, nivelMinimo: 5 },
  { nombre: 'Pedigree Adulto Carne y Verduras', marca: 'Pedigree', categoria: 'Perros', tipo: 'Adulto', presentacion: 'Bolsa', unidadMedida: '3 kg', precio: 34.9, nivelMinimo: 5 },
  { nombre: 'Pedigree Cachorro', marca: 'Pedigree', categoria: 'Perros', tipo: 'Cachorro', presentacion: 'Bolsa', unidadMedida: '1 kg', precio: 14.9, nivelMinimo: 5 },
  { nombre: 'Mimaskot Adulto', marca: 'Mimaskot', categoria: 'Perros', tipo: 'Adulto', presentacion: 'Saco', unidadMedida: '20 kg', precio: 89.9, nivelMinimo: 3 },
  { nombre: 'Mimaskot Cachorro', marca: 'Mimaskot', categoria: 'Perros', tipo: 'Cachorro', presentacion: 'Bolsa', unidadMedida: '8 kg', precio: 59.9, nivelMinimo: 5 },
  { nombre: 'Dog Chow Adulto Razas Medianas', marca: 'Purina', categoria: 'Perros', tipo: 'Adulto', presentacion: 'Bolsa', unidadMedida: '4 kg', precio: 52.9, nivelMinimo: 5 },
  { nombre: 'Pro Plan Puppy', marca: 'Purina', categoria: 'Perros', tipo: 'Cachorro', presentacion: 'Bolsa', unidadMedida: '3 kg', precio: 89.9, nivelMinimo: 5 },
  { nombre: 'Royal Canin Medium Adult', marca: 'Royal Canin', categoria: 'Perros', tipo: 'Adulto', presentacion: 'Bolsa', unidadMedida: '4 kg', precio: 119.9, nivelMinimo: 3 },
  // GATOS
  { nombre: 'Cat Chow Adulto Pollo', marca: 'Purina', categoria: 'Gatos', tipo: 'Adulto', presentacion: 'Bolsa', unidadMedida: '1.5 kg', precio: 29.9, nivelMinimo: 5 },
  { nombre: 'Cat Chow Gatitos', marca: 'Purina', categoria: 'Gatos', tipo: 'Cachorro/Gatito', presentacion: 'Bolsa', unidadMedida: '1 kg', precio: 24.9, nivelMinimo: 5 },
  { nombre: 'Whiskas Adulto Atún', marca: 'Whiskas', categoria: 'Gatos', tipo: 'Adulto', presentacion: 'Bolsa', unidadMedida: '1.5 kg', precio: 27.9, nivelMinimo: 5 },
  { nombre: 'Whiskas Gatitos Leche', marca: 'Whiskas', categoria: 'Gatos', tipo: 'Cachorro/Gatito', presentacion: 'Bolsa', unidadMedida: '1 kg', precio: 22.9, nivelMinimo: 5 },
  { nombre: 'Mimaskot Gato Adulto', marca: 'Mimaskot', categoria: 'Gatos', tipo: 'Adulto', presentacion: 'Bolsa', unidadMedida: '1.5 kg', precio: 18.9, nivelMinimo: 5 },
  { nombre: 'Royal Canin Kitten', marca: 'Royal Canin', categoria: 'Gatos', tipo: 'Cachorro/Gatito', presentacion: 'Bolsa', unidadMedida: '2 kg', precio: 89.9, nivelMinimo: 3 },
  { nombre: 'Felix Adulto Salmón', marca: 'Purina', categoria: 'Gatos', tipo: 'Adulto', presentacion: 'Lata', unidadMedida: '85 g', precio: 4.5, nivelMinimo: 10 },
  // GALLINAS/POLLOS/PATOS
  { nombre: 'Alimento Postura Gallinas Nicolini', marca: 'Nicolini', categoria: 'Gallinas/Pollos/Patos', tipo: 'Postura', presentacion: 'Saco', unidadMedida: '40 kg', precio: 89.9, nivelMinimo: 3 },
  { nombre: 'Alimento Inicio Pollos', marca: 'Nicolini', categoria: 'Gallinas/Pollos/Patos', tipo: 'Inicio (1-21 días)', presentacion: 'Saco', unidadMedida: '40 kg', precio: 95.9, nivelMinimo: 3 },
  { nombre: 'Alimento Crecimiento Pollos', marca: 'Nicolini', categoria: 'Gallinas/Pollos/Patos', tipo: 'Crecimiento', presentacion: 'Saco', unidadMedida: '40 kg', precio: 92.9, nivelMinimo: 3 },
  { nombre: 'Alimento Acabado Pollos', marca: 'Nicolini', categoria: 'Gallinas/Pollos/Patos', tipo: 'Acabado/Engorde', presentacion: 'Saco', unidadMedida: '40 kg', precio: 88.9, nivelMinimo: 3 },
  { nombre: 'Alimento Postura Gallinas Redondos', marca: 'Redondos', categoria: 'Gallinas/Pollos/Patos', tipo: 'Postura', presentacion: 'Saco', unidadMedida: '40 kg', precio: 87.9, nivelMinimo: 3 },
  { nombre: 'Alimento Crecimiento Patos', marca: 'Tomasino', categoria: 'Gallinas/Pollos/Patos', tipo: 'Crecimiento', presentacion: 'Saco', unidadMedida: '40 kg', precio: 91.9, nivelMinimo: 3 },
  { nombre: 'Maíz Partido para Aves', marca: 'Granel', categoria: 'Gallinas/Pollos/Patos', tipo: 'Mantenimiento', presentacion: 'Saco', unidadMedida: '50 kg', precio: 79.9, nivelMinimo: 3 },
  // CUYES Y CONEJOS
  { nombre: 'Cuyina Inicio', marca: 'Nicolini', categoria: 'Cuyes/Conejos', tipo: 'Inicio/Crecimiento', presentacion: 'Saco', unidadMedida: '40 kg', precio: 84.9, nivelMinimo: 3 },
  { nombre: 'Cuyina Engorde', marca: 'Nicolini', categoria: 'Cuyes/Conejos', tipo: 'Engorde', presentacion: 'Saco', unidadMedida: '40 kg', precio: 82.9, nivelMinimo: 3 },
  { nombre: 'Alimento Conejo Adulto', marca: 'Tomasino', categoria: 'Cuyes/Conejos', tipo: 'Adulto/Mantenimiento', presentacion: 'Saco', unidadMedida: '40 kg', precio: 86.9, nivelMinimo: 3 },
  { nombre: 'Alimento Cuy Reproductora', marca: 'Redondos', categoria: 'Cuyes/Conejos', tipo: 'Reproducción/Gestación', presentacion: 'Saco', unidadMedida: '40 kg', precio: 88.9, nivelMinimo: 3 },
  { nombre: 'Pienso Cuy Crecimiento', marca: 'Purina', categoria: 'Cuyes/Conejos', tipo: 'Crecimiento', presentacion: 'Saco', unidadMedida: '20 kg', precio: 52.9, nivelMinimo: 3 },
  { nombre: 'Alfalfa Deshidratada para Conejos', marca: 'Granel', categoria: 'Cuyes/Conejos', tipo: 'Mantenimiento', presentacion: 'Bolsa', unidadMedida: '1 kg', precio: 7.9, nivelMinimo: 10},
  // LOROS Y AVES ORNAMENTALES
  { nombre: 'Mix Semillas para Loros', marca: 'Vitakraft', categoria: 'Loros/Aves', tipo: 'Mantenimiento', presentacion: 'Bolsa', unidadMedida: '1 kg', precio: 24.9, nivelMinimo: 5 },
  { nombre: 'Alimento Canarios y Jilgueros', marca: 'Vitakraft', categoria: 'Loros/Aves', tipo: 'Mantenimiento', presentacion: 'Bolsa', unidadMedida: '500 g', precio: 14.9, nivelMinimo: 5 },
  { nombre: 'Mix Premium Periquitos', marca: 'Versele-Laga', categoria: 'Loros/Aves', tipo: 'Mantenimiento', presentacion: 'Bolsa', unidadMedida: '1 kg', precio: 29.9, nivelMinimo: 5 },
  { nombre: 'Alimento Loro Grande (Guacamayo)', marca: 'Kaytee', categoria: 'Loros/Aves', tipo: 'Mantenimiento', presentacion: 'Bolsa', unidadMedida: '1.4 kg', precio: 54.9, nivelMinimo: 3 },
  { nombre: 'Pellets para Loros Medianos', marca: 'ZuPreem', categoria: 'Loros/Aves', tipo: 'Mantenimiento', presentacion: 'Bolsa', unidadMedida: '1 kg', precio: 64.9, nivelMinimo: 3 },
  { nombre: 'Mix Semillas para Pinzones', marca: 'Vitakraft', categoria: 'Loros/Aves', tipo: 'Mantenimiento', presentacion: 'Bolsa', unidadMedida: '500 g', precio: 12.9, nivelMinimo: 5 },
  { nombre: 'Snack Frutas para Aves', marca: 'Trill', categoria: 'Loros/Aves', tipo: 'Snack/Complemento', presentacion: 'Bolsa', unidadMedida: '400 g', precio: 9.9, nivelMinimo: 5 },
]

async function seedProductos() {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) throw new Error('MONGO_URI no definida en .env')

    await mongoose.connect(mongoUri)
    console.log('✅ MongoDB conectado')

    const nombresCategoria = [
      'Perros',
      'Gatos', 
      'Gallinas/Pollos/Patos',
      'Cuyes/Conejos',
      'Loros/Aves'
    ]

    const catMap: Record<string, any> = {}

    for (const nombre of nombresCategoria) {
      let cat = await Categoria.findOne({ nombre })
      if (!cat) {
        cat = await Categoria.create({ nombre })
        console.log(`  + Categoría creada: ${nombre}`)
      } else {
        console.log(`  - Categoría ya existe: ${nombre}`)
      }
      catMap[nombre] = cat._id
    }

    let creados = 0
    let omitidos = 0

    for (const p of productosData) {
      const existe = await Producto.findOne({
        nombre: p.nombre,
        marca: p.marca,
        presentacion: p.presentacion
      })

      if (existe) {
        console.log(`  - Omitido (ya existe): ${p.nombre}`)
        omitidos++
        continue
      }

      await Producto.create({
        ...p,
        categoria: catMap[p.categoria],
        activo: true
      })
      console.log(`  + Creado: ${p.nombre}`)
      creados++
    }

    console.log(`Resumen:`)
    console.log(`  Categorías: ${nombresCategoria.length}`)
    console.log(`  Productos creados:  ${creados}`)
    console.log(`  Productos omitidos: ${omitidos}`)

    await mongoose.disconnect()
    console.log('Desconectado')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

seedProductos()