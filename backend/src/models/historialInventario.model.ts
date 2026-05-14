import { Schema, model, Document } from 'mongoose'

export interface IHistorial extends Document {
  productoId: Schema.Types.ObjectId
  tipo: 'ingreso' | 'ajuste' | 'venta'
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  usuarioId: Schema.Types.ObjectId
  fecha: Date
  observaciones?: string
}

const HistorialSchema = new Schema<IHistorial>({
  productoId:    { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  tipo:          { type: String, enum: ['ingreso', 'ajuste', 'venta'], required: true },
  cantidad:      { type: Number, required: true },
  stockAnterior: { type: Number, required: true },
  stockNuevo:    { type: Number, required: true },
  usuarioId:     { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fecha:         { type: Date, default: Date.now },
  observaciones: { type: String }
}, { timestamps: true })

export const HistorialInventario = model<IHistorial>('HistorialInventario', HistorialSchema)