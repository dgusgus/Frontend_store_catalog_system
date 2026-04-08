<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../composables/useToast'
import { useCartStore } from '../../stores/cart.store'

const router = useRouter()
const auth   = useAuthStore()
const toast  = useToast()
const cart = useCartStore()

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

  <!-- Badge rol — solo admin autenticado -->
  <span
    v-if="auth.isAdmin"
    class="badge badge-warning badge-sm hidden sm:flex"
  >
    Admin
  </span>

     <!-- Mis pedidos — solo usuarios autenticados -->
      <RouterLink v-if="auth.isAuthenticated" to="/my-orders" class="btn btn-ghost btn-sm gap-1 hidden sm:flex">
        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Mis pedidos
      </RouterLink>



  <!-- Carrito — siempre visible -->
  <RouterLink to="/cart" class="btn btn-ghost btn-circle">
    <div class="indicator">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z"
        />
      </svg>
      <span
        v-if="cart.itemCount > 0"
        class="badge badge-primary badge-xs indicator-item"
      >
        {{ cart.itemCount > 9 ? '9+' : cart.itemCount }}
      </span>
    </div>
  </RouterLink>

  <!-- Menú admin — solo si está autenticado -->
  <div v-if="auth.isAuthenticated" class="dropdown dropdown-end">
    <button tabindex="0" class="btn btn-ghost btn-circle">
      <div class="avatar placeholder">
        <div class="bg-warning text-warning-content rounded-full w-8">
          <span class="text-xs">
            {{ (auth.user?.name ?? auth.user?.email ?? 'A')[0].toUpperCase() }}
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
      <li v-if="auth.isAdmin">
        <RouterLink to="/admin">Panel admin</RouterLink>
      </li>
      <li>
        <RouterLink to="/my-orders">Mis pedidos</RouterLink>
      </li>
      <li>
        <button @click="handleLogout">Cerrar sesión</button>
      </li>
    </ul>
  </div>

  <!-- Sin sesión: no mostramos nada — /login es solo para admin -->

</div>
  </div>
</template>