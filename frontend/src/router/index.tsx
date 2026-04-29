import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React from 'react'
import Login from '../views/authentication/Login'
import Register from '../views/authentication/Register'
import ForgotPassword from '../views/authentication/ForgotPassword'
import Dashboard from '../pages/Dashboard'

const token = () => localStorage.getItem('token')

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  return token() ? <>{children}</> : <Navigate to="/login" />
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
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}