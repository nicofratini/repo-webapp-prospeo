<template>
  <div class="min-h-screen flex bg-gray-50">
    <ClientOnly>
      <!-- Sidebar -->
      <div class="w-64 bg-white shadow-lg flex flex-col h-screen fixed border-r border-gray-200">
        <!-- App Name/Logo -->
        <div class="p-6 border-b border-gray-100">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Prospeo
          </h1>
        </div>

        <!-- User Info -->
        <div v-if="profileStore.profile" class="p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
              {{ profileStore.profile.email.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ profileStore.profile?.full_name || profileStore.profile?.email }}</p>
              <p v-if="profileStore.isSuperAdmin" class="text-xs text-purple-600 font-medium">Super Admin</p>
              <p v-else-if="profileStore.isAdmin" class="text-xs text-blue-600 font-medium">Administrateur</p>
              <p v-else class="text-xs text-gray-500">Utilisateur</p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 p-4 space-y-2">
          <NuxtLink 
            v-for="item in baseNavigationItems"
            :key="item.path"
            :to="item.path" 
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
            :class="route.path === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.name }}</span>
          </NuxtLink>

          <!-- Admin Navigation Item -->
          <template v-if="profileStore.isSuperAdmin">
            <NuxtLink 
              to="/admin"
              class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
              :class="route.path === '/admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'"
            >
              <Icon name="heroicons:cog-6-tooth" class="w-5 h-5" />
              <span class="font-medium">Administration</span>
            </NuxtLink>
          </template>
        </nav>

        <!-- Logout Button -->
        <div class="p-4 mt-auto border-t border-gray-100">
          <button 
            @click="handleLogout" 
            class="w-full px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition duration-200 flex items-center gap-3"
          >
            <Icon name="heroicons:arrow-left-on-rectangle" class="w-5 h-5" />
            <span class="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>
    </ClientOnly>

    <!-- Main Content -->
    <div class="flex-1 ml-64">
      <div class="p-8">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const profileStore = useProfileStore()
const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()

// Base navigation items that don't depend on admin status
const baseNavigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'heroicons:home' },
  { name: 'Propriétés', path: '/dashboard/properties', icon: 'heroicons:building-office-2' },
  { name: 'Agent IA', path: '/dashboard/ai-agent', icon: 'heroicons:cpu-chip' },
  { name: 'Appels', path: '/dashboard/calls', icon: 'heroicons:phone' },
  { name: 'Calendrier', path: '/dashboard/calendar', icon: 'heroicons:calendar' },
  { name: 'Agence', path: '/dashboard/agency', icon: 'heroicons:building-office' }
]

// Wait for profile to be loaded before rendering
await profileStore.fetchProfile()

async function handleLogout() {
  try {
    // First clear the profile store
    await profileStore.$reset()
    
    // Then sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Supabase signout error:', error)
    }

    // Always navigate to login page, regardless of errors
    await router.push('/auth/login')
  } catch (err) {
    console.error('Error during logout:', err)
    // Force navigation to login even if there's an error
    await router.push('/auth/login')
  }
}
</script>