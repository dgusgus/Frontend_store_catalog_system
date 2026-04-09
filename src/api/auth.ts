import { fetcher } from './fetcher'
import type { AuthResponse } from '../types'

export const authApi = {
  login(email: string, password: string) {
    return fetcher<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  register(email: string, password: string, name?: string, phone?: string) {
    return fetcher<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, phone }),
    })
  },

  logout(refreshToken: string) {
    return fetcher<void>('/auth/logout', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ refreshToken }),
    })
  },
}