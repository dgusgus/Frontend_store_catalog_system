import { useUiStore } from '../stores/ui.store'

export function useToast() {
  const ui = useUiStore()

  return {
    success: (msg: string) => ui.showToast(msg, 'success'),
    error:   (msg: string) => ui.showToast(msg, 'error'),
    info:    (msg: string) => ui.showToast(msg, 'info'),
  }
}