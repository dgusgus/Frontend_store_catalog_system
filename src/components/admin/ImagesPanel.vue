<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '../../stores/admin.store'
import { useToast } from '../../composables/useToast'
import { ApiRequestError } from '../../api/fetcher'
import type { Product } from '../../types'
import ImageUploader from './ImageUploader.vue'

const props = defineProps<{ product: Product }>()
const store = useAdminStore()
const toast = useToast()

const showUploader = ref(false)

// Se llama cuando Cloudinary devuelve la URL
async function handleUploaded(url: string) {
  try {
    await store.addImage(props.product.id, {
      url,
      position: props.product.images.length,
    })
    toast.success('Imagen agregada al producto')
    showUploader.value = false
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al guardar imagen')
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

async function move(index: number, direction: -1 | 1) {
  const images   = [...props.product.images]
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= images.length) return
  ;[images[index], images[newIndex]] = [images[newIndex], images[index]]
  try {
    await store.reorderImages(props.product.id, images.map(img => img.id))
  } catch {
    toast.error('Error al reordenar')
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">

    <!-- Grid de imágenes actuales -->
    <div v-if="product.images.length > 0" class="grid grid-cols-3 gap-2">
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
              class="btn btn-xs bg-base-100/90"
              :disabled="index === 0"
              @click="move(index, -1)"
            >←</button>
            <button
              class="btn btn-xs bg-base-100/90"
              :disabled="index === product.images.length - 1"
              @click="move(index, 1)"
            >→</button>
          </div>
          <button
            class="btn btn-xs btn-error text-white"
            @click="handleDelete(image.id)"
          >Eliminar</button>
        </div>
      </div>
    </div>

    <p v-else class="text-xs text-base-content/40 text-center py-2">
      Sin imágenes
    </p>

    <!-- Uploader expandible -->
    <div v-if="showUploader">
      <ImageUploader @uploaded="(url) => handleUploaded(url)" />
      <button
        class="btn btn-ghost btn-xs w-full mt-2"
        @click="showUploader = false"
      >
        Cancelar
      </button>
    </div>

    <button
      v-else
      class="btn btn-ghost btn-outline btn-xs w-full"
      @click="showUploader = true"
    >
      + Subir imagen
    </button>

  </div>
</template>