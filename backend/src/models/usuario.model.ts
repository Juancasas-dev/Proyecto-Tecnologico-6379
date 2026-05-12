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
  activo:          { type: Boolean, default: true },
  intentosFallidos:{ type: Number,  default: 0 },
  bloqueado:       { type: Boolean, default: false },
  fechaBloqueo:    { type: Date,    default: null }
}, { timestamps: true })

export const Usuario = model<IUsuario>('Usuario', UsuarioSchema)