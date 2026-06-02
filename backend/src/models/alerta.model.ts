import { Schema, model, Document } from 'mongoose'

export interface IAlerta extends Document {
  producto: any
  stockActual: number
  nivelMinimo: number
  tipo: 'stock_bajo' | 'proximo_vencer' | 'vencido'
  activa: boolean
}

const AlertaSchema = new Schema<IAlerta>({
  producto: {
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  stockActual: { type: Number, required: true },
  nivelMinimo:  { type: Number, required: true },
  tipo: {
    type: String,
    enum: ['stock_bajo', 'proximo_vencer', 'vencido'],
    default: 'stock_bajo'
  },
  activa: { type: Boolean, default: true }
}, { timestamps: true })

export const Alerta = model<IAlerta>('Alerta', AlertaSchema)