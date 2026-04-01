<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '../../stores/admin.store'
import { useToast } from '../../composables/useToast'
import { ApiRequestError } from '../../api/fetcher'
import type { Product } from '../../types'

const props = defineProps<{ product: Product }>()
const store = useAdminStore()
const toast = useToast()

const showForm = ref(false)
const saving   = ref(false)
const newImage = ref({ url: '', alt: '' })

async function handleAdd() {
  if (!newImage.value.url) return
  saving.value = true
  try {
    await store.addImage(props.product.id, {
      url:      newImage.value.url,
      alt:      newImage.value.alt || undefined,
      position: props.product.images.length,
    })
    toast.success('Imagen agregada')
    newImage.value = { url: '', alt: '' }
    showForm.value = false
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'URL de imagen inválida')
  } finally {
    saving.value = false
  }
}

async function handleDelete(imageId: number) {
  if (!confirm('¿Eliminar esta imagen?')) return
  try {
    await store.deleteImage(props.product.id, imageId)
    toast.success('Imagen eliminada')
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al eliminar')
  }
}

// Mover imagen arriba o abajo en el orden
async function move(index: number, direction: -1 | 1) {
  const images   = [...props.product.images]
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= images.length) return

  // Swap
  ;[images[index], images[newIndex]] = [images[newIndex], images[index]]
  const newOrder = images.map(img => img.id)

  try {
    await store.reorderImages(props.product.id, newOrder)
  } catch (e) {
    toast.error('Error al reordenar')
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">

    <!-- Grid de imágenes actuales -->
    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="(image, index) in product.images"
        :key="image.id"
        class="relative group rounded-xl overflow-hidden border border-base-200 aspect-square bg-base-200"
      >
        <img :src="image.url" :alt="image.alt ?? ''" class="w-full h-full object-cover" />

        <!-- Badge posición -->
        <span class="absolute top-1 left-1 badge badge-xs badge-neutral">
          {{ index === 0 ? 'Principal' : `#${index + 1}` }}
        </span>

        <!-- Controles overlay -->
        <div class="absolute inset-0 bg-base-300/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
          <div class="flex gap-1">
            <button
              class="btn btn-xs btn-ghost bg-base-100/80"
              :disabled="index === 0"
              @click="move(index, -1)"
              title="Mover arriba"
            >←</button>
            <button
              class="btn btn-xs btn-ghost bg-base-100/80"
              :disabled="index === product.images.length - 1"
              @click="move(index, 1)"
              title="Mover abajo"
            >→</button>
          </div>
          <button
            class="btn btn-xs btn-error bg-error/90 text-white"
            @click="handleDelete(image.id)"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Sin imágenes -->
    <p v-if="product.images.length === 0" class="text-xs text-base-content/40 text-center py-2">
      Sin imágenes
    </p>

    <!-- Formulario nueva imagen -->
    <div v-if="showForm" class="rounded-lg border border-primary/30 bg-primary/5 p-3 flex flex-col gap-2">
      <p class="text-xs font-semibold text-primary">Agregar imagen por URL</p>
      <input
        v-model="newImage.url"
        type="url"
        placeholder="https://ejemplo.com/imagen.jpg"
        class="input input-xs input-bordered w-full"
      />
      <input
        v-model="newImage.alt"
        type="text"
        placeholder="Descripción de la imagen (opcional)"
        class="input input-xs input-bordered w-full"
      />
      <!-- Preview -->
      <div v-if="newImage.url" class="w-20 h-20 rounded-lg overflow-hidden bg-base-200">
        <img :src="newImage.url" alt="preview" class="w-full h-full object-cover" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
      </div>
      <div class="flex gap-2 justify-end">
        <button class="btn btn-xs btn-ghost" @click="showForm = false; newImage = { url: '', alt: '' }">Cancelar</button>
        <button
          class="btn btn-xs btn-primary"
          :disabled="!newImage.url || saving"
          @click="handleAdd"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs"></span>
          Agregar
        </button>
      </div>
    </div>

    <button v-if="!showForm" class="btn btn-xs btn-ghost btn-outline w-full" @click="showForm = true">
      + Agregar imagen
    </button>

  </div>
</template>