import { Schema, model, Document } from 'mongoose'

export interface IUsuario extends Document {
  nombre: string
  username: string
  email: string
  password: string
  rol: 'vendedor' | 'dueño' | 'admin'
  activo: boolean
  intentosFallidos: number
  bloqueado: boolean
  fechaBloqueo: Date | null
  creadoPor: Schema.Types.ObjectId | null
  tokenInvalidadoEn: Date | null
  debeCambiarContrasena: boolean
}

const UsuarioSchema = new Schema<IUsuario>({
  nombre:   { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol:      { 
    type: String, 
    enum: ['vendedor', 'dueño', 'admin'], 
    default: 'vendedor' 
  },
  activo:                { type: Boolean, default: true },
  intentosFallidos:      { type: Number,  default: 0 },
  bloqueado:             { type: Boolean, default: false },
  fechaBloqueo:          { type: Date,    default: null },
  creadoPor:             { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
  tokenInvalidadoEn:     { type: Date,    default: null },
  debeCambiarContrasena: { type: Boolean, default: true }
}, { timestamps: true })

export const Usuario = model<IUsuario>('Usuario', UsuarioSchema)