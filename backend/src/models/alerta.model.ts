import { Schema, model, Document } from 'mongoose'

export interface IAlerta extends Document {
  producto: any
  mercaderia: any
  stockActual: number
  nivelMinimo: number
  tipo: 'stock_bajo' | 'proximo_vencer' | 'vencido'
  activa: boolean
  atendidaPor: any
  fechaAtencion: Date | null
}

const AlertaSchema = new Schema<IAlerta>({
  producto: {
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  mercaderia: {
    type: Schema.Types.ObjectId,
    ref: 'Mercaderia',
    default: null          
  },
  stockActual: { type: Number, required: true },
  nivelMinimo:  { type: Number, required: true },
  tipo: {
    type: String,
    enum: ['stock_bajo', 'proximo_vencer', 'vencido'],
    default: 'stock_bajo'
  },
  activa: { type: Boolean, default: true },
  atendidaPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  fechaAtencion: {
    type: Date,
    default: null
  }
}, { timestamps: true })

export const Alerta = model<IAlerta>('Alerta', AlertaSchema)