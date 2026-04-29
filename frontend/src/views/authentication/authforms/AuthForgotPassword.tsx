import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

const AuthForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEnviado(true)
  }

  return (
    <form className="mt-6" onSubmit={handleSubmit}>
      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="emadd" style={{color: '#ffffff'}}>Correo electrónico</Label>
        </div>
        <Input id="emadd" type="email" placeholder="juan@sivweb.com"
          value={email} onChange={e => setEmail(e.target.value)} required />
      </div>

      {enviado && (
        <p className="text-green-400 text-sm text-center mb-4">
          Si el correo existe recibirás un enlace pronto
        </p>
      )}

      <Button type="submit" className="w-full h-12 rounded-lg font-semibold text-white"
        style={{background: '#5d87ff'}}>
        Enviar enlace
      </Button>
    </form>
  )
}

export default AuthForgotPassword