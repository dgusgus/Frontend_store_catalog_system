// src/stores/orders.store.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ordersApi } from '../api/orders'
import type { Order, OrderStatus, UpdateOrderStatusPayload } from '../api/orders'
import type { PaginatedResponse } from '../types'

export const useOrdersStore = defineStore('orders', () => {

  const orders  = ref<PaginatedResponse<Order> | null>(null)
  const loading = ref(false)
  const error   = ref<string | null>(null)

  // Conteo de pendientes para el badge en el tab
  const pendingCount = ref(0)

  async function fetchOrders(params: { status?: OrderStatus; page?: number } = {}) {
    loading.value = true
    error.value   = null
    try {
      orders.value = await ordersApi.getAll(params)

      // Si estamos viendo todas, también actualizar el conteo de pendientes
      if (!params.status) {
        pendingCount.value = orders.value.items.filter(
          o => o.status === 'PENDING'
        ).length
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar pedidos'
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(id: number, payload: UpdateOrderStatusPayload) {
    const updated = await ordersApi.updateStatus(id, payload)

    // Actualizar en la lista local sin refetch
    if (orders.value) {
      const idx = orders.value.items.findIndex(o => o.id === id)
      if (idx >= 0) orders.value.items[idx] = updated
    }

    // Restar del conteo de pendientes si se resolvió
    if (payload.status === 'CONFIRMED' || payload.status === 'REJECTED') {
      pendingCount.value = Math.max(0, pendingCount.value - 1)
    }

    return updated
  }

  return {
    orders,
    loading,
    error,
    pendingCount,
    fetchOrders,
    updateStatus,
  }
})