<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '../../types'
import { formatPrice, toNumber } from '../../utils/format'
// En el computed de mainImage
import { cloudinaryUrl } from '../../api/cloudinary'

const props = defineProps<{ product: Product }>()

/* const mainImage = computed(() =>
  props.product.images[0]?.url ??
  `https://placehold.co/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(props.product.name)}`
) */

const mainImage = computed(() =>
  props.product.images[0]?.url
    ? cloudinaryUrl(props.product.images[0].url, { width: 400, height: 400 })
    : `https://placehold.co/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(props.product.name)}`
)

const discountPercent = computed(() => {
  if (!props.product.comparePrice) return null
  const price   = toNumber(props.product.price)
  const compare = toNumber(props.product.comparePrice)
  const diff    = compare - price
  return Math.round((diff / compare) * 100)
})

const hasStock = computed(() =>
  props.product.variants.length === 0 ||
  props.product.variants.some(v => v.stock > 0)
)
</script>

<template>
  <RouterLink
    :to="`/product/${product.slug}`"
    class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
  >
    <figure class="relative aspect-square overflow-hidden rounded-t-2xl bg-base-200">
      <img
        :src="mainImage"
        :alt="product.images[0]?.alt ?? product.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <span
        v-if="discountPercent"
        class="absolute top-2 left-2 badge badge-error text-white font-bold text-xs"
      >
        -{{ discountPercent }}%
      </span>
      <div
        v-if="!hasStock"
        class="absolute inset-0 bg-base-100/70 flex items-center justify-center"
      >
        <span class="badge badge-ghost">Sin stock</span>
      </div>
    </figure>

    <div class="card-body p-3 gap-1">
      <span class="text-xs text-base-content/50 uppercase tracking-wide truncate">
        {{ product.category.name }}
      </span>
      <h3 class="font-semibold text-sm leading-tight line-clamp-2 text-base-content">
        {{ product.name }}
      </h3>
      <div v-if="product.tags.length" class="flex gap-1 flex-wrap">
        <span
          v-for="tag in product.tags.slice(0, 2)"
          :key="tag.id"
          class="badge badge-outline badge-xs"
        >
          {{ tag.name }}
        </span>
      </div>
      <!-- ← aquí el cambio: formatPrice() en vez de .toFixed() -->
      <div class="flex items-baseline gap-2 mt-1">
        <span class="font-bold text-base text-base-content">
          ${{ formatPrice(product.price) }}
        </span>
        <span
          v-if="product.comparePrice"
          class="text-xs text-base-content/40 line-through"
        >
          ${{ formatPrice(product.comparePrice) }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>