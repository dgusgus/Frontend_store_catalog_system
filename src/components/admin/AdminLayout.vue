<!-- Reemplaza el bloque de tabs completo -->
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