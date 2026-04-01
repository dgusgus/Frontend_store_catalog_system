<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart.store'
import { useToast } from '../composables/useToast'
import AppNavbar from '../components/ui/AppNavbar.vue'

const router = useRouter()
const cart   = useCartStore()
const toast  = useToast()

const copied = ref(false)

// ── Genera el texto del resumen ────────────────────
const summaryText = computed(() => {
  const lines: string[] = []

  lines.push('🛍️ RESUMEN DE COTIZACIÓN')
  lines.push('─'.repeat(30))

  cart.items.forEach(item => {
    const variant  = item.variantName ? ` (${item.variantName})` : ''
    const subtotal = (item.price * item.quantity).toFixed(2)
    lines.push(`\n• ${item.productName}${variant}`)
    lines.push(`  ${item.quantity} × $${item.price.toFixed(2)} = $${subtotal}`)
  })

  lines.push('\n' + '─'.repeat(30))

  if (cart.discountResult) {
    lines.push(`Subtotal:   $${cart.subtotal.toFixed(2)}`)
    lines.push(`Descuento (${cart.discountResult.code}): -$${cart.discountAmount.toFixed(2)}`)
    lines.push(`TOTAL:      $${cart.total.toFixed(2)}`)
  } else {
    lines.push(`TOTAL: $${cart.total.toFixed(2)}`)
  }

  return lines.join('\n')
})

// ── Líneas estructuradas para renderizar en pantalla
const summaryLines = computed(() => {
  return cart.items.map(item => ({
    name:      item.productName,
    variant:   item.variantName ?? null,
    image:     item.image ?? null,
    slug:      item.slug,
    quantity:  item.quantity,
    unitPrice: item.price,
    subtotal:  item.price * item.quantity,
  }))
})

// ── Copiar al portapapeles ─────────────────────────
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(summaryText.value)
    copied.value = true
    toast.success('Resumen copiado')
    setTimeout(() => { copied.value = false }, 2500)
  } catch {
    toast.error('No se pudo copiar')
  }
}

// ── Compartir nativo (Web Share API) ──────────────
const canShare = computed(() =>
  typeof navigator !== 'undefined' && !!navigator.share
)

async function handleShare() {
  try {
    await navigator.share({
      title: 'Mi cotización',
      text:  summaryText.value,
    })
  } catch {
    // El usuario canceló — no es un error real
  }
}

function handleNewQuote() {
  cart.clearCart()
  router.push('/catalog')
}
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
        <h1 class="text-xl font-bold">Tu cotización</h1>
        <p class="text-sm text-base-content/50 mt-0.5">
          Copia o comparte el resumen de tu pedido
        </p>
      </div>

      <!-- Carrito vacío -->
      <div v-if="cart.isEmpty" class="flex flex-col items-center gap-4 py-16 text-center">
        <span class="text-5xl">🛒</span>
        <p class="text-base-content/60">No hay productos en el carrito</p>
        <RouterLink to="/catalog" class="btn btn-primary btn-sm">
          Ver productos
        </RouterLink>
      </div>

      <template v-else>

        <!-- Lista de productos -->
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
              <!-- Imagen -->
              <RouterLink :to="`/product/${line.slug}`" class="shrink-0">
                <div class="size-14 rounded-xl overflow-hidden bg-base-200">
                  <img
                    v-if="line.image"
                    :src="line.image"
                    :alt="line.name"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-xl">📦</div>
                </div>
              </RouterLink>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm truncate">{{ line.name }}</p>
                <p v-if="line.variant" class="text-xs text-base-content/50">{{ line.variant }}</p>
                <p class="text-xs text-base-content/50 mt-0.5">
                  {{ line.quantity }} × ${{ line.unitPrice.toFixed(2) }}
                </p>
              </div>

              <!-- Subtotal -->
              <span class="font-bold text-sm shrink-0">
                ${{ line.subtotal.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Totales -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-2">
            <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide mb-1">
              Totales
            </h2>

            <div class="flex justify-between text-sm">
              <span class="text-base-content/60">Subtotal</span>
              <span>${{ cart.subtotal.toFixed(2) }}</span>
            </div>

            <div
              v-if="cart.discountResult"
              class="flex justify-between text-sm"
            >
              <span class="text-success flex items-center gap-1">
                <span class="badge badge-success badge-xs">✓</span>
                {{ cart.discountResult.code }}
                <span class="text-base-content/40">
                  ({{ cart.discountResult.type === 'PERCENT'
                    ? `${cart.discountResult.value}%`
                    : `$${cart.discountResult.value}` }})
                </span>
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

        <!-- Preview del texto copiable -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 gap-2">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
                Resumen de texto
              </h2>
              <span class="text-xs text-base-content/40">para copiar y pegar</span>
            </div>
            <pre class="text-xs font-mono text-base-content/70 bg-base-200 rounded-xl p-3 whitespace-pre-wrap leading-relaxed select-all">{{ summaryText }}</pre>
          </div>
        </div>

        <!-- Acciones principales -->
        <div class="flex flex-col gap-2">

          <!-- Copiar -->
          <button
            class="btn btn-primary w-full gap-2 text-base"
            @click="handleCopy"
          >
            <svg
              v-if="!copied"
              xmlns="http://www.w3.org/2000/svg"
              class="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ copied ? '¡Copiado!' : 'Copiar resumen' }}
          </button>

          <!-- Compartir nativo — solo en mobile si el browser lo soporta -->
          <button
            v-if="canShare"
            class="btn btn-outline w-full gap-2"
            @click="handleShare"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Compartir
          </button>

          <!-- Nueva cotización -->
          <button
            class="btn btn-ghost w-full text-base-content/50"
            @click="handleNewQuote"
          >
            Empezar nueva cotización
          </button>

        </div>

      </template>

    </main>
  </div>
</template>