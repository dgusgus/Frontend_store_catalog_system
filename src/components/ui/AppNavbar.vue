<!-- src/components/ui/AppNavbar.vue -->
<script setup lang="ts">
import { useRouter }       from 'vue-router'
import { useAuthStore }    from '../../stores/auth.store'
import { useToast }        from '../../composables/useToast'
import { useCartStore }    from '../../stores/cart.store'
import { useActiveOrder }  from '../../composables/useActiveOrder'

const router = useRouter()
const auth   = useAuthStore()
const toast  = useToast()
const cart   = useCartStore()
const order  = useActiveOrder()

async function handleLogout() {
  await auth.logout()
  toast.info('Sesión cerrada')
  router.push('/login')
}
</script>

<template>
  <div class="navbar bg-base-100 border-b border-base-200 sticky top-0 z-40">

    <div class="navbar-start">
      <RouterLink to="/catalog" class="btn btn-ghost text-lg font-bold px-2">
        🛍️ Mi Tienda
      </RouterLink>
    </div>

    <div class="navbar-end gap-1">

      <span v-if="auth.isAdmin" class="badge badge-warning badge-sm hidden sm:flex">
        Admin
      </span>

      <!-- Badge del pedido activo — solo muestra el número, sin timer -->
      <RouterLink
        v-if="auth.isAuthenticated && order.hasPending.value"
        to="/my-orders"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
        :class="{
          'bg-warning/20 text-warning':           order.hasTimer.value && order.urgency.value !== 'critical',
          'bg-error/20 text-error animate-pulse': order.hasTimer.value && order.urgency.value === 'critical',
          'bg-success/20 text-success':           !order.hasTimer.value,
        }"
      >
        <!-- Ícono según estado -->
        <span class="text-sm">
          {{ order.activeOrder.value?.status === 'CONFIRMED' ? '✅' : order.urgency.value === 'critical' ? '🚨' : '⏳' }}
        </span>
        <!-- Número de orden -->
        <span class="font-mono font-bold hidden sm:block">
          {{ order.activeOrder.value?.orderNumber }}
        </span>
        <!-- Label corto en mobile -->
        <span class="sm:hidden">Pedido</span>
      </RouterLink>

      <!-- Carrito -->
      <RouterLink to="/cart" class="btn btn-ghost btn-circle">
        <div class="indicator">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z"/>
          </svg>
          <span v-if="cart.itemCount > 0" class="badge badge-primary badge-xs indicator-item">
            {{ cart.itemCount > 9 ? '9+' : cart.itemCount }}
          </span>
        </div>
      </RouterLink>

      <!-- Menú usuario -->
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
        <ul tabindex="0"
          class="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-2 shadow-lg border border-base-200 mt-1">
          <li class="menu-title text-xs truncate px-2 py-1">
            {{ auth.user?.email }}
          </li>
          <li>
            <RouterLink to="/my-orders">
              Mis pedidos
              <span v-if="order.hasPending.value" class="badge badge-warning badge-xs">1</span>
            </RouterLink>
          </li>
          <li v-if="auth.isAdmin">
            <RouterLink to="/admin">Panel admin</RouterLink>
          </li>
          <li>
            <button @click="handleLogout">Cerrar sesión</button>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>