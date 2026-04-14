// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/catalog' },

    // ── Siempre públicas ───────────────────────────────────
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('../views/CatalogView.vue'),
    },
    {
      path: '/product/:slug',
      name: 'product',
      component: () => import('../views/ProductView.vue'),
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue'),
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/CheckoutView.vue'),
    },

    // ── Requieren login ────────────────────────────────────
    {
      path: '/my-orders',
      name: 'my-orders',
      component: () => import('../views/MyOrdersView.vue'),
      meta: { requiresAuth: true },
    },

    // ── Admin ──────────────────────────────────────────────
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      redirect: '/admin/orders',
      children: [
        { path: 'orders',     name: 'admin-orders',     component: () => import('../views/admin/AdminOrdersView.vue') },
        { path: 'products',   name: 'admin-products',   component: () => import('../views/admin/AdminProductsView.vue') },
        { path: 'categories', name: 'admin-categories', component: () => import('../views/admin/AdminCategoriesView.vue') },
        { path: 'discounts',  name: 'admin-discounts',  component: () => import('../views/admin/AdminDiscountsView.vue') },
        { path: 'users',      name: 'admin-users',      component: () => import('../views/admin/AdminUsersView.vue') },
        { path: 'settings',   name: 'admin-settings',   component: () => import('../views/admin/AdminSettingsView.vue') },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/catalog' },
  ],
})

// Guard global — solo bloquea rutas que explícitamente lo requieren
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAdmin) {
    if (!auth.isAuthenticated) return { name: 'login' }
    if (!auth.isAdmin)         return { name: 'catalog' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Todo lo demás: pasar sin restricción
})

export { router }