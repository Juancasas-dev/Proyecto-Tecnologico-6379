import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Producto } from '../models/producto.model'
import { Categoria } from '../models/categoria.model'

dotenv.config()

const equipamiento = [
  // PERROS
  { nombre: 'Comedero de Acero Inoxidable', marca: 'Bonita', categoria: 'Perros', tipo: 'Comedero', unidadMedida: '900 ml', presentacion: 'Unidad', precio: 25, nivelMinimo: 3 },
  { nombre: 'Bebedero Automático Portátil', marca: 'Pet Water', categoria: 'Perros', tipo: 'Bebedero', unidadMedida: '500 ml', presentacion: 'Unidad', precio: 35, nivelMinimo: 3 },
  { nombre: 'Arnés de Seguridad Acolchado', marca: 'Zeedog', categoria: 'Perros', tipo: 'Paseo', unidadMedida: 'Talla M', presentacion: 'Unidad', precio: 85, nivelMinimo: 2 },
  // GATOS
  { nombre: 'Fuente de Agua Automática', marca: 'Catit', categoria: 'Gatos', tipo: 'Bebedero', unidadMedida: '3 L', presentacion: 'Unidad', precio: 145, nivelMinimo: 2 },
  { nombre: 'Rascador de Torre Multitubos', marca: 'Fancy Pets', categoria: 'Gatos', tipo: 'Juguete', unidadMedida: '120 cm', presentacion: 'Unidad', precio: 180, nivelMinimo: 2 },
  { nombre: 'Arenero Sanitario Cerrado', marca: 'Moderna', categoria: 'Gatos', tipo: 'Higiene', unidadMedida: 'Grande', presentacion: 'Unidad', precio: 110, nivelMinimo: 2 },
  // GALLINAS/POLLOS/PATOS
  { nombre: 'Comedero Tolva para Aves', marca: 'Nicolini', categoria: 'Gallinas/Pollos/Patos', tipo: 'Comedero', unidadMedida: '10 kg', presentacion: 'Unidad', precio: 45, nivelMinimo: 3 },
  { nombre: 'Bebedero de Campana Automático', marca: 'Genérica', categoria: 'Gallinas/Pollos/Patos', tipo: 'Bebedero', unidadMedida: '5 L', presentacion: 'Unidad', precio: 28, nivelMinimo: 3 },
  { nombre: 'Incubadora Automática', marca: 'Digital Pro', categoria: 'Gallinas/Pollos/Patos', tipo: 'Producción', unidadMedida: '48 huevos', presentacion: 'Unidad', precio: 450, nivelMinimo: 1 },
  // CUYES/CONEJOS
  { nombre: 'Bebedero de Goteo (Niple)', marca: 'Savic', categoria: 'Cuyes/Conejos', tipo: 'Bebedero', unidadMedida: '1 L', presentacion: 'Unidad', precio: 22, nivelMinimo: 3 },
  { nombre: 'Henera de Metal Colgante', marca: 'Living World', categoria: 'Cuyes/Conejos', tipo: 'Comedero', unidadMedida: 'Estándar', presentacion: 'Unidad', precio: 30, nivelMinimo: 3 },
  { nombre: 'Jaula para Cuyes con Base Alta', marca: 'Genérica', categoria: 'Cuyes/Conejos', tipo: 'Vivienda', unidadMedida: '80x50 cm', presentacion: 'Unidad', precio: 120, nivelMinimo: 2 },
  // LOROS/AVES
  { nombre: 'Comedero de Cerámica Pesado', marca: 'Living World', categoria: 'Loros/Aves', tipo: 'Comedero', unidadMedida: '250 ml', presentacion: 'Unidad', precio: 18, nivelMinimo: 5 },
  { nombre: 'Bañera Externa para Canarios', marca: 'Trixie', categoria: 'Loros/Aves', tipo: 'Higiene', unidadMedida: 'Pequeña', presentacion: 'Unidad', precio: 15, nivelMinimo: 5 },
  { nombre: 'Nido de Madera para Periquitos', marca: 'Artesanal', categoria: 'Loros/Aves', tipo: 'Reproducción', unidadMedida: 'Mediano', presentacion: 'Unidad', precio: 12, nivelMinimo: 5 },
]

