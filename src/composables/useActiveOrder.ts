// src/composables/useActiveOrder.ts
//
// FIXES:
// 1. El timer solo corre para pedidos PENDING (no CONFIRMED)
//    porque el timer es "tiempo para que el admin confirme"
// 2. Si el tiempo ya expiró, el pedido PENDING se ignora como "activo"
//    (el backend lo rechazará eventualmente o el admin lo verá)
// 3. CONFIRMED bloquea crear nuevo pedido pero NO muestra timer

import { ref, computed, onUnmounted } from 'vue'
import { ordersApi } from '../api/orders'
import type { Order } from '../api/orders'

const ORDER_DURATION_MS = 15 * 60 * 1000  // 15 minutos

// Singleton compartido
let sharedActiveOrder  = ref<Order | null>(null)  // pedido PENDING o CONFIRMED activo
let sharedPendingOrder = ref<Order | null>(null)  // solo PENDING (para el timer)
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
    if (!sharedPendingOrder.value) {
      stopTick()
      sharedSeconds.value = 0
      return
    }
    const secs = computeSecondsLeft(sharedPendingOrder.value)
    sharedSeconds.value = secs
    // Si el tiempo expiró, el pedido PENDING ya no bloquea el timer
    // (el pedido sigue existiendo en la DB, solo deja de mostrar el reloj)
    if (secs <= 0) {
      stopTick()
      sharedPendingOrder.value = null
      sharedSeconds.value = 0
    }
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

    // Pedido activo = PENDING o CONFIRMED (bloquea crear nuevo)
    const active = result.items.find(
      o => o.status === 'PENDING' || o.status === 'CONFIRMED'
    ) ?? null
    sharedActiveOrder.value = active
    sharedLoaded.value = true

    // Timer solo para PENDING cuyo tiempo no haya expirado
    if (active?.status === 'PENDING') {
      const secs = computeSecondsLeft(active)
      if (secs > 0) {
        sharedPendingOrder.value = active
        sharedSeconds.value = secs
        startTick()
      } else {
        // El tiempo expiró — no mostramos timer pero el pedido sigue bloqueando
        sharedPendingOrder.value = null
        sharedSeconds.value = 0
        stopTick()
      }
    } else {
      // CONFIRMED o sin pedido activo — no hay timer
      sharedPendingOrder.value = null
      sharedSeconds.value = 0
      stopTick()
    }
  } catch {
    // Error de red — no bloqueamos
  }
}

export function useActiveOrder() {
  if (!sharedLoaded.value) {
    refreshActiveOrder()
    startPoll()
  }

  // ── Computed ─────────────────────────────────────────────
  const activeOrder    = computed(() => sharedActiveOrder.value)
  const pendingOrder   = computed(() => sharedPendingOrder.value)
  const hasPending     = computed(() => !!sharedActiveOrder.value)
  const canCreateOrder = computed(() => !hasPending.value)

  // Timer — solo si hay pedido PENDING con tiempo restante
  const hasTimer      = computed(() => !!sharedPendingOrder.value && sharedSeconds.value > 0)
  const secondsLeft   = computed(() => sharedSeconds.value)
  const minutesLeft   = computed(() => Math.floor(sharedSeconds.value / 60))
  const secondsRem    = computed(() => sharedSeconds.value % 60)

  const formattedTime = computed(() =>
    `${String(minutesLeft.value).padStart(2, '0')}:${String(secondsRem.value).padStart(2, '0')}`
  )

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
    activeOrder,
    pendingOrder,
    hasPending,
    canCreateOrder,
    hasTimer,
    secondsLeft,
    formattedTime,
    urgency,
    progressPercent,
    setActiveOrder,
    clearActiveOrder,
    refreshActiveOrder,
  }
}