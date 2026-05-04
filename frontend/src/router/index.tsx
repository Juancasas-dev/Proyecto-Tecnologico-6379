import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React from 'react'
import Login from '../views/authentication/Login'
import Register from '../views/authentication/Register'
import ForgotPassword from '../views/authentication/ForgotPassword'
import Dashboard from '../pages/Dashboard'
import AdminDashboard from '../pages/AdminDashboard'

const token = () => localStorage.getItem('token')
const rol = () => JSON.parse(localStorage.getItem('usuario') || '{}')?.rol

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  return token() ? <>{children}</> : <Navigate to="/login" />
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  if (!token()) return <Navigate to="/login" />
  if (rol() !== 'admin') return <Navigate to="/dashboard" />
  return <>{children}</>
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}