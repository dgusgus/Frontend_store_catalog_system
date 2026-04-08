// src/api/settings.ts

import { fetcher } from './fetcher'

export interface StoreSettings {
  id:               number
  whatsappNumber:   string | null
  storeName:        string | null
  storeDescription: string | null
  updatedAt:        string
}

export interface UpdateSettingsPayload {
  whatsappNumber?:   string | null
  storeName?:        string | null
  storeDescription?: string | null
}

export const settingsApi = {
  // Público — lo usa el checkout
  get() {
    return fetcher<StoreSettings>('/settings')
  },

  // Solo admin
  update(payload: UpdateSettingsPayload) {
    return fetcher<StoreSettings>('/settings', {
      method: 'PATCH',
      auth:   true,
      body:   JSON.stringify(payload),
    })
  },
}