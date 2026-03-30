import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

export const useUiStore = defineStore('ui', () => {
  const loading = ref(false)
  const toasts = ref<Toast[]>([])
  let nextId = 0

  function showToast(message: string, type: ToastType = 'info', duration = 3000) {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  return { loading, toasts, showToast, setLoading }
})