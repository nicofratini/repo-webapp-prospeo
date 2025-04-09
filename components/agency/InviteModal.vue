<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Inviter un collaborateur</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              v-model="email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@exemple.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Message personnalisé (optionnel)
            </label>
            <textarea
              v-model="message"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ajoutez un message personnalisé à l'invitation..."
            ></textarea>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            @click="close"
            class="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Annuler
          </button>
          <button
            @click="sendInvitation"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            :disabled="loading"
          >
            {{ loading ? 'Envoi...' : 'Envoyer l\'invitation' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', data: { email: string; message: string }): void;
}>();

const email = ref('');
const message = ref('');

const close = () => {
  email.value = '';
  message.value = '';
  emit('update:modelValue', false);
};

const sendInvitation = () => {
  if (!email.value) return;
  emit('submit', {
    email: email.value,
    message: message.value
  });
};
</script>