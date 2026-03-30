import { fetcher } from './fetcher'
import type { Product, PaginatedResponse, ProductFilters } from '../types'

export interface CreateProductPayload {
  name:         string
  slug:         string
  description?: string
  price:        number
  comparePrice?: number
  published:    boolean
  categoryId:   number
  tags?:        string[]
}

export type UpdateProductPayload = Partial<CreateProductPayload>

export const productsApi = {
  // ── Público ──────────────────────────────────────
  getAll(filters: ProductFilters = {}) {
    const params = new URLSearchParams()
    if (filters.q)        params.set('q', filters.q)
    if (filters.category) params.set('category', filters.category)
    if (filters.tag)      params.set('tag', filters.tag)
    if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
    if (filters.inStock)  params.set('inStock', 'true')
    if (filters.page)     params.set('page', String(filters.page))
    if (filters.limit)    params.set('limit', String(filters.limit))
    if (filters.orderBy)  params.set('orderBy', filters.orderBy)
    const query = params.toString()
    return fetcher<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`)
  },

  getBySlug(slug: string) {
    return fetcher<Product>(`/products/${slug}`)
  },

  // ── Admin ─────────────────────────────────────────
  getAllAdmin(filters: ProductFilters = {}) {
    const params = new URLSearchParams()
    if (filters.q)                       params.set('q', filters.q)
    if (filters.page)                    params.set('page', String(filters.page))
    if (filters.limit)                   params.set('limit', String(filters.limit))
    if (filters.published !== undefined) params.set('published', String(filters.published))
    const query = params.toString()
    return fetcher<PaginatedResponse<Product>>(
      `/products/admin${query ? `?${query}` : ''}`,
      { auth: true }
    )
  },

  create(payload: CreateProductPayload) {
    return fetcher<Product>('/products', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  update(id: number, payload: UpdateProductPayload) {
    return fetcher<Product>(`/products/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  delete(id: number) {
    return fetcher<void>(`/products/${id}`, {
      method: 'DELETE',
      auth: true,
    })
  },
}