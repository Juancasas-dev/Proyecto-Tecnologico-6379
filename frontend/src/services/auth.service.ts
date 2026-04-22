import axios from 'axios'

const API = 'http://localhost:3000/api'

export const loginService = async (email: string, password: string) => {
  const { data } = await axios.post(`${API}/auth/login`, { email, password })
  return data
}