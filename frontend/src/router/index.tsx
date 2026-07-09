import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React from 'react'
import Login from '../views/authentication/Login'
import ForgotPassword from '../views/authentication/ForgotPassword'
import Dashboard from '../pages/Dashboard'
import AdminDashboard from '../pages/AdminDashboard'
import GestionUsuarios from '../pages/GestionUsuarios'
import FullLayout from '../layouts/full/FullLayout'
import CatalogoProductos from '../pages/CatalogoProductos'
import Mercaderia from '../pages/Mercaderia'
import CambiarContrasena from '../pages/CambiarContrasena'
import Respaldo from '../pages/Respaldo'
import Categorias from '../pages/Categorias'
import Ventas from '../pages/Ventas'
import HistorialVentas from '../pages/HistorialVentas'
import Alertas from '../pages/Alertas'
import Demandas from '../pages/Demandas'
import AjusteStock from '../pages/AjusteStock'
import ResumenTurnos from '../pages/ResumenTurnos'
import Reportes from '../pages/Reportes'
import Trazabilidad from '../pages/Trazabilidad'
import Proveedores from '../pages/Proveedores'
import ResetPassword from '../views/authentication/ResetPassword'


const token = () => localStorage.getItem('token')
const rol = () => JSON.parse(localStorage.getItem('usuario') || '{}')?.rol

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  return token() ? <>{children}</> : <Navigate to="/login" />
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  if (!token()) return <Navigate to="/login" />
  if (rol() !== 'admin') return <AccesoDenegado />
  return <>{children}</>
}

const EnConstruccion = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <h2 className="text-xl font-semibold text-foreground">Sección en construcción</h2>
    <p className="text-muted-foreground text-sm">Esta funcionalidad estará disponible próximamente</p>
  </div>
)

const AccesoDenegado = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
    <h1 className="text-3xl font-bold text-error">403 — Acceso Denegado</h1>
    <p className="text-muted-foreground text-sm">
      No tienes permiso para acceder a esta sección.
    </p>
    <button
      onClick={() => window.history.back()}
      className="text-primary text-sm hover:underline"
    >
      Volver atrás
    </button>
  </div>
)

const NegocioRoute = ({ children }: { children: React.ReactNode }) => {
  if (!token()) return <Navigate to="/login" />
  if (rol() === 'admin') return <AccesoDenegado />
  return <>{children}</>
}

const DuenoRoute = ({ children }: { children: React.ReactNode }) => {
  if (!token()) return <Navigate to="/login" />
  if (rol() === 'admin') return <AccesoDenegado />
  if (rol() !== 'dueño') return <AccesoDenegado />
  return <>{children}</>
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/respaldos" element={
          <AdminRoute>
            <Respaldo />
          </AdminRoute>
        } />

        <Route element={
          <PrivateRoute>
            <FullLayout />
          </PrivateRoute>
        }>
          <Route path="/dashboard" element={
            <NegocioRoute>
              <Dashboard />
            </NegocioRoute>
          } />
          <Route path="/dashboard/usuarios" element={
            <DuenoRoute>
              <GestionUsuarios />
            </DuenoRoute>
          } />
          <Route path="/dashboard/productos" element={
            <NegocioRoute>
              <CatalogoProductos />
            </NegocioRoute>
          } />
          <Route path="/dashboard/mercaderia" element={
            <NegocioRoute>
              <Mercaderia />
            </NegocioRoute>
          } />
          <Route path="/dashboard/categorias" element={
            <NegocioRoute>
              <Categorias />
            </NegocioRoute>
          } />
          <Route path="/dashboard/proveedores" element={
            <DuenoRoute>
              <Proveedores />
            </DuenoRoute>
          } />
          <Route path="/dashboard/turno" element={
            <NegocioRoute>
              <ResumenTurnos />
            </NegocioRoute>
          } />
          <Route path="/dashboard/demandas" element={
            <DuenoRoute>
              <Demandas />
            </DuenoRoute>
          } />
          <Route path="/dashboard/reportes" element={
            <DuenoRoute>
              <Reportes />
            </DuenoRoute>
          } />

          <Route path="/dashboard/trazabilidad" element={
            <DuenoRoute>
              <Trazabilidad />
            </DuenoRoute>
          } />
          <Route path="/dashboard/alertas" element={
            <NegocioRoute>
              <Alertas />
            </NegocioRoute>
          } />
          <Route path="/dashboard/ventas" element={
            <NegocioRoute>
              <Ventas />
            </NegocioRoute>
          } />
          <Route path="/dashboard/historial-ventas" element={
            <NegocioRoute>
              <HistorialVentas />
            </NegocioRoute>
          } />
          <Route path="/dashboard/ajustes" element={
            <DuenoRoute>
              <AjusteStock />
            </DuenoRoute>
          } />
          <Route path="/dashboard/*" element={
            <NegocioRoute>
              <EnConstruccion />
            </NegocioRoute>
          } />
        </Route>
        <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}