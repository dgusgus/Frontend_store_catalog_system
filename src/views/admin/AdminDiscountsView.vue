<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAdminStore } from '../../stores/admin.store'
import { useToast } from '../../composables/useToast'
import { ApiRequestError } from '../../api/fetcher'
import type { CreateDiscountPayload } from '../../api/discounts'
import DiscountFormModal from '../../components/admin/DiscountFormModal.vue'

const store      = useAdminStore()
const toast      = useToast()
const modalOpen  = ref(false)

onMounted(() => store.fetchDiscounts())

async function handleSaved(payload: CreateDiscountPayload) {
  try {
    await store.createDiscount(payload)
    toast.success('Descuento creado')
    modalOpen.value = false
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al crear')
  }
}

async function handleToggle(id: number) {
  try {
    await store.toggleDiscount(id)
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error')
  }
}

async function handleDelete(id: number, code: string) {
  if (!confirm(`¿Eliminar el código "${code}"?`)) return
  try {
    await store.deleteDiscount(id)
    toast.success('Descuento eliminado')
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al eliminar')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-bold text-lg">Descuentos</h2>
        <p class="text-sm text-base-content/50">{{ store.discounts.length }} códigos</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="modalOpen = true">+ Nuevo</button>
    </div>

    <div v-if="store.discountsLoading" class="flex flex-col gap-2">
      <div v-for="n in 4" :key="n" class="skeleton h-16 w-full rounded-xl"></div>
    </div>

    <div v-else-if="store.discountsError" class="alert alert-error">
      <span>{{ store.discountsError }}</span>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="discount in store.discounts"
        :key="discount.id"
        class="card bg-base-100 shadow-sm"
      >
        <div class="card-body p-3 flex-row items-center gap-3">

          <!-- Código + info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sm">{{ discount.code }}</span>
              <span
                class="badge badge-xs"
                :class="discount.active ? 'badge-success' : 'badge-ghost'"
              >
                {{ discount.active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <p class="text-xs text-base-content/50 mt-0.5">
              {{ discount.type === 'PERCENT' ? `${discount.value}%` : `$${discount.value}` }}
              <span v-if="discount.minAmount"> · mín. ${{ discount.minAmount }}</span>
              <span v-if="discount.maxUses"> · {{ discount.usedCount }}/{{ discount.maxUses }} usos</span>
              <span v-else> · {{ discount.usedCount }} usos</span>
            </p>
            <p v-if="discount.expiresAt" class="text-xs text-warning">
              Expira: {{ new Date(discount.expiresAt).toLocaleDateString('es') }}
            </p>
          </div>

          <!-- Acciones -->
          <div class="flex gap-1 shrink-0">
            <button
              class="btn btn-xs btn-ghost"
              @click="handleToggle(discount.id)"
              :title="discount.active ? 'Desactivar' : 'Activar'"
            >
              {{ discount.active ? '⏸️' : '▶️' }}
            </button>
            <button
              class="btn btn-xs btn-ghost text-error"
              @click="handleDelete(discount.id, discount.code)"
            >
              🗑️
            </button>
          </div>

        </div>
      </div>

      <div v-if="store.discounts.length === 0" class="text-center py-12 text-base-content/40">
        No hay descuentos creados
      </div>
    </div>

  </div>

  <DiscountFormModal
    :open="modalOpen"
    @close="modalOpen = false"
    @saved="handleSaved"
  />
</template>