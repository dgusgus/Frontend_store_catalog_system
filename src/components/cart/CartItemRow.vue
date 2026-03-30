<script setup lang="ts">
import { useCartStore } from '../../stores/cart.store'
import type { CartItem } from '../../types'

const props = defineProps<{ item: CartItem }>()
const cart  = useCartStore()

function dec() {
  cart.updateQuantity(props.item.productId, props.item.variantId, props.item.quantity - 1)
}
function inc() {
  cart.updateQuantity(props.item.productId, props.item.variantId, props.item.quantity + 1)
}
function remove() {
  cart.removeItem(props.item.productId, props.item.variantId)
}
</script>

<template>
  <div class="flex gap-3 py-3 border-b border-base-200 last:border-0">

    <!-- Imagen -->
    <RouterLink :to="`/product/${item.slug}`" class="shrink-0">
      <div class="size-20 rounded-xl overflow-hidden bg-base-200">
        <img
          v-if="item.image"
          :src="item.image"
          :alt="item.productName"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-2xl">
          🛍️
        </div>
      </div>
    </RouterLink>

    <!-- Info + controles -->
    <div class="flex-1 flex flex-col gap-1 min-w-0">

      <!-- Nombre -->
      <RouterLink
        :to="`/product/${item.slug}`"
        class="font-semibold text-sm text-base-content leading-tight line-clamp-2"
      >
        {{ item.productName }}
      </RouterLink>

      <!-- Variante -->
      <span v-if="item.variantName" class="text-xs text-base-content/50">
        {{ item.variantName }}
      </span>

      <!-- Precio unitario -->
      <span class="text-xs text-base-content/50">
        ${{ item.price.toFixed(2) }} c/u
      </span>

      <!-- Fila inferior: cantidad + subtotal + eliminar -->
      <div class="flex items-center justify-between mt-1">

        <!-- Control de cantidad -->
        <div class="flex items-center gap-1">
          <button
            class="btn btn-xs btn-ghost btn-circle"
            :disabled="item.quantity <= 1"
            @click="dec"
          >
            −
          </button>
          <span class="w-6 text-center text-sm font-medium">
            {{ item.quantity }}
          </span>
          <button
            class="btn btn-xs btn-ghost btn-circle"
            @click="inc"
          >
            +
          </button>
        </div>

        <!-- Subtotal de esta fila -->
        <span class="font-bold text-sm text-base-content">
          ${{ (item.price * item.quantity).toFixed(2) }}
        </span>

        <!-- Eliminar -->
        <button
          class="btn btn-xs btn-ghost text-error"
          @click="remove"
          aria-label="Eliminar del carrito"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>

      </div>
    </div>
  </div>
</template>