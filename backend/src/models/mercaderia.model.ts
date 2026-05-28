import { Schema, model, Document } from 'mongoose'

export interface IMercaderia extends Document {
  producto: Schema.Types.ObjectId
  cantidad: number
  cantidadRestante: number
  fechaIngreso: Date
  fechaVencimiento: Date
  creadoPor: Schema.Types.ObjectId | null
}

const MercaderiaSchema = new Schema<IMercaderia>({
  producto: {
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },

  cantidad: {
    type: Number,
    required: true,
    min: 1
  },

 
  cantidadRestante: {
    type: Number,
    required: true
  },

  fechaIngreso: {
    type: Date,
    required: true,
    default: Date.now
  },

  fechaVencimiento: {
  type: Date,
  required: false,
  default: null
},

  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  }
}, { timestamps: true })

export const Mercaderia = model<IMercaderia>(
  'Mercaderia',
  MercaderiaSchema
)