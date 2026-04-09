// src/stores/cart.store.ts
// Cambios: addItem y updateQuantity validan stock contra la API

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { discountsApi } from '../api/discounts'
import { productsApi }  from '../api/products'
import { ApiRequestError } from '../api/fetcher'
import type { CartItem, DiscountResult, Product, Variant } from '../types'

const STORAGE_KEY = 'cart'

function loadFromStorage(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function saveToStorage(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const useCartStore = defineStore('cart', () => {

  const items           = ref<CartItem[]>(loadFromStorage())
  const discountCode    = ref<string>('')
  const discountResult  = ref<DiscountResult | null>(null)
  const discountLoading = ref(false)
  const discountError   = ref<string | null>(null)

  // ── Getters ────────────────────────────────────────────────
  const itemCount = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0)
  )
  const subtotal = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )
  const discountAmount = computed(() => discountResult.value?.discountAmount ?? 0)
  const total = computed(() => Math.max(0, subtotal.value - discountAmount.value))
  const isEmpty = computed(() => items.value.length === 0)

  // ── Helpers ────────────────────────────────────────────────
  function findIndex(productId: number, variantId?: number): number {
    return items.value.findIndex(
      i => i.productId === productId && i.variantId === variantId
    )
  }

  function persist() { saveToStorage(items.value) }

  // ── addItem con validación de stock ───────────────────────
  // Devuelve un objeto con success y mensaje de error opcional
  async function addItem(
    product: Product,
    variant: Variant | null = null
  ): Promise<{ success: boolean; error?: string }> {

    const idx = findIndex(product.id, variant?.id)
    const currentQty = idx >= 0 ? items.value[idx].quantity : 0
    const newQty     = currentQty + 1

    // Verificar stock disponible
    if (variant) {
      // Refrescar stock desde la API para tener el valor actualizado
      const freshVariant = await getFreshVariantStock(product.slug, variant.id)
      if (freshVariant !== null && freshVariant < newQty) {
        return {
          success: false,
          error: freshVariant === 0
            ? `Sin stock disponible para ${variant.name}`
            : `Solo quedan ${freshVariant} unidades de ${variant.name}`,
        }
      }
    }

    const price = variant?.price ?? product.price

    if (idx >= 0) {
      items.value[idx].quantity = newQty
    } else {
      items.value.push({
        productId:   product.id,
        productName: product.name,
        slug:        product.slug,
        image:       product.images[0]?.url,
        variantId:   variant?.id,
        variantName: variant?.name,
        // Guardamos el stock máximo para validar incrementos sin API
        maxStock:    variant?.stock ?? 9999,
        price:       Number(price),
        quantity:    1,
      })
    }

    persist()

    if (discountResult.value) {
      void applyDiscount(discountCode.value)
    }

    return { success: true }
  }

  // Obtiene el stock actualizado de una variante desde la API
  async function getFreshVariantStock(
    productSlug: string,
    variantId: number
  ): Promise<number | null> {
    try {
      const product = await productsApi.getBySlug(productSlug)
      const variant = product.variants.find(v => v.id === variantId)
      return variant ? variant.stock : null
    } catch {
      // Si falla la API, no bloqueamos — el backend validará al confirmar
      return null
    }
  }

  function removeItem(productId: number, variantId?: number) {
    const idx = findIndex(productId, variantId)
    if (idx < 0) return
    items.value.splice(idx, 1)
    persist()
    if (discountResult.value) void applyDiscount(discountCode.value)
  }

  // updateQuantity con validación de stock local
  function updateQuantity(
    productId: number,
    variantId: number | undefined,
    quantity: number
  ): { success: boolean; error?: string } {
    const idx = findIndex(productId, variantId)
    if (idx < 0) return { success: false }

    if (quantity <= 0) {
      removeItem(productId, variantId)
      return { success: true }
    }

    const item = items.value[idx]

    // Validar contra el maxStock guardado localmente
    if (item.maxStock !== undefined && quantity > item.maxStock) {
      return {
        success: false,
        error:   `Solo hay ${item.maxStock} unidades disponibles`,
      }
    }

    items.value[idx].quantity = quantity
    persist()

    if (discountResult.value) void applyDiscount(discountCode.value)
    return { success: true }
  }

  function clearCart() {
    items.value          = []
    discountCode.value   = ''
    discountResult.value = null
    discountError.value  = null
    persist()
  }

  // ── Descuentos ─────────────────────────────────────────────
  async function applyDiscount(code: string) {
    if (!code.trim()) return
    discountLoading.value = true
    discountError.value   = null
    try {
      discountResult.value = await discountsApi.validate(
        code.trim().toUpperCase(),
        subtotal.value
      )
      discountCode.value = code.trim().toUpperCase()
    } catch (e) {
      discountResult.value = null
      discountError.value  = e instanceof ApiRequestError
        ? e.message
        : 'Error al validar el código'
    } finally {
      discountLoading.value = false
    }
  }

  function removeDiscount() {
    discountCode.value   = ''
    discountResult.value = null
    discountError.value  = null
  }

  return {
    items, discountCode, discountResult,
    discountLoading, discountError,
    itemCount, subtotal, discountAmount, total, isEmpty,
    addItem, removeItem, updateQuantity, clearCart,
    applyDiscount, removeDiscount,
  }
})