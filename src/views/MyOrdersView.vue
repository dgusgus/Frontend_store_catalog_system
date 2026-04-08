<!-- src/views/MyOrdersView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ordersApi }   from '../api/orders'
import { useAuthStore } from '../stores/auth.store'
import AppNavbar from '../components/ui/AppNavbar.vue'
import type { Order, OrderStatus } from '../api/orders'

const auth = useAuthStore()

const orders  = ref<Order[]>([])
const loading = ref(true)
const error   = ref<string | null>(null)

// ── Polling cada 30s para actualizar estado sin recargar ───
let pollInterval: ReturnType<typeof setInterval>

onMounted(async () => {
  await loadOrders()
  // Actualiza automáticamente cada 30 segundos
  pollInterval = setInterval(loadOrders, 30_000)
})

// Limpia el intervalo al salir de la vista
import { onUnmounted } from 'vue'
onUnmounted(() => clearInterval(pollInterval))

async function loadOrders() {
  try {
    const result = await ordersApi.getMyOrders()
    orders.value = result.items
  } catch (e) {
    error.value = 'Error al cargar tus pedidos'
  } finally {
    loading.value = false
  }
}

// ── Configuración visual por estado ───────────────────────
const statusConfig: Record<OrderStatus, {
  label: string
  icon: string
  bgClass: string
  textClass: string
  badgeClass: string
  message: string
}> = {
  PENDING: {
    label:      'En espera',
    icon:       '⏳',
    bgClass:    'bg-warning/10 border-warning/30',
    textClass:  'text-warning',
    badgeClass: 'badge-warning',
    message:    'Tu pedido fue recibido. El vendedor lo está revisando.',
  },
  CONFIRMED: {
    label:      '¡Aceptado!',
    icon:       '✅',
    bgClass:    'bg-success/10 border-success/30',
    textClass:  'text-success',
    badgeClass: 'badge-success',
    message:    'Tu pedido fue aceptado. Pronto te contactarán.',
  },
  REJECTED: {
    label:      'Rechazado',
    icon:       '❌',
    bgClass:    'bg-error/10 border-error/30',
    textClass:  'text-error',
    badgeClass: 'badge-error',
    message:    'Tu pedido no pudo ser procesado.',
  },
  DELIVERED: {
    label:      'Entregado',
    icon:       '📦',
    bgClass:    'bg-info/10 border-info/30',
    textClass:  'text-info',
    badgeClass: 'badge-info',
    message:    '¡Tu pedido fue entregado!',
  },
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
        <p class="text-sm text-base-content/50 mt-0.5">
          Estado de tus pedidos en tiempo real
        </p>
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
        <RouterLink to="/catalog" class="btn btn-primary btn-sm">
          Ver productos
        </RouterLink>
      </div>

      <!-- Lista de pedidos -->
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="order in orders"
          :key="order.id"
          class="card border shadow-sm"
          :class="statusConfig[order.status].bgClass"
        >
          <div class="card-body p-4 gap-3">

            <!-- Header: número + estado -->
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

            <!-- Nota del admin si existe -->
            <div
              v-if="order.adminNote"
              class="bg-base-100/80 rounded-lg px-3 py-2 text-sm text-base-content/70 flex gap-2"
            >
              <span class="shrink-0">💬</span>
              <span>{{ order.adminNote }}</span>
            </div>

            <!-- Resumen de items -->
            <div class="bg-base-100/60 rounded-xl p-3 flex flex-col gap-1">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex justify-between text-sm"
              >
                <span class="text-base-content/70 truncate flex-1 mr-2">
                  {{ item.productName }}
                  <span v-if="item.variantName" class="text-xs text-base-content/40">
                    ({{ item.variantName }})
                  </span>
                  × {{ item.quantity }}
                </span>
                <span class="font-medium shrink-0">
                  ${{ Number(item.subtotal).toFixed(2) }}
                </span>
              </div>
              <div class="flex justify-between font-bold text-sm pt-1.5 mt-0.5 border-t border-base-200">
                <span>Total</span>
                <span>${{ Number(order.total).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Fecha -->
            <p class="text-xs text-base-content/40 text-right">
              {{ formatDate(order.createdAt) }}
            </p>

          </div>
        </div>

        <!-- Indicador de actualización automática -->
        <p class="text-xs text-center text-base-content/30 mt-1">
          🔄 Se actualiza automáticamente cada 30 segundos
        </p>
      </div>

    </main>
  </div>
</template>