<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products.store'
import { useToast } from '../composables/useToast'
import type { Variant } from '../types'
import AppNavbar from '../components/ui/AppNavbar.vue'
import ProductGallery from '../components/products/ProductGallery.vue'
import VariantSelector from '../components/products/VariantSelector.vue'
import { useCartStore } from '../stores/cart.store'

const route  = useRoute()
const router = useRouter()
const store  = useProductsStore()
const toast  = useToast()

// Variante seleccionada por el usuario
const selectedVariant = ref<Variant | null>(null)

// ── Carga del producto ─────────────────────────────
onMounted(async () => {
  const slug = route.params.slug as string
  await store.fetchProduct(slug)

  if (store.error) {
    toast.error('Producto no encontrado')
    router.push('/catalog')
  }
})

const product = computed(() => store.current)

const price = computed(() => Number(product.value?.price ?? 0))
const comparePrice = computed(() => {
  if (!product.value?.comparePrice) return null
  return Number(product.value.comparePrice)
})

// ── Precio con descuento ───────────────────────────
const discountPercent = computed(() => {
  if (!comparePrice.value) return null

  const diff = comparePrice.value - price.value
  return Math.round((diff / comparePrice.value) * 100)
})

// ── ¿Se puede agregar al carrito? ──────────────────
// Si tiene variantes, el usuario debe seleccionar una primero
const canAddToCart = computed(() => {
  if (!product.value) return false
  if (product.value.variants.length === 0) return true
  return selectedVariant.value !== null && selectedVariant.value.stock > 0
})

// ── Acción carrito (placeholder — Paso 5 futuro) ───
// Reemplazar la función addToCart placeholder
const cartStore = useCartStore()

function addToCart() {
  if (!canAddToCart.value || !product.value) return

  cartStore.addItem(product.value, selectedVariant.value)

  const label = selectedVariant.value
    ? `${product.value.name} — ${selectedVariant.value.name}`
    : product.value.name

  toast.success(`${label} agregado`)
}
</script>

<template>
  <div class="min-h-screen bg-base-200">

    <AppNavbar />

    <!-- Loading skeleton -->
    <div v-if="store.loading" class="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">
      <div class="skeleton aspect-square w-full rounded-2xl"></div>
      <div class="skeleton h-6 w-3/4 rounded"></div>
      <div class="skeleton h-4 w-1/2 rounded"></div>
      <div class="skeleton h-10 w-full rounded"></div>
    </div>

    <!-- Producto cargado -->
    <main v-else-if="product" class="max-w-2xl mx-auto px-4 pb-24">

      <!-- Galería -->
      <div class="pt-4">
        <ProductGallery :images="product.images" :name="product.name" />
      </div>

      <!-- Info principal -->
      <div class="mt-4 flex flex-col gap-3">

        <!-- Categoría + tags -->
        <div class="flex items-center gap-2 flex-wrap">
          <RouterLink
            :to="`/catalog?category=${product.category.slug}`"
            class="text-xs text-primary font-medium uppercase tracking-wide"
          >
            {{ product.category.name }}
          </RouterLink>
          <span
            v-for="tag in product.tags"
            :key="tag.id"
            class="badge badge-outline badge-xs"
          >
            {{ tag.name }}
          </span>
        </div>

        <!-- Nombre -->
        <h1 class="text-xl font-bold text-base-content leading-snug">
          {{ product.name }}
        </h1>

        <!-- Precio base (cuando NO hay variantes) -->
        <div v-if="product.variants.length === 0" class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-base-content">
            ${{ price.toFixed(2) }}
          </span>
          <span v-if="comparePrice" class="text-sm text-base-content/40 line-through">
            ${{ comparePrice.toFixed(2) }}
          </span>
          <span v-if="discountPercent" class="badge badge-error text-white font-bold text-xs">
            -{{ discountPercent }}%
          </span>
        </div>

        <!-- Precio + selector (cuando SÍ hay variantes) -->
        <div v-else>
          <!-- comparePrice y badge de descuento -->
          <div v-if="comparePrice" class="flex items-center gap-2 mb-2">
            <span class="text-sm text-base-content/40 line-through">
              Antes: ${{ comparePrice.toFixed(2) }}
            </span>
            <span v-if="discountPercent" class="badge badge-error text-white font-bold text-xs">
              -{{ discountPercent }}%
            </span>
          </div>

          <VariantSelector
            v-model="selectedVariant"
            :variants="product.variants"
            :base-price="product.price"
          />
        </div>

        <!-- Descripción -->
        <div v-if="product.description" class="divider my-0"></div>
        <p v-if="product.description" class="text-sm text-base-content/70 leading-relaxed">
          {{ product.description }}
        </p>

      </div>

    </main>

    <!-- Barra fija inferior — botón agregar al carrito -->
    <div
      v-if="product && !store.loading"
      class="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200 p-4 z-40"
    >
      <div class="max-w-2xl mx-auto flex gap-3">

        <!-- Volver al catálogo -->
        <button
          class="btn btn-ghost btn-square"
          @click="router.back()"
          aria-label="Volver"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <!-- Agregar al carrito -->
        <button
          class="btn btn-primary flex-1"
          :disabled="!canAddToCart"
          @click="addToCart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11"/>
          </svg>
          <span v-if="product.variants.length > 0 && !selectedVariant">
            Selecciona una opción
          </span>
          <span v-else>
            Agregar al carrito
          </span>
        </button>

      </div>
    </div>

  </div>
</template>