import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import axios from 'axios'

const AuthRegister = () => {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await axios.post('http://localhost:3000/api/auth/register', {
        nombre, email, password
      })
      navigate('/login')
    } catch {
      setError('Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mt-6" onSubmit={handleSubmit}>
      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="name" style={{color: '#ffffff'}}>Nombre</Label>
        </div>
        <Input id="name" type="text" placeholder="Juan Pérez"
          value={nombre} onChange={e => setNombre(e.target.value)} required />
      </div>
      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="emadd" style={{color: '#ffffff'}}>Correo electrónico</Label>
        </div>
        <Input id="emadd" type="email" placeholder="juan@sivweb.com"
          value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="mb-6">
        <div className="mb-2 block">
          <Label htmlFor="userpwd" style={{color: '#ffffff'}}>Contraseña</Label>
        </div>
        <Input id="userpwd" type="password" placeholder="••••••••"
          value={password} onChange={e => setPassword(e.target.value)} required />
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

      <Button type="submit" className="w-full h-12 rounded-lg font-semibold text-white"
        style={{background: '#5d87ff'}} disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </Button>
    </form>
  )
}

export default AuthRegister