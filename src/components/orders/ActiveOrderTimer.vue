<!-- src/components/orders/ActiveOrderTimer.vue -->
<!-- Muestra el temporizador del pedido PENDING activo.
     Se usa en el navbar (compacto) y en my-orders (expandido). -->
<script setup lang="ts">
import { useActiveOrder } from '../../composables/useActiveOrder'

defineProps<{
  variant: 'navbar' | 'full'  // navbar = pequeño, full = card completa
}>()

const order = useActiveOrder()
</script>

<template>

  <!-- ── Versión navbar (pequeña, inline) ───────────────── -->
  <template v-if="variant === 'navbar'">
    <RouterLink
      v-if="order.hasPending.value"
      to="/my-orders"
      class="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors"
      :class="{
        'bg-base-200 text-base-content':       order.urgency.value === 'normal',
        'bg-warning/20 text-warning':           order.urgency.value === 'warning',
        'bg-error/20 text-error animate-pulse': order.urgency.value === 'critical',
      }"
    >
      <!-- Ícono -->
      <span class="text-sm">
        {{ order.urgency.value === 'critical' ? '🚨' : '⏱️' }}
      </span>
      <!-- Tiempo -->
      <span class="font-mono font-bold text-sm tabular-nums">
        {{ order.formattedTime.value }}
      </span>
      <!-- Número de orden -->
      <span class="text-xs opacity-70 hidden sm:block">
        {{ order.activeOrder.value?.orderNumber }}
      </span>
    </RouterLink>
  </template>

  <!-- ── Versión full (card en my-orders) ───────────────── -->
  <template v-else>
    <Transition name="timer-slide">
      <div
        v-if="order.hasPending.value"
        class="rounded-2xl border-2 p-4 transition-all duration-500"
        :class="{
          'border-base-300 bg-base-100':                      order.urgency.value === 'normal',
          'border-warning/50 bg-warning/10':                  order.urgency.value === 'warning',
          'border-error/70 bg-error/10':                      order.urgency.value === 'critical',
        }"
      >
        <div class="flex items-center gap-3">

          <!-- Ícono -->
          <div
            class="shrink-0 rounded-full flex items-center justify-center size-10"
            :class="{
              'bg-base-200':   order.urgency.value === 'normal',
              'bg-warning/20': order.urgency.value === 'warning',
              'bg-error/20':   order.urgency.value === 'critical',
            }"
          >
            <span class="text-xl">
              {{ order.urgency.value === 'critical' ? '🚨' : order.urgency.value === 'warning' ? '⚠️' : '⏱️' }}
            </span>
          </div>

          <!-- Texto -->
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-semibold"
              :class="{
                'text-base-content': order.urgency.value === 'normal',
                'text-warning':      order.urgency.value === 'warning',
                'text-error':        order.urgency.value === 'critical',
              }"
            >
              {{
                order.urgency.value === 'critical'
                  ? '¡Tu pedido expira muy pronto!'
                  : order.urgency.value === 'warning'
                  ? 'El tiempo se está agotando'
                  : 'Tiempo para que el vendedor confirme'
              }}
            </p>
            <p class="text-xs text-base-content/50 mt-0.5">
              {{
                order.urgency.value === 'critical'
                  ? 'Si el tiempo expira, el pedido se cancelará'
                  : 'El vendedor tiene 15 minutos para aceptar tu pedido'
              }}
            </p>
          </div>

          <!-- Reloj digital -->
          <div
            class="shrink-0 font-mono text-2xl font-bold tabular-nums"
            :class="{
              'text-base-content':        order.urgency.value === 'normal',
              'text-warning':             order.urgency.value === 'warning',
              'text-error animate-pulse': order.urgency.value === 'critical',
            }"
          >
            {{ order.formattedTime.value }}
          </div>

        </div>

        <!-- Barra de progreso -->
        <div class="mt-3 h-1.5 bg-base-200 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-1000"
            :class="{
              'bg-primary':  order.urgency.value === 'normal',
              'bg-warning':  order.urgency.value === 'warning',
              'bg-error':    order.urgency.value === 'critical',
            }"
            :style="{ width: `${order.progressPercent.value}%` }"
          ></div>
        </div>

      </div>
    </Transition>
  </template>

</template>

<style scoped>
.timer-slide-enter-active,
.timer-slide-leave-active { transition: all 0.3s ease; }
.timer-slide-enter-from,
.timer-slide-leave-to     { opacity: 0; transform: translateY(-8px); }
</style>