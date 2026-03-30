import { fetcher } from './fetcher'
import type { AuthUser } from '../types'

export const adminApi = {
  getUsers() {
    return fetcher<AuthUser[]>('/admin/users', { auth: true })
  },

  changeRole(userId: number, role: 'USER' | 'ADMIN') {
    return fetcher<AuthUser>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ role }),
    })
  },
}