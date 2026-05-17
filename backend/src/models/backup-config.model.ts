import { Schema, model, Document } from 'mongoose'

export interface IBackupConfig extends Document {
  frecuencia: 'diario' | 'semanal'
  hora: string
  activo: boolean
  proximoRespaldo?: Date
  actualizadoPor?: string
}

const BackupConfigSchema = new Schema<IBackupConfig>(
  {
    frecuencia: {
      type: String,
      enum: ['diario', 'semanal'],
      default: 'diario'
    },

    hora: {
      type: String,
      default: '02:00'
    },

    activo: {
      type: Boolean,
      default: true
    },

    proximoRespaldo: {
      type: Date,
      default: null
    },

    actualizadoPor: {
      type: String,
      default: 'Sistema'
    }
  },
  {
    timestamps: true
  }
)

export const BackupConfig = model<IBackupConfig>(
  'BackupConfig',
  BackupConfigSchema
)