import { Schema, model, Document } from 'mongoose'

interface IProductoVenta {
  producto: Schema.Types.ObjectId
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface IVenta extends Document {
  items: IProductoVenta[]
  total: number
  tipoPago: 'efectivo' | 'transferencia'
  numeroBoleta?: string
  vendedor: Schema.Types.ObjectId
  fecha: Date
  estado: 'completada' | 'anulada'
}

const ProductoVentaSchema = new Schema<IProductoVenta>({
  producto:       { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  nombre:         { type: String, required: true },
  cantidad:       { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  subtotal:       { type: Number, required: true }
}, { _id: false })

const VentaSchema = new Schema<IVenta>({
  items:        { type: [ProductoVentaSchema], required: true },
  total:        { type: Number, required: true },
  tipoPago:     { type: String, enum: ['efectivo', 'transferencia'], required: true },
    numeroBoleta: { type: String, required: true, maxlength: 20 },
  vendedor:     { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fecha:        { type: Date, default: Date.now },
  estado:       { type: String, enum: ['completada', 'anulada'], default: 'completada' }
}, { timestamps: true })


VentaSchema.index({ vendedor: 1 })
VentaSchema.index({ fecha: -1 })
VentaSchema.index({ 'items.producto': 1 })
VentaSchema.index({ numeroBoleta: 1 }, { unique: true })

export const Venta = model<IVenta>('Venta', VentaSchema)