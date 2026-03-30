<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useToast } from '../composables/useToast'
import { ApiRequestError } from '../api/fetcher'

const router = useRouter()
const auth   = useAuthStore()
const toast  = useToast()

// ── Form state ─────────────────────────────────────
const email    = ref('')
const password = ref('')
const loading  = ref(false)
const showPass = ref(false)

// ── Validación simple client-side ─────────────────
const emailError = computed(() => {
  if (!email.value) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
    ? ''
    : 'Email inválido'
})

const canSubmit = computed(() =>
  email.value.length > 0 &&
  password.value.length >= 6 &&
  !emailError.value &&
  !loading.value
)

// ── Submit ─────────────────────────────────────────
async function handleLogin() {
  if (!canSubmit.value) return
  loading.value = true

  try {
    await auth.login(email.value, password.value)
    toast.success(`Bienvenido, ${auth.user?.name ?? auth.user?.email}`)
    router.push('/catalog')
  } catch (e) {
    if (e instanceof ApiRequestError) {
      // El backend devuelve mensajes claros — los mostramos directo
      toast.error(e.message)
    } else {
      toast.error('No se pudo conectar al servidor')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200 flex flex-col items-center justify-center px-4">

    <!-- Logo / marca -->
    <div class="mb-8 text-center">
      <div class="text-4xl mb-2">🛍️</div>
      <h1 class="text-2xl font-bold text-base-content">Mi Tienda</h1>
      <p class="text-sm text-base-content/60 mt-1">Ingresa a tu cuenta</p>
    </div>

    <!-- Card del formulario -->
    <div class="card bg-base-100 shadow-xl w-full max-w-sm">
      <div class="card-body gap-4">

        <!-- Email -->
        <label class="form-control w-full">
          <div class="label pb-1">
            <span class="label-text font-medium">Email</span>
          </div>
          <input
            v-model="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="tu@email.com"
            class="input input-bordered w-full"
            :class="{ 'input-error': emailError }"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
          <div class="label pt-1" v-if="emailError">
            <span class="label-text-alt text-error">{{ emailError }}</span>
          </div>
        </label>

        <!-- Contraseña -->
        <label class="form-control w-full">
          <div class="label pb-1">
            <span class="label-text font-medium">Contraseña</span>
          </div>
          <div class="relative">
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Mínimo 6 caracteres"
              class="input input-bordered w-full pr-12"
              :disabled="loading"
              @keyup.enter="handleLogin"
            />
            <!-- Toggle mostrar/ocultar contraseña -->
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
              :aria-label="showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPass = !showPass"
            >
              <!-- Ojo abierto -->
              <svg v-if="!showPass" xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <!-- Ojo cerrado -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
        </label>

        <!-- Botón submit -->
        <button
          class="btn btn-primary w-full mt-2"
          :disabled="!canSubmit"
          @click="handleLogin"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Ingresar</span>
        </button>

        <!-- Hint credenciales demo (quitar en producción) -->
        <div class="divider text-xs text-base-content/30 my-0">demo</div>
        <div class="flex flex-col gap-1">
          <button
            class="btn btn-ghost btn-xs text-base-content/50"
            @click="email = 'admin@example.com'; password = 'admin123'"
          >
            Admin: admin@example.com / admin123
          </button>
          <button
            class="btn btn-ghost btn-xs text-base-content/50"
            @click="email = 'user@example.com'; password = 'user123'"
          >
            User: user@example.com / user123
          </button>
        </div>

      </div>
    </div>

  </div>
</template>