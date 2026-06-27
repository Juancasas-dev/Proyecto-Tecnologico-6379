import { Schema, model, Document } from 'mongoose'

export interface IBackup extends Document {
  fecha: Date
  estado: 'Exitoso' | 'Error'
  archivo: string
  mensaje: string
  creadoPor: Schema.Types.ObjectId | null
  tipo: 'manual' | 'automatico'   
}

const BackupSchema = new Schema<IBackup>({
  fecha:   { type: Date, default: Date.now },
  estado:  { type: String, enum: ['Exitoso', 'Error'], required: true },
  archivo: { type: String, default: '' },
  mensaje: { type: String, default: '' },
  creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
  tipo:    { type: String, enum: ['manual', 'automatico'], default: 'manual' } 
}, { timestamps: true })

export const Backup = model<IBackup>('Backup', BackupSchema)