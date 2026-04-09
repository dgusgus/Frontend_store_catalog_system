<!-- src/views/admin/AdminSettingsView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../../stores/settings.store'
import { useToast }         from '../../composables/useToast'
import { ApiRequestError }  from '../../api/fetcher'
import ImageUploader        from '../../components/admin/ImageUploader.vue'

const store = useSettingsStore()
const toast = useToast()

const saving = ref(false)

const form = ref({
  whatsappNumber:   '',
  storeName:        '',
  storeDescription: '',
  paymentQrUrl:     '',
})

onMounted(async () => {
  // Forzar recarga siempre en el admin para tener datos frescos
  store.$patch({ settings: null })
  await store.fetchSettings()

  if (store.settings) {
    form.value = {
      whatsappNumber:   store.settings.whatsappNumber   ?? '',
      storeName:        store.settings.storeName        ?? '',
      storeDescription: store.settings.storeDescription ?? '',
      paymentQrUrl:     store.settings.paymentQrUrl     ?? '',
    }
  }
})

async function handleSave() {
  saving.value = true
  try {
    await store.updateSettings({
      whatsappNumber:   form.value.whatsappNumber.trim()   || null,
      storeName:        form.value.storeName.trim()        || null,
      storeDescription: form.value.storeDescription.trim() || null,
      paymentQrUrl:     form.value.paymentQrUrl.trim()     || null,
    })
    toast.success('Configuración guardada')
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al guardar')
  } finally {
    saving.value = false
  }
}

// Cuando ImageUploader termina, guarda la URL en el form
function handleQrUploaded(url: string) {
  form.value.paymentQrUrl = url
  toast.success('QR subido — guardá la configuración para aplicarlo')
}

function previewWhatsAppLink(): string {
  if (!form.value.whatsappNumber) return ''
  return `https://wa.me/${form.value.whatsappNumber}`
}
</script>

<template>
  <div class="flex flex-col gap-4 max-w-lg">

    <div>
      <h2 class="font-bold text-lg">Configuración</h2>
      <p class="text-sm text-base-content/50">Ajustes generales de la tienda</p>
    </div>

    <div v-if="store.loading" class="flex flex-col gap-3">
      <div v-for="n in 3" :key="n" class="skeleton h-12 w-full rounded-xl"></div>
    </div>

    <div v-else class="flex flex-col gap-4">

      <!-- ── WhatsApp ─────────────────────────────────────── -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4 gap-3">

          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              fill="currentColor" class="size-5 text-success">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <h3 class="font-semibold text-sm">WhatsApp del negocio</h3>
          </div>

          <label class="form-control">
            <div class="label pb-1">
              <span class="label-text text-sm">Número de WhatsApp</span>
              <span class="label-text-alt text-base-content/40">sin + ni espacios</span>
            </div>
            <input
              v-model="form.whatsappNumber"
              type="tel"
              inputmode="numeric"
              placeholder="59171234567"
              class="input input-bordered input-sm font-mono"
            />
            <div class="label pt-1">
              <span class="label-text-alt text-base-content/40">
                Código de país + número. Ej: Bolivia → 59171234567
              </span>
            </div>
          </label>

          <div v-if="form.whatsappNumber"
            class="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2">
            <span class="text-xs text-base-content/50 flex-1 truncate font-mono">
              {{ previewWhatsAppLink() }}
            </span>
            <a :href="previewWhatsAppLink()" target="_blank" rel="noopener noreferrer"
              class="btn btn-xs btn-ghost text-success">
              Probar →
            </a>
          </div>

        </div>
      </div>

      <!-- ── QR de pago bancario ──────────────────────────── -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4 gap-3">

          <div class="flex items-center gap-2">
            <span class="text-xl">🏦</span>
            <h3 class="font-semibold text-sm">QR de pago bancario</h3>
          </div>

          <p class="text-xs text-base-content/50">
            Subí el QR de tu cuenta bancaria. Los clientes lo verán al confirmar
            su pedido para realizar la transferencia.
          </p>

          <!-- Preview del QR actual -->
          <div v-if="form.paymentQrUrl" class="flex flex-col items-center gap-2">
            <div class="bg-white rounded-2xl p-4 border border-base-200 shadow-sm">
              <img
                :src="form.paymentQrUrl"
                alt="QR de pago actual"
                class="w-40 h-40 object-contain"
              />
            </div>
            <div class="flex gap-2">
              <span class="badge badge-success badge-sm gap-1">
                ✓ QR configurado
              </span>
              <button
                class="badge badge-ghost badge-sm cursor-pointer hover:badge-error"
                @click="form.paymentQrUrl = ''"
              >
                Quitar
              </button>
            </div>
          </div>

          <!-- Uploader — usa el mismo componente de imágenes de productos -->
          <div>
            <p class="text-xs font-medium text-base-content/60 mb-2">
              {{ form.paymentQrUrl ? 'Reemplazar QR:' : 'Subir QR:' }}
            </p>
            <ImageUploader @uploaded="(url) => handleQrUploaded(url)" />
          </div>

          <!-- Nota -->
          <div class="alert alert-info text-xs py-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4 shrink-0" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>
              Después de subir la imagen, tocá <strong>Guardar configuración</strong>
              para que los cambios se apliquen.
            </span>
          </div>

        </div>
      </div>

      <!-- ── Info de la tienda ────────────────────────────── -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4 gap-3">

          <h3 class="font-semibold text-sm">Información de la tienda</h3>

          <label class="form-control">
            <div class="label pb-1"><span class="label-text text-sm">Nombre</span></div>
            <input
              v-model="form.storeName"
              type="text"
              placeholder="Mi Tienda"
              class="input input-bordered input-sm"
            />
          </label>

          <label class="form-control">
            <div class="label pb-1">
              <span class="label-text text-sm">Descripción</span>
              <span class="label-text-alt text-base-content/40">opcional</span>
            </div>
            <textarea
              v-model="form.storeDescription"
              placeholder="La mejor tienda de la ciudad..."
              class="textarea textarea-bordered textarea-sm h-16 resize-none"
            ></textarea>
          </label>

        </div>
      </div>

      <!-- Botón guardar -->
      <button
        class="btn btn-primary w-full"
        :disabled="saving"
        @click="handleSave"
      >
        <span v-if="saving" class="loading loading-spinner loading-sm"></span>
        Guardar configuración
      </button>

    </div>
  </div>
</template>