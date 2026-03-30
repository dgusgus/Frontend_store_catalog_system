<script setup lang="ts">
import { onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin.store'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../composables/useToast'
import { ApiRequestError } from '../../api/fetcher'

const store = useAdminStore()
const auth  = useAuthStore()
const toast = useToast()

onMounted(() => store.fetchUsers())

async function handleRoleChange(userId: number, currentRole: string) {
  const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
  if (!confirm(`¿Cambiar rol a ${newRole}?`)) return
  try {
    await store.changeUserRole(userId, newRole)
    toast.success('Rol actualizado')
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Error al cambiar rol')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <div>
      <h2 class="font-bold text-lg">Usuarios</h2>
      <p class="text-sm text-base-content/50">{{ store.users.length }} registrados</p>
    </div>

    <div v-if="store.usersLoading" class="flex flex-col gap-2">
      <div v-for="n in 3" :key="n" class="skeleton h-16 w-full rounded-xl"></div>
    </div>

    <div v-else-if="store.usersError" class="alert alert-error">
      <span>{{ store.usersError }}</span>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="user in store.users"
        :key="user.id"
        class="card bg-base-100 shadow-sm"
      >
        <div class="card-body p-3 flex-row items-center gap-3">

          <!-- Avatar -->
          <div class="avatar placeholder shrink-0">
            <div
              class="rounded-full w-10 text-xs"
              :class="user.role === 'ADMIN' ? 'bg-warning text-warning-content' : 'bg-neutral text-neutral-content'"
            >
              <span>{{ (user.name ?? user.email)[0].toUpperCase() }}</span>
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ user.name ?? '—' }}</p>
            <p class="text-xs text-base-content/50 truncate">{{ user.email }}</p>
          </div>

          <!-- Rol + acción -->
          <div class="flex items-center gap-2 shrink-0">
            <span
              class="badge badge-sm"
              :class="user.role === 'ADMIN' ? 'badge-warning' : 'badge-ghost'"
            >
              {{ user.role }}
            </span>
            <!-- No se puede cambiar el propio rol -->
            <button
              v-if="user.id !== auth.user?.id"
              class="btn btn-xs btn-ghost"
              @click="handleRoleChange(user.id, user.role)"
              :title="`Cambiar a ${user.role === 'ADMIN' ? 'USER' : 'ADMIN'}`"
            >
              🔄
            </button>
            <span v-else class="text-xs text-base-content/30">tú</span>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>