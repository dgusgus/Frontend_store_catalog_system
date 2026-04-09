<!-- src/views/CheckoutView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter }        from 'vue-router'
import { useCartStore }     from '../stores/cart.store'
import { useSettingsStore } from '../stores/settings.store'
import { useAuthStore }     from '../stores/auth.store'
import { useToast }         from '../composables/useToast'
import { useWhatsApp }      from '../composables/useWhatsApp'
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

const customerPhone = ref('')
const createdOrder  = ref<Order | null>(null)
const submitting    = ref(false)

onMounted(() => settings.fetchSettings())

// ── Validación ─────────────────────────────────────────────
const canSubmit = computed(() =>
  !cart.isEmpty &&
  !submitting.value &&
  auth.isAuthenticated &&
  customerPhone.value.trim().length >= 7
)

// ── Confirmar pedido ───────────────────────────────────────
async function handleConfirm() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const order = await ordersApi.create({
      customerName:  auth.user?.name ?? auth.user?.email ?? 'Cliente',
      customerPhone: customerPhone.value.trim(),
      discountCode:  cart.discountCode || undefined,
      items: cart.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity:  item.quantity,
      })),
    })

    createdOrder.value = order
    cart.clearCart()
    toast.success(`Pedido ${order.orderNumber} creado`)
    wa.openWhatsApp(order, 'app')

  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al crear el pedido.')
  } finally {
    submitting.value = false
  }
}

function handleReopenWhatsApp() {
  if (!createdOrder.value) return
  wa.openWhatsApp(createdOrder.value, 'app')
}

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
        <p class="text-sm text-base-content/50 mt-0.5">Revisá tu pedido antes de enviarlo</p>
      </div>

      <!-- ── PEDIDO CONFIRMADO ───────────────────────────── -->
      <template v-if="createdOrder">

        <!-- Card de éxito -->
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

            <!-- Resumen de items -->
            <div class="w-full bg-base-100 rounded-xl p-3 text-left mt-1">
              <div
                v-for="item in createdOrder.items"
                :key="item.id"
                class="flex justify-between text-sm py-1.5 border-b border-base-200 last:border-0"
              >
                <span class="text-base-content/70">
                  {{ item.productName }}
                  <span v-if="item.variantName" class="text-xs text-base-content/40">
                    ({{ item.variantName }})
                  </span>
                  × {{ item.quantity }}
                </span>
                <span class="font-medium">${{ Number(item.subtotal).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between font-bold mt-2 pt-1 border-t border-base-200">
                <span>Total</span>
                <span>${{ Number(createdOrder.total).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── QR de pago ─────────────────────────────────────
             Aquí createdOrder ya está garantizado como no-null
             porque estamos dentro de <template v-if="createdOrder">
        -->
        <div v-if="settings.paymentQrUrl" class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 items-center gap-3">

            <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide w-full">
              Pago bancario
            </h2>

            <p class="text-sm text-base-content/70 text-center">
              Escaneá el QR para transferir el monto total
            </p>

            <!-- Monto destacado — createdOrder no puede ser null aquí -->
            <div class="bg-primary/10 rounded-xl px-6 py-3 text-center w-full">
              <p class="text-xs text-base-content/50 uppercase tracking-wide">Monto a transferir</p>
              <p class="text-3xl font-bold text-primary mt-1">
                ${{ Number(createdOrder.total).toFixed(2) }}
              </p>
            </div>

            <!-- QR — settings.paymentQrUrl ya es string no-null por el v-if del padre -->
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-base-200">
              <img
                :src="settings.paymentQrUrl"
                alt="QR de pago"
                class="w-48 h-48 object-contain"
              />
            </div>

            <p class="text-xs text-base-content/40 text-center">
              Después de transferir, enviá el comprobante por WhatsApp
            </p>

          </div>
        </div>

        <!-- Acciones post-confirmación -->
        <div class="flex flex-col gap-2">
          <button class="btn btn-success w-full gap-2 text-white" @click="handleReopenWhatsApp">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Reenviar por WhatsApp
          </button>
          <RouterLink to="/my-orders" class="btn btn-outline w-full">
            Ver estado de mis pedidos
          </RouterLink>
          <button class="btn btn-ghost w-full text-base-content/50"
            @click="router.push('/catalog')">
            Seguir comprando
          </button>
        </div>

      </template>

      <!-- ── CARRITO VACÍO ──────────────────────────────── -->
      <div v-else-if="cart.isEmpty" class="flex flex-col items-center gap-4 py-16 text-center">
        <span class="text-5xl">🛒</span>
        <p class="text-base-content/60">No hay productos en el carrito</p>
        <RouterLink to="/catalog" class="btn btn-primary btn-sm">Ver productos</RouterLink>
      </div>

      <!-- ── FORMULARIO ─────────────────────────────────── -->
      <template v-else>

        <!-- Productos -->
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

        <!-- Botón condicional -->
        <div class="flex flex-col gap-2">

          <!-- NO autenticado -->
          <template v-if="!auth.isAuthenticated">
            <div class="alert alert-info text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-5 shrink-0" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Necesitás una cuenta para confirmar tu pedido.</span>
            </div>
            <RouterLink to="/login" class="btn btn-primary w-full text-base">
              Iniciar sesión para continuar
            </RouterLink>
            <p class="text-center text-sm text-base-content/50">
              ¿No tenés cuenta?
              <RouterLink to="/register" class="link link-primary font-medium">
                Registrate gratis
              </RouterLink>
            </p>
          </template>

          <!-- SÍ autenticado -->
          <template v-else>
            <div class="card bg-base-100 shadow-sm">
              <div class="card-body p-4 gap-3">
                <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
                  Tu teléfono
                </h2>
                <label class="form-control">
                  <input
                    v-model="customerPhone"
                    type="tel"
                    inputmode="tel"
                    placeholder="71234567"
                    class="input input-bordered input-sm"
                  />
                  <div class="label pt-1">
                    <span class="label-text-alt text-base-content/40">
                      Para que el vendedor pueda contactarte
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <button
              class="btn btn-success w-full gap-2 text-base text-white"
              :disabled="!canSubmit"
              @click="handleConfirm"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill="currentColor" class="size-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {{ submitting ? 'Creando pedido...' : 'Confirmar pedido' }}
            </button>

            <p class="text-xs text-center text-base-content/40">
              Comprando como
              <span class="font-medium">{{ auth.user?.name ?? auth.user?.email }}</span>
            </p>
          </template>

        </div>
      </template>

    </main>
  </div>
</template>