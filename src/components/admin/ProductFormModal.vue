<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { categoriesApi } from '../../api/categories'
import type { Product, Category } from '../../types'
import type { CreateProductPayload } from '../../api/products'

const props = defineProps<{
  open:     boolean
  product?: Product | null   // null = crear, Product = editar
}>()

const emit = defineEmits<{
  close:  []
  saved:  [payload: CreateProductPayload, id?: number]
}>()

const categories = ref<Category[]>([])
const loading    = ref(false)

// ── Form ───────────────────────────────────────────
const form = ref({
  name:         '',
  slug:         '',
  description:  '',
  price:        0,
  comparePrice: '' as number | '',
  published:    false,
  categoryId:   0,
  tags:         '' as string,  // CSV: "nuevo, oferta"
})

const isEdit = computed(() => !!props.product)

// Rellena el form al abrir en modo edición
watch(() => props.open, async (val) => {
  if (!val) return
  categories.value = await categoriesApi.getAll().catch(() => [])

  if (props.product) {
    form.value = {
      name:         props.product.name,
      slug:         props.product.slug,
      description:  props.product.description ?? '',
      price:        Number(props.product.price),
      comparePrice: props.product.comparePrice ? Number(props.product.comparePrice) : '',
      published:    props.product.published,
      categoryId:   props.product.category.id,
      tags:         props.product.tags.map(t => t.name).join(', '),
    }
  } else {
    form.value = {
      name: '', slug: '', description: '',
      price: 0, comparePrice: '', published: false,
      categoryId: 0, tags: '',
    }
  }
})

// Auto-genera slug desde el nombre (solo en modo crear)
watch(() => form.value.name, (val) => {
  if (isEdit.value) return
  form.value.slug = val
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
})

function handleSubmit() {
  const payload: CreateProductPayload = {
    name:        form.value.name,
    slug:        form.value.slug,
    description: form.value.description || undefined,
    price:       form.value.price,
    comparePrice: form.value.comparePrice !== ''
      ? Number(form.value.comparePrice)
      : undefined,
    published:   form.value.published,
    categoryId:  form.value.categoryId,
    tags: form.value.tags
      ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
      : undefined,
  }
  emit('saved', payload, props.product?.id)
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': open }">
    <div class="modal-box w-full max-w-lg">

      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">
          {{ isEdit ? 'Editar producto' : 'Nuevo producto' }}
        </h3>
        <button class="btn btn-sm btn-ghost btn-circle" @click="emit('close')">✕</button>
      </div>

      <!-- Form -->
      <div class="flex flex-col gap-3">

        <!-- Nombre -->
        <label class="form-control">
          <div class="label pb-1"><span class="label-text">Nombre *</span></div>
          <input v-model="form.name" type="text" class="input input-bordered input-sm" placeholder="Smartphone X100" />
        </label>

        <!-- Slug -->
        <label class="form-control">
          <div class="label pb-1"><span class="label-text">Slug *</span></div>
          <input v-model="form.slug" type="text" class="input input-bordered input-sm font-mono text-xs" placeholder="smartphone-x100" />
        </label>

        <!-- Descripción -->
        <label class="form-control">
          <div class="label pb-1"><span class="label-text">Descripción</span></div>
          <textarea v-model="form.description" class="textarea textarea-bordered textarea-sm h-20 resize-none" placeholder="Descripción del producto..."></textarea>
        </label>

        <!-- Precio + Precio comparación -->
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <div class="label pb-1"><span class="label-text">Precio *</span></div>
            <input v-model.number="form.price" type="number" step="0.01" min="0" class="input input-bordered input-sm" placeholder="99.99" />
          </label>
          <label class="form-control">
            <div class="label pb-1"><span class="label-text">Precio anterior</span></div>
            <input v-model.number="form.comparePrice" type="number" step="0.01" min="0" class="input input-bordered input-sm" placeholder="129.99" />
          </label>
        </div>

        <!-- Categoría -->
        <label class="form-control">
          <div class="label pb-1"><span class="label-text">Categoría *</span></div>
          <select v-model.number="form.categoryId" class="select select-bordered select-sm">
            <option :value="0" disabled>Seleccionar categoría</option>
            <template v-for="cat in categories" :key="cat.id">
              <option :value="cat.id">{{ cat.name }}</option>
              <option v-for="child in cat.children" :key="child.id" :value="child.id">
                &nbsp;&nbsp;{{ child.name }}
              </option>
            </template>
          </select>
        </label>

        <!-- Tags -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text">Tags</span>
            <span class="label-text-alt text-base-content/40">separados por coma</span>
          </div>
          <input v-model="form.tags" type="text" class="input input-bordered input-sm" placeholder="nuevo, oferta" />
        </label>

        <!-- Publicado -->
        <div class="flex items-center gap-3">
          <input v-model="form.published" type="checkbox" class="toggle toggle-sm toggle-primary" :id="`pub-${product?.id ?? 'new'}`" />
          <label :for="`pub-${product?.id ?? 'new'}`" class="text-sm cursor-pointer">
            {{ form.published ? 'Publicado' : 'Borrador' }}
          </label>
        </div>

      </div>

      <!-- Footer -->
      <div class="modal-action mt-4">
        <button class="btn btn-ghost btn-sm" @click="emit('close')">Cancelar</button>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!form.name || !form.slug || form.price <= 0 || form.categoryId === 0 || loading"
          @click="handleSubmit"
        >
          {{ isEdit ? 'Guardar cambios' : 'Crear producto' }}
        </button>
      </div>

    </div>
    <div class="modal-backdrop" @click="emit('close')"></div>
  </dialog>
</template>