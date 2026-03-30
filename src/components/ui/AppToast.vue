<script setup lang="ts">
import { useUiStore } from '../../stores/ui.store'

const ui = useUiStore()
</script>

<template>
  <div class="toast toast-top toast-center z-50">
    <TransitionGroup name="toast">
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="alert shadow-lg min-w-64 max-w-80"
        :class="{
          'alert-success': toast.type === 'success',
          'alert-error':   toast.type === 'error',
          'alert-info':    toast.type === 'info',
        }"
      >
        <span class="text-sm">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>