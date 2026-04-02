<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Category } from '../../types'
import type { CreateCategoryPayload } from '../../api/categories'

const props = defineProps<{
  open:        boolean
  category?:   Category | null
  categories:  Category[]           // para el selector de padre
}>()

const emit = defineEmits<{
  close: []
  saved: [payload: CreateCategoryPayload, id?: number]
}>()

const isEdit = computed(() => !!props.category)

const form = ref({
  name:        '',
  slug:        '',
  description: '',
  parentId:    null as number | null,
})

// Rellena el form al abrir
watch(() => props.open, (val) => {
  if (!val) return
  if (props.category) {
    form.value = {
      name:        props.category.name,
      slug:        props.category.slug,
      description: props.category.description ?? '',
      parentId:    props.category.parentId ?? null,
    }
  } else {
    form.value = { name: '', slug: '', description: '', parentId: null }
  }
})

// Auto-genera slug desde el nombre solo en modo crear
watch(() => form.value.name, (val) => {
  if (isEdit.value) return
  form.value.slug = val
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
})

// Categorías raíz disponibles como padre
// Excluye la propia categoría si es edición
const parentOptions = computed(() =>
  props.categories.filter(c => c.id !== props.category?.id)
)

const canSubmit = computed(() =>
  form.value.name.trim().length >= 2 &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.value.slug)
)

function handleSubmit() {
  if (!canSubmit.value) return
  emit('saved', {
    name:        form.value.name.trim(),
    slug:        form.value.slug.trim(),
    description: form.value.description.trim() || undefined,
    parentId:    form.value.parentId ?? undefined,
  }, props.category?.id)
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': open }">
    <div class="modal-box w-full max-w-sm">

      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">
          {{ isEdit ? 'Editar categoría' : 'Nueva categoría' }}
        </h3>
        <button class="btn btn-sm btn-ghost btn-circle" @click="emit('close')">✕</button>
      </div>

      <div class="flex flex-col gap-3">

        <!-- Nombre -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text">Nombre *</span>
          </div>
          <input
            v-model="form.name"
            type="text"
            placeholder="Electrónica"
            class="input input-bordered"
            autofocus
          />
        </label>

        <!-- Slug -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text">Slug *</span>
            <span class="label-text-alt text-base-content/40">auto-generado</span>
          </div>
          <input
            v-model="form.slug"
            type="text"
            placeholder="electronica"
            class="input input-bordered font-mono text-sm"
            :class="{ 'input-error': form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug) }"
          />
          <div class="label pt-1">
            <span
              class="label-text-alt"
              :class="form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)
                ? 'text-error'
                : 'text-base-content/40'"
            >
              Solo minúsculas, números y guiones
            </span>
          </div>
        </label>

        <!-- Descripción -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text">Descripción</span>
            <span class="label-text-alt text-base-content/40">opcional</span>
          </div>
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered textarea-sm h-16 resize-none"
            placeholder="Gadgets, celulares y tecnología..."
          ></textarea>
        </label>

        <!-- Categoría padre -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text">Subcategoría de</span>
            <span class="label-text-alt text-base-content/40">opcional</span>
          </div>
          <select
            v-model="form.parentId"
            class="select select-bordered"
          >
            <option :value="null">— Categoría raíz —</option>
            <option
              v-for="cat in parentOptions"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>
          <div class="label pt-1">
            <span class="label-text-alt text-base-content/40">
              Si eliges una categoría padre, esta será subcategoría de ella
            </span>
          </div>
        </label>

      </div>

      <!-- Footer -->
      <div class="modal-action mt-4">
        <button class="btn btn-ghost btn-sm" @click="emit('close')">
          Cancelar
        </button>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ isEdit ? 'Guardar cambios' : 'Crear categoría' }}
        </button>
      </div>

    </div>
    <div class="modal-backdrop" @click="emit('close')"></div>
  </dialog>
</template>