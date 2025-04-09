<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Redirection en cours...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser();
const router = useRouter();

onMounted(async () => {
  try {
    // Check if user is authenticated
    if (!user.value) {
      await navigateTo('/auth/login');
      return;
    }

    // Get user profile to check role
    const supabase = useSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
      .single();

    // Redirect based on role
    if (profile?.role === 'super_admin') {
      await navigateTo('/admin');
    } else {
      await navigateTo('/dashboard');
    }
  } catch (error) {
    console.error('Error during redirection:', error);
    await navigateTo('/auth/login');
  }
});

// Add auth middleware to ensure proper authentication
definePageMeta({
  middleware: ['auth']
});
</script>