// src/api/orders.ts

import { fetcher } from './fetcher'
import type { PaginatedResponse } from '../types'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'DELIVERED'

export interface OrderItem {
  id:          number
  productId:   number
  variantId:   number | null
  productName: string
  variantName: string | null
  unitPrice:   string
  quantity:    number
  subtotal:    string
}

export interface Order {
  id:             number
  orderNumber:    string
  status:         OrderStatus
  customerName:   string
  customerPhone:  string
  subtotal:       string
  discountCode:   string | null
  discountAmount: string
  total:          string
  adminNote:      string | null
  createdAt:      string
  updatedAt:      string
  user:           { id: number; name: string | null; email: string }
  items:          OrderItem[]
}

export interface CreateOrderPayload {
  customerName:   string
  customerPhone:  string
  discountCode?:  string
  items: {
    productId:  number
    variantId?: number
    quantity:   number
  }[]
}

export interface UpdateOrderStatusPayload {
  status:     'CONFIRMED' | 'REJECTED' | 'DELIVERED'
  adminNote?: string
}

export const ordersApi = {

  // ── Cliente ────────────────────────────────────────────
  create(payload: CreateOrderPayload) {
    return fetcher<Order>('/orders', {
      method: 'POST',
      auth:   true,
      body:   JSON.stringify(payload),
    })
  },

  getMyOrders(page = 1) {
    return fetcher<PaginatedResponse<Order>>(`/orders/my?page=${page}`, {
      auth: true,
    })
  },

  confirmReceived(id: number) {
    return fetcher<Order>(`/orders/${id}/received`, {
      method: 'PATCH',
      auth:   true,
    })
  },

  // ── Admin ──────────────────────────────────────────────
  getAll(params: { status?: OrderStatus; page?: number } = {}) {
    const query = new URLSearchParams()
    if (params.status) query.set('status', params.status)
    if (params.page)   query.set('page', String(params.page))
    const qs = query.toString()
    return fetcher<PaginatedResponse<Order>>(
      `/orders${qs ? `?${qs}` : ''}`,
      { auth: true }
    )
  },

  getById(id: number) {
    return fetcher<Order>(`/orders/${id}`, { auth: true })
  },

  updateStatus(id: number, payload: UpdateOrderStatusPayload) {
    return fetcher<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      auth:   true,
      body:   JSON.stringify(payload),
    })
  },

  deleteRejected(id: number) {
    return fetcher<void>(`/orders/${id}`, {
      method: 'DELETE',
      auth:   true,
    })
  },
}