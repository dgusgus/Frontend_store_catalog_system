<script setup lang="ts">
import { ref } from 'vue'
import { uploadImage, CloudinaryUploadError } from '../../api/cloudinary'
import { useToast } from '../../composables/useToast'

const emit = defineEmits<{
  uploaded: [url: string, publicId: string]
}>()

const toast       = useToast()
const dragging    = ref(false)
const uploading   = ref(false)
const progress    = ref(0)
const previewUrl  = ref<string | null>(null)
const fileInput   = ref<HTMLInputElement | null>(null)

// ── Drag & drop ────────────────────────────────────
function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragging.value = true
}

function onDragLeave() {
  dragging.value = false
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) await handleFile(file)
}

// ── Input file ──────────────────────────────────────
function openPicker() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await handleFile(file)
}

// ── Upload ─────────────────────────────────────────
async function handleFile(file: File) {
  uploading.value  = true
  progress.value   = 0
  previewUrl.value = URL.createObjectURL(file)

  try {
    const result = await uploadImage(file, (pct) => {
      progress.value = pct
    })
    emit('uploaded', result.secure_url, result.public_id)
    toast.success('Imagen subida correctamente')
  } catch (e) {
    previewUrl.value = null
    toast.error(e instanceof CloudinaryUploadError ? e.message : 'Error al subir')
  } finally {
    uploading.value = false
    progress.value  = 0
    // Reset input para permitir subir el mismo archivo de nuevo
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">

    <!-- Zona de drop -->
    <div
      class="border-2 border-dashed rounded-xl transition-colors cursor-pointer"
      :class="[
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-base-300 hover:border-primary/50 hover:bg-base-200/50',
        uploading ? 'pointer-events-none' : '',
      ]"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="openPicker"
    >
      <!-- Estado: preview cargando -->
      <div v-if="uploading" class="p-4 flex flex-col items-center gap-2">
        <div class="relative size-16">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            class="size-16 rounded-lg object-cover opacity-60"
            alt=""
          />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="loading loading-spinner loading-sm text-primary"></span>
          </div>
        </div>
        <!-- Barra de progreso -->
        <div class="w-full bg-base-200 rounded-full h-1.5">
          <div
            class="bg-primary h-1.5 rounded-full transition-all duration-150"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <p class="text-xs text-base-content/50">Subiendo... {{ progress }}%</p>
      </div>

      <!-- Estado: idle -->
      <div v-else class="p-6 flex flex-col items-center gap-2 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="size-8 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <div>
          <p class="text-sm font-medium text-base-content/70">
            Arrastra una imagen o toca para elegir
          </p>
          <p class="text-xs text-base-content/40 mt-0.5">
            JPG, PNG o WebP · máx. 5MB
          </p>
        </div>
      </div>
    </div>

    <!-- Input oculto -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="onFileChange"
    />

  </div>
</template>