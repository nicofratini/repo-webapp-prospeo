<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Adresse
      </label>
      <input
        v-model="formData.address"
        type="text"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Ville
      </label>
      <input
        v-model="formData.city"
        type="text"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          v-model="formData.type"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="apartment">Appartement</option>
          <option value="house">Maison</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Prix
        </label>
        <input
          v-model.number="formData.price"
          type="number"
          required
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Surface (m²)
        </label>
        <input
          v-model.number="formData.surface"
          type="number"
          required
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Chambres
        </label>
        <input
          v-model.number="formData.bedrooms"
          type="number"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        v-model="formData.description"
        rows="4"
        class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>

    <div class="flex justify-end gap-3 mt-6">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-gray-700 hover:text-gray-900"
      >
        Annuler
      </button>
      <button
        type="submit"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        :disabled="loading"
      >
        <span v-if="!loading">{{ property ? 'Enregistrer' : 'Créer' }}</span>
        <span v-else>Chargement...</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Property } from '~/composables/useProperties';

const props = withDefaults(defineProps<{
  property?: Property | null;
  loading?: boolean;
}>(), {
  property: null,
  loading: false
});

const emit = defineEmits<{
  (e: 'submit', data: Partial<Property>): void;
  (e: 'cancel'): void;
}>();

// Initialize with default values
const formData = ref({
  address: '',
  city: '',
  type: 'apartment' as const,
  price: 0,
  surface: 0,
  bedrooms: 0,
  description: '',
});

// Initialize form data when property changes, with null checks
watch(() => props.property, (newProperty) => {
  if (!newProperty) {
    // Reset to default values if property is null
    formData.value = {
      address: '',
      city: '',
      type: 'apartment',
      price: 0,
      surface: 0,
      bedrooms: 0,
      description: '',
    };
    return;
  }
  
  formData.value = {
    address: newProperty.address ?? '',
    city: newProperty.city ?? '',
    type: newProperty.type ?? 'apartment',
    price: newProperty.price ?? 0,
    surface: newProperty.surface ?? 0,
    bedrooms: newProperty.bedrooms ?? 0,
    description: newProperty.description ?? '',
  };
}, { immediate: true });

const handleSubmit = () => {
  emit('submit', {
    ...formData.value,
    id: props.property?.id,
  });
};
</script>