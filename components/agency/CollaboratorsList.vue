<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
      <button
        @click="$emit('invite')"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
      >
        <Icon name="heroicons:user-plus" class="w-5 h-5" />
        Inviter un collaborateur
      </button>
    </div>

    <!-- Collaborators List -->
    <div class="divide-y divide-gray-200">
      <div v-for="user in collaborators" :key="user.id" class="py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span class="text-blue-600 font-medium">
              {{ user.email.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div>
            <p class="font-medium text-gray-900">{{ user.full_name || user.email }}</p>
            <p class="text-sm text-gray-500">{{ user.email }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span 
            :class="{
              'bg-green-100 text-green-800': user.status === 'active',
              'bg-yellow-100 text-yellow-800': user.status === 'pending'
            }"
            class="px-3 py-1 rounded-full text-xs font-medium"
          >
            {{ user.status === 'active' ? 'Actif' : 'En attente' }}
          </span>
          <button
            v-if="user.status === 'pending'"
            @click="$emit('resend', user.id)"
            class="text-blue-600 hover:text-blue-800"
          >
            <Icon name="heroicons:envelope" class="w-5 h-5" />
          </button>
          <button
            @click="$emit('remove', user.id)"
            class="text-red-600 hover:text-red-800"
          >
            <Icon name="heroicons:trash" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Collaborator {
  id: string;
  email: string;
  full_name: string | null;
  status: 'active' | 'pending';
}

defineProps<{
  collaborators: Collaborator[];
  title?: string;
}>();

defineEmits<{
  (e: 'invite'): void;
  (e: 'resend', id: string): void;
  (e: 'remove', id: string): void;
}>();
</script>