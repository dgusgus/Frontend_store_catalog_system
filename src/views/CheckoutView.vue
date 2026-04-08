<!-- src/views/CheckoutView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore }     from '../stores/cart.store'
import { useSettingsStore } from '../stores/settings.store'
import { useToast }         from '../composables/useToast'
import { useWhatsApp }      from '../composables/useWhatsApp'
import type { WhatsAppTarget } from '../composables/useWhatsApp'
import AppNavbar from '../components/ui/AppNavbar.vue'

const router   = useRouter()
const cart     = useCartStore()
const settings = useSettingsStore()
const toast    = useToast()
const wa       = useWhatsApp()

// Carga el número de WhatsApp al entrar al checkout
onMounted(() => settings.fetchSettings())

// ── Datos del cliente ──────────────────────────────────────
const customer = ref({ name: '', phone: '' })

const canSend = computed(() =>
  customer.value.name.trim().length >= 2  &&
  customer.value.phone.trim().length >= 7 &&
  !cart.isEmpty &&
  settings.hasWhatsapp
)

// ── Selector de destino ────────────────────────────────────
// El usuario elige cómo abrir WhatsApp
const selectedTarget = ref<WhatsAppTarget>('app')

// ── Preview del mensaje ────────────────────────────────────
const messagePreview = computed(() => {
  if (customer.value.name.trim().length < 2) return null
  return wa.buildMessage(customer.value)
})

// ── Enviar por WhatsApp ────────────────────────────────────
function handleWhatsApp() {
  if (!canSend.value) return
  wa.openWhatsApp(customer.value, selectedTarget.value)
}

// ── Copiar al portapapeles ─────────────────────────────────
const copied = ref(false)

async function handleCopy() {
  const text = messagePreview.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    toast.success('Resumen copiado')
    setTimeout(() => { copied.value = false }, 2500)
  } catch {
    toast.error('No se pudo copiar')
  }
}

// ── Compartir nativo (solo móvil) ──────────────────────────
const canShare = computed(() =>
  typeof navigator !== 'undefined' && !!navigator.share
)

async function handleShare() {
  if (!messagePreview.value) return
  try {
    await navigator.share({ title: 'Mi pedido', text: messagePreview.value })
  } catch { /* el usuario canceló */ }
}

function handleNewQuote() {
  cart.clearCart()
  router.push('/catalog')
}

// ── Líneas para el resumen visual ─────────────────────────
const summaryLines = computed(() =>
  cart.items.map(item => ({
    name:      item.productName,
    variant:   item.variantName ?? null,
    image:     item.image ?? null,
    slug:      item.slug,
    quantity:  item.quantity,
    unitPrice: item.price,
    subtotal:  item.price * item.quantity,
  }))
)
</script>

