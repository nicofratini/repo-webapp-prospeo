<template>
  <div class="w-full px-4">
    <ClientOnly>
      <AuthForm
        mode="login"
        :loading="isLoading"
        @submit-form="handleLogin"
      />
      <div
        v-if="errorMessage"
        class="mt-4 p-4 text-red-700 bg-red-100 rounded-md max-w-md mx-auto text-center"
      >
        {{ errorMessage }}
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const router = useRouter()

const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async (credentials: { email: string; password: string }) => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        errorMessage.value = 'Email ou mot de passe incorrect'
      } else {
        errorMessage.value = error.message
      }
      return
    }

    if (data?.user) {
      // Get user profile to check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      // Redirect based on role
      if (profile?.role === 'super_admin') {
        await router.push('/admin')
      } else {
        await router.push('/dashboard')
      }
    }
  } catch (err) {
    console.error('Login error:', err)
    errorMessage.value = "Une erreur s'est produite lors de la connexion"
  } finally {
    isLoading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>