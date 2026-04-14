// src/composables/useActiveOrder.ts
// CONFIRMED bloquea crear nuevo pedido — se libera cuando el cliente
// toca "¡Recibí mi pedido!" que lo pasa a DELIVERED

import { ref, computed } from 'vue'
import { ordersApi } from '../api/orders'
import type { Order } from '../api/orders'

const ORDER_DURATION_MS = 15 * 60 * 1000

// Singleton
let sharedActiveOrder  = ref<Order | null>(null)
let sharedPendingOrder = ref<Order | null>(null)
let sharedSeconds      = ref(0)
let sharedLoaded       = ref(false)
let tickInterval: ReturnType<typeof setInterval> | null = null
let pollInterval:  ReturnType<typeof setInterval> | null = null

function computeSecondsLeft(order: Order): number {
  const createdAt = new Date(order.createdAt).getTime()
  const expiresAt = createdAt + ORDER_DURATION_MS
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
}

function startTick() {
  if (tickInterval) return
  tickInterval = setInterval(() => {
    if (!sharedPendingOrder.value) { stopTick(); sharedSeconds.value = 0; return }
    const secs = computeSecondsLeft(sharedPendingOrder.value)
    sharedSeconds.value = secs
    if (secs <= 0) { stopTick(); sharedPendingOrder.value = null; sharedSeconds.value = 0 }
  }, 1000)
}

function stopTick() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null }
}

function startPoll() {
  if (pollInterval) return
  pollInterval = setInterval(() => refreshActiveOrder(), 30_000)
}

async function refreshActiveOrder() {
  try {
    const result = await ordersApi.getMyOrders()

    // Bloquea si hay PENDING o CONFIRMED — se libera con DELIVERED o REJECTED
    const active = result.items.find(
      o => o.status === 'PENDING' || o.status === 'CONFIRMED'
    ) ?? null
    sharedActiveOrder.value = active
    sharedLoaded.value = true

    // Timer solo para PENDING con tiempo restante
    if (active?.status === 'PENDING') {
      const secs = computeSecondsLeft(active)
      if (secs > 0) {
        sharedPendingOrder.value = active
        sharedSeconds.value = secs
        startTick()
      } else {
        sharedPendingOrder.value = null
        sharedSeconds.value = 0
        stopTick()
      }
    } else {
      // CONFIRMED o sin activo — no hay timer
      sharedPendingOrder.value = null
      sharedSeconds.value = 0
      stopTick()
    }
  } catch { /* error de red */ }
}

export function useActiveOrder() {
  if (!sharedLoaded.value) {
    refreshActiveOrder()
    startPoll()
  }

  const activeOrder    = computed(() => sharedActiveOrder.value)
  const pendingOrder   = computed(() => sharedPendingOrder.value)
  const hasPending     = computed(() => !!sharedActiveOrder.value)
  const canCreateOrder = computed(() => !hasPending.value)

  const hasTimer      = computed(() => !!sharedPendingOrder.value && sharedSeconds.value > 0)
  const secondsLeft   = computed(() => sharedSeconds.value)

  const formattedTime = computed(() => {
    const m = Math.floor(sharedSeconds.value / 60)
    const s = sharedSeconds.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  const urgency = computed((): 'normal' | 'warning' | 'critical' => {
    if (sharedSeconds.value <= 60)  return 'critical'
    if (sharedSeconds.value <= 180) return 'warning'
    return 'normal'
  })

  const progressPercent = computed(() =>
    hasTimer.value ? (sharedSeconds.value / (15 * 60)) * 100 : 0
  )

  function setActiveOrder(order: Order) {
    sharedActiveOrder.value = order
    sharedLoaded.value = true
    if (order.status === 'PENDING') {
      sharedPendingOrder.value = order
      sharedSeconds.value = computeSecondsLeft(order)
      startTick()
    }
  }

  function clearActiveOrder() {
    sharedActiveOrder.value  = null
    sharedPendingOrder.value = null
    sharedSeconds.value = 0
    stopTick()
  }

  return {
    activeOrder, pendingOrder,
    hasPending, canCreateOrder,
    hasTimer, secondsLeft,
    formattedTime, urgency, progressPercent,
    setActiveOrder, clearActiveOrder,
    refreshActiveOrder,
  }
}