<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const auth   = useAuthStore()
const toast  = useToast()

async function handleLogout() {
  await auth.logout()
  toast.info('Sesión cerrada')
  router.push('/login')
}
</script>

<template>
  <div class="navbar bg-base-100 border-b border-base-200 sticky top-0 z-40">

    <!-- Marca -->
    <div class="navbar-start">
      <RouterLink to="/catalog" class="btn btn-ghost text-lg font-bold px-2">
        🛍️ Mi Tienda
      </RouterLink>
    </div>

    <!-- Acciones -->
    <div class="navbar-end gap-1">

      <!-- Badge de rol solo si está autenticado -->
      <span
        v-if="auth.isAuthenticated"
        class="badge badge-sm hidden sm:flex"
        :class="auth.isAdmin ? 'badge-warning' : 'badge-ghost'"
      >
        {{ auth.isAdmin ? 'Admin' : 'User' }}
      </span>

      <!-- Menú de usuario -->
      <div v-if="auth.isAuthenticated" class="dropdown dropdown-end">
        <button tabindex="0" class="btn btn-ghost btn-circle">
          <div class="avatar placeholder">
            <div class="bg-neutral text-neutral-content rounded-full w-8">
              <span class="text-xs">
                {{ (auth.user?.name ?? auth.user?.email ?? '?')[0].toUpperCase() }}
              </span>
            </div>
          </div>
        </button>
        <ul
          tabindex="0"
          class="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-2 shadow-lg border border-base-200 mt-1"
        >
          <li class="menu-title text-xs truncate px-2 py-1">
            {{ auth.user?.email }}
          </li>
          <li><button @click="handleLogout">Cerrar sesión</button></li>
        </ul>
      </div>

      <!-- Si no está autenticado -->
      <RouterLink v-else to="/login" class="btn btn-primary btn-sm">
        Ingresar
      </RouterLink>

    </div>
  </div>
</template>