// src/stores/settings.store.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsApi } from '../api/settings'
import type { StoreSettings, UpdateSettingsPayload } from '../api/settings'
// ↑ Importamos el tipo desde api/settings — así si agregamos campos ahí,
//   el store los hereda automáticamente sin tener que duplicar el tipo

export const useSettingsStore = defineStore('settings', () => {

  // Antes: tipo inline que no tenía paymentQrUrl
  // Ahora: usa StoreSettings directamente
  const settings = ref<StoreSettings | null>(null)

  const loading = ref(false)
  const error   = ref<string | null>(null)

  const whatsappNumber = computed(() => settings.value?.whatsappNumber ?? null)
  const hasWhatsapp    = computed(() => !!whatsappNumber.value)
  const paymentQrUrl   = computed(() => settings.value?.paymentQrUrl ?? null)

  async function fetchSettings() {
    if (settings.value) return

    loading.value = true
    error.value   = null
    try {
      settings.value = await settingsApi.get()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar configuración'
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(payload: UpdateSettingsPayload) {
    const updated = await settingsApi.update(payload)
    settings.value = updated
    return updated
  }

  return {
    settings,
    loading,
    error,
    whatsappNumber,
    hasWhatsapp,
    paymentQrUrl,   // ← expuesto como computed para uso directo
    fetchSettings,
    updateSettings,
  }
})