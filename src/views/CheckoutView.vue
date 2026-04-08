<!-- src/views/CheckoutView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter }        from 'vue-router'
import { useCartStore }     from '../stores/cart.store'
import { useSettingsStore } from '../stores/settings.store'
import { useAuthStore }     from '../stores/auth.store'
import { useToast }         from '../composables/useToast'
import { useWhatsApp }      from '../composables/useWhatsApp'
import type { WhatsAppTarget } from '../composables/useWhatsApp'
import { ordersApi }        from '../api/orders'
import { ApiRequestError }  from '../api/fetcher'
import AppNavbar from '../components/ui/AppNavbar.vue'
import type { Order } from '../api/orders'

const router   = useRouter()
const cart     = useCartStore()
const settings = useSettingsStore()
const auth     = useAuthStore()
const toast    = useToast()
const wa       = useWhatsApp()

onMounted(() => settings.fetchSettings())

// ── Datos del cliente ──────────────────────────────────────
// Pre-rellena con los datos del usuario autenticado
const customer = ref({
  name:  auth.user?.name  ?? '',
  phone: '',
})

const selectedTarget = ref<WhatsAppTarget>('app')

// ── Estado de la orden creada ──────────────────────────────
const createdOrder  = ref<Order | null>(null)
const submitting    = ref(false)

// ── Validación ─────────────────────────────────────────────
const canSubmit = computed(() =>
  customer.value.name.trim().length >= 2  &&
  customer.value.phone.trim().length >= 7 &&
  !cart.isEmpty &&
  !submitting.value
)

// ── Preview del mensaje (antes de crear la orden) ──────────
const messagePreview = computed(() => {
  if (customer.value.name.trim().length < 2) return null
  if (createdOrder.value) {
    return wa.buildMessage(customer.value, createdOrder.value.orderNumber)
  }
  return wa.buildMessage(customer.value, null)
})

// ── Confirmar pedido ───────────────────────────────────────
async function handleConfirm() {
  if (!canSubmit.value) return

  submitting.value = true
  try {
    // 1. Crear la orden en el backend
    const order = await ordersApi.create({
      customerName:  customer.value.name.trim(),
      customerPhone: customer.value.phone.trim(),
      discountCode:  cart.discountCode || undefined,
      items: cart.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity:  item.quantity,
      })),
    })

    createdOrder.value = order

    // 2. Limpiar el carrito — la orden ya está en el backend
    cart.clearCart()

    toast.success(`Pedido ${order.orderNumber} creado`)

    // 3. Abrir WhatsApp con el número de orden incluido
    wa.openWhatsApp(customer.value, selectedTarget.value, order.orderNumber)

  } catch (e) {
    if (e instanceof ApiRequestError) {
      toast.error(e.message)
    } else {
      toast.error('Error al crear el pedido. Intentá de nuevo.')
    }
  } finally {
    submitting.value = false
  }
}

// ── Re-abrir WhatsApp si el usuario lo cerró ───────────────
function handleReopenWhatsApp() {
  if (!createdOrder.value) return
  wa.openWhatsApp(customer.value, selectedTarget.value, createdOrder.value.orderNumber)
}

