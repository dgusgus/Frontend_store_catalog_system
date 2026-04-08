// src/stores/settings.store.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsApi } from '../api/settings'
import type { UpdateSettingsPayload } from '../api/settings'

export const useSettingsStore = defineStore('settings', () => {

  const settings = ref<{
    id:               number
    whatsappNumber:   string | null
    storeName:        string | null
    storeDescription: string | null
    updatedAt:        string
  } | null>(null)

  const loading = ref(false)
  const error   = ref<string | null>(null)

  // El número formateado listo para usar en wa.me
  const whatsappNumber = computed(() => settings.value?.whatsappNumber ?? null)
  const hasWhatsapp    = computed(() => !!whatsappNumber.value)

  async function fetchSettings() {
    // Si ya los tenemos en memoria, no volvemos a pedir
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
    fetchSettings,
    updateSettings,
  }
})