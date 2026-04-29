import { Link } from 'react-router-dom'
import AuthLogin from './authforms/AuthLogin'

const Login = () => {
  return (
    <div className="relative overflow-hidden h-screen bg-lightprimary dark:bg-darkprimary">
      <div className="flex h-full justify-center items-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg md:w-[450px] w-full p-8">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">SIVWEB</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ingresa con tu cuenta
            </p>
          </div>

          <AuthLogin />

          <div className="flex gap-2 text-sm mt-6 items-center justify-center">
            <p className="text-foreground font-semibold">¿No tienes cuenta?</p>
            <Link to="/auth/register" className="text-primary font-medium">
              Crear cuenta
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Login