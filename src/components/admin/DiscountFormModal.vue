<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreateDiscountPayload } from '../../api/discounts'

const props = defineProps<{ open: boolean }>()
const emit  = defineEmits<{ close: []; saved: [payload: CreateDiscountPayload] }>()

const form = ref({
  code:      '',
  type:      'PERCENT' as 'PERCENT' | 'FIXED',
  value:     0,
  minAmount: '' as number | '',
  maxUses:   '' as number | '',
  active:    true,
  expiresAt: '',
})

watch(() => props.open, (val) => {
  if (!val) return
  form.value = {
    code: '', type: 'PERCENT', value: 0,
    minAmount: '', maxUses: '', active: true, expiresAt: '',
  }
})

function handleSubmit() {
  emit('saved', {
    code:      form.value.code.toUpperCase(),
    type:      form.value.type,
    value:     form.value.value,
    minAmount: form.value.minAmount !== '' ? Number(form.value.minAmount) : undefined,
    maxUses:   form.value.maxUses   !== '' ? Number(form.value.maxUses)   : undefined,
    active:    form.value.active,
    expiresAt: form.value.expiresAt || undefined,
  })
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': open }">
    <div class="modal-box w-full max-w-sm">

      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">Nuevo descuento</h3>
        <button class="btn btn-sm btn-ghost btn-circle" @click="emit('close')">✕</button>
      </div>

      <div class="flex flex-col gap-3">

        <!-- Código -->
        <label class="form-control">
          <div class="label pb-1"><span class="label-text">Código *</span></div>
          <input
            v-model="form.code"
            type="text"
            class="input input-bordered input-sm font-mono uppercase tracking-widest"
            placeholder="VERANO20"
          />
        </label>

        <!-- Tipo + Valor -->
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <div class="label pb-1"><span class="label-text">Tipo *</span></div>
            <select v-model="form.type" class="select select-bordered select-sm">
              <option value="PERCENT">Porcentaje %</option>
              <option value="FIXED">Monto fijo $</option>
            </select>
          </label>
          <label class="form-control">
            <div class="label pb-1"><span class="label-text">Valor *</span></div>
            <input
              v-model.number="form.value"
              type="number" min="0" step="0.01"
              class="input input-bordered input-sm"
              :placeholder="form.type === 'PERCENT' ? '20' : '10.00'"
            />
          </label>
        </div>

        <!-- Monto mínimo + Máx usos -->
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <div class="label pb-1"><span class="label-text">Monto mínimo</span></div>
            <input v-model.number="form.minAmount" type="number" min="0" step="0.01" class="input input-bordered input-sm" placeholder="50.00" />
          </label>
          <label class="form-control">
            <div class="label pb-1"><span class="label-text">Máx. usos</span></div>
            <input v-model.number="form.maxUses" type="number" min="1" class="input input-bordered input-sm" placeholder="100" />
          </label>
        </div>

        <!-- Expiración -->
        <label class="form-control">
          <div class="label pb-1"><span class="label-text">Expira el</span></div>
          <input v-model="form.expiresAt" type="datetime-local" class="input input-bordered input-sm" />
        </label>

        <!-- Activo -->
        <div class="flex items-center gap-3">
          <input v-model="form.active" type="checkbox" class="toggle toggle-sm toggle-primary" id="discount-active" />
          <label for="discount-active" class="text-sm cursor-pointer">Activo al crear</label>
        </div>

      </div>

      <div class="modal-action mt-4">
        <button class="btn btn-ghost btn-sm" @click="emit('close')">Cancelar</button>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!form.code || form.value <= 0"
          @click="handleSubmit"
        >
          Crear descuento
        </button>
      </div>

    </div>
    <div class="modal-backdrop" @click="emit('close')"></div>
  </dialog>
</template>