import { Schema, model, Document } from 'mongoose'

export interface IUsuario extends Document {
  nombre: string
  username: string
  email: string
  telefono: string | null
  password: string
  rol: 'vendedor' | 'dueño' | 'admin'
  activo: boolean
  intentosFallidos: number
  bloqueado: boolean
  fechaBloqueo: Date | null
  creadoPor: Schema.Types.ObjectId | null
  tokenInvalidadoEn: Date | null
  debeCambiarContrasena: boolean
  resetToken: string | null        
  resetTokenExpira: Date | null
  ultimoLogout?: Date


  motivoDesactivacion: string | null
  detalleDesactivacion: string | null
  fechaDesactivacion: Date | null
  desactivadoPor: Schema.Types.ObjectId | null
}

const UsuarioSchema = new Schema<IUsuario>({
  nombre:   { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  telefono: {
    type: String,
    default: null,

    match: [/^9\d{8}$/, 'El teléfono debe tener 9 dígitos y comenzar con 9']
  },
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
  debeCambiarContrasena: { type: Boolean, default: true },
  resetToken:            { type: String,  default: null },  
  resetTokenExpira:      { type: Date,    default: null },
  ultimoLogout:          { type: Date,    default: null },

  motivoDesactivacion:  { type: String, default: null },
  detalleDesactivacion: { type: String, default: null },
  fechaDesactivacion:   { type: Date,   default: null },
  desactivadoPor:       { type: Schema.Types.ObjectId, ref: 'Usuario', default: null }
}, { timestamps: true })

export const Usuario = model<IUsuario>('Usuario', UsuarioSchema)