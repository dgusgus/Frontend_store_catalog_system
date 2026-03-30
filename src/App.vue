<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import { useCounterStore } from './stores/counter'
const counter = useCounterStore()
</script>

<template>
  <HelloWorld />
  <div class="p-10">
    <button class="btn btn-primary">Hola DaisyUI 🚀</button>
  </div>
  <router-view />
  <div class="p-10">
    <h1 class="text-xl">Contador: {{ counter.count }}</h1>

    <button class="btn btn-primary mt-4" @click="counter.increment()">
      Incrementar
    </button>
  </div>
</template>
