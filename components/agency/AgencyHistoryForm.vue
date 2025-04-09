<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Date de création
        </label>
        <input
          v-model="modelValue.foundedDate"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Histoire et évolution
        </label>
        <textarea
          v-model="modelValue.history"
          rows="6"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Décrivez l'histoire et l'évolution de votre agence..."
        ></textarea>
      </div>

      <!-- Milestones -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Étapes importantes
        </label>
        <div class="space-y-3">
          <div v-for="(milestone, index) in modelValue.milestones" :key="index" 
            class="flex gap-4 items-start p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex-1 space-y-2">
              <input
                v-model="milestone.date"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                v-model="milestone.description"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description de l'étape..."
              ></textarea>
            </div>
            <button
              @click="removeMilestone(index)"
              class="text-red-600 hover:text-red-800"
            >
              <Icon name="heroicons:trash" class="w-5 h-5" />
            </button>
          </div>
          
          <button
            @click="addMilestone"
            class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Ajouter une étape
          </button>
        </div>
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
interface Milestone {
  date: string;
  description: string;
}

interface AgencyHistory {
  foundedDate: string;
  history: string;
  milestones: Milestone[];
}

const props = defineProps<{
  modelValue: AgencyHistory;
  title?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: AgencyHistory): void;
  (e: 'save'): void;
}>();

const addMilestone = () => {
  const newMilestones = [...props.modelValue.milestones, { date: '', description: '' }];
  emit('update:modelValue', { ...props.modelValue, milestones: newMilestones });
};

const removeMilestone = (index: number) => {
  const newMilestones = props.modelValue.milestones.filter((_, i) => i !== index);
  emit('update:modelValue', { ...props.modelValue, milestones: newMilestones });
};
</script>