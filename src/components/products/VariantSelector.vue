<script setup lang="ts">
import { computed } from 'vue'
import type { Variant } from '../../types'

const props = defineProps<{
  variants: Variant[]
  modelValue: Variant | null
  basePrice: string | number
}>()

const emit = defineEmits<{
  'update:modelValue': [variant: Variant | null]
}>()

// Precio efectivo según la variante seleccionada
const effectivePrice = computed(() => {
  if (!props.modelValue) return props.basePrice
  return props.modelValue.price ?? props.basePrice
})

function select(variant: Variant) {
  // Si clickea la misma variante, la deselecciona
  if (props.modelValue?.id === variant.id) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', variant)
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">

    <!-- Precio efectivo -->
       <div class="flex items-baseline gap-1">
            <span class="text-2xl font-bold text-base-content">
                ${{ Number(effectivePrice).toFixed(2) }}
            </span>
            <span v-if="modelValue?.price && Number(modelValue.price) !== Number(basePrice)"
                class="text-sm text-base-content/50">
                (precio de esta variante)
            </span>

        </div>



    <!-- Botones de variante -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="variant in variants"
        :key="variant.id"
        class="btn btn-sm transition-all"
        :class="[
          modelValue?.id === variant.id
            ? 'btn-primary'
            : 'btn-outline',
          variant.stock === 0
            ? 'opacity-40 line-through cursor-not-allowed'
            : ''
        ]"
        :disabled="variant.stock === 0"
        :title="variant.stock === 0 ? 'Sin stock' : `Stock: ${variant.stock}`"
        @click="select(variant)"
      >
        {{ variant.name }}
      </button>
    </div>

    <!-- Stock de la variante seleccionada -->
    <p v-if="modelValue" class="text-xs text-base-content/50">
      <span v-if="modelValue.stock > 10">✅ En stock</span>
      <span v-else-if="modelValue.stock > 0" class="text-warning">
        ⚠️ Solo {{ modelValue.stock }} disponible{{ modelValue.stock > 1 ? 's' : '' }}
      </span>
      <span v-else class="text-error">❌ Sin stock</span>
    </p>

  </div>
</template>