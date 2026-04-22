import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginService } from '../services/auth.service'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await loginService(email, password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      navigate('/dashboard')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            Sistema de Inventario
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@inventario.com"
              required
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg py-2.5 text-sm font-medium transition mt-2"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

        </form>
      </div>
    </div>
  )
}