import { Schema, model, Document } from 'mongoose'

export interface IProducto extends Document {
  nombre: string
  marca: string
  categoria: Schema.Types.ObjectId
  tipo: string
  tipoProducto: 'alimento' | 'medicamento' | 'equipamiento'
  precio: number
  unidadMedida: string
  presentacion: string
  nivelMinimo: number
  stock: number 
  activo: boolean
  creadoPor: Schema.Types.ObjectId | null
}

const ProductoSchema = new Schema<IProducto>({
  nombre:       { type: String, required: true },
  marca:        { type: String, required: true },
  categoria:    { type: Schema.Types.ObjectId, ref: 'Categoria', required: true },
  tipo:         { type: String, required: true },
  tipoProducto: { type: String, enum: ['alimento', 'medicamento', 'equipamiento'], default: 'alimento' },
  precio:       { type: Number, required: true },
  unidadMedida: { type: String, required: true },
  presentacion: { type: String, required: true },
  nivelMinimo:  { type: Number, default: 0 },
  stock:          { type: Number, default: 0 },
  activo:       { type: Boolean, default: true },
  creadoPor:    { type: Schema.Types.ObjectId, ref: 'Usuario', default: null }
}, { timestamps: true })

ProductoSchema.index({ nombre: 1, marca: 1, presentacion: 1 }, { unique: true })

export const Producto = model<IProducto>('Producto', ProductoSchema)