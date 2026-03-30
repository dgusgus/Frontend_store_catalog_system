import { fetcher } from './fetcher'
import type { DiscountResult } from '../types'

export interface Discount {
  id:         number
  code:       string
  type:       'PERCENT' | 'FIXED'
  value:      number
  minAmount?: number
  maxUses?:   number
  usedCount:  number
  active:     boolean
  expiresAt?: string
  createdAt:  string
}

export interface CreateDiscountPayload {
  code:       string
  type:       'PERCENT' | 'FIXED'
  value:      number
  minAmount?: number
  maxUses?:   number
  active?:    boolean
  expiresAt?: string
}

export const discountsApi = {
  // ── Público ──────────────────────────────────────
  validate(code: string, cartAmount: number) {
    return fetcher<DiscountResult>('/discounts/validate', {
      method: 'POST',
      body: JSON.stringify({ code, cartAmount }),
    })
  },

  // ── Admin ─────────────────────────────────────────
  getAll() {
    return fetcher<Discount[]>('/discounts', { auth: true })
  },

  create(payload: CreateDiscountPayload) {
    return fetcher<Discount>('/discounts', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  toggle(id: number) {
    return fetcher<Discount>(`/discounts/${id}/toggle`, {
      method: 'PATCH',
      auth: true,
    })
  },

  delete(id: number) {
    return fetcher<void>(`/discounts/${id}`, {
      method: 'DELETE',
      auth: true,
    })
  },
}