import axios from 'axios'

const API = 'http://localhost:3000/api'

export const loginService = async (username: string, password: string) => {
  const { data } = await axios.post(`${API}/auth/login`, { username, password })
  return data
}