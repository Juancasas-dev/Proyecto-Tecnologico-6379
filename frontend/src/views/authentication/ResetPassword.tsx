import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3000/api'

type EstadoToken = 'validando' | 'valido' | 'invalido'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [estadoToken, setEstadoToken] = useState<EstadoToken>('validando')
  const [rol, setRol] = useState<'vendedor' | 'dueño' | 'admin' | null>(null)
  const [mensajeToken, setMensajeToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const validar = async () => {
      if (!token) {
        setEstadoToken('invalido')
        setMensajeToken('Este enlace ha expirado. Por favor, solicita uno nuevo desde la pantalla de inicio de sesión.')
        return
      }
      try {
        const { data } = await axios.get(`${API}/auth/validar-token/${token}`)
        setRol(data.rol)
        setEstadoToken('valido')
      } catch (error: any) {
        setEstadoToken('invalido')
        setMensajeToken(
          error.response?.data?.mensaje ||
          'Este enlace ha expirado. Por favor, solicita uno nuevo desde la pantalla de inicio de sesión.'
        )
      }
    }
    validar()
  }, [token])

  const esAltaSeguridad = rol === 'dueño' || rol === 'admin'

  const cumpleLongitud = esAltaSeguridad ? password.length >= 10 : password.length >= 8
  const cumpleMayuscula = /[A-Z]/.test(password)
  const cumpleMinuscula = /[a-z]/.test(password)
  const cumpleNumero = /\d/.test(password)
  const cumpleEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const coincide = password === confirmar && confirmar !== ''

  const formularioValido = esAltaSeguridad
    ? cumpleLongitud && cumpleMayuscula && cumpleMinuscula && cumpleNumero && cumpleEspecial && coincide
    : cumpleLongitud && cumpleMayuscula && cumpleNumero && coincide

  const guardar = async () => {
    setGuardando(true)
    setMensaje('')
    try {
      const { data } = await axios.post(`${API}/auth/reset-password`, { token, password })
      // Éxito — redirigir al login con mensaje
      navigate('/login?reset=true')
    } catch (error: any) {
      const msg = error.response?.data?.mensaje || 'Error al cambiar contraseña'
      setMensaje(msg)
      if (msg.includes('expirado')) {
        setEstadoToken('invalido')
        setMensajeToken(msg)
      }
    } finally {
      setGuardando(false)
    }
  }

  // Validando token
  if (estadoToken === 'validando') {
    return (
      <div className="relative overflow-hidden h-screen bg-lightprimary dark:bg-darkprimary">
        <div className="flex h-full justify-center items-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Validando enlace...</p>
          </div>
        </div>
      </div>
    )
  }

  // Token inválido o expirado
  if (estadoToken === 'invalido') {
    return (
      <div className="relative overflow-hidden h-screen bg-lightprimary dark:bg-darkprimary">
        <div className="flex h-full justify-center items-center px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg md:w-[450px] w-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Enlace no disponible</h2>
            <p className="text-error text-sm mb-6">{mensajeToken}</p>
            <Link to="/auth/forgot-password"
              className="inline-block w-full h-11 rounded-lg font-semibold text-white text-sm flex items-center justify-center"
              style={{ background: '#5d87ff' }}>
              Solicitar nuevo enlace
            </Link>
            <Link to="/login" className="mt-4 text-sm block text-center" style={{ color: '#5d87ff' }}>
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Formulario válido
  return (
    <div className="relative overflow-hidden h-screen bg-lightprimary dark:bg-darkprimary">
      <div className="flex h-full justify-center items-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg md:w-[480px] w-full p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">SIVWEB</h1>
            <p className="text-foreground font-medium mt-1">Restablecer contraseña</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-foreground mb-1 block">Nueva contraseña</label>
              <input type="password" placeholder="Nueva contraseña"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
            </div>

            <div>
              <label className="text-sm text-foreground mb-1 block">Confirmar contraseña</label>
              <input type="password" placeholder="Confirmar contraseña"
                value={confirmar} onChange={e => setConfirmar(e.target.value)}
                className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${
                  confirmar && !coincide ? 'border-error' : 'border-border focus:border-primary'
                }`} />
            </div>

            {/* Indicadores de requisitos */}
            <div className="bg-muted/20 rounded-lg p-3 space-y-1">
              <p className={`text-xs ${cumpleLongitud ? 'text-success' : 'text-muted-foreground'}`}>
                ✓ {esAltaSeguridad ? 'Mínimo 10 caracteres' : 'Mínimo 8 caracteres'}
              </p>
              <p className={`text-xs ${cumpleMayuscula ? 'text-success' : 'text-muted-foreground'}`}>
                ✓ Una mayúscula
              </p>
              {esAltaSeguridad && (
                <p className={`text-xs ${cumpleMinuscula ? 'text-success' : 'text-muted-foreground'}`}>
                  ✓ Una minúscula
                </p>
              )}
              <p className={`text-xs ${cumpleNumero ? 'text-success' : 'text-muted-foreground'}`}>
                ✓ Un número
              </p>
              {esAltaSeguridad && (
                <p className={`text-xs ${cumpleEspecial ? 'text-success' : 'text-muted-foreground'}`}>
                  ✓ Un carácter especial (!@#$%...)
                </p>
              )}
              {confirmar && (
                <p className={`text-xs ${coincide ? 'text-success' : 'text-error'}`}>
                  {coincide ? '✓ Las contraseñas coinciden' : 'Las contraseñas ingresadas no coinciden.'}
                </p>
              )}
            </div>

            {mensaje && (
              <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3">
                <p className="text-error text-sm">{mensaje}</p>
              </div>
            )}

            <button onClick={guardar}
              disabled={!formularioValido || guardando}
              className="w-full h-11 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition"
              style={{ background: '#5d87ff' }}>
              {guardando ? 'Guardando...' : 'Guardar contraseña'}
            </button>

            <Link to="/login" className="text-sm text-center" style={{ color: '#5d87ff' }}>
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}