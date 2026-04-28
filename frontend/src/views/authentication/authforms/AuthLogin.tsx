import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { loginService } from '../../../services/auth.service'

const AuthLogin = () => {
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
    <form className="mt-6" onSubmit={handleSubmit}>
      <div className="mb-4">
        <div className="mb-2 block">
         <Label htmlFor="email" style={{color: '#ffffff'}}>Correo electrónico</Label>
        </div>
        <Input
          id="email"
          type="email"
          placeholder="admin@sivweb.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="password" style={{color: '#ffffff'}}>Contraseña</Label>
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
       <Label htmlFor="remember" className="font-normal cursor-pointer" style={{color: '#ffffff'}}>
        Recordar dispositivo
        </Label>
        </div>
        <Link to="/" className="text-sm font-medium" style={{color: '#5d87ff'}}>
        ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center mb-4">{error}</p>
      )}

     <Button 
    type="submit" 
    className="w-full h-12 rounded-lg font-semibold text-white" 
    style={{background: '#5d87ff'}}
    disabled={loading}>
  {loading ? 'Ingresando...' : 'Ingresar'}
    </Button>
    </form>
  )
}

export default AuthLogin