const medicamentos = [
  // PERROS
  { nombre: 'Simparica Antipulgas Garrapatas', marca: 'Zoetis', categoria: 'Perros', tipo: 'Antiparasitario', unidadMedida: '1 Tableta 20-40kg', presentacion: 'Caja', precio: 65, nivelMinimo: 5 },
  { nombre: 'Canatox Protector Hepático', marca: 'Laboratorios Pets', categoria: 'Perros', tipo: 'Suplemento', unidadMedida: 'Frasco 60 ml', presentacion: 'Frasco', precio: 35, nivelMinimo: 5 },
  { nombre: 'Amoxicilina Ácido Clavulánico', marca: 'Genérico Vet', categoria: 'Perros', tipo: 'Antibiótico', unidadMedida: 'Caja 10 tabletas', presentacion: 'Caja', precio: 45, nivelMinimo: 5 },
  // GATOS
  { nombre: 'Profender Pipeta Interna', marca: 'Bayer', categoria: 'Gatos', tipo: 'Antiparasitario', unidadMedida: '1 Pipeta 0.5-2.5kg', presentacion: 'Caja', precio: 48, nivelMinimo: 5 },
  { nombre: 'Mirrapel Gatos Pelo y Piel', marca: 'Combi', categoria: 'Gatos', tipo: 'Suplemento', unidadMedida: 'Frasco 120 ml', presentacion: 'Frasco', precio: 42, nivelMinimo: 5 },
  { nombre: 'Doxiciclina Tabletas', marca: 'Movet', categoria: 'Gatos', tipo: 'Antibiótico', unidadMedida: 'Blíster 10 tabletas', presentacion: 'Blíster', precio: 25, nivelMinimo: 5 },
  // GALLINAS/POLLOS/PATOS
  { nombre: 'Coccigan Control Coccidiosis', marca: 'Montana', categoria: 'Gallinas/Pollos/Patos', tipo: 'Antiparasitario', unidadMedida: 'Sobre 100 g', presentacion: 'Sobre', precio: 18, nivelMinimo: 5 },
  { nombre: 'Promotor L Vitaminas Aminoácidos', marca: 'Calier', categoria: 'Gallinas/Pollos/Patos', tipo: 'Suplemento', unidadMedida: 'Frasco 1 L', presentacion: 'Frasco', precio: 95, nivelMinimo: 3 },
  { nombre: 'Yodo Agrícola Desinfectante', marca: 'Agrovet Market', categoria: 'Gallinas/Pollos/Patos', tipo: 'Desinfectante', unidadMedida: 'Frasco 1 L', presentacion: 'Frasco', precio: 30, nivelMinimo: 3 },
  // CUYES/CONEJOS
  { nombre: 'Cuyevit Multivitamínico', marca: 'Montana', categoria: 'Cuyes/Conejos', tipo: 'Suplemento', unidadMedida: 'Frasco 100 ml', presentacion: 'Frasco', precio: 22, nivelMinimo: 5 },
  { nombre: 'Enrofloxacina 10% Oral', marca: 'Agrovet Market', categoria: 'Cuyes/Conejos', tipo: 'Antibiótico', unidadMedida: 'Frasco 50 ml', presentacion: 'Frasco', precio: 15, nivelMinimo: 5 },
  { nombre: 'Fenbendazol Suspensión', marca: 'Genérica', categoria: 'Cuyes/Conejos', tipo: 'Antiparasitario', unidadMedida: 'Frasco 100 ml', presentacion: 'Frasco', precio: 20, nivelMinimo: 5 },
  // LOROS/AVES
  { nombre: 'Vita-Aves Complejo Vitamínico', marca: 'Montana', categoria: 'Loros/Aves', tipo: 'Suplemento', unidadMedida: 'Gotero 30 ml', presentacion: 'Gotero', precio: 12, nivelMinimo: 5 },
  { nombre: 'Antiasmático para Aves', marca: 'Lab. Veterinario', categoria: 'Loros/Aves', tipo: 'Antibiótico', unidadMedida: 'Gotero 15 ml', presentacion: 'Gotero', precio: 14, nivelMinimo: 5 },
  { nombre: 'Sarnavet Spray Ácaros', marca: 'Genérico', categoria: 'Loros/Aves', tipo: 'Antiparasitario', unidadMedida: 'Frasco 100 ml', presentacion: 'Frasco', precio: 18, nivelMinimo: 5 },
]

async function seedEquipamientoMedicamentos() {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) throw new Error('MONGO_URI no definida en .env')

    await mongoose.connect(mongoUri)
    console.log('✅ MongoDB conectado')

    const cats = await Categoria.find()
    const catMap: Record<string, any> = {}
    cats.forEach(c => catMap[c.nombre] = c._id)

    let creados = 0
    let omitidos = 0

    console.log('\n🔧 Equipamiento:')
    for (const p of equipamiento) {
      const existe = await Producto.findOne({ nombre: p.nombre, marca: p.marca })
      if (existe) { console.log(`  - Omitido: ${p.nombre}`); omitidos++; continue }
      await Producto.create({ ...p, categoria: catMap[p.categoria], tipoProducto: 'equipamiento', activo: true })
      console.log(`  + Creado: ${p.nombre}`)
      creados++
    }

    console.log('\n💊 Medicamentos:')
    for (const p of medicamentos) {
      const existe = await Producto.findOne({ nombre: p.nombre, marca: p.marca })
      if (existe) { console.log(`  - Omitido: ${p.nombre}`); omitidos++; continue }
      await Producto.create({ ...p, categoria: catMap[p.categoria], tipoProducto: 'medicamento', activo: true })
      console.log(`  + Creado: ${p.nombre}`)
      creados++
    }

    console.log(`\n📊 Resumen:`)
    console.log(`  Creados:  ${creados}`)
    console.log(`  Omitidos: ${omitidos}`)

    await mongoose.disconnect()
    console.log('✅ Desconectado')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedEquipamientoMedicamentos()