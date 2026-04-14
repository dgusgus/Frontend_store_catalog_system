<!-- src/views/MyOrdersView.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ordersApi }        from '../api/orders'
import { useSettingsStore } from '../stores/settings.store'
import { useActiveOrder }   from '../composables/useActiveOrder'
import { useToast }         from '../composables/useToast'
import { ApiRequestError }  from '../api/fetcher'
import AppNavbar            from '../components/ui/AppNavbar.vue'
import type { Order, OrderStatus } from '../api/orders'

const settings = useSettingsStore()
const active   = useActiveOrder()
const toast    = useToast()

const orders      = ref<Order[]>([])
const loading     = ref(true)
const error       = ref<string | null>(null)
const confirming  = ref<number | null>(null)  // id del pedido que se está confirmando

let pollInterval: ReturnType<typeof setInterval>

onMounted(async () => {
  settings.fetchSettings()
  await loadOrders()
  pollInterval = setInterval(async () => {
    await loadOrders()
    await active.refreshActiveOrder()
  }, 30_000)
})

onUnmounted(() => clearInterval(pollInterval))

async function loadOrders() {
  try {
    const result = await ordersApi.getMyOrders()
    orders.value = result.items
  } catch {
    error.value = 'Error al cargar tus pedidos'
  } finally {
    loading.value = false
  }
}

// ── Confirmar recepción ────────────────────────────────────
async function handleConfirmReceived(order: Order) {
  confirming.value = order.id
  try {
    const updated = await ordersApi.confirmReceived(order.id)

    // Actualizar localmente sin refetch
    const idx = orders.value.findIndex(o => o.id === order.id)
    if (idx >= 0) orders.value[idx] = updated

    // Limpiar el pedido activo del singleton
    await active.refreshActiveOrder()

    toast.success(`¡Gracias! Pedido ${order.orderNumber} marcado como recibido.`)
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al confirmar')
  } finally {
    confirming.value = null
  }
}

// ── Descargar QR ───────────────────────────────────────────
async function downloadQr() {
  const url = settings.paymentQrUrl
  if (!url) return
  try {
    const response = await fetch(url)
    const blob     = await response.blob()
    const link     = document.createElement('a')
    link.href      = URL.createObjectURL(blob)
    link.download  = 'qr-pago.png'
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    window.open(url, '_blank')
  }
}

// ── Config visual por estado ───────────────────────────────
const statusConfig: Record<OrderStatus, {
  label: string; icon: string
  bgClass: string; textClass: string; badgeClass: string
  message: string
}> = {
  PENDING: {
    label: 'En espera', icon: '⏳',
    bgClass:   'bg-warning/10 border-warning/30',
    textClass: 'text-warning', badgeClass: 'badge-warning',
    message: 'Tu pedido fue recibido. El vendedor lo está revisando.',
  },
  CONFIRMED: {
    label: '¡Aceptado!', icon: '✅',
    bgClass:   'bg-success/10 border-success/30',
    textClass: 'text-success', badgeClass: 'badge-success',
    message: 'Tu pedido fue aceptado. Cuando lo recibas, confirmá la recepción.',
  },
  REJECTED: {
    label: 'Rechazado', icon: '❌',
    bgClass:   'bg-error/10 border-error/30',
    textClass: 'text-error', badgeClass: 'badge-error',
    message: 'Tu pedido no pudo ser procesado.',
  },
  DELIVERED: {
    label: 'Entregado', icon: '📦',
    bgClass:   'bg-base-200 border-base-300',
    textClass: 'text-base-content/60', badgeClass: 'badge-ghost',
    message: '¡Pedido entregado! Gracias por tu compra.',
  },
}

function isPendingWithTimer(order: Order): boolean {
  return order.status === 'PENDING' &&
    active.pendingOrder.value?.id === order.id &&
    active.hasTimer.value
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <AppNavbar />

    <main class="max-w-lg mx-auto px-4 pb-8 pt-4 flex flex-col gap-4">

      <div>
        <h1 class="text-xl font-bold">Mis pedidos</h1>
        <p class="text-sm text-base-content/50 mt-0.5">Estado de tus pedidos en tiempo real</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col gap-3">
        <div v-for="n in 2" :key="n" class="skeleton h-32 w-full rounded-xl"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="alert alert-error">
        <span>{{ error }}</span>
        <button class="btn btn-sm btn-ghost" @click="loadOrders">Reintentar</button>
      </div>

      <!-- Sin pedidos -->
      <div v-else-if="orders.length === 0"
        class="flex flex-col items-center gap-4 py-16 text-center">
        <span class="text-5xl">📭</span>
        <p class="text-base-content/60">Todavía no tenés pedidos</p>
        <RouterLink to="/catalog" class="btn btn-primary btn-sm">Ver productos</RouterLink>
      </div>

      <!-- Lista -->
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="order in orders"
          :key="order.id"
          class="card border shadow-sm transition-all"
          :class="statusConfig[order.status].bgClass"
        >
          <div class="card-body p-4 gap-3">

            <!-- Header -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ statusConfig[order.status].icon }}</span>
                <span class="font-mono font-bold">{{ order.orderNumber }}</span>
              </div>
              <span class="badge badge-sm" :class="statusConfig[order.status].badgeClass">
                {{ statusConfig[order.status].label }}
              </span>
            </div>

            <!-- Mensaje de estado -->
            <p class="text-sm font-medium" :class="statusConfig[order.status].textClass">
              {{ statusConfig[order.status].message }}
            </p>

            <!-- Timer — solo para PENDING activo con tiempo restante -->
            <div
              v-if="isPendingWithTimer(order)"
              class="rounded-xl border p-3 transition-all"
              :class="{
                'border-base-300 bg-base-100/50':  active.urgency.value === 'normal',
                'border-warning/50 bg-warning/10': active.urgency.value === 'warning',
                'border-error/60 bg-error/10':     active.urgency.value === 'critical',
              }"
            >
              <div class="flex items-center gap-3">
                <span class="text-lg">
                  {{ active.urgency.value === 'critical' ? '🚨' : active.urgency.value === 'warning' ? '⚠️' : '⏱️' }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold"
                    :class="{
                      'text-base-content': active.urgency.value === 'normal',
                      'text-warning':      active.urgency.value === 'warning',
                      'text-error':        active.urgency.value === 'critical',
                    }">
                    {{ active.urgency.value === 'critical' ? '¡Expira muy pronto!' : active.urgency.value === 'warning' ? 'El tiempo se agota' : 'Tiempo para confirmar' }}
                  </p>
                  <p class="text-xs text-base-content/40">El vendedor tiene 15 min para aceptar</p>
                </div>
                <span class="font-mono font-bold text-xl tabular-nums shrink-0"
                  :class="{
                    'text-base-content':        active.urgency.value === 'normal',
                    'text-warning':             active.urgency.value === 'warning',
                    'text-error animate-pulse': active.urgency.value === 'critical',
                  }">
                  {{ active.formattedTime.value }}
                </span>
              </div>
              <div class="mt-2 h-1 bg-base-200 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000"
                  :class="{
                    'bg-primary': active.urgency.value === 'normal',
                    'bg-warning': active.urgency.value === 'warning',
                    'bg-error':   active.urgency.value === 'critical',
                  }"
                  :style="{ width: `${active.progressPercent.value}%` }" />
              </div>
            </div>

            <!-- Nota del admin -->
            <div v-if="order.adminNote"
              class="bg-base-100/80 rounded-lg px-3 py-2 text-sm text-base-content/70 flex gap-2">
              <span class="shrink-0">💬</span>
              <span>{{ order.adminNote }}</span>
            </div>

            <!-- Items -->
            <div class="bg-base-100/60 rounded-xl p-3 flex flex-col gap-1">
              <div v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
                <span class="text-base-content/70 truncate flex-1 mr-2">
                  {{ item.productName }}
                  <span v-if="item.variantName" class="text-xs text-base-content/40">
                    ({{ item.variantName }})
                  </span>
                  × {{ item.quantity }}
                </span>
                <span class="font-medium shrink-0">${{ Number(item.subtotal).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between font-bold text-sm pt-1.5 mt-0.5 border-t border-base-200">
                <span>Total</span>
                <span>${{ Number(order.total).toFixed(2) }}</span>
              </div>
            </div>

            <!-- QR de pago — para PENDING o CONFIRMED -->
            <div
              v-if="settings.paymentQrUrl && (order.status === 'PENDING' || order.status === 'CONFIRMED')"
              class="bg-base-100 rounded-xl p-4 flex flex-col items-center gap-3"
            >
              <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
                Pago bancario
              </p>
              <div class="bg-primary/10 rounded-xl px-4 py-2 text-center w-full">
                <p class="text-xs text-base-content/50">Monto a transferir</p>
                <p class="text-2xl font-bold text-primary">${{ Number(order.total).toFixed(2) }}</p>
              </div>
              <div class="bg-white rounded-xl p-3 border border-base-200">
                <img :src="settings.paymentQrUrl" alt="QR de pago" class="w-36 h-36 object-contain" />
              </div>
              <button class="btn btn-outline btn-sm w-full gap-2" @click="downloadQr">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Descargar QR
              </button>
            </div>

            <!-- ── Botón confirmar recepción — solo para CONFIRMED ── -->
            <div v-if="order.status === 'CONFIRMED'"
              class="border-t border-success/20 pt-3 flex flex-col gap-2">

              <div class="flex items-start gap-2 text-xs text-base-content/50">
                <span class="shrink-0 mt-0.5">ℹ️</span>
                <span>
                  Cuando recibas tu pedido, tocá el botón para confirmarlo.
                  Esto te permitirá hacer un nuevo pedido.
                </span>
              </div>

              <button
                class="btn btn-success w-full gap-2 text-white"
                :class="{ 'loading': confirming === order.id }"
                :disabled="confirming === order.id"
                @click="handleConfirmReceived(order)"
              >
                <span v-if="confirming === order.id" class="loading loading-spinner loading-sm"></span>
                <template v-else>
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M5 13l4 4L19 7"/>
                  </svg>
                  ¡Recibí mi pedido!
                </template>
              </button>

            </div>

            <!-- Fecha -->
            <p class="text-xs text-base-content/40 text-right">
              {{ formatDate(order.createdAt) }}
            </p>

          </div>
        </div>

        <p class="text-xs text-center text-base-content/30 mt-1">
          🔄 Se actualiza cada 30 segundos
        </p>
      </div>

    </main>
  </div>
</template>