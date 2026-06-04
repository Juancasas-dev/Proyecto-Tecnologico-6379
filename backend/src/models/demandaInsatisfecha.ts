import mongoose, { Schema } from 'mongoose'

const demandaSchema = new mongoose.Schema({
  producto:         { type: String, required: true },
  productoRef:      { type: Schema.Types.ObjectId, ref: 'Producto', default: null },
  categoria:        { type: String },
  stockActual:      { type: Number, default: 0 },
  vecessolicitado:  { type: Number, default: 1 },
  registradoPor:    { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
  atendido:         { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('DemandaInsatisfecha', demandaSchema)