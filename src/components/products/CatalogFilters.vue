<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Category, ProductFilters } from '../../types'

const props = defineProps<{
  categories: Category[]
  modelValue: ProductFilters
}>()

const emit = defineEmits<{
  'update:modelValue': [filters: ProductFilters]
}>()

// Copia local para no mutar la prop directamente
const search   = ref(props.modelValue.q ?? '')
const category = ref(props.modelValue.category ?? '')
const orderBy  = ref(props.modelValue.orderBy ?? 'newest')

// Debounce para la búsqueda — no dispara fetch en cada letra
let searchTimer: ReturnType<typeof setTimeout>
watch(search, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emitFilters(), 400)
})

watch([category, orderBy], () => emitFilters())

function emitFilters() {
  emit('update:modelValue', {
    ...props.modelValue,
    q:        search.value  || undefined,
    category: category.value || undefined,
    orderBy:  orderBy.value as ProductFilters['orderBy'],
    page: 1,  // resetear página al cambiar filtros
  })
}

function clearFilters() {
  search.value   = ''
  category.value = ''
  orderBy.value  = 'newest'
}

const hasActiveFilters = () =>
  !!search.value || !!category.value || orderBy.value !== 'newest'
</script>

<template>
  <div class="flex flex-col gap-2">

    <!-- Búsqueda -->
    <label class="input input-bordered flex items-center gap-2 w-full">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
      </svg>
      <input
        v-model="search"
        type="search"
        inputmode="search"
        placeholder="Buscar productos..."
        class="grow text-sm bg-transparent outline-none"
      />
      <button
        v-if="search"
        class="text-base-content/30 hover:text-base-content"
        @click="search = ''"
      >
        ✕
      </button>
    </label>

    <!-- Categoría + Orden en fila -->
    <div class="flex gap-2">

      <select
        v-model="category"
        class="select select-bordered select-sm flex-1 text-sm"
      >
        <option value="">Todas las categorías</option>
        <template v-for="cat in categories" :key="cat.id">
          <option :value="cat.slug">{{ cat.name }}</option>
          <option
            v-for="child in cat.children"
            :key="child.id"
            :value="child.slug"
          >
            &nbsp;&nbsp;{{ child.name }}
          </option>
        </template>
      </select>

      <select
        v-model="orderBy"
        class="select select-bordered select-sm w-36 text-sm"
      >
        <option value="newest">Más nuevos</option>
        <option value="price_asc">Menor precio</option>
        <option value="price_desc">Mayor precio</option>
        <option value="name">A - Z</option>
      </select>

    </div>

    <!-- Limpiar filtros -->
    <button
      v-if="hasActiveFilters()"
      class="btn btn-ghost btn-xs self-start text-base-content/50"
      @click="clearFilters"
    >
      ✕ Limpiar filtros
    </button>

  </div>
</template>