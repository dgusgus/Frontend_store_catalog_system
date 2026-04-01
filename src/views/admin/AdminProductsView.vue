<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAdminStore } from '../../stores/admin.store'
import { useToast } from '../../composables/useToast'
import { ApiRequestError } from '../../api/fetcher'
import type { Product } from '../../types'
import type { CreateProductPayload } from '../../api/products'
import ProductFormModal from '../../components/admin/ProductFormModal.vue'

import VariantsPanel from '../../components/admin/VariantsPanel.vue'
import ImagesPanel from '../../components/admin/ImagesPanel.vue'

const store   = useAdminStore()
const toast   = useToast()

const modalOpen    = ref(false)
const editProduct  = ref<Product | null>(null)

// Agrega este estado para controlar qué producto está expandido
const expandedId  = ref<number | null>(null)
const expandedTab = ref<'variants' | 'images'>('variants')

onMounted(() => store.fetchProducts())

function openCreate() {
  editProduct.value = null
  modalOpen.value   = true
}

function openEdit(product: Product) {
  editProduct.value = product
  modalOpen.value   = true
}

async function handleSaved(payload: CreateProductPayload, id?: number) {
  try {
    if (id) {
      await store.updateProduct(id, payload)
      toast.success('Producto actualizado')
    } else {
      await store.createProduct(payload)
      toast.success('Producto creado')
    }
    modalOpen.value = false
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al guardar')
  }
}

async function handleDelete(product: Product) {
  if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return
  try {
    await store.deleteProduct(product.id)
    toast.success('Producto eliminado')
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al eliminar')
  }
}

async function togglePublished(product: Product) {
  try {
    await store.updateProduct(product.id, { published: !product.published })
    toast.success(product.published ? 'Pasado a borrador' : 'Publicado')
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error')
  }
}

function toggleExpand(productId: number, tab: 'variants' | 'images') {
  if (expandedId.value === productId && expandedTab.value === tab) {
    expandedId.value = null
  } else {
    expandedId.value  = productId
    expandedTab.value = tab
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-bold text-lg">Productos</h2>
        <p class="text-sm text-base-content/50">
          {{ store.products?.pagination.total ?? 0 }} en total
        </p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openCreate">
        + Nuevo
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.productsLoading" class="flex flex-col gap-2">
      <div v-for="n in 5" :key="n" class="skeleton h-16 w-full rounded-xl"></div>
    </div>

    <!-- Error -->
    <div v-else-if="store.productsError" class="alert alert-error">
      <span>{{ store.productsError }}</span>
      <button class="btn btn-sm btn-ghost" @click="store.fetchProducts()">Reintentar</button>
    </div>

    <!-- Tabla de productos -->
   <div v-for="product in store.products?.items" :key="product.id" class="card bg-base-100 shadow-sm overflow-hidden">
      <!-- Fila principal -->
      <div class="card-body p-3 flex-row items-center gap-3">

        <!-- Imagen miniatura -->
        <div class="size-14 rounded-lg overflow-hidden bg-base-200 shrink-0">
          <img v-if="product.images[0]" :src="product.images[0].url" :alt="product.name"
            class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-lg">📦</div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm truncate">{{ product.name }}</p>
          <p class="text-xs text-base-content/50">
            ${{ Number(product.price).toFixed(2) }} · {{ product.category.name }}
          </p>
          <!-- Botones expandir -->
          <div class="flex gap-1 mt-1">
            <button class="badge badge-xs cursor-pointer transition-colors" :class="expandedId === product.id && expandedTab === 'variants'
              ? 'badge-primary'
              : 'badge-ghost hover:badge-primary'" @click="toggleExpand(product.id, 'variants')">
              {{ product.variants.length }} variante{{ product.variants.length !== 1 ? 's' : '' }}
            </button>
            <button class="badge badge-xs cursor-pointer transition-colors" :class="expandedId === product.id && expandedTab === 'images'
              ? 'badge-secondary'
              : 'badge-ghost hover:badge-secondary'" @click="toggleExpand(product.id, 'images')">
              {{ product.images.length }} imagen{{ product.images.length !== 1 ? 'es' : '' }}
            </button>
            <span class="badge badge-xs" :class="product.published ? 'badge-success' : 'badge-ghost'">
              {{ product.published ? 'Publicado' : 'Borrador' }}
            </span>
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex flex-col gap-1 shrink-0">
          <button class="btn btn-xs btn-ghost" @click="togglePublished(product)" title="Cambiar estado">
            {{ product.published ? '📤' : '📥' }}
          </button>
          <button class="btn btn-xs btn-ghost" @click="openEdit(product)" title="Editar">✏️</button>
          <button class="btn btn-xs btn-ghost text-error" @click="handleDelete(product)" title="Eliminar">🗑️</button>
        </div>
      </div>

      <!-- Panel expandible -->
      <Transition name="expand">
        <div v-if="expandedId === product.id" class="border-t border-base-200 bg-base-50 p-3">
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
            {{ expandedTab === 'variants' ? 'Variantes' : 'Imágenes' }}
          </p>
          <VariantsPanel v-if="expandedTab === 'variants'" :product="product" />
          <ImagesPanel v-else :product="product" />
        </div>
      </Transition>
    </div>

    <!-- Paginación -->
    <div
      v-if="store.products && store.products.pagination.totalPages > 1"
      class="flex justify-center gap-2"
    >
      <button
        class="btn btn-sm btn-ghost"
        :disabled="!store.products.pagination.hasPrev"
        @click="store.fetchProducts(store.products.pagination.page - 1)"
      >← Anterior</button>
      <span class="btn btn-sm btn-ghost no-animation">
        {{ store.products.pagination.page }} / {{ store.products.pagination.totalPages }}
      </span>
      <button
        class="btn btn-sm btn-ghost"
        :disabled="!store.products.pagination.hasNext"
        @click="store.fetchProducts(store.products.pagination.page + 1)"
      >Siguiente →</button>
    </div>

  </div>

  <!-- Modal -->
  <ProductFormModal
    :open="modalOpen"
    :product="editProduct"
    @close="modalOpen = false"
    @saved="handleSaved"
  />
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 600px;
  opacity: 1;
}
</style>