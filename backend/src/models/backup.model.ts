import { Schema, model, Document } from 'mongoose'

export interface IBackup extends Document {
  fecha: Date
  estado: 'Exitoso' | 'Error'
  archivo: string
  mensaje: string
  creadoPor: Schema.Types.ObjectId | null
}

const BackupSchema = new Schema<IBackup>({
  fecha: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['Exitoso', 'Error'],
    required: true
  },
  archivo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    default: ''
  },
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  }
}, {
  timestamps: true
})

export const Backup = model<IBackup>('Backup', BackupSchema)