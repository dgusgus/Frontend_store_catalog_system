<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store'
import { useRouter } from 'vue-router'
import { useToast } from '../../composables/useToast'

const auth   = useAuthStore()
const router = useRouter()
const toast  = useToast()

async function handleLogout() {
  await auth.logout()
  toast.info('Sesión cerrada')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-base-200">

    <!-- Navbar admin -->
    <div class="navbar bg-base-100 border-b border-base-200 sticky top-0 z-40">
      <div class="navbar-start">
        <RouterLink to="/catalog" class="btn btn-ghost btn-sm gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Tienda
        </RouterLink>
      </div>
      <div class="navbar-center">
        <span class="font-bold text-sm">Panel Admin</span>
      </div>
      <div class="navbar-end">
        <div class="avatar placeholder">
          <div class="bg-warning text-warning-content rounded-full w-8">
            <span class="text-xs">
              {{ (auth.user?.name ?? auth.user?.email ?? 'A')[0].toUpperCase() }}
            </span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm ml-1" @click="handleLogout">
          Salir
        </button>
      </div>
    </div>

    <!-- Tabs de navegación -->
    <div class="bg-base-100 border-b border-base-200">
      <div class="max-w-4xl mx-auto px-4">
        <div role="tablist" class="tabs tabs-bordered">
          <RouterLink
            to="/admin/products"
            role="tab"
            class="tab"
            :class="$route.path.startsWith('/admin/products') ? 'tab-active' : ''"
          >
          Productos
        </RouterLink>
        <RouterLink
          to="/admin/categories"
          role="tab"
          class="tab"
          :class="$route.path.startsWith('/admin/categories') ? 'tab-active' : ''"
        >
          Categorías
        </RouterLink>
          <RouterLink
            to="/admin/discounts"
            role="tab"
            class="tab"
            :class="$route.path.startsWith('/admin/discounts') ? 'tab-active' : ''"
          >
            Descuentos
          </RouterLink>
          <RouterLink
            to="/admin/users"
            role="tab"
            class="tab"
            :class="$route.path.startsWith('/admin/users') ? 'tab-active' : ''"
          >
            Usuarios
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Contenido de la sección activa -->
    <div class="max-w-4xl mx-auto px-4 py-4">
      <RouterView />
    </div>

  </div>
</template>