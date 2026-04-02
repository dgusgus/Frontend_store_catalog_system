import { fetcher } from './fetcher'
import type { Category } from '../types'

export interface CreateCategoryPayload {
  name:         string
  slug:         string
  description?: string
  parentId?:    number
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>

export const categoriesApi = {
  // ── Público ──────────────────────────────────────
  getAll() {
    return fetcher<Category[]>('/categories')
  },

  getBySlug(slug: string) {
    return fetcher<Category>(`/categories/${slug}`)
  },

  // ── Admin ─────────────────────────────────────────
  create(payload: CreateCategoryPayload) {
    return fetcher<Category>('/categories', {
      method: 'POST',
      auth:   true,
      body:   JSON.stringify(payload),
    })
  },

  update(id: number, payload: UpdateCategoryPayload) {
    return fetcher<Category>(`/categories/${id}`, {
      method: 'PATCH',
      auth:   true,
      body:   JSON.stringify(payload),
    })
  },

  delete(id: number) {
    return fetcher<void>(`/categories/${id}`, {
      method: 'DELETE',
      auth:   true,
    })
  },
}