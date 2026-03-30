import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productsApi } from '../api/products'
import type { Product, ProductFilters, Pagination } from '../types'

export const useProductsStore = defineStore('products', () => {
  const items = ref<Product[]>([])
  const current = ref<Product | null>(null)
  const pagination = ref<Pagination | null>(null)
  const filters = ref<ProductFilters>({ page: 1, limit: 20, orderBy: 'newest' })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts(newFilters?: ProductFilters) {
    loading.value = true
    error.value = null
    if (newFilters) filters.value = { ...filters.value, ...newFilters }

    try {
      const result = await productsApi.getAll(filters.value)
      items.value = result.items
      pagination.value = result.pagination
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar productos'
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(slug: string) {
    loading.value = true
    error.value = null
    current.value = null

    try {
      current.value = await productsApi.getBySlug(slug)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Producto no encontrado'
    } finally {
      loading.value = false
    }
  }

  function resetFilters() {
    filters.value = { page: 1, limit: 20, orderBy: 'newest' }
  }

  return { items, current, pagination, filters, loading, error, fetchProducts, fetchProduct, resetFilters }
})