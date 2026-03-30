import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productsApi } from '../api/products'
import { discountsApi } from '../api/discounts'
import { adminApi } from '../api/admin'
import type { Product, AuthUser, PaginatedResponse } from '../types'
import type { Discount, CreateDiscountPayload } from '../api/discounts'
import type { CreateProductPayload, UpdateProductPayload } from '../api/products'

export const useAdminStore = defineStore('admin', () => {

  // ── Products ───────────────────────────────────────
  const products        = ref<PaginatedResponse<Product> | null>(null)
  const productsLoading = ref(false)
  const productsError   = ref<string | null>(null)

  async function fetchProducts(page = 1) {
    productsLoading.value = true
    productsError.value   = null
    try {
      products.value = await productsApi.getAllAdmin({ page, limit: 20 })
    } catch (e) {
      productsError.value = e instanceof Error ? e.message : 'Error al cargar productos'
    } finally {
      productsLoading.value = false
    }
  }

  async function createProduct(payload: CreateProductPayload) {
    const created = await productsApi.create(payload)
    await fetchProducts()
    return created
  }

  async function updateProduct(id: number, payload: UpdateProductPayload) {
    const updated = await productsApi.update(id, payload)
    // Actualiza el item en la lista local sin refetch
    if (products.value) {
      const idx = products.value.items.findIndex(p => p.id === id)
      if (idx >= 0) products.value.items[idx] = updated
    }
    return updated
  }

  async function deleteProduct(id: number) {
    await productsApi.delete(id)
    if (products.value) {
      products.value.items = products.value.items.filter(p => p.id !== id)
      products.value.pagination.total--
    }
  }

  // ── Discounts ──────────────────────────────────────
  const discounts        = ref<Discount[]>([])
  const discountsLoading = ref(false)
  const discountsError   = ref<string | null>(null)

  async function fetchDiscounts() {
    discountsLoading.value = true
    discountsError.value   = null
    try {
      discounts.value = await discountsApi.getAll()
    } catch (e) {
      discountsError.value = e instanceof Error ? e.message : 'Error al cargar descuentos'
    } finally {
      discountsLoading.value = false
    }
  }

  async function createDiscount(payload: CreateDiscountPayload) {
    const created = await discountsApi.create(payload)
    discounts.value.unshift(created)
    return created
  }

  async function toggleDiscount(id: number) {
    const updated = await discountsApi.toggle(id)
    const idx = discounts.value.findIndex(d => d.id === id)
    if (idx >= 0) discounts.value[idx] = updated
  }

  async function deleteDiscount(id: number) {
    await discountsApi.delete(id)
    discounts.value = discounts.value.filter(d => d.id !== id)
  }

  // ── Users ──────────────────────────────────────────
  const users        = ref<AuthUser[]>([])
  const usersLoading = ref(false)
  const usersError   = ref<string | null>(null)

  async function fetchUsers() {
    usersLoading.value = true
    usersError.value   = null
    try {
      users.value = await adminApi.getUsers()
    } catch (e) {
      usersError.value = e instanceof Error ? e.message : 'Error al cargar usuarios'
    } finally {
      usersLoading.value = false
    }
  }

  async function changeUserRole(userId: number, role: 'USER' | 'ADMIN') {
    const updated = await adminApi.changeRole(userId, role)
    const idx = users.value.findIndex(u => u.id === userId)
    if (idx >= 0) users.value[idx] = updated
  }

  return {
    // products
    products, productsLoading, productsError,
    fetchProducts, createProduct, updateProduct, deleteProduct,
    // discounts
    discounts, discountsLoading, discountsError,
    fetchDiscounts, createDiscount, toggleDiscount, deleteDiscount,
    // users
    users, usersLoading, usersError,
    fetchUsers, changeUserRole,
  }
})