import { Schema, model, Document, Types } from 'mongoose'


export interface IAuditoria extends Document {
  usuarioModificadoId: Types.ObjectId
  accion: 'EDICION_PERFIL' | 'DESACTIVACION' | 'ACTIVACION'
  camposAlterados: Record<string, any>
  adminResponsableId: Types.ObjectId
  fechaHora: Date
}

const AuditoriaSchema = new Schema<IAuditoria>({
  usuarioModificadoId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: {
    type: String,
    enum: ['EDICION_PERFIL', 'DESACTIVACION', 'ACTIVACION'],
    required: true
  },
  camposAlterados: { type: Schema.Types.Mixed, required: true },
  adminResponsableId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaHora: { type: Date, default: Date.now }
})

export const Auditoria = model<IAuditoria>('Auditoria', AuditoriaSchema)