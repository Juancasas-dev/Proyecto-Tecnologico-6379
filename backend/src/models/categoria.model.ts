import { Schema, model, Document } from 'mongoose'

export interface ICategoria extends Document {
  nombre: string
  descripcion?: string
  activo: boolean
}

const CategoriaSchema = new Schema<ICategoria>({
  nombre:      { type: String, required: true, unique: true },
  descripcion: { type: String },
  activo:      { type: Boolean, default: true }
}, { timestamps: true })

export const Categoria = model<ICategoria>('Categoria', CategoriaSchema)