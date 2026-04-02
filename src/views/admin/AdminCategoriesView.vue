<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAdminStore } from '../../stores/admin.store'
import { useToast } from '../../composables/useToast'
import { ApiRequestError } from '../../api/fetcher'
import type { Category } from '../../types'
import type { CreateCategoryPayload } from '../../api/categories'
import CategoryFormModal from '../../components/admin/CategoryFormModal.vue'

const store = useAdminStore()
const toast = useToast()

const modalOpen      = ref(false)
const editCategory   = ref<Category | null>(null)

onMounted(() => store.fetchCategories())

function openCreate() {
  editCategory.value = null
  modalOpen.value    = true
}

function openEdit(category: Category) {
  editCategory.value = category
  modalOpen.value    = true
}

async function handleSaved(payload: CreateCategoryPayload, id?: number) {
  try {
    if (id) {
      await store.updateCategory(id, payload)
      toast.success('Categoría actualizada')
    } else {
      await store.createCategory(payload)
      toast.success('Categoría creada')
    }
    modalOpen.value = false
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al guardar')
  }
}

async function handleDelete(category: Category) {
  const hasChildren  = category.children?.length > 0
  const confirmMsg   = hasChildren
    ? `"${category.name}" tiene ${category.children.length} subcategoría(s). ¿Eliminarla igual?`
    : `¿Eliminar la categoría "${category.name}"?`

  if (!confirm(confirmMsg)) return

  try {
    await store.deleteCategory(category.id)
    toast.success('Categoría eliminada')
  } catch (e) {
    // El backend lanza ConflictError si tiene productos
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al eliminar')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-bold text-lg">Categorías</h2>
        <p class="text-sm text-base-content/50">
          {{ store.categories.length }} categoría{{ store.categories.length !== 1 ? 's' : '' }} raíz
        </p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openCreate">
        + Nueva
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.categoriesLoading" class="flex flex-col gap-2">
      <div v-for="n in 4" :key="n" class="skeleton h-16 w-full rounded-xl"></div>
    </div>

    <!-- Error -->
    <div v-else-if="store.categoriesError" class="alert alert-error">
      <span>{{ store.categoriesError }}</span>
      <button class="btn btn-sm btn-ghost" @click="store.fetchCategories()">
        Reintentar
      </button>
    </div>

    <!-- Lista -->
    <div v-else class="flex flex-col gap-2">

      <!-- Sin categorías -->
      <div
        v-if="store.categories.length === 0"
        class="flex flex-col items-center gap-3 py-12 text-center"
      >
        <span class="text-4xl">📂</span>
        <p class="text-base-content/50 text-sm">No hay categorías todavía</p>
        <button class="btn btn-primary btn-sm" @click="openCreate">
          Crear primera categoría
        </button>
      </div>

      <!-- Árbol de categorías -->
      <template v-for="category in store.categories" :key="category.id">

        <!-- Categoría raíz -->
        <div class="card bg-base-100 shadow-sm overflow-hidden">
          <div class="card-body p-3 flex-row items-center gap-3">

            <!-- Ícono + info -->
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg">
              📁
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm truncate">{{ category.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="font-mono text-xs text-base-content/40">/{{ category.slug }}</span>
                <span
                  v-if="category.children.length > 0"
                  class="badge badge-xs badge-ghost"
                >
                  {{ category.children.length }} sub
                </span>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex gap-1 shrink-0">
              <button
                class="btn btn-xs btn-ghost"
                title="Editar"
                @click="openEdit(category)"
              >
                ✏️
              </button>
              <button
                class="btn btn-xs btn-ghost text-error"
                title="Eliminar"
                @click="handleDelete(category)"
              >
                🗑️
              </button>
            </div>

          </div>

          <!-- Subcategorías -->
          <div
            v-if="category.children.length > 0"
            class="border-t border-base-200"
          >
            <div
              v-for="child in category.children"
              :key="child.id"
              class="flex items-center gap-3 px-3 py-2 border-b border-base-200/50 last:border-0 hover:bg-base-50 transition-colors"
            >
              <!-- Indentación visual -->
              <div class="flex items-center gap-2 pl-4 flex-1 min-w-0">
                <span class="text-base-content/20 text-xs">└</span>
                <div class="size-7 rounded-md bg-base-200 flex items-center justify-center text-sm shrink-0">
                  📄
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium truncate">{{ child.name }}</p>
                  <span class="font-mono text-xs text-base-content/40">/{{ child.slug }}</span>
                </div>
              </div>

              <!-- Acciones subcategoría -->
              <div class="flex gap-1 shrink-0">
                <button
                  class="btn btn-xs btn-ghost"
                  title="Editar subcategoría"
                  @click="openEdit({ ...child, children: [], parentId: category.id })"
                >
                  ✏️
                </button>
                <button
                  class="btn btn-xs btn-ghost text-error"
                  title="Eliminar subcategoría"
                  @click="handleDelete({ ...child, children: [] })"
                >
                  🗑️
                </button>
              </div>
            </div>

            <!-- Botón agregar subcategoría desde aquí -->
            <button
              class="w-full text-left px-3 py-2 pl-14 text-xs text-primary hover:bg-primary/5 transition-colors flex items-center gap-1"
              @click="editCategory = null; modalOpen = true; /* preselecciona padre */"
              @click.prevent="() => {
                editCategory = null
                modalOpen = true
              }"
            >
              + Agregar subcategoría en {{ category.name }}
            </button>
          </div>

        </div>

      </template>

    </div>

  </div>

  <!-- Modal -->
  <CategoryFormModal
    :open="modalOpen"
    :category="editCategory"
    :categories="store.categories"
    @close="modalOpen = false; editCategory = null"
    @saved="handleSaved"
  />
</template>