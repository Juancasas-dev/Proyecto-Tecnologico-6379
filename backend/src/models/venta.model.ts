import { Schema, model, Document } from 'mongoose'

interface IProductoVenta {
    producto: Schema.Types.ObjectId
    nombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
}

interface IHistorialVenta {
    accion: string
    usuario: Schema.Types.ObjectId
    fecha: Date
    motivo: string
}

export interface IVenta extends Document {
    items: IProductoVenta[]
    total: number
    tipoPago: 'efectivo' | 'transferencia'
    numeroBoleta?: string
    vendedor: Schema.Types.ObjectId
    fecha: Date
    estado: 'completada' | 'anulada' | 'modificada'
    motivo?: string
    fechaAnulacion?: Date
    fechaModificacion?: Date
    usuarioAccion?: Schema.Types.ObjectId
    historial: IHistorialVenta[]
}

const ProductoVentaSchema = new Schema<IProductoVenta>({
    producto:       { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombre:         { type: String, required: true },
    cantidad:       { type: Number, required: true },
    precioUnitario: { type: Number, required: true },
    subtotal:       { type: Number, required: true }
}, { _id: false })

const HistorialVentaSchema = new Schema<IHistorialVenta>({
    accion:  { type: String, required: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fecha:   { type: Date, default: Date.now },
    motivo:  { type: String, default: '' }
}, { _id: false })

const VentaSchema = new Schema<IVenta>({
    items:            { type: [ProductoVentaSchema], required: true },
    total:            { type: Number, required: true },
    tipoPago:         { type: String, enum: ['efectivo', 'transferencia'], required: true },
    numeroBoleta:     { type: String, default: null },  
    vendedor:         { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha:            { type: Date, default: Date.now },
    estado:           { type: String, enum: ['completada', 'anulada', 'modificada'], default: 'completada' },
    motivo:           { type: String, default: '' },
    fechaAnulacion:   { type: Date },
    fechaModificacion:{ type: Date },
    usuarioAccion:    { type: Schema.Types.ObjectId, ref: 'Usuario' },
    historial:        { type: [HistorialVentaSchema], default: [] }
}, { timestamps: true })

VentaSchema.index({ vendedor: 1 })
VentaSchema.index({ fecha: -1 })
VentaSchema.index({ estado: 1 })
VentaSchema.index({ 'items.producto': 1 })
VentaSchema.index({ numeroBoleta: 1 }, { unique: true, sparse: true })

export const Venta = model<IVenta>('Venta', VentaSchema)