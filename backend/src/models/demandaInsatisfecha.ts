import mongoose from 'mongoose'

const demandaSchema = new mongoose.Schema({
  producto:    { type: String, required: true },
  categoria:   { type: String },
  stockActual: { type: Number, default: 0 },
  fecha:       { type: Date, default: Date.now },
  atendido:    { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('DemandaInsatisfecha', demandaSchema)