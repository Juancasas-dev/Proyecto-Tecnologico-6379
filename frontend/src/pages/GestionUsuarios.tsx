import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Usuario {
  _id: string
  nombre: string
  username: string
  email: string
  rol: 'vendedor' | 'dueño' | 'admin'
  activo: boolean
  bloqueado: boolean
  debeCambiarContrasena: boolean
  createdAt: string
}

const API = 'http://localhost:3000/api'

const getToken = () => localStorage.getItem('token')

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    username: '',
    email: '',
    password: '',
    rol: 'vendedor'
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const headers = { Authorization: `Bearer ${getToken()}` }

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${API}/usuarios`, { headers })
      setUsuarios(data)
    } catch {
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      await axios.post(`${API}/usuarios`, form, { headers })
      setModalAbierto(false)
      setForm({ nombre: '', username: '', email: '', password: '', rol: 'vendedor' })
      cargarUsuarios()
    } catch (error: any) {
      setFormError(error.response?.data?.mensaje || 'Error al crear usuario')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEstado = async (id: string, activo: boolean) => {
    try {
      await axios.patch(`${API}/usuarios/${id}/estado`, { activo }, { headers })
      cargarUsuarios()
    } catch {
      alert('Error al cambiar estado')
    }
  }

  const handleDesbloquear = async (id: string) => {
    try {
      await axios.patch(`${API}/usuarios/${id}/desbloquear`, {}, { headers })
      cargarUsuarios()
    } catch {
      alert('Error al desbloquear usuario')
    }
  }

  const rolColor = (rol: string) => {
    if (rol === 'dueño') return 'bg-primary/10 text-primary'
    if (rol === 'vendedor') return 'bg-success/10 text-success'
    return 'bg-warning/10 text-warning'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground text-sm">Administra los accesos al sistema</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis transition"
        >
          <Icon icon="solar:user-plus-linear" height={18} />
          Nuevo usuario
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      ) : error ? (
        <div className="bg-error/10 text-error rounded-lg p-4 text-sm">{error}</div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Usuario</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Rol</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.nombre}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${rolColor(u.rol)}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${
                        u.activo ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                      }`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      {u.bloqueado && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium w-fit bg-warning/10 text-warning">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEstado(u._id, !u.activo)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          u.activo
                            ? 'border-error text-error hover:bg-error/10'
                            : 'border-success text-success hover:bg-success/10'
                        }`}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      {u.bloqueado && (
                        <button
                          onClick={() => handleDesbloquear(u._id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-warning text-warning hover:bg-warning/10 transition"
                        >
                          Desbloquear
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-foreground">Nuevo Usuario</h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>

            <form onSubmit={handleCrear} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-foreground mb-1 block">Nombre</label>
                <input
                  type="text"
                  placeholder="Juan García"
                  value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border border-border bg-transparent text-foreground focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-sm text-foreground mb-1 block">Username</label>
                <input
                  type="text"
                  placeholder="juangarcia"
                  value={form.username}
                  onChange={e => setForm({...form, username: e.target.value})}
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border border-border bg-transparent text-foreground focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-sm text-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  placeholder="juan@sivweb.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border border-border bg-transparent text-foreground focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-sm text-foreground mb-1 block">Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border border-border bg-transparent text-foreground focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-sm text-foreground mb-1 block">Rol</label>
                <select
                  value={form.rol}
                  onChange={e => setForm({...form, rol: e.target.value})}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border border-border bg-card text-foreground focus:border-primary transition"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="dueño">Dueño</option>
                </select>
              </div>

              {formError && (
                <p className="text-error text-sm text-center">{formError}</p>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis disabled:opacity-50 transition mt-1"
              >
                {formLoading ? 'Creando...' : 'Crear usuario'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}