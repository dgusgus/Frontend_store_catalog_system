import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { discountsApi } from '../api/discounts'
import { ApiRequestError } from '../api/fetcher'
import type { CartItem, DiscountResult, Product, Variant } from '../types'

const STORAGE_KEY = 'cart'

// Persiste y recupera el carrito en localStorage
function loadFromStorage(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const useCartStore = defineStore('cart', () => {

  // ── State ──────────────────────────────────────────
  const items           = ref<CartItem[]>(loadFromStorage())
  const discountCode    = ref<string>('')
  const discountResult  = ref<DiscountResult | null>(null)
  const discountLoading = ref(false)
  const discountError   = ref<string | null>(null)

  // ── Getters ────────────────────────────────────────
  const itemCount = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0)
  )

  const subtotal = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )

  const discountAmount = computed(() =>
    discountResult.value?.discountAmount ?? 0
  )

  const total = computed(() =>
    Math.max(0, subtotal.value - discountAmount.value)
  )

  const isEmpty = computed(() => items.value.length === 0)

  // ── Helpers internos ───────────────────────────────
  function findIndex(productId: number, variantId?: number): number {
    return items.value.findIndex(
      i => i.productId === productId && i.variantId === variantId
    )
  }

  function persist() {
    saveToStorage(items.value)
  }

  // ── Actions ────────────────────────────────────────
  function addItem(product: Product, variant: Variant | null = null) {
    const price = variant?.price ?? product.price
    const idx   = findIndex(product.id, variant?.id)

    if (idx >= 0) {
      // Ya existe → incrementar cantidad
      items.value[idx].quantity++
    } else {
      items.value.push({
        productId:   product.id,
        productName: product.name,
        slug:        product.slug,
        image:       product.images[0]?.url,
        variantId:   variant?.id,
        variantName: variant?.name,
        price:       Number(price),
        quantity: 1,
      })
    }

    persist()
    // Si ya había un descuento aplicado, revalidar con el nuevo subtotal
    if (discountResult.value) {
      void applyDiscount(discountCode.value)
    }
  }

  function removeItem(productId: number, variantId?: number) {
    const idx = findIndex(productId, variantId)
    if (idx < 0) return
    items.value.splice(idx, 1)
    persist()
    if (discountResult.value) void applyDiscount(discountCode.value)
  }

  function updateQuantity(productId: number, variantId: number | undefined, quantity: number) {
    const idx = findIndex(productId, variantId)
    if (idx < 0) return
    if (quantity <= 0) {
      removeItem(productId, variantId)
      return
    }
    items.value[idx].quantity = quantity
    persist()
    if (discountResult.value) void applyDiscount(discountCode.value)
  }

  function clearCart() {
    items.value          = []
    discountCode.value   = ''
    discountResult.value = null
    discountError.value  = null
    persist()
  }

  // ── Descuentos ─────────────────────────────────────
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
    // state
    items, discountCode, discountResult,
    discountLoading, discountError,
    // getters
    itemCount, subtotal, discountAmount, total, isEmpty,
    // actions
    addItem, removeItem, updateQuantity, clearCart,
    applyDiscount, removeDiscount,
  }
})