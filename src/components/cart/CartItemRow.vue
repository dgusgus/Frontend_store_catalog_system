<!-- src/components/cart/CartItemRow.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '../../stores/cart.store'
import type { CartItem } from '../../types'

const props = defineProps<{ item: CartItem }>()
const cart  = useCartStore()

const stockError = ref<string | null>(null)

async function dec() {
  stockError.value = null
  cart.updateQuantity(props.item.productId, props.item.variantId, props.item.quantity - 1)
}

async function inc() {
  stockError.value = null
  const result = cart.updateQuantity(
    props.item.productId,
    props.item.variantId,
    props.item.quantity + 1
  )
  if (!result.success && result.error) {
    stockError.value = result.error
    // El error desaparece solo después de 3 segundos
    setTimeout(() => { stockError.value = null }, 3000)
  }
}

function remove() {
  cart.removeItem(props.item.productId, props.item.variantId)
}

// Stock máximo disponible (guardado cuando se agregó el item)
const atMaxStock = () =>
  props.item.maxStock !== undefined &&
  props.item.quantity >= props.item.maxStock
</script>

<template>
  <div class="flex flex-col py-3 border-b border-base-200 last:border-0 gap-1">
    <div class="flex gap-3">

      <!-- Imagen -->
      <RouterLink :to="`/product/${item.slug}`" class="shrink-0">
        <div class="size-20 rounded-xl overflow-hidden bg-base-200">
          <img v-if="item.image" :src="item.image" :alt="item.productName"
            class="w-full h-full object-cover" loading="lazy" />
          <div v-else class="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
        </div>
      </RouterLink>

      <!-- Info + controles -->
      <div class="flex-1 flex flex-col gap-1 min-w-0">

        <RouterLink :to="`/product/${item.slug}`"
          class="font-semibold text-sm text-base-content leading-tight line-clamp-2">
          {{ item.productName }}
        </RouterLink>

        <span v-if="item.variantName" class="text-xs text-base-content/50">
          {{ item.variantName }}
        </span>

        <span class="text-xs text-base-content/50">
          ${{ item.price.toFixed(2) }} c/u
        </span>

        <!-- Stock disponible -->
        <span v-if="item.maxStock !== undefined && item.maxStock <= 5"
          class="text-xs text-warning">
          ⚠️ Solo {{ item.maxStock }} disponible{{ item.maxStock !== 1 ? 's' : '' }}
        </span>

        <!-- Fila inferior: cantidad + subtotal + eliminar -->
        <div class="flex items-center justify-between mt-1">

          <div class="flex items-center gap-1">
            <button class="btn btn-xs btn-ghost btn-circle"
              :disabled="item.quantity <= 1" @click="dec">−</button>
            <span class="w-6 text-center text-sm font-medium">{{ item.quantity }}</span>
            <button
              class="btn btn-xs btn-ghost btn-circle"
              :class="{ 'btn-disabled opacity-40': atMaxStock() }"
              :disabled="atMaxStock()"
              @click="inc"
            >+</button>
          </div>

          <span class="font-bold text-sm text-base-content">
            ${{ (item.price * item.quantity).toFixed(2) }}
          </span>

          <button class="btn btn-xs btn-ghost text-error" @click="remove"
            aria-label="Eliminar del carrito">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>

        </div>
      </div>
    </div>

    <!-- Error de stock — aparece debajo del item -->
    <Transition name="stock-error">
      <div v-if="stockError"
        class="flex items-center gap-1.5 text-xs text-error bg-error/10 rounded-lg px-3 py-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5 shrink-0" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        {{ stockError }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.stock-error-enter-active,
.stock-error-leave-active {
  transition: all 0.2s ease;
}
.stock-error-enter-from,
.stock-error-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>