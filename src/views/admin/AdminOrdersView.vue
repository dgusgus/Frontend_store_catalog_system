<!-- src/views/admin/AdminOrdersView.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useOrdersStore } from '../../stores/orders.store'
import { useToast }       from '../../composables/useToast'
import { ApiRequestError } from '../../api/fetcher'
import type { Order, OrderStatus } from '../../api/orders'

const store = useOrdersStore()
const toast = useToast()

const activeFilter  = ref<OrderStatus | undefined>(undefined)
const selectedOrder = ref<Order | null>(null)
const adminNote     = ref('')
const actionLoading = ref(false)

onMounted(() => store.fetchOrders())

function applyFilter(status: OrderStatus | undefined) {
  activeFilter.value = status
  store.fetchOrders({ status })
}

function openOrder(order: Order) {
  selectedOrder.value = order
  adminNote.value     = order.adminNote ?? ''
}

function closeModal() {
  selectedOrder.value = null
  adminNote.value     = ''
}

async function handleAction(status: 'CONFIRMED' | 'REJECTED') {
  if (!selectedOrder.value) return
  actionLoading.value = true
  try {
    await store.updateStatus(selectedOrder.value.id, {
      status,
      adminNote: adminNote.value.trim() || undefined,
    })
    toast.success(status === 'CONFIRMED' ? 'Pedido aceptado ✓' : 'Pedido rechazado')
    closeModal()
    store.fetchOrders({ status: activeFilter.value })
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al actualizar')
  } finally {
    actionLoading.value = false
  }
}

async function handleDelete(order: Order) {
  if (!confirm(`¿Eliminar el pedido ${order.orderNumber}? Esta acción no se puede deshacer.`)) return
  try {
    await store.deleteOrder(order.id)
    toast.success(`Pedido ${order.orderNumber} eliminado`)
    closeModal()
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al eliminar')
  }
}

