<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Nom de l'agence
        </label>
        <input
          v-model="modelValue.name"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Email de contact
        </label>
        <input
          v-model="modelValue.email"
          type="email"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Téléphone
        </label>
        <input
          v-model="modelValue.phone"
          type="tel"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Site web
        </label>
        <input
          v-model="modelValue.website"
          type="url"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Adresse
        </label>
        <textarea
          v-model="modelValue.address"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          v-model="modelValue.description"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        @click="$emit('save')"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        :disabled="loading"
      >
        {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AgencyInfo {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description: string;
}

defineProps<{
  modelValue: AgencyInfo;
  title?: string;
  loading?: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: AgencyInfo): void;
  (e: 'save'): void;
}>();
</script>