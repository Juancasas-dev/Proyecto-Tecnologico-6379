import { Schema, model, Document } from 'mongoose'

export interface IProveedor extends Document {
  nombre: string
  ruc: string
  telefono?: string
  direccion?: string
  activo: boolean
}

const ProveedorSchema = new Schema<IProveedor>({
  nombre:    { type: String, required: true, trim: true },
  ruc:       { type: String, required: true, unique: true, trim: true },
  telefono:  { type: String, default: '' },
  direccion: { type: String, default: '' },
  activo:    { type: Boolean, default: true }
}, { timestamps: true })

ProveedorSchema.index({ nombre: 'text', ruc: 'text' })

export const Proveedor = model<IProveedor>('Proveedor', ProveedorSchema)