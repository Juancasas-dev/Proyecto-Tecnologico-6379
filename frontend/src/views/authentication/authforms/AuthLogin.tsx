import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { loginService } from '../../../services/auth.service'

const AuthLogin = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginService(username, password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))

      if (data.usuario.rol === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (error: any) {
    const mensaje = error.response?.data?.mensaje || 'Usuario o contraseña incorrectos'
     setError(mensaje)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mt-6" onSubmit={handleSubmit}>
      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="username" style={{ color: '#ffffff' }}>Usuario</Label>
        </div>
        <Input
          id="username"
          type="text"
          placeholder="Ingrese su usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="password" style={{ color: '#ffffff' }}>Contraseña</Label>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-between my-5">
        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="font-normal cursor-pointer"
            style={{ color: '#ffffff' }}>
            Recordar dispositivo
          </Label>
        </div>
        <Link to="/auth/forgot-password" className="text-sm font-medium"
          style={{ color: '#5d87ff' }}>
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}

      <Button type="submit" className="w-full h-12 rounded-lg font-semibold text-white"
        style={{ background: '#5d87ff' }} disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  )
}

export default AuthLogin