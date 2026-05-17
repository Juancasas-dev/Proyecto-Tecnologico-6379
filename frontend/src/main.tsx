import React from 'react'
import ReactDOM from 'react-dom/client'
import Router from './router/index'
import './index.css'
import './services/axiosConfig'

document.documentElement.classList.add('dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
)