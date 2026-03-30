import { fetcher } from './fetcher'
import type { Product, PaginatedResponse, ProductFilters } from '../types'

export const productsApi = {
  getAll(filters: ProductFilters = {}) {
    const params = new URLSearchParams()
    if (filters.q)         params.set('q', filters.q)
    if (filters.category)  params.set('category', filters.category)
    if (filters.tag)       params.set('tag', filters.tag)
    if (filters.minPrice)  params.set('minPrice', String(filters.minPrice))
    if (filters.maxPrice)  params.set('maxPrice', String(filters.maxPrice))
    if (filters.inStock)   params.set('inStock', 'true')
    if (filters.page)      params.set('page', String(filters.page))
    if (filters.limit)     params.set('limit', String(filters.limit))
    if (filters.orderBy)   params.set('orderBy', filters.orderBy)

    const query = params.toString()
    return fetcher<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`)
  },

  getBySlug(slug: string) {
    return fetcher<Product>(`/products/${slug}`)
  },
}