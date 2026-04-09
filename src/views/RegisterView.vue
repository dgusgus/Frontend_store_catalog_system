<!-- src/views/RegisterView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useToast } from '../composables/useToast'
import { ApiRequestError } from '../api/fetcher'

const router = useRouter()
const auth   = useAuthStore()
const toast  = useToast()

// ── Form state ─────────────────────────────────────────────
const name     = ref('')
const phone    = ref('')
const email    = ref('')
const password = ref('')
const confirm  = ref('')
const showPass = ref(false)
const loading  = ref(false)

// ── Validaciones ───────────────────────────────────────────
const emailError = computed(() => {
  if (!email.value) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? '' : 'Email inválido'
})

const passwordError = computed(() => {
  if (!password.value) return ''
  return password.value.length >= 6 ? '' : 'Mínimo 6 caracteres'
})

const confirmError = computed(() => {
  if (!confirm.value) return ''
  return confirm.value === password.value ? '' : 'Las contraseñas no coinciden'
})

const phoneError = computed(() => {
  if (!phone.value) return ''
  return /^\d{7,15}$/.test(phone.value) ? '' : 'Solo números, entre 7 y 15 dígitos'
})

const canSubmit = computed(() =>
  name.value.trim().length >= 2    &&
  phone.value.trim().length >= 7   &&
  email.value.length > 0           &&
  !emailError.value                &&
  password.value.length >= 6       &&
  !passwordError.value             &&
  confirm.value === password.value &&
  !loading.value
)

// ── Submit ─────────────────────────────────────────────────
async function handleRegister() {
  if (!canSubmit.value) return
  loading.value = true

  try {
    // El backend actual acepta name — extendemos para incluir phone
    // Si el backend aún no tiene phone, igual funciona (lo ignora)
    await auth.register(email.value, password.value, name.value, phone.value)
    toast.success(`¡Bienvenido, ${auth.user?.name ?? auth.user?.email}!`)

    // Si vino del checkout, volver ahí
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect ?? '/catalog')
  } catch (e) {
    if (e instanceof ApiRequestError) {
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
  <div class="min-h-screen bg-base-200 flex flex-col items-center justify-center px-4 py-8">

    <!-- Logo -->
    <div class="mb-6 text-center">
      <div class="text-4xl mb-2">🛍️</div>
      <h1 class="text-2xl font-bold text-base-content">Crear cuenta</h1>
      <p class="text-sm text-base-content/60 mt-1">
        Ya tenés cuenta?
        <RouterLink to="/login" class="link link-primary font-medium">Iniciá sesión</RouterLink>
      </p>
    </div>

    <div class="card bg-base-100 shadow-xl w-full max-w-sm">
      <div class="card-body gap-3">

        <!-- Nombre -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text font-medium">Nombre completo *</span>
          </div>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            placeholder="Juan Pérez"
            class="input input-bordered w-full"
            :class="{ 'input-error': name && name.trim().length < 2 }"
            :disabled="loading"
            @keyup.enter="handleRegister"
          />
          <div v-if="name && name.trim().length < 2" class="label pt-1">
            <span class="label-text-alt text-error">Mínimo 2 caracteres</span>
          </div>
        </label>

        <!-- Teléfono -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text font-medium">Teléfono / WhatsApp *</span>
          </div>
          <input
            v-model="phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            placeholder="71234567"
            class="input input-bordered w-full"
            :class="{ 'input-error': phoneError }"
            :disabled="loading"
            @keyup.enter="handleRegister"
          />
          <div v-if="phoneError" class="label pt-1">
            <span class="label-text-alt text-error">{{ phoneError }}</span>
          </div>
        </label>

        <!-- Email -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text font-medium">Email *</span>
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
            @keyup.enter="handleRegister"
          />
          <div v-if="emailError" class="label pt-1">
            <span class="label-text-alt text-error">{{ emailError }}</span>
          </div>
        </label>

        <!-- Contraseña -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text font-medium">Contraseña *</span>
          </div>
          <div class="relative">
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Mínimo 6 caracteres"
              class="input input-bordered w-full pr-12"
              :class="{ 'input-error': passwordError }"
              :disabled="loading"
              @keyup.enter="handleRegister"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              @click="showPass = !showPass"
            >
              <svg v-if="!showPass" xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
          <div v-if="passwordError" class="label pt-1">
            <span class="label-text-alt text-error">{{ passwordError }}</span>
          </div>
        </label>

        <!-- Confirmar contraseña -->
        <label class="form-control">
          <div class="label pb-1">
            <span class="label-text font-medium">Confirmar contraseña *</span>
          </div>
          <input
            v-model="confirm"
            :type="showPass ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Repetí tu contraseña"
            class="input input-bordered w-full"
            :class="{ 'input-error': confirmError }"
            :disabled="loading"
            @keyup.enter="handleRegister"
          />
          <div v-if="confirmError" class="label pt-1">
            <span class="label-text-alt text-error">{{ confirmError }}</span>
          </div>
        </label>

        <!-- Botón -->
        <button
          class="btn btn-primary w-full mt-2"
          :disabled="!canSubmit"
          @click="handleRegister"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Crear cuenta</span>
        </button>

      </div>
    </div>

  </div>
</template>