const statusConfig: Record<OrderStatus, { label: string; class: string; icon: string }> = {
  PENDING:   { label: 'Pendiente', class: 'badge-warning', icon: '⏳' },
  CONFIRMED: { label: 'Aceptado',  class: 'badge-success', icon: '✅' },
  REJECTED:  { label: 'Rechazado', class: 'badge-error',   icon: '❌' },
  DELIVERED: { label: 'Entregado', class: 'badge-info',    icon: '📦' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-bold text-lg flex items-center gap-2">
          Pedidos
          <span v-if="store.pendingCount > 0" class="badge badge-warning badge-sm">
            {{ store.pendingCount }} pendiente{{ store.pendingCount !== 1 ? 's' : '' }}
          </span>
        </h2>
        <p class="text-sm text-base-content/50">
          {{ store.orders?.pagination.total ?? 0 }} en total
        </p>
      </div>
      <button class="btn btn-ghost btn-sm" @click="store.fetchOrders({ status: activeFilter })">
        🔄 Actualizar
      </button>
    </div>

    <!-- Filtros -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="opt in [
          { label: 'Todos',         value: undefined },
          { label: '⏳ Pendientes', value: 'PENDING'   as OrderStatus },
          { label: '✅ Aceptados',  value: 'CONFIRMED' as OrderStatus },
          { label: '❌ Rechazados', value: 'REJECTED'  as OrderStatus },
          { label: '📦 Entregados', value: 'DELIVERED' as OrderStatus },
        ]"
        :key="String(opt.value)"
        class="btn btn-xs"
        :class="activeFilter === opt.value ? 'btn-primary' : 'btn-ghost'"
        @click="applyFilter(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-col gap-2">
      <div v-for="n in 4" :key="n" class="skeleton h-20 w-full rounded-xl"></div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="alert alert-error">
      <span>{{ store.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="store.fetchOrders()">Reintentar</button>
    </div>

    <!-- Lista -->
    <div v-else class="flex flex-col gap-2">

      <div v-if="!store.orders?.items.length" class="text-center py-12 text-base-content/40">
        <p class="text-3xl mb-2">📭</p>
        <p>No hay pedidos {{ activeFilter ? 'con este estado' : 'todavía' }}</p>
      </div>

      <div
        v-for="order in store.orders?.items"
        :key="order.id"
        class="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        @click="openOrder(order)"
      >
        <div class="card-body p-3 flex-row items-center gap-3">

          <div class="shrink-0 text-2xl">{{ statusConfig[order.status].icon }}</div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sm">{{ order.orderNumber }}</span>
              <span class="badge badge-xs" :class="statusConfig[order.status].class">
                {{ statusConfig[order.status].label }}
              </span>
            </div>
            <p class="text-sm text-base-content/70 truncate mt-0.5">
              {{ order.customerName }} · {{ order.customerPhone }}
            </p>
            <p class="text-xs text-base-content/40 mt-0.5">
              {{ formatDate(order.createdAt) }}
              · {{ order.items.length }} producto{{ order.items.length !== 1 ? 's' : '' }}
            </p>
          </div>

          <div class="shrink-0 text-right">
            <p class="font-bold text-base">${{ Number(order.total).toFixed(2) }}</p>
            <p v-if="Number(order.discountAmount) > 0" class="text-xs text-success">
              -${{ Number(order.discountAmount).toFixed(2) }}
            </p>
          </div>

          <!-- Botón eliminar directo en la lista — solo para REJECTED -->
          <button
            v-if="order.status === 'REJECTED'"
            class="btn btn-ghost btn-xs text-error shrink-0"
            title="Eliminar pedido rechazado"
            @click.stop="handleDelete(order)"
          >
            🗑️
          </button>

          <svg v-else xmlns="http://www.w3.org/2000/svg"
            class="size-4 text-base-content/30 shrink-0" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>

        </div>
      </div>

    </div>

    <!-- Paginación -->
    <div v-if="store.orders && store.orders.pagination.totalPages > 1"
      class="flex justify-center gap-2">
      <button class="btn btn-sm btn-ghost"
        :disabled="!store.orders.pagination.hasPrev"
        @click="store.fetchOrders({ status: activeFilter, page: store.orders!.pagination.page - 1 })">
        ← Anterior
      </button>
      <span class="btn btn-sm btn-ghost no-animation">
        {{ store.orders.pagination.page }} / {{ store.orders.pagination.totalPages }}
      </span>
      <button class="btn btn-sm btn-ghost"
        :disabled="!store.orders.pagination.hasNext"
        @click="store.fetchOrders({ status: activeFilter, page: store.orders!.pagination.page + 1 })">
        Siguiente →
      </button>
    </div>

  </div>

  <!-- Modal de detalle -->
  <dialog class="modal" :class="{ 'modal-open': !!selectedOrder }">
    <div v-if="selectedOrder" class="modal-box w-full max-w-md">

      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="font-mono font-bold text-lg">{{ selectedOrder.orderNumber }}</p>
          <span class="badge badge-sm" :class="statusConfig[selectedOrder.status].class">
            {{ statusConfig[selectedOrder.status].label }}
          </span>
        </div>
        <button class="btn btn-sm btn-ghost btn-circle" @click="closeModal">✕</button>
      </div>

      <!-- Cliente -->
      <div class="bg-base-200 rounded-xl p-3 mb-3">
        <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Cliente</p>
        <p class="text-sm font-medium">{{ selectedOrder.customerName }}</p>
        <p class="text-sm text-base-content/60">{{ selectedOrder.customerPhone }}</p>
        <p class="text-xs text-base-content/40 mt-1">{{ selectedOrder.user.email }}</p>
      </div>

      <!-- Items -->
      <div class="flex flex-col gap-1 mb-3">
        <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Productos</p>
        <div
          v-for="item in selectedOrder.items" :key="item.id"
          class="flex justify-between items-center text-sm py-1.5 border-b border-base-200 last:border-0"
        >
          <div class="min-w-0">
            <p class="font-medium truncate">{{ item.productName }}</p>
            <p v-if="item.variantName" class="text-xs text-base-content/50">{{ item.variantName }}</p>
            <p class="text-xs text-base-content/50">
              {{ item.quantity }} × ${{ Number(item.unitPrice).toFixed(2) }}
            </p>
          </div>
          <span class="font-semibold shrink-0 ml-2">${{ Number(item.subtotal).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Totales -->
      <div class="bg-base-200 rounded-xl p-3 mb-3">
        <div class="flex justify-between text-sm">
          <span class="text-base-content/60">Subtotal</span>
          <span>${{ Number(selectedOrder.subtotal).toFixed(2) }}</span>
        </div>
        <div v-if="Number(selectedOrder.discountAmount) > 0"
          class="flex justify-between text-sm text-success">
          <span>Descuento ({{ selectedOrder.discountCode }})</span>
          <span>−${{ Number(selectedOrder.discountAmount).toFixed(2) }}</span>
        </div>
        <div class="flex justify-between font-bold text-base mt-1 pt-1 border-t border-base-300">
          <span>Total</span>
          <span>${{ Number(selectedOrder.total).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Nota del admin existente -->
      <div v-if="selectedOrder.adminNote && selectedOrder.status !== 'PENDING'"
        class="alert alert-info alert-sm mb-3 text-xs">
        <span>Nota: {{ selectedOrder.adminNote }}</span>
      </div>

      <!-- Fecha -->
      <p class="text-xs text-base-content/30 text-center mb-3">
        Creado: {{ formatDate(selectedOrder.createdAt) }}
      </p>

      <!-- Acciones según estado -->

      <!-- PENDING: aceptar o rechazar -->
      <template v-if="selectedOrder.status === 'PENDING'">
        <label class="form-control mb-3">
          <div class="label pb-1">
            <span class="label-text text-sm">Nota para el cliente</span>
            <span class="label-text-alt text-base-content/40">opcional</span>
          </div>
          <textarea v-model="adminNote" class="textarea textarea-bordered textarea-sm h-16 resize-none"
            placeholder="Ej: Tu pedido estará listo en 2 horas..."></textarea>
        </label>
        <div class="flex gap-2">
          <button class="btn btn-error flex-1 gap-1" :disabled="actionLoading"
            @click="handleAction('REJECTED')">
            <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
            ❌ Rechazar
          </button>
          <button class="btn btn-success flex-1 gap-1 text-white" :disabled="actionLoading"
            @click="handleAction('CONFIRMED')">
            <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
            ✅ Aceptar pedido
          </button>
        </div>
      </template>

      <!-- REJECTED: solo eliminar -->
      <template v-if="selectedOrder.status === 'REJECTED'">
        <button
          class="btn btn-error btn-outline w-full gap-2"
          @click="handleDelete(selectedOrder)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar pedido rechazado
        </button>
      </template>

    </div>
    <div class="modal-backdrop" @click="closeModal"></div>
  </dialog>
</template>