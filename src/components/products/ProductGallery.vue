<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProductImage } from '../../types'

import { cloudinaryUrl } from '../../api/cloudinary'

const props = defineProps<{ images: ProductImage[]; name: string }>()

const activeIndex = ref(0)

/* const activeImage = computed(() =>
  props.images[activeIndex.value]?.url ??
  `https://placehold.co/600x600/f3f4f6/9ca3af?text=${encodeURIComponent(props.name)}`
) */

const activeImage = computed(() =>
  props.images[activeIndex.value]?.url
    ? cloudinaryUrl(props.images[activeIndex.value].url, { width: 600, height: 600 })
    : `https://placehold.co/600x600/f3f4f6/9ca3af?text=${encodeURIComponent(props.name)}`
)

const activeAlt = computed(() =>
  props.images[activeIndex.value]?.alt ?? props.name
)
</script>

<template>
  <div class="flex flex-col gap-2">

    <!-- Imagen principal -->
    <div class="aspect-square w-full overflow-hidden rounded-2xl bg-base-200">
      <Transition name="fade" mode="out-in">
        <img
          :key="activeIndex"
          :src="activeImage"
          :alt="activeAlt"
          class="w-full h-full object-cover"
        />
      </Transition>
    </div>

    <!-- Thumbnails — solo si hay más de 1 imagen -->
    <div v-if="images.length > 1" class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="(img, i) in images"
        :key="img.id"
        class="shrink-0 size-16 rounded-xl overflow-hidden border-2 transition-colors"
        :class="i === activeIndex
          ? 'border-primary'
          : 'border-transparent opacity-60 hover:opacity-100'"
        @click="activeIndex = i"
      >
        <img
          :src="img.url"
          :alt="img.alt ?? name"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </button>
    </div>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>