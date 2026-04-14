<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '../stores/cart.store'
import { useToast } from '../composables/useToast'
import AppNavbar from '../components/ui/AppNavbar.vue'
import CartItemRow from '../components/cart/CartItemRow.vue'
//import CartTimer from '../components/cart/CartTimer.vue'

const cart = useCartStore()
const toast = useToast()

const couponInput = ref(cart.discountCode)

async function handleApplyDiscount() {
  if (!couponInput.value.trim()) return
  await cart.applyDiscount(couponInput.value)
  if (cart.discountResult) {
    toast.success(`Código aplicado — ahorras $${cart.discountResult.discountAmount.toFixed(2)}`)
  }
}

function handleRemoveDiscount() {
  cart.removeDiscount()
  couponInput.value = ''
  toast.info('Código eliminado')
}

function handleClearCart() {
  cart.clearCart()
  toast.info('Carrito vaciado')
}
</script>

<template>
  <div class="min-h-screen bg-base-200">

    <AppNavbar />

    <main class="max-w-2xl mx-auto px-4 pb-32">

      <!-- Header -->
      <div class="flex items-center justify-between py-4">
        <div>
          <h1 class="text-xl font-bold text-base-content">Carrito</h1>
          <p class="text-sm text-base-content/50 mt-0.5">
            {{ cart.itemCount }} producto{{ cart.itemCount !== 1 ? 's' : '' }}
          </p>
        </div>
        <button v-if="!cart.isEmpty" class="btn btn-ghost btn-sm text-error" @click="handleClearCart">
          Vaciar
        </button>
      </div>

      <!-- Carrito vacío -->
      <div v-if="cart.isEmpty" class="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <span class="text-6xl">🛒</span>
        <p class="text-base-content/60">Tu carrito está vacío</p>
        <RouterLink to="/catalog" class="btn btn-primary btn-sm">
          Ver productos
        </RouterLink>
      </div>
      <!-- Timer del carrito -->
      <!-- <CartTimer v-if="!cart.isEmpty" class="mb-2" /> -->
      <!-- Lista de items -->
      <div v-else class="flex flex-col gap-4">

        <!-- Items -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <CartItemRow v-for="item in cart.items" :key="`${item.productId}-${item.variantId}`" :item="item" />
          </div>
        </div>

        <!-- Código de descuento -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-3">
            <h2 class="font-semibold text-sm">Código de descuento</h2>

            <!-- Descuento ya aplicado -->
            <div v-if="cart.discountResult" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="badge badge-success badge-sm">✓</span>
                <span class="font-mono font-bold text-sm">{{ cart.discountResult.code }}</span>
                <span class="text-xs text-success">
                  −${{ cart.discountResult.discountAmount.toFixed(2) }}
                </span>
              </div>
              <button class="btn btn-ghost btn-xs text-error" @click="handleRemoveDiscount">
                Quitar
              </button>
            </div>

            <!-- Input para ingresar código -->
            <div v-else class="flex gap-2">
              <input v-model="couponInput" type="text" placeholder="VERANO20"
                class="input input-bordered input-sm flex-1 uppercase font-mono tracking-widest"
                :class="{ 'input-error': cart.discountError }" :disabled="cart.discountLoading"
                @keyup.enter="handleApplyDiscount" />
              <button class="btn btn-sm btn-outline" :disabled="!couponInput.trim() || cart.discountLoading"
                @click="handleApplyDiscount">
                <span v-if="cart.discountLoading" class="loading loading-spinner loading-xs"></span>
                <span v-else>Aplicar</span>
              </button>
            </div>

            <!-- Error del código -->
            <p v-if="cart.discountError" class="text-xs text-error">
              {{ cart.discountError }}
            </p>

          </div>
        </div>

        <!-- Resumen de totales -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-2">
            <h2 class="font-semibold text-sm mb-1">Resumen</h2>

            <div class="flex justify-between text-sm">
              <span class="text-base-content/60">Subtotal</span>
              <span>${{ cart.subtotal.toFixed(2) }}</span>
            </div>

            <div v-if="cart.discountAmount > 0" class="flex justify-between text-sm text-success">
              <span>Descuento</span>
              <span>−${{ cart.discountAmount.toFixed(2) }}</span>
            </div>

            <div class="divider my-1"></div>

            <div class="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>${{ cart.total.toFixed(2) }}</span>
            </div>

            <p v-if="cart.discountAmount > 0" class="text-xs text-success text-right">
              ¡Ahorras ${{ cart.discountAmount.toFixed(2) }}!
            </p>
          </div>
        </div>

      </div>
    </main>

    <!-- Barra fija inferior — checkout -->
    <div v-if="!cart.isEmpty" class="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200 p-4 z-40">
      <div class="max-w-2xl mx-auto flex gap-3 items-center">
        <div class="flex-1">
          <p class="text-xs text-base-content/50">Total a pagar</p>
          <p class="font-bold text-lg">${{ cart.total.toFixed(2) }}</p>
        </div>
        <!-- Reemplaza el botón del checkout en la barra fija -->
        <!-- En la barra fija inferior, reemplaza el botón de checkout -->
        <div class="flex-1">
          <p class="text-xs text-base-content/50">Total a pagar</p>
          <p class="font-bold text-lg">${{ cart.total.toFixed(2) }}</p>
        </div>
        <RouterLink to="/checkout" class="btn btn-primary flex-1 gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Ver cotización
        </RouterLink>
      </div>
    </div>

  </div>
</template>