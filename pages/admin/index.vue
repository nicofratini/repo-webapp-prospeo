<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Administration</h1>
      <p class="mt-2 text-gray-600">Gérez les agents IA et leurs assignations utilisateurs</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- User Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Filtrer par utilisateur
          </label>
          <select
            v-model="filters.userId"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tous les utilisateurs</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.full_name || user.email }}
            </option>
          </select>
        </div>

        <!-- Role Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Filtrer par rôle
          </label>
          <select
            v-model="filters.role"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="user">Utilisateurs</option>
          </select>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Rechercher
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Rechercher par email ou nom..."
              class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10"
            />
            <Icon 
              name="heroicons:magnifying-glass" 
              class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Agents List -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Agents ElevenLabs</h2>
            <p class="mt-1 text-sm text-gray-500">Configurez les agents IA et leurs accès utilisateurs</p>
          </div>
          <button 
            @click="fetchAgents" 
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            :disabled="loading"
          >
            <Icon 
              v-if="loading" 
              name="heroicons:arrow-path" 
              class="w-5 h-5 animate-spin"
            />
            <Icon 
              v-else 
              name="heroicons:arrow-path" 
              class="w-5 h-5"
            />
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center gap-3 text-red-700">
          <Icon name="heroicons:exclamation-circle" class="w-5 h-5" />
          <p class="font-medium">{{ error }}</p>
        </div>
      </div>

      <!-- Agents List -->
      <div v-if="filteredAgents.length" class="divide-y divide-gray-200">
        <div v-for="agent in filteredAgents" :key="agent.agent_id" class="p-6">
          <!-- Agent Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Icon name="heroicons:cpu-chip" class="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ agent.name }}</h3>
                <div class="mt-1 flex items-center gap-3 text-sm text-gray-500">
                  <span class="flex items-center gap-1">
                    <Icon name="heroicons:identification" class="w-4 h-4" />
                    {{ agent.agent_id }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon name="heroicons:calendar" class="w-4 h-4" />
                    {{ formatDate(agent.created_at_unix_secs) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="editAgent(agent)"
                class="text-blue-600 hover:text-blue-800"
              >
                <Icon name="heroicons:pencil-square" class="w-5 h-5" />
              </button>
              <span class="px-3 py-1 text-xs font-medium rounded-full"
                :class="agent.access_info.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
              >
                {{ agent.access_info.role }}
              </span>
            </div>
          </div>

          <!-- Agent Content -->
          <div class="space-y-4">
            <!-- Creator Info -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Informations créateur</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">Nom :</span>
                  <span class="ml-2 text-gray-900">{{ agent.access_info.creator_name }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Email :</span>
                  <span class="ml-2 text-gray-900">{{ agent.access_info.creator_email }}</span>
                </div>
              </div>
            </div>

            <!-- User Assignment Section -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-medium text-gray-900">Utilisateurs assignés</h4>
                <button 
                  @click="openAssignmentModal(agent)"
                  class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
                >
                  <Icon name="heroicons:user-plus" class="w-4 h-4" />
                  Gérer les assignations
                </button>
              </div>
              
              <!-- Assigned Users List -->
              <div class="space-y-2">
                <div v-if="selectedUsers[agent.agent_id]?.length" class="flex flex-wrap gap-2">
                  <div v-for="userId in selectedUsers[agent.agent_id]" :key="userId"
                    class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    <Icon name="heroicons:user" class="w-4 h-4 text-gray-500" />
                    {{ getUserEmail(userId) }}
                  </div>
                </div>
                <div v-else class="text-sm text-gray-500 italic">
                  Aucun utilisateur assigné
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading" class="p-8 text-center">
        <div class="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon name="heroicons:cpu-chip" class="w-6 h-6 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun agent trouvé</h3>
        <p class="text-gray-500 max-w-sm mx-auto">
          {{ 
            filters.search || filters.userId || filters.role
              ? "Aucun agent ne correspond aux critères de filtrage."
              : "Commencez par créer un agent dans ElevenLabs pour pouvoir le configurer ici."
          }}
        </p>
      </div>
    </div>

    <!-- Assignment Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Assigner des utilisateurs</h3>
              <p class="mt-1 text-sm text-gray-500">
                Sélectionnez les utilisateurs qui auront accès à cet agent
              </p>
            </div>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="mb-4">
            <div class="flex items-center gap-3 text-sm text-gray-600">
              <div class="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                <Icon name="heroicons:cpu-chip" class="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ selectedAgent?.name }}</p>
                <p class="text-xs">{{ selectedAgent?.agent_id }}</p>
              </div>
            </div>
          </div>

          <!-- Search Users -->
          <div class="mb-4">
            <div class="relative">
              <input
                v-model="userSearch"
                type="text"
                placeholder="Rechercher un utilisateur..."
                class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Icon 
                name="heroicons:magnifying-glass" 
                class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              />
            </div>
          </div>

          <!-- Users Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-900 mb-2">
              Sélectionner les utilisateurs
            </label>
            <div class="border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-200">
              <div v-for="user in filteredModalUsers" :key="user.id" class="p-3 hover:bg-gray-50">
                <label class="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    :value="user.id"
                    v-model="tempSelectedUsers"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
                  <div>
                    <p class="text-sm text-gray-900">{{ user.email }}</p>
                    <p v-if="user.full_name" class="text-xs text-gray-500">{{ user.full_name }}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex justify-end gap-3">
            <button 
              @click="closeModal"
              class="px-4 py-2 text-gray-700 hover:text-gray-900"
              :disabled="isAssigning[selectedAgent?.agent_id || '']"
            >
              Annuler
            </button>
            <button 
              @click="saveAssignments"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              :disabled="isAssigning[selectedAgent?.agent_id || '']"
            >
              <Icon 
                v-if="isAssigning[selectedAgent?.agent_id || '']" 
                name="heroicons:arrow-path" 
                class="w-5 h-5 animate-spin"
              />
              <span>
                {{ isAssigning[selectedAgent?.agent_id || ''] ? 'Enregistrement...' : 'Enregistrer' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Modifier l'agent</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ selectedAgent?.name }}
              </p>
            </div>
            <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <div class="p-6">
          <AgentEditForm
            :agent="selectedAgent"
            :loading="updating"
            @submit="handleAgentUpdate"
            @cancel="closeEditModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AccessInfo {
  is_creator: boolean;
  creator_name: string;
  creator_email: string;
  role: string;
}

interface Agent {
  agent_id: string;
  name: string;
  created_at_unix_secs: number;
  access_info: AccessInfo;
  conversation_config?: {
    agent?: {
      first_message?: string;
      language?: string;
      prompt?: {
        system_prompt?: string;
        knowledge_base?: any[];
      };
    };
    tts?: {
      model_id?: string;
      stability?: number;
      speed?: number;
    };
    turn?: {
      turn_timeout?: number;
    };
    conversation?: {
      max_duration_seconds?: number;
    };
  };
  platform_settings?: any;
}

interface AgentsResponse {
  agents: Agent[];
  next_cursor: string | null;
  has_more: boolean;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
}

const supabase = useSupabaseClient();
const agents = ref<Agent[]>([]);
const users = ref<User[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedUsers = ref<Record<string, string[]>>({});
const isAssigning = ref<Record<string, boolean>>({});

// Edit state
const showEditModal = ref(false);
const selectedAgent = ref<Agent | null>(null);
const updating = ref(false);

// Filters
const filters = ref({
  userId: '',
  role: '',
  search: ''
});

// Modal state
const showModal = ref(false);
const tempSelectedUsers = ref<string[]>([]);
const userSearch = ref('');

// Computed properties
const filteredAgents = computed(() => {
  let filtered = [...agents.value];

  // Filter by assigned user
  if (filters.value.userId) {
    filtered = filtered.filter(agent => 
      selectedUsers.value[agent.agent_id]?.includes(filters.value.userId)
    );
  }

  // Filter by role (admin/user)
  if (filters.value.role) {
    const isAdmin = filters.value.role === 'admin';
    filtered = filtered.filter(agent => {
      const assignedUsers = selectedUsers.value[agent.agent_id] || [];
      return assignedUsers.some(userId => {
        const user = users.value.find(u => u.id === userId);
        return user?.is_admin === isAdmin;
      });
    });
  }

  // Filter by search term
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase();
    filtered = filtered.filter(agent => {
      // Search in agent name and ID
      if (agent.name.toLowerCase().includes(searchTerm)) return true;
      if (agent.agent_id.toLowerCase().includes(searchTerm)) return true;

      // Search in assigned users
      const assignedUsers = selectedUsers.value[agent.agent_id] || [];
      return assignedUsers.some(userId => {
        const user = users.value.find(u => u.id === userId);
        return user?.email.toLowerCase().includes(searchTerm) ||
               user?.full_name?.toLowerCase().includes(searchTerm);
      });
    });
  }

  return filtered;
});

const filteredModalUsers = computed(() => {
  let filtered = [...users.value];

  if (userSearch.value) {
    const searchTerm = userSearch.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.email.toLowerCase().includes(searchTerm) ||
      user.full_name?.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
});

const formatDate = (unixTimestamp: number) => {
  return new Date(unixTimestamp * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getUserEmail = (userId: string): string => {
  const user = users.value.find(u => u.id === userId);
  return user?.full_name || user?.email || userId;
};

const fetchAgents = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      headers: {
        'xi-api-key': 'sk_c6ce660f7fe4911d0d903a694f1b2c6c9e10d67c20b5b561'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des agents (${response.status})`);
    }

    const data: AgentsResponse = await response.json();
    agents.value = data.agents;

    // Fetch current assignments for these agents
    await fetchCurrentAssignments();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Une erreur s'est produite";
    console.error('Error fetching agents:', e);
  } finally {
    loading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin');
    
    if (err) throw err;
    users.value = data;
  } catch (e) {
    console.error('Error fetching users:', e);
    error.value = "Erreur lors de la récupération des utilisateurs";
  }
};

const fetchCurrentAssignments = async () => {
  try {
    const { data, error: err } = await supabase
      .from('user_agents')
      .select('agent_id, user_id');
    
    if (err) throw err;

    // Reset assignments
    selectedUsers.value = {};
    
    // Group assignments by agent_id
    data.forEach(assignment => {
      if (!selectedUsers.value[assignment.agent_id]) {
        selectedUsers.value[assignment.agent_id] = [];
      }
      selectedUsers.value[assignment.agent_id].push(assignment.user_id);
    });
  } catch (e) {
    console.error('Error fetching assignments:', e);
  }
};

const openAssignmentModal = (agent: Agent) => {
  selectedAgent.value = agent;
  tempSelectedUsers.value = selectedUsers.value[agent.agent_id] || [];
  userSearch.value = '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedAgent.value = null;
  tempSelectedUsers.value = [];
  userSearch.value = '';
};

const saveAssignments = async () => {
  if (!selectedAgent.value) return;
  
  const agentId = selectedAgent.value.agent_id;
  
  try {
    isAssigning.value[agentId] = true;
    error.value = null;

    // First, remove all existing assignments for this agent
    const { error: deleteError } = await supabase
      .from('user_agents')
      .delete()
      .eq('agent_id', agentId);
    
    if (deleteError) throw deleteError;

    // Then, create new assignments for selected users
    if (tempSelectedUsers.value.length > 0) {
      const assignments = tempSelectedUsers.value.map(userId => ({
        user_id: userId,
        agent_id: agentId
      }));

      const { error: insertError } = await supabase
        .from('user_agents')
        .insert(assignments);
      
      if (insertError) throw insertError;
    }

    // Update the local state
    selectedUsers.value[agentId] = [...tempSelectedUsers.value];
    closeModal();
  } catch (e) {
    console.error('Error updating assignments:', e);
    error.value = "Erreur lors de l'assignation de l'agent";
  } finally {
    isAssigning.value[agentId] = false;
  }
};

const editAgent = async (agent: Agent) => {
  try {
    error.value = null;
    updating.value = true;

    // Fetch full agent details
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agent.agent_id}`,
      {
        headers: {
          'xi-api-key': 'sk_c6ce660f7fe4911d0d903a694f1b2c6c9e10d67c20b5b561'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching agent details: ${response.status}`);
    }

    const agentDetails = await response.json();
    
    // Update the agent in the list with full details
    const index = agents.value.findIndex(a => a.agent_id === agent.agent_id);
    if (index !== -1) {
      agents.value[index] = {
        ...agents.value[index],
        ...agentDetails
      };
    }

    // Set selected agent and show modal
    selectedAgent.value = agentDetails;
    showEditModal.value = true;
  } catch (e) {
    console.error('Error fetching agent details:', e);
    error.value = e instanceof Error ? e.message : "Une erreur s'est produite";
  } finally {
    updating.value = false;
  }
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedAgent.value = null;
};

const handleAgentUpdate = async (formData: any) => {
  if (!selectedAgent.value) return;
  
  updating.value = true;
  error.value = null;

  try {
    // Ensure maxDuration is a valid integer
    const maxDurationSeconds = Math.round(formData.maxDuration * 60);
    
    // Prepare the update payload with validated data
    const updatePayload = {
      name: formData.name || '',
      conversation_config: {
        agent: {
          first_message: formData.firstMessage || '',
          language: formData.language || 'fr',
          prompt: {
            system_prompt: formData.systemPrompt || '',
            knowledge_base: selectedAgent.value.conversation_config?.agent?.prompt?.knowledge_base || []
          }
        },
        tts: {
          model_id: formData.ttsModel || 'eleven_multilingual_v2',
          stability: Number(formData.stability) || 0.5,
          speed: Number(formData.speed) || 1.0
        },
        turn: {
          turn_timeout: Number(formData.turnTimeout) || 30
        },
        conversation: {
          max_duration_seconds: maxDurationSeconds
        }
      },
      platform_settings: formData.platform_settings
    };

    // Call ElevenLabs API to update the agent
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent.value.agent_id}`,
      {
        method: 'PATCH',
        headers: {
          'xi-api-key': 'sk_c6ce660f7fe4911d0d903a694f1b2c6c9e10d67c20b5b561',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Update agent error:', errorData);
      
      // Parse and format the error message
      let errorMessage = 'Error updating agent';
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (errorData.detail.message) {
          try {
            // Try to parse the validation error message
            const validationErrors = JSON.parse(errorData.detail.message);
            if (Array.isArray(validationErrors)) {
              errorMessage = validationErrors.map(err => err.msg).join(', ');
            } else {
              errorMessage = errorData.detail.message;
            }
          } catch {
            errorMessage = errorData.detail.message;
          }
        }
      }
      
      throw new Error(errorMessage);
    }

    // Update local state
    const updatedAgent = await response.json();
    const index = agents.value.findIndex(a => a.agent_id === selectedAgent.value?.agent_id);
    if (index !== -1) {
      agents.value[index] = updatedAgent;
    }

    closeEditModal();
  } catch (e) {
    console.error('Error updating agent:', e);
    error.value = e instanceof Error ? e.message : "Une erreur s'est produite lors de la mise à jour";
  } finally {
    updating.value = false;
  }
};

// Watch filters for analytics
watch(filters, (newFilters) => {
  console.log('Filters changed:', newFilters);
}, { deep: true });

// Fetch initial data
onMounted(async () => {
  await Promise.all([fetchAgents(), fetchUsers()]);
});

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
});
</script>