import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/catalog' },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('../views/CatalogView.vue'),
      meta: { public: true },
    },
    {
      path: '/product/:slug',
      name: 'product',
      component: () => import('../views/ProductView.vue'),
      meta: { public: true },
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue'),
      meta: { public: true },
    },
    // ── Admin (rutas anidadas) ─────────────────────
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      redirect: '/admin/products',
      children: [
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('../views/admin/AdminProductsView.vue'),
        },
        {
          path: 'discounts',
          name: 'admin-discounts',
          component: () => import('../views/admin/AdminDiscountsView.vue'),
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/admin/AdminUsersView.vue'),
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/catalog' },
  ],
})

// Guard global
router.beforeEach((to) => {
  const auth = useAuthStore()

  // Ruta requiere admin
  if (to.meta.requiresAdmin) {
    if (!auth.isAuthenticated) return { name: 'login' }
    if (!auth.isAdmin)         return { name: 'catalog' }
  }

  // Ruta privada normal
  if (!to.meta.public && !to.meta.requiresAdmin && !auth.isAuthenticated) {
    return { name: 'login' }
  }
})

export { router }