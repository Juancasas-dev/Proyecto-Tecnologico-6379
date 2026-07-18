import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface Usuario {
  _id: string
  nombre: string
  username: string
  email: string
  telefono?: string | null
  rol: 'vendedor' | 'dueño' | 'admin'
  activo: boolean
  bloqueado: boolean
  debeCambiarContrasena: boolean
  motivoDesactivacion?: string | null
  detalleDesactivacion?: string | null
  fechaDesactivacion?: string | null
  desactivadoPor?: { nombre: string } | null
}

const MOTIVOS_DESACTIVACION = [
  'Renuncia',
  'Despido',
  'Cuenta Comprometida',
  'Finalización de contrato',
  'Otra causa'
]

const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem('token')

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCrear, setModalCrear] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalDesactivar, setModalDesactivar] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [motivoDesactivar, setMotivoDesactivar] = useState('')
  const [detalleDesactivar, setDetalleDesactivar] = useState('')
  const [errorDesactivar, setErrorDesactivar] = useState('')
  const [emailDuplicado, setEmailDuplicado] = useState(false)

  const [form, setForm] = useState({
    nombre: '', username: '', email: '',
    telefono: '', password: '', rol: 'vendedor'
  })

  const [formEditar, setFormEditar] = useState({
    nombre: '', email: '', telefono: ''
  })

  const headers = { Authorization: `Bearer ${getToken()}` }

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${API}/usuarios`, { headers })
      setUsuarios(data)
    } catch {
      console.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarUsuarios() }, [])

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.nombre || !form.username || !form.email || !form.password) {
      setFormError('Completa todos los campos obligatorios')
      return
    }
    setFormLoading(true)
    try {
      await axios.post(`${API}/usuarios`, form, { headers })
      setModalCrear(false)
      setForm({ nombre: '', username: '', email: '', telefono: '', password: '', rol: 'vendedor' })
      cargarUsuarios()
    } catch (error: any) {
      setFormError(error.response?.data?.mensaje || 'Error al crear usuario')
    } finally {
      setFormLoading(false)
    }
  }

  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario)
    setFormEditar({
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono || ''
    })
    setFormError('')
    setEmailDuplicado(false)
    setModalEditar(true)
  }

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setEmailDuplicado(false)

    if (!formEditar.nombre.trim()) {
      setFormError('El nombre es obligatorio')
      return
    }
    if (!formEditar.email.trim()) {
      setFormError('El correo es obligatorio')
      return
    }
    if (formEditar.telefono && !/^9\d{8}$/.test(formEditar.telefono)) {
      setFormError('El teléfono debe tener 9 dígitos y comenzar con 9')
      return
    }

    setFormLoading(true)
    try {
      await axios.patch(`${API}/usuarios/${usuarioSeleccionado?._id}/editar`, {
        nombre: formEditar.nombre.trim(),
        email: formEditar.email.trim(),
        telefono: formEditar.telefono.trim() || null
      }, { headers })
      setModalEditar(false)
      cargarUsuarios()
    } catch (error: any) {
      const mensaje = error.response?.data?.mensaje || 'Error al editar usuario'
      if (error.response?.status === 409) {
        setEmailDuplicado(true)
        setFormError(mensaje)
      } else {
        setFormError(mensaje)
      }
    } finally {
      setFormLoading(false)
    }
  }

  const abrirModalDesactivar = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario)
    setMotivoDesactivar('')
    setDetalleDesactivar('')
    setErrorDesactivar('')
    setModalDesactivar(true)
  }

  const handleDesactivar = async () => {
    if (!motivoDesactivar) { setErrorDesactivar('Selecciona un motivo'); return }
    if (detalleDesactivar.trim().length < 10) { setErrorDesactivar('El detalle debe tener mínimo 10 caracteres'); return }
    if (!usuarioSeleccionado) return
    setFormLoading(true)
    try {
      await axios.patch(`${API}/usuarios/${usuarioSeleccionado._id}/estado`, {
        activo: false,
        motivoDesactivacion: motivoDesactivar,
        detalleDesactivacion: detalleDesactivar.trim()
      }, { headers })
      setModalDesactivar(false)
      cargarUsuarios()
    } catch (error: any) {
      setErrorDesactivar(error.response?.data?.mensaje || 'Error al desactivar usuario')
    } finally {
      setFormLoading(false)
    }
  }

  const handleActivar = async (usuario: Usuario) => {
    try {
      await axios.patch(`${API}/usuarios/${usuario._id}/estado`, { activo: true }, { headers })
      cargarUsuarios()
    } catch {
      alert('Error al activar usuario')
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

  const colorRol = (rol: string) => {
    if (rol === 'dueño') return 'bg-primary/10 text-primary'
    if (rol === 'admin') return 'bg-warning/10 text-warning'
    return 'bg-success/10 text-success'
  }

  const formularioDesactivarValido = motivoDesactivar !== '' && detalleDesactivar.trim().length >= 10

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground text-sm">{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={() => {
          setForm({ nombre: '', username: '', email: '', telefono: '', password: '', rol: 'vendedor' })
          setFormError('')
          setModalCrear(true)
        }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primaryemphasis transition">
          <Icon icon="solar:add-circle-linear" height={18} />
          Nuevo usuario
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Usuario</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Teléfono</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Rol</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Motivo desactivación</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario, index) => (
                <tr key={usuario._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-muted-foreground text-xs">{index + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">{usuario.nombre}</p>
                    <p className="text-xs text-muted-foreground">@{usuario.username}</p>
                    <p className="text-xs text-muted-foreground">{usuario.email}</p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-sm">
                    {usuario.telefono || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorRol(usuario.rol)}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${
                        !usuario.activo
                          ? 'bg-error/10 text-error'
                          : usuario.debeCambiarContrasena
                            ? 'bg-warning/10 text-warning'
                            : 'bg-success/10 text-success'
                      }`}>
                        {!usuario.activo ? 'Inactivo' : usuario.debeCambiarContrasena ? 'Pendiente' : 'Activo'}
                      </span>
                      {usuario.bloqueado && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-warning/10 text-warning w-fit">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {!usuario.activo && usuario.motivoDesactivacion ? (
                      <div>
                        <p className="text-xs text-error font-medium">{usuario.motivoDesactivacion}</p>
                        {usuario.detalleDesactivacion && (
                          <button
                            onClick={() => { setUsuarioSeleccionado(usuario); setModalDetalle(true) }}
                            className="text-xs text-primary hover:underline mt-0.5">
                            Ver detalle →
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* Botón editar */}
                      <button onClick={() => abrirModalEditar(usuario)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition"
                        title="Editar">
                        <Icon icon="solar:pen-new-square-linear" height={16} />
                      </button>
                      {usuario.activo ? (
                        <button onClick={() => abrirModalDesactivar(usuario)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-error/10 text-error hover:bg-error/20 transition"
                          title="Desactivar">
                          <Icon icon="solar:eye-closed-linear" height={16} />
                        </button>
                      ) : (
                        <button onClick={() => handleActivar(usuario)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-success/10 text-success hover:bg-success/20 transition"
                          title="Activar">
                          <Icon icon="solar:eye-linear" height={16} />
                        </button>
                      )}
                      {usuario.bloqueado && (
                        <button onClick={() => handleDesbloquear(usuario._id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-warning/10 text-warning hover:bg-warning/20 transition"
                          title="Desbloquear">
                          <Icon icon="solar:lock-keyhole-unlocked-linear" height={16} />
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

      {/* ─── Modal crear usuario ───────────────────────────────────────────── */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-foreground">Nuevo usuario</h2>
              <button onClick={() => setModalCrear(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>
            <form onSubmit={handleCrear} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-foreground mb-1 block">Nombre <span className="text-error">*</span></label>
                <input type="text" value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1 block">Username <span className="text-error">*</span></label>
                <input type="text" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="usuario123"
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1 block">Email <span className="text-error">*</span></label>
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@gmail.com"
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1 block">
                  Teléfono <span className="text-muted-foreground text-xs">(opcional)</span>
                </label>
                <input type="text" value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                  placeholder="9XXXXXXXX" maxLength={9}
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1 block">Contraseña temporal <span className="text-error">*</span></label>
                <input type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1 block">Rol</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-card text-foreground outline-none focus:border-primary transition">
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Admin BD</option>
                </select>
              </div>
              {formError && <p className="text-error text-sm">{formError}</p>}
              <button type="submit" disabled={formLoading}
                className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis disabled:opacity-50 transition">
                {formLoading ? 'Creando...' : 'Crear usuario'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal editar usuario ──────────────────────────────────────────── */}
      {modalEditar && usuarioSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-foreground">Editar usuario</h2>
              <button onClick={() => setModalEditar(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>
            <form onSubmit={handleEditar} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-foreground mb-1 block">Nombre <span className="text-error">*</span></label>
                <input type="text" value={formEditar.nombre}
                  onChange={e => setFormEditar({ ...formEditar, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1 block">Email <span className="text-error">*</span></label>
                <input type="email" value={formEditar.email}
                  onChange={e => { setFormEditar({ ...formEditar, email: e.target.value }); setEmailDuplicado(false) }}
                  placeholder="usuario@gmail.com"
                  className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none transition ${
                    emailDuplicado ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                  }`} />
                {emailDuplicado && (
                  <p className="text-error text-xs mt-1">
                    El correo electrónico ingresado ya pertenece a otro usuario registrado en el sistema
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-foreground mb-1 block">
                  Teléfono <span className="text-muted-foreground text-xs">(opcional)</span>
                </label>
                <input type="text" value={formEditar.telefono}
                  onChange={e => setFormEditar({ ...formEditar, telefono: e.target.value })}
                  placeholder="9XXXXXXXX" maxLength={9}
                  className="w-full rounded-lg px-4 py-2.5 text-sm border border-border bg-transparent text-foreground outline-none focus:border-primary transition" />
                <p className="text-xs text-muted-foreground mt-1">9 dígitos, debe comenzar con 9</p>
              </div>
              {formError && !emailDuplicado && <p className="text-error text-sm">{formError}</p>}
              <button type="submit" disabled={formLoading}
                className="w-full h-11 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primaryemphasis disabled:opacity-50 transition">
                {formLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal desactivar ──────────────────────────────────────────────── */}
      {modalDesactivar && usuarioSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-semibold text-foreground">Desactivar usuario</h3>
              <button onClick={() => setModalDesactivar(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona el motivo para desactivar a{' '}
              <strong className="text-foreground">{usuarioSeleccionado.nombre}</strong>.
            </p>
            <div className="space-y-2 mb-4">
              {MOTIVOS_DESACTIVACION.map(m => (
                <label key={m} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  motivoDesactivar === m ? 'border-error bg-error/5' : 'border-border hover:border-error/50'
                }`}>
                  <input type="radio" name="motivo" value={m}
                    checked={motivoDesactivar === m}
                    onChange={() => setMotivoDesactivar(m)}
                    className="accent-error" />
                  <span className="text-sm text-foreground">{m}</span>
                </label>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-sm text-foreground mb-1 block">
                Detalle / Justificación <span className="text-error">*</span>
              </label>
              <textarea value={detalleDesactivar}
                onChange={e => setDetalleDesactivar(e.target.value)}
                placeholder="Justificación del motivo (mínimo 10 caracteres)..."
                rows={3}
                className={`w-full rounded-lg px-4 py-2.5 text-sm border bg-transparent text-foreground outline-none focus:border-primary transition resize-none ${
                  detalleDesactivar.trim().length > 0 && detalleDesactivar.trim().length < 10
                    ? 'border-error' : 'border-border'
                }`} />
              <p className={`text-xs mt-1 ${detalleDesactivar.trim().length >= 10 ? 'text-success' : 'text-muted-foreground'}`}>
                {detalleDesactivar.trim().length}/10 caracteres mínimos
              </p>
            </div>
            {errorDesactivar && <p className="text-error text-sm mb-3">{errorDesactivar}</p>}
            <div className="flex gap-2">
              <button onClick={() => setModalDesactivar(false)}
                className="flex-1 border border-border text-muted-foreground py-2 rounded-lg text-sm hover:bg-muted/30 transition">
                Cancelar
              </button>
              <button onClick={handleDesactivar}
                disabled={formLoading || !formularioDesactivarValido}
                className="flex-1 bg-error text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
                {formLoading ? 'Desactivando...' : 'Confirmar desactivación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal detalle desactivación ───────────────────────────────────── */}
      {modalDetalle && usuarioSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Detalle de desactivación</h3>
              <button onClick={() => setModalDetalle(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="solar:close-circle-linear" height={22} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usuario</span>
                <span className="text-foreground font-medium">{usuarioSeleccionado.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Motivo</span>
                <span className="text-error font-medium">{usuarioSeleccionado.motivoDesactivacion}</span>
              </div>
              {usuarioSeleccionado.fechaDesactivacion && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fecha</span>
                  <span className="text-foreground">
                    {new Date(usuarioSeleccionado.fechaDesactivacion).toLocaleString('es-PE')}
                  </span>
                </div>
              )}
              {usuarioSeleccionado.detalleDesactivacion && (
                <div className="bg-muted/20 rounded-lg p-3 mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Justificación:</p>
                  <p className="text-sm text-foreground">{usuarioSeleccionado.detalleDesactivacion}</p>
                </div>
              )}
            </div>
            <button onClick={() => setModalDetalle(false)}
              className="w-full mt-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/30 text-sm transition">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}