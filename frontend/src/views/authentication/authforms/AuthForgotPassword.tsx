import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import axios from 'axios'

const API = 'http://localhost:3000/api'

const AuthForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensaje('')
    try {
      const { data } = await axios.post(`${API}/auth/olvide-password`, { email })
      setMensaje(data.mensaje)
      setEnviado(true)
    } catch (error: any) {
      setMensaje(error.response?.data?.mensaje || 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mt-6" onSubmit={handleSubmit}>
      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="emadd" style={{ color: '#ffffff' }}>Correo electrónico</Label>
        </div>
        <Input id="emadd" type="email" placeholder="juan@gmail.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={enviado} />
      </div>

      {mensaje && (
        <div className="bg-success/10 border border-success/20 rounded-lg px-4 py-3 mb-4">
          <p className="text-success text-sm text-center">{mensaje}</p>
        </div>
      )}

      <Button type="submit"
        disabled={loading || enviado}
        className="w-full h-12 rounded-lg font-semibold text-white"
        style={{ background: enviado ? '#888' : '#5d87ff' }}>
        {loading ? 'Enviando...' : enviado ? 'Enlace enviado' : 'Enviar enlace'}
      </Button>

      {enviado && (
        <button type="button"
          onClick={() => { setEnviado(false); setMensaje(''); setEmail('') }}
          className="mt-4 text-sm text-center w-full"
          style={{ color: '#5d87ff' }}>
          Intentar con otro correo
        </button>
      )}
    </form>
  )
}

export default AuthForgotPassword