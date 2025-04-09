<template>
  <div class="w-full">
    <div class="bg-white rounded-xl shadow-xl overflow-hidden">
      <div class="p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          {{ mode === 'login' ? 'Connexion' : 'Inscription' }}
        </h2>
        <p class="text-gray-600 mb-6">
          {{ mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte' }}
        </p>

        <form @submit.prevent="$emit('submitForm', { email, password })" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div class="relative">
              <Icon 
                name="heroicons:envelope" 
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              />
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                :class="{'opacity-50 cursor-not-allowed': loading}"
                :disabled="loading"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <div class="relative">
              <Icon 
                name="heroicons:lock-closed" 
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              />
              <input
                id="password"
                v-model="password"
                type="password"
                required
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                :class="{'opacity-50 cursor-not-allowed': loading}"
                :disabled="loading"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
            :disabled="loading"
          >
            <Icon v-if="loading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
            <span>
              {{ mode === 'login' ? 'Se connecter' : "S'inscrire" }}
            </span>
          </button>
        </form>
      </div>

      <div class="px-8 py-4 bg-gray-50 border-t border-gray-100">
        <NuxtLink
          :to="mode === 'login' ? '/auth/register' : '/auth/login'"
          class="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2 transition duration-200"
        >
          <Icon :name="mode === 'login' ? 'heroicons:user-plus' : 'heroicons:arrow-left'" class="w-4 h-4" />
          {{ mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter' }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  mode: 'login' | 'register'
  loading?: boolean
}>()

const email = ref('')
const password = ref('')

defineEmits<{
  (e: 'submitForm', credentials: { email: string; password: string }): void
}>()
</script>