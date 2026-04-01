<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '../../stores/admin.store'
import { useToast } from '../../composables/useToast'
import { ApiRequestError } from '../../api/fetcher'
import type { Product, Variant } from '../../types'

const props = defineProps<{ product: Product }>()
const store = useAdminStore()
const toast = useToast()

// ── Nuevo formulario ───────────────────────────────
const showForm  = ref(false)
const saving    = ref(false)
const newForm   = ref({ sku: '', name: '', stock: 0, price: '' as number | '' })

// ── Edición inline ─────────────────────────────────
const editingId = ref<number | null>(null)
const editForm  = ref({ stock: 0, price: '' as number | '' })

function startEdit(variant: Variant) {
  editingId.value = variant.id
  editForm.value  = {
    stock: variant.stock,
    price: variant.price ? Number(variant.price) : '',
  }
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(variantId: number) {
  saving.value = true
  try {
    await store.updateVariant(props.product.id, variantId, {
      stock: editForm.value.stock,
      price: editForm.value.price !== '' ? Number(editForm.value.price) : undefined,
    })
    toast.success('Variante actualizada')
    editingId.value = null
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al actualizar')
  } finally {
    saving.value = false
  }
}

async function handleAdd() {
  if (!newForm.value.sku || !newForm.value.name) return
  saving.value = true
  try {
    await store.addVariant(props.product.id, {
      sku:   newForm.value.sku.toUpperCase(),
      name:  newForm.value.name,
      stock: newForm.value.stock,
      price: newForm.value.price !== '' ? Number(newForm.value.price) : undefined,
    })
    toast.success('Variante agregada')
    newForm.value = { sku: '', name: '', stock: 0, price: '' }
    showForm.value = false
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al agregar')
  } finally {
    saving.value = false
  }
}

async function handleDelete(variantId: number, name: string) {
  if (!confirm(`¿Eliminar la variante "${name}"?`)) return
  try {
    await store.deleteVariant(props.product.id, variantId)
    toast.success('Variante eliminada')
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al eliminar')
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">

    <!-- Lista de variantes existentes -->
    <div
      v-for="variant in product.variants"
      :key="variant.id"
      class="rounded-lg border border-base-200 bg-base-50 p-2"
    >
      <!-- Vista normal -->
      <div v-if="editingId !== variant.id" class="flex items-center gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ variant.name }}</p>
          <p class="text-xs text-base-content/50 font-mono">{{ variant.sku }}</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <span class="text-xs">
            Stock: <span class="font-bold" :class="variant.stock === 0 ? 'text-error' : 'text-success'">{{ variant.stock }}</span>
          </span>
          <span class="text-xs text-base-content/50">
            {{ variant.price ? `$${Number(variant.price).toFixed(2)}` : 'Precio base' }}
          </span>
        </div>
        <div class="flex gap-1">
          <button class="btn btn-xs btn-ghost" @click="startEdit(variant)">✏️</button>
          <button class="btn btn-xs btn-ghost text-error" @click="handleDelete(variant.id, variant.name)">🗑️</button>
        </div>
      </div>

      <!-- Edición inline -->
      <div v-else class="flex items-center gap-2 flex-wrap">
        <p class="text-xs font-medium flex-1">{{ variant.name }}</p>
        <div class="flex gap-2">
          <label class="flex items-center gap-1 text-xs">
            Stock
            <input v-model.number="editForm.stock" type="number" min="0" class="input input-xs input-bordered w-16" />
          </label>
          <label class="flex items-center gap-1 text-xs">
            Precio
            <input v-model.number="editForm.price" type="number" min="0" step="0.01" placeholder="base" class="input input-xs input-bordered w-20" />
          </label>
        </div>
        <div class="flex gap-1">
          <button class="btn btn-xs btn-primary" :disabled="saving" @click="saveEdit(variant.id)">✓</button>
          <button class="btn btn-xs btn-ghost" @click="cancelEdit">✕</button>
        </div>
      </div>
    </div>

    <!-- Sin variantes -->
    <p v-if="product.variants.length === 0" class="text-xs text-base-content/40 text-center py-2">
      Sin variantes — el precio base aplica directo
    </p>

    <!-- Formulario nueva variante -->
    <div v-if="showForm" class="rounded-lg border border-primary/30 bg-primary/5 p-3 flex flex-col gap-2">
      <p class="text-xs font-semibold text-primary">Nueva variante</p>
      <div class="grid grid-cols-2 gap-2">
        <label class="form-control">
          <div class="label py-0"><span class="label-text text-xs">SKU *</span></div>
          <input v-model="newForm.sku" type="text" placeholder="CAM-ROJA-M" class="input input-xs input-bordered font-mono uppercase" />
        </label>
        <label class="form-control">
          <div class="label py-0"><span class="label-text text-xs">Nombre *</span></div>
          <input v-model="newForm.name" type="text" placeholder="Rojo / M" class="input input-xs input-bordered" />
        </label>
        <label class="form-control">
          <div class="label py-0"><span class="label-text text-xs">Stock</span></div>
          <input v-model.number="newForm.stock" type="number" min="0" class="input input-xs input-bordered" />
        </label>
        <label class="form-control">
          <div class="label py-0"><span class="label-text text-xs">Precio (opcional)</span></div>
          <input v-model.number="newForm.price" type="number" min="0" step="0.01" placeholder="hereda base" class="input input-xs input-bordered" />
        </label>
      </div>
      <div class="flex gap-2 justify-end">
        <button class="btn btn-xs btn-ghost" @click="showForm = false">Cancelar</button>
        <button
          class="btn btn-xs btn-primary"
          :disabled="!newForm.sku || !newForm.name || saving"
          @click="handleAdd"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs"></span>
          Agregar
        </button>
      </div>
    </div>

    <!-- Botón abrir formulario -->
    <button v-if="!showForm" class="btn btn-xs btn-ghost btn-outline w-full" @click="showForm = true">
      + Agregar variante
    </button>

  </div>
</template>