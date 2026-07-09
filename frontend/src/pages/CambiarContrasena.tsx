import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('token')

export default function CambiarContrasena() {
  const navigate = useNavigate()
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [contador, setContador] = useState(5)

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  // ─── Indicadores de requisitos ────────────────────────────────────────
  const cumpleLongitud = nuevaContrasena.length >= 8
  const cumpleMayuscula = /[A-Z]/.test(nuevaContrasena)
  const cumpleNumero = /\d/.test(nuevaContrasena)
  const coincide = nuevaContrasena === confirmar && confirmar !== ''
  const formularioValido = cumpleLongitud && cumpleMayuscula && cumpleNumero && coincide
  // ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!exito) return
    if (contador === 0) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      navigate('/login')
      return
    }
    const timer = setTimeout(() => setContador(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [exito, contador, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formularioValido) return
    setLoading(true)
    try {
      await axios.post(
        `${API}/auth/cambiar-contrasena`,
        { nuevaContrasena },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      setExito(true)
    } catch (error: any) {
      setError(error.response?.data?.mensaje || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden h-screen" style={{ background: '#1e2a3a' }}>
      <div className="flex h-full justify-center items-center px-4">
        <div className="rounded-2xl shadow-lg md:w-[450px] w-full p-8"
          style={{ background: '#253347', border: '1px solid #3a4f6e' }}>

          {exito ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">¡Contraseña actualizada!</h2>
              <p className="text-gray-400 text-sm mb-6">Tu contraseña ha sido cambiada exitosamente.</p>
              <div className="bg-primary/10 rounded-lg p-4 mb-6">
                <p className="text-primary text-sm">
                  Serás redirigido al login en <strong>{contador}</strong> segundos...
                </p>
                <div className="w-full bg-primary/20 rounded-full h-1.5 mt-3">
                  <div className="bg-primary h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(contador / 5) * 100}%` }} />
                </div>
              </div>
              <button onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('usuario')
                navigate('/login')
              }} className="text-primary text-sm hover:underline">
                Ir al login ahora →
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold" style={{ color: '#5d87ff' }}>SIVWEB</h1>
                <p className="text-white font-medium mt-2">Cambiar contraseña</p>
                <p className="text-gray-400 text-sm mt-1">
                  Hola <strong className="text-white">{usuario.nombre}</strong>,
                  debes cambiar tu contraseña antes de continuar.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm mb-1 block" style={{ color: '#ffffff' }}>
                    Nueva contraseña
                  </label>
                  <input type="password" placeholder="Mínimo 8 caracteres"
                    value={nuevaContrasena}
                    onChange={e => setNuevaContrasena(e.target.value)}
                    required
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border transition"
                    style={{ background: '#1a2535', border: '1px solid #2e4060', color: '#ffffff' }} />
                </div>

                <div>
                  <label className="text-sm mb-1 block" style={{ color: '#ffffff' }}>
                    Confirmar contraseña
                  </label>
                  <input type="password" placeholder="Repite tu nueva contraseña"
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    required
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border transition"
                    style={{
                      background: '#1a2535',
                      border: confirmar && !coincide ? '1px solid #f44336' : '1px solid #2e4060',
                      color: '#ffffff'
                    }} />
                </div>

                {/* ─── Indicadores visuales ─────────────────────────── */}
                <div className="rounded-lg p-3 space-y-1"
                  style={{ background: '#1a2535', border: '1px solid #2e4060' }}>
                  <p className={`text-xs ${cumpleLongitud ? 'text-green-400' : 'text-gray-500'}`}>
                    ✓ Mínimo 8 caracteres
                  </p>
                  <p className={`text-xs ${cumpleMayuscula ? 'text-green-400' : 'text-gray-500'}`}>
                    ✓ Una mayúscula
                  </p>
                  <p className={`text-xs ${cumpleNumero ? 'text-green-400' : 'text-gray-500'}`}>
                    ✓ Un número
                  </p>
                  {confirmar && (
                    <p className={`text-xs ${coincide ? 'text-green-400' : 'text-red-400'}`}>
                      {coincide ? '✓ Las contraseñas coinciden' : 'Las contraseñas ingresadas no coinciden.'}
                    </p>
                  )}
                </div>
                {/* ──────────────────────────────────────────────────── */}

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <button type="submit"
                  disabled={loading || !formularioValido}
                  className="w-full h-11 rounded-lg font-semibold text-white text-sm disabled:opacity-50 transition mt-1"
                  style={{ background: '#5d87ff' }}>
                  {loading ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}