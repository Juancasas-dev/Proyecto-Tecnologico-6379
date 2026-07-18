import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export const loginService = async (username: string, password: string) => {
  const { data } = await axios.post(`${API}/auth/login`, { username, password })
  return data
}