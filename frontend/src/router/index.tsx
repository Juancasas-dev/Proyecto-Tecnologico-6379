import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React from 'react'
import Login from '../views/authentication/Login'
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