<template>
  <div class="w-full px-4">
    <AuthForm
      mode="register"
      :loading="isLoading"
      @submit-form="handleRegister"
    />
    <div
      v-if="errorMessage"
      class="mt-4 p-4 text-red-700 bg-red-100 rounded-md max-w-md mx-auto text-center"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const router = useRouter()

const isLoading = ref(false)
const errorMessage = ref('')

const handleRegister = async (credentials: { email: string; password: string }) => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const { error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      if (error.message === 'User already registered') {
        errorMessage.value = 'Cet email est déjà enregistré. Veuillez vous connecter.'
      } else {
        errorMessage.value = error.message
      }
      return
    }

    await router.push('/dashboard')
  } catch (err) {
    errorMessage.value = "Une erreur s'est produite lors de l'inscription"
  } finally {
    isLoading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>