// ── Líneas del resumen visual ──────────────────────────────
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

      <div>
        <button class="btn btn-ghost btn-sm -ml-2 mb-1" @click="router.back()">
          ← Volver al carrito
        </button>
        <h1 class="text-xl font-bold">Confirmar pedido</h1>
        <p class="text-sm text-base-content/50 mt-0.5">
          Revisá tu pedido y confirmalo para enviarlo al vendedor
        </p>
      </div>

      <!-- ── Pedido creado exitosamente ─────────────────── -->
      <template v-if="createdOrder">
        <div class="card bg-success/10 border border-success/30 shadow-sm">
          <div class="card-body p-5 items-center text-center gap-3">
            <div class="text-4xl">✅</div>
            <div>
              <p class="font-bold text-lg text-success">¡Pedido confirmado!</p>
              <p class="text-2xl font-mono font-bold mt-1">{{ createdOrder.orderNumber }}</p>
              <p class="text-sm text-base-content/60 mt-2">
                El vendedor recibió tu pedido por WhatsApp y lo confirmará en breve.
              </p>
            </div>

            <!-- Resumen del pedido creado -->
            <div class="w-full bg-base-100 rounded-xl p-3 text-left mt-1">
              <div v-for="item in createdOrder.items" :key="item.id"
                class="flex justify-between text-sm py-1 border-b border-base-200 last:border-0">
                <span class="text-base-content/70">
                  {{ item.productName }}
                  <span v-if="item.variantName" class="text-xs text-base-content/40">
                    ({{ item.variantName }})
                  </span>
                  × {{ item.quantity }}
                </span>
                <span class="font-medium">${{ Number(item.subtotal).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between font-bold mt-2 pt-1">
                <span>Total</span>
                <span>${{ Number(createdOrder.total).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones post-confirmación -->
        <div class="flex flex-col gap-2">
          <button
            class="btn btn-success w-full gap-2 text-white"
            @click="handleReopenWhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Reenviar por WhatsApp
          </button>
          <button class="btn btn-ghost w-full" @click="router.push('/catalog')">
            Seguir comprando
          </button>
        </div>
      </template>

      <!-- ── Formulario (carrito no vacío, orden no creada) ── -->
      <template v-else-if="!cart.isEmpty">

        <!-- Aviso si no está autenticado -->
        <div v-if="!auth.isAuthenticated" class="alert alert-warning">
          <span class="text-sm">
            Necesitás
            <RouterLink to="/login" class="link font-semibold">iniciar sesión</RouterLink>
            para confirmar un pedido.
          </span>
        </div>

        <!-- Aviso WhatsApp no configurado -->
        <div v-if="!settings.hasWhatsapp && !settings.loading" class="alert alert-warning">
          <span class="text-sm">
            WhatsApp no configurado.
            <RouterLink to="/admin/settings" class="link font-semibold">Configurarlo →</RouterLink>
          </span>
        </div>

        <!-- Productos -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-3">
            <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
              Productos
            </h2>
            <div v-for="line in summaryLines" :key="`${line.slug}-${line.variant}`"
              class="flex items-center gap-3 py-2 border-b border-base-200 last:border-0">
              <div class="size-14 rounded-xl overflow-hidden bg-base-200 shrink-0">
                <img v-if="line.image" :src="line.image" :alt="line.name"
                  class="w-full h-full object-cover" loading="lazy" />
                <div v-else class="w-full h-full flex items-center justify-center text-xl">📦</div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm truncate">{{ line.name }}</p>
                <p v-if="line.variant" class="text-xs text-base-content/50">{{ line.variant }}</p>
                <p class="text-xs text-base-content/50">
                  {{ line.quantity }} × ${{ line.unitPrice.toFixed(2) }}
                </p>
              </div>
              <span class="font-bold text-sm shrink-0">${{ line.subtotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Totales -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-2">
            <div class="flex justify-between text-sm">
              <span class="text-base-content/60">Subtotal</span>
              <span>${{ cart.subtotal.toFixed(2) }}</span>
            </div>
            <div v-if="cart.discountResult" class="flex justify-between text-sm text-success">
              <span class="flex items-center gap-1">
                <span class="badge badge-success badge-xs">✓</span>
                {{ cart.discountResult.code }}
              </span>
              <span>−${{ cart.discountAmount.toFixed(2) }}</span>
            </div>
            <div class="divider my-0"></div>
            <div class="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${{ cart.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Datos del cliente -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-3">
            <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
              Tus datos
            </h2>
            <label class="form-control">
              <div class="label pb-1"><span class="label-text text-sm">Nombre completo *</span></div>
              <input v-model="customer.name" type="text" placeholder="Juan Pérez"
                class="input input-bordered input-sm"
                :class="{ 'input-error': customer.name && customer.name.trim().length < 2 }" />
            </label>
            <label class="form-control">
              <div class="label pb-1"><span class="label-text text-sm">Teléfono / WhatsApp *</span></div>
              <input v-model="customer.phone" type="tel" inputmode="tel" placeholder="71234567"
                class="input input-bordered input-sm"
                :class="{ 'input-error': customer.phone && customer.phone.trim().length < 7 }" />
            </label>
          </div>
        </div>

        <!-- Selector de apertura de WhatsApp -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-3">
            <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
              ¿Cómo abrís WhatsApp?
            </h2>
            <div class="grid grid-cols-2 gap-2">
              <label v-for="opt in [
                { value: 'app', icon: '📱', label: 'App móvil',   desc: 'Abre la app instalada' },
                { value: 'web', icon: '💻', label: 'WhatsApp Web', desc: 'Abre en el navegador' },
              ]" :key="opt.value"
                class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors"
                :class="selectedTarget === opt.value
                  ? 'border-success bg-success/5'
                  : 'border-base-200 hover:border-base-300'"
              >
                <input v-model="selectedTarget" type="radio" :value="opt.value" class="hidden" />
                <span class="text-2xl">{{ opt.icon }}</span>
                <div class="text-center">
                  <p class="text-sm font-semibold">{{ opt.label }}</p>
                  <p class="text-xs text-base-content/50 mt-0.5">{{ opt.desc }}</p>
                </div>
                <span class="badge badge-xs"
                  :class="selectedTarget === opt.value ? 'badge-success' : 'badge-ghost'">
                  {{ selectedTarget === opt.value ? '✓ Seleccionado' : 'Seleccionar' }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Preview del mensaje -->
        <div v-if="messagePreview" class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-2">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
                Vista previa
              </h2>
              <span class="text-xs text-base-content/40">lo que verá el vendedor</span>
            </div>
            <pre class="text-xs font-mono text-base-content/70 bg-base-200 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">{{ messagePreview }}</pre>
          </div>
        </div>

        <!-- Botón confirmar -->
        <div class="flex flex-col gap-2">
          <button
            class="btn btn-success w-full gap-2 text-base text-white"
            :disabled="!canSubmit || !auth.isAuthenticated"
            @click="handleConfirm"
          >
            <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {{ submitting ? 'Creando pedido...' : 'Confirmar y enviar por WhatsApp' }}
          </button>
          <button class="btn btn-ghost w-full text-sm text-base-content/50" @click="router.back()">
            Volver al carrito
          </button>
        </div>

      </template>

      <!-- Carrito vacío -->
      <div v-else class="flex flex-col items-center gap-4 py-16 text-center">
        <span class="text-5xl">🛒</span>
        <p class="text-base-content/60">No hay productos en el carrito</p>
        <RouterLink to="/catalog" class="btn btn-primary btn-sm">Ver productos</RouterLink>
      </div>

    </main>
  </div>
</template>