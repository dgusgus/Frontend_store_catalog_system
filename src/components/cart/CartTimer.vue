<!-- src/components/cart/CartTimer.vue -->
<!-- Temporizador visual del carrito — se muestra en CartView y CheckoutView -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useCartTimer } from '../../composables/useCartTimer'

const timer = useCartTimer()

onMounted(() => timer.init())
</script>

<template>
  <Transition name="timer-slide">
    <div
      v-if="timer.isActive.value"
      class="rounded-2xl border-2 p-4 transition-all duration-500"
      :class="{
        'border-base-300 bg-base-100':                         timer.urgency.value === 'normal',
        'border-warning/50 bg-warning/10':                     timer.urgency.value === 'warning',
        'border-error/70 bg-error/10 animate-pulse-border':    timer.urgency.value === 'critical',
      }"
    >
      <div class="flex items-center gap-3">

        <!-- Ícono animado -->
        <div
          class="shrink-0 rounded-full flex items-center justify-center size-10 transition-colors"
          :class="{
            'bg-base-200':  timer.urgency.value === 'normal',
            'bg-warning/20': timer.urgency.value === 'warning',
            'bg-error/20':   timer.urgency.value === 'critical',
          }"
        >
          <span
            class="text-xl transition-all"
            :class="{ 'animate-spin-slow': timer.urgency.value === 'critical' }"
          >
            {{ timer.urgency.value === 'critical' ? '🚨' : timer.urgency.value === 'warning' ? '⚠️' : '⏱️' }}
          </span>
        </div>

        <!-- Texto -->
        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-semibold"
            :class="{
              'text-base-content':  timer.urgency.value === 'normal',
              'text-warning':       timer.urgency.value === 'warning',
              'text-error':         timer.urgency.value === 'critical',
            }"
          >
            {{ timer.urgency.value === 'critical'
              ? '¡Tu carrito expira pronto!'
              : timer.urgency.value === 'warning'
              ? 'El carrito expirará en breve'
              : 'Tiempo para completar tu compra' }}
          </p>
          <p class="text-xs text-base-content/50 mt-0.5">
            {{ timer.urgency.value === 'critical'
              ? 'El carrito se vaciará automáticamente'
              : 'Confirmá tu pedido antes de que expire' }}
          </p>
        </div>

        <!-- Reloj digital -->
        <div
          class="shrink-0 font-mono text-2xl font-bold tabular-nums transition-colors"
          :class="{
            'text-base-content':              timer.urgency.value === 'normal',
            'text-warning':                   timer.urgency.value === 'warning',
            'text-error animate-pulse':       timer.urgency.value === 'critical',
          }"
        >
          {{ timer.formattedTime.value }}
        </div>

      </div>

      <!-- Barra de progreso -->
      <div class="mt-3 h-1.5 bg-base-200 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-1000"
          :class="{
            'bg-primary':  timer.urgency.value === 'normal',
            'bg-warning':  timer.urgency.value === 'warning',
            'bg-error':    timer.urgency.value === 'critical',
          }"
          :style="{
            width: `${(timer.secondsLeft.value / (15 * 60)) * 100}%`
          }"
        ></div>
      </div>

    </div>
  </Transition>
</template>

<style scoped>
.timer-slide-enter-active,
.timer-slide-leave-active {
  transition: all 0.3s ease;
}
.timer-slide-enter-from,
.timer-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes pulse-border {
  0%, 100% { border-color: rgb(239 68 68 / 0.7); }
  50%       { border-color: rgb(239 68 68 / 0.2); }
}
.animate-pulse-border {
  animation: pulse-border 1.5s ease-in-out infinite;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}
</style>