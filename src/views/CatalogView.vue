<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useProductsStore } from '../stores/products.store'
import { categoriesApi } from '../api/categories'
import type { Category, ProductFilters } from '../types'
import AppNavbar from '../components/ui/AppNavbar.vue'
import ProductCard from '../components/products/ProductCard.vue'
import ProductCardSkeleton from '../components/products/ProductCardSkeleton.vue'
import CatalogFilters from '../components/products/CatalogFilters.vue'

const store      = useProductsStore()
const categories = ref<Category[]>([])

// ── Carga inicial ──────────────────────────────────
onMounted(async () => {
  categories.value = await categoriesApi.getAll().catch(() => [])
  await store.fetchProducts()
})

// ── Filtros: CatalogFilters emite → fetch directo ──
// Sin watch — evita el loop reactivo
function updateFilters(filters: ProductFilters) {
  store.fetchProducts(filters)
}

// ── Paginación ─────────────────────────────────────
function goToPage(page: number) {
  store.fetchProducts({ ...store.filters, page })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-base-200">

    <AppNavbar />

    <main class="max-w-2xl mx-auto px-4 pb-8">

      <!-- Header -->
      <div class="py-4">
        <h1 class="text-xl font-bold text-base-content">Catálogo</h1>
        <p v-if="store.pagination" class="text-sm text-base-content/50 mt-0.5">
          {{ store.pagination.total }}
          producto{{ store.pagination.total !== 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Filtros -->
      <CatalogFilters
        :categories="categories"
        :model-value="store.filters"
        @update:model-value="updateFilters"
        class="mb-4"
      />

      <!-- Error -->
      <div v-if="store.error" class="alert alert-error mb-4">
        <span>{{ store.error }}</span>
        <button class="btn btn-sm btn-ghost" @click="store.fetchProducts()">
          Reintentar
        </button>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <template v-if="store.loading">
          <ProductCardSkeleton v-for="n in 6" :key="n" />
        </template>
        <template v-else>
          <ProductCard
            v-for="product in store.items"
            :key="product.id"
            :product="product"
          />
        </template>
      </div>

      <!-- Sin resultados -->
      <div
        v-if="!store.loading && store.items.length === 0 && !store.error"
        class="flex flex-col items-center justify-center py-16 text-center gap-3"
      >
        <span class="text-5xl">🔍</span>
        <p class="text-base-content/60 text-sm">
          No encontramos productos con esos filtros
        </p>
        <button
          class="btn btn-ghost btn-sm"
          @click="store.resetFilters(); store.fetchProducts()"
        >
          Ver todos los productos
        </button>
      </div>

      <!-- Paginación -->
      <div
        v-if="store.pagination && store.pagination.totalPages > 1"
        class="flex justify-center items-center gap-2 mt-6"
      >
        <button
          class="btn btn-sm btn-ghost"
          :disabled="!store.pagination.hasPrev"
          @click="goToPage(store.pagination!.page - 1)"
        >
          ← Anterior
        </button>
        <span class="text-sm text-base-content/60">
          {{ store.pagination.page }} / {{ store.pagination.totalPages }}
        </span>
        <button
          class="btn btn-sm btn-ghost"
          :disabled="!store.pagination.hasNext"
          @click="goToPage(store.pagination!.page + 1)"
        >
          Siguiente →
        </button>
      </div>

    </main>
  </div>
</template>