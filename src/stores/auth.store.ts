import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'
import type { AuthUser } from '../types'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))

  // ── Getters ────────────────────────────────────────
  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  // ── Actions ────────────────────────────────────────
  async function login(email: string, password: string) {
    const result = await authApi.login(email, password)

    user.value = result.user
    accessToken.value = result.accessToken
    refreshToken.value = result.refreshToken

    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
  }

  async function logout() {
    if (refreshToken.value) {
      await authApi.logout(refreshToken.value).catch(() => {})
    }
    $reset()
  }

  function $reset() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return { user, accessToken, isAuthenticated, isAdmin, login, logout }
})