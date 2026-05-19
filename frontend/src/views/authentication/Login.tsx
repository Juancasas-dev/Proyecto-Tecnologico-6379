import AuthLogin from './authforms/AuthLogin'

const Login = () => {
  return (
    <div className="relative overflow-hidden h-screen bg-lightprimary dark:bg-darkprimary">
      <div className="flex h-full justify-center items-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg md:w-[450px] w-full p-8">

          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 mb-2">
              <img src="/logo.png" alt="SIVWEB" className="w-20 h-16 object-contain" />
              <h1 className="text-3xl font-bold text-primary">SIVWEB</h1>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Ingresa con tu cuenta
            </p>
          </div>

          <AuthLogin />

        </div>
      </div>
    </div>
  )
}

export default Login