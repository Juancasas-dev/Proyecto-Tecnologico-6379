import axios from 'axios'

axios.interceptors.response.use(
  response => response,
  error => {
  
    if (error.config?.url?.includes('/auth/login')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      setTimeout(() => {
        window.location.href = '/login?expired=true'
      }, 500)
    }
    return Promise.reject(error)
  }
)