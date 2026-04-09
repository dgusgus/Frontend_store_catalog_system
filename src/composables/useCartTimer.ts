// src/composables/useCartTimer.ts
//
// Temporizador de 15 minutos para el carrito.
// Se inicia cuando el carrito tiene items, se reinicia si el usuario agrega algo,
// y al llegar a 0 vacía el carrito automáticamente.
//
// El tiempo se persiste en localStorage para sobrevivir refrescos de página.

import { ref, computed, watch, onUnmounted } from 'vue'
import { useCartStore } from '../stores/cart.store'

const DURATION_MS  = 15 * 60 * 1000  // 15 minutos
const STORAGE_KEY  = 'cart_expires_at'

export function useCartTimer() {
  const cart = useCartStore()

  // Tiempo restante en segundos
  const secondsLeft = ref(0)
  let interval: ReturnType<typeof setInterval> | null = null

  // ── Leer / escribir expiración en localStorage ─────────────
  function getExpiry(): number | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const val = Number(raw)
    return isNaN(val) ? null : val
  }

  function setExpiry(expiresAt: number) {
    localStorage.setItem(STORAGE_KEY, String(expiresAt))
  }

  function clearExpiry() {
    localStorage.removeItem(STORAGE_KEY)
  }

  // ── Calcular segundos restantes ────────────────────────────
  function computeSeconds(): number {
    const expiry = getExpiry()
    if (!expiry) return 0
    return Math.max(0, Math.floor((expiry - Date.now()) / 1000))
  }

  // ── Iniciar o reiniciar el timer ───────────────────────────
  function startTimer() {
    const expiresAt = Date.now() + DURATION_MS
    setExpiry(expiresAt)
    secondsLeft.value = computeSeconds()
    startTick()
  }

  // ── Tick cada segundo ──────────────────────────────────────
  function startTick() {
    if (interval) clearInterval(interval)
    interval = setInterval(() => {
      secondsLeft.value = computeSeconds()

      if (secondsLeft.value <= 0) {
        stopTimer()
        // Vaciar el carrito si aún tiene items
        if (!cart.isEmpty) {
          cart.clearCart()
          // La vista que usa este composable reacciona al isEmpty del cart
        }
      }
    }, 1000)
  }

  function stopTimer() {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
    clearExpiry()
    secondsLeft.value = 0
  }

  // ── Arrancar al montar si hay items y tiempo guardado ──────
  function init() {
    if (cart.isEmpty) return

    const expiry = getExpiry()
    if (!expiry) {
      // Primer item agregado — iniciar timer
      startTimer()
      return
    }

    const remaining = computeSeconds()
    if (remaining <= 0) {
      // El timer ya expiró mientras estaba cerrada la app
      stopTimer()
      cart.clearCart()
    } else {
      secondsLeft.value = remaining
      startTick()
    }
  }

  // Si el carrito se vació externamente, parar el timer
  watch(() => cart.isEmpty, (empty) => {
    if (empty) stopTimer()
  })

  // Reiniciar el timer cuando se agrega un item
  watch(() => cart.itemCount, (count, prev) => {
    if (count > prev && count > 0) {
      startTimer()
    }
  })

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  // ── Computed útiles para la UI ─────────────────────────────
  const minutes = computed(() => Math.floor(secondsLeft.value / 60))
  const seconds = computed(() => secondsLeft.value % 60)

  const formattedTime = computed(() =>
    `${String(minutes.value).padStart(2, '0')}:${String(seconds.value).padStart(2, '0')}`
  )

  // Niveles de urgencia para el color
  const urgency = computed((): 'normal' | 'warning' | 'critical' => {
    if (secondsLeft.value <= 60)  return 'critical'  // último minuto: rojo pulsando
    if (secondsLeft.value <= 180) return 'warning'   // últimos 3 min: amarillo
    return 'normal'
  })

  const isActive = computed(() => secondsLeft.value > 0)

  return {
    formattedTime,
    secondsLeft,
    minutes,
    seconds,
    urgency,
    isActive,
    startTimer,
    stopTimer,
    init,
  }
}