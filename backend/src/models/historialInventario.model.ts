import { Schema, model, Document } from 'mongoose'

export interface IHistorial extends Document {
  productoId: Schema.Types.ObjectId
  tipo: 'ingreso' | 'ajuste' | 'venta' | 'ajuste_entrada' | 'ajuste_salida'
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  usuarioId: Schema.Types.ObjectId
  fecha: Date
  observaciones?: string
  causa?: string              
  valorEconomico?: number     
}

const HistorialSchema = new Schema<IHistorial>({
  productoId:    { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  tipo: { type: String, enum: ['ingreso', 'ajuste', 'venta', 'ajuste_entrada', 'ajuste_salida'], required: true },
  cantidad:      { type: Number, required: true },
  stockAnterior: { type: Number, required: true },
  stockNuevo:    { type: Number, required: true },
  usuarioId:     { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fecha:         { type: Date, default: Date.now },
  observaciones: { type: String },
  causa: {
    type: String,
    enum: ['Merma', 'Robo o hurto', 'Producto vencido', 'Error de conteo',
           'Otra', 'Stock encontrado no registrado', 'Devolución de cliente'],
    default: null
  },
  valorEconomico: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

export const HistorialInventario = model<IHistorial>('HistorialInventario', HistorialSchema)