<template>
  <div class="min-h-screen bg-base-200">

    <AppNavbar />

    <main class="max-w-lg mx-auto px-4 pb-10 pt-4 flex flex-col gap-4">

      <!-- Header -->
      <div>
        <button class="btn btn-ghost btn-sm -ml-2 mb-1" @click="router.back()">
          ← Volver al carrito
        </button>
        <h1 class="text-xl font-bold">Tu pedido</h1>
        <p class="text-sm text-base-content/50 mt-0.5">
          Completá tus datos y envianos el pedido por WhatsApp
        </p>
      </div>

      <!-- Carrito vacío -->
      <div v-if="cart.isEmpty" class="flex flex-col items-center gap-4 py-16 text-center">
        <span class="text-5xl">🛒</span>
        <p class="text-base-content/60">No hay productos en el carrito</p>
        <RouterLink to="/catalog" class="btn btn-primary btn-sm">Ver productos</RouterLink>
      </div>

      <template v-else>

        <!-- ── Aviso si WhatsApp no está configurado ─────── -->
        <div v-if="!settings.hasWhatsapp && !settings.loading" class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <span class="text-sm">
            El número de WhatsApp no está configurado.
            <RouterLink to="/admin" class="link font-semibold">Configurarlo en el panel admin →</RouterLink>
          </span>
        </div>

        <!-- ── Productos ───────────────────────────────────── -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-3">
            <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
              Productos
            </h2>

            <div
              v-for="line in summaryLines"
              :key="`${line.slug}-${line.variant}`"
              class="flex items-center gap-3 py-2 border-b border-base-200 last:border-0"
            >
              <RouterLink :to="`/product/${line.slug}`" class="shrink-0">
                <div class="size-14 rounded-xl overflow-hidden bg-base-200">
                  <img v-if="line.image" :src="line.image" :alt="line.name"
                    class="w-full h-full object-cover" loading="lazy" />
                  <div v-else class="w-full h-full flex items-center justify-center text-xl">📦</div>
                </div>
              </RouterLink>

              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm truncate">{{ line.name }}</p>
                <p v-if="line.variant" class="text-xs text-base-content/50">{{ line.variant }}</p>
                <p class="text-xs text-base-content/50 mt-0.5">
                  {{ line.quantity }} × ${{ line.unitPrice.toFixed(2) }}
                </p>
              </div>

              <span class="font-bold text-sm shrink-0">${{ line.subtotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- ── Totales ─────────────────────────────────────── -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-2">
            <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide mb-1">
              Totales
            </h2>

            <div class="flex justify-between text-sm">
              <span class="text-base-content/60">Subtotal</span>
              <span>${{ cart.subtotal.toFixed(2) }}</span>
            </div>

            <div v-if="cart.discountResult" class="flex justify-between text-sm">
              <span class="text-success flex items-center gap-1">
                <span class="badge badge-success badge-xs">✓</span>
                {{ cart.discountResult.code }}
              </span>
              <span class="text-success">−${{ cart.discountAmount.toFixed(2) }}</span>
            </div>

            <div class="divider my-0"></div>

            <div class="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${{ cart.total.toFixed(2) }}</span>
            </div>

            <p v-if="cart.discountAmount > 0" class="text-xs text-success text-right">
              Ahorraste ${{ cart.discountAmount.toFixed(2) }} 🎉
            </p>
          </div>
        </div>

        <!-- ── Formulario del cliente ──────────────────────── -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-3">
            <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
              Tus datos
            </h2>

            <label class="form-control">
              <div class="label pb-1">
                <span class="label-text text-sm">Nombre completo *</span>
              </div>
              <input
                v-model="customer.name"
                type="text"
                placeholder="Juan Pérez"
                class="input input-bordered input-sm"
                :class="{ 'input-error': customer.name && customer.name.trim().length < 2 }"
              />
            </label>

            <label class="form-control">
              <div class="label pb-1">
                <span class="label-text text-sm">Teléfono / WhatsApp *</span>
              </div>
              <input
                v-model="customer.phone"
                type="tel"
                inputmode="tel"
                placeholder="71234567"
                class="input input-bordered input-sm"
                :class="{ 'input-error': customer.phone && customer.phone.trim().length < 7 }"
              />
            </label>
          </div>
        </div>

        <!-- ── Selector de cómo abrir WhatsApp ────────────── -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-3">
            <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
              ¿Cómo querés abrir WhatsApp?
            </h2>

            <div class="grid grid-cols-2 gap-2">

              <!-- Opción: App -->
              <label
                class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors"
                :class="selectedTarget === 'app'
                  ? 'border-success bg-success/5'
                  : 'border-base-200 hover:border-base-300'"
              >
                <input
                  v-model="selectedTarget"
                  type="radio"
                  value="app"
                  class="hidden"
                />
                <span class="text-2xl">📱</span>
                <div class="text-center">
                  <p class="text-sm font-semibold">App de WhatsApp</p>
                  <p class="text-xs text-base-content/50 mt-0.5">
                    Abre la app instalada en el dispositivo
                  </p>
                </div>
                <span
                  class="badge badge-xs"
                  :class="selectedTarget === 'app' ? 'badge-success' : 'badge-ghost'"
                >
                  {{ selectedTarget === 'app' ? '✓ Seleccionado' : 'Seleccionar' }}
                </span>
              </label>

              <!-- Opción: Web -->
              <label
                class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors"
                :class="selectedTarget === 'web'
                  ? 'border-success bg-success/5'
                  : 'border-base-200 hover:border-base-300'"
              >
                <input
                  v-model="selectedTarget"
                  type="radio"
                  value="web"
                  class="hidden"
                />
                <span class="text-2xl">💻</span>
                <div class="text-center">
                  <p class="text-sm font-semibold">WhatsApp Web</p>
                  <p class="text-xs text-base-content/50 mt-0.5">
                    Abre directamente en el navegador
                  </p>
                </div>
                <span
                  class="badge badge-xs"
                  :class="selectedTarget === 'web' ? 'badge-success' : 'badge-ghost'"
                >
                  {{ selectedTarget === 'web' ? '✓ Seleccionado' : 'Seleccionar' }}
                </span>
              </label>

            </div>
          </div>
        </div>

        <!-- ── Preview del mensaje ─────────────────────────── -->
        <div v-if="messagePreview" class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-2">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
                Vista previa
              </h2>
              <span class="text-xs text-base-content/40">lo que recibirá el vendedor</span>
            </div>
            <pre class="text-xs font-mono text-base-content/70 bg-base-200 rounded-xl p-3 whitespace-pre-wrap leading-relaxed select-all">{{ messagePreview }}</pre>
          </div>
        </div>

        <p v-else class="text-center text-sm text-base-content/40 py-1">
          Completá tu nombre para ver la vista previa
        </p>

        <!-- ── Acciones ─────────────────────────────────────── -->
        <div class="flex flex-col gap-2">

          <!-- Botón principal: WhatsApp -->
          <button
            class="btn btn-success w-full gap-2 text-base text-white"
            :disabled="!canSend"
            @click="handleWhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar pedido por WhatsApp
            <span class="text-xs opacity-75">
              ({{ selectedTarget === 'app' ? 'App' : 'Web' }})
            </span>
          </button>

          <!-- Botones secundarios -->
          <div class="flex gap-2">
            <button
              class="btn btn-outline flex-1 gap-1 text-sm"
              :disabled="!messagePreview"
              @click="handleCopy"
            >
              <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ copied ? '¡Copiado!' : 'Copiar' }}
            </button>

            <button
              v-if="canShare"
              class="btn btn-outline flex-1 gap-1 text-sm"
              :disabled="!messagePreview"
              @click="handleShare"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
              Compartir
            </button>
          </div>

          <button
            class="btn btn-ghost w-full text-base-content/50 text-sm"
            @click="handleNewQuote"
          >
            Empezar nuevo pedido
          </button>

        </div>

      </template>
    </main>
  </div>
</template>