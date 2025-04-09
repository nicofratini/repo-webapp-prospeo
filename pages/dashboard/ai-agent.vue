<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Configuration Agent IA</h1>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Chargement de vos agents...</p>
    </div>

    <div v-else-if="error" class="bg-red-100 text-red-700 p-4 rounded mb-6">
      {{ error }}
    </div>

    <div v-else-if="agents.length > 0" class="grid gap-6">
      <div v-for="agent in agents" :key="agent.agent_id" class="bg-white rounded-lg shadow p-6">
        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-2">{{ agent.name }}</h2>
          <p class="text-gray-600 text-sm">ID: {{ agent.agent_id }}</p>
          <p class="text-gray-600 text-sm">Créé le: {{ formatDate(agent.created_at_unix_secs) }}</p>
        </div>

        <div class="border-t pt-4">
          <h3 class="font-medium mb-2">Informations créateur</h3>
          <p class="text-gray-600 text-sm">Nom: {{ agent.access_info.creator_name }}</p>
          <p class="text-gray-600 text-sm">Email: {{ agent.access_info.creator_email }}</p>
          <p class="text-gray-600 text-sm">Rôle: {{ agent.access_info.role }}</p>
        </div>

        <!-- Knowledge Base Section -->
        <div class="border-t mt-4 pt-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-medium">Base de connaissances</h3>
            <button
              @click="fetchKnowledgeBase"
              class="text-blue-600 hover:text-blue-800 text-sm"
              :disabled="loadingKB"
            >
              <span v-if="!loadingKB">Rafraîchir</span>
              <span v-else>Chargement...</span>
            </button>
          </div>

          <!-- Current Knowledge Base Assignment -->
          <div 
            v-if="agent.conversation_config?.agent?.prompt?.knowledge_base?.[0]" 
            class="mb-4"
          >
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-blue-900">Base de connaissances associée</h4>
                  <p class="text-sm text-blue-700">
                    {{ agent.conversation_config?.agent?.prompt?.knowledge_base[0]?.name || 'Document sans nom' }}
                  </p>
                  <p class="text-xs text-blue-600 mt-1">
                    ID: {{ agent.conversation_config?.agent?.prompt?.knowledge_base[0]?.id }}
                  </p>
                </div>
                <button
                  @click="unassignKnowledgeBase(agent.agent_id)"
                  class="text-red-600 hover:text-red-800 text-sm"
                  :disabled="unassigning === agent.agent_id"
                >
                  <span v-if="unassigning !== agent.agent_id">Dissocier</span>
                  <span v-else>...</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="space-y-4">
            <!-- Properties Text Generation -->
            <div>
              <button
                @click="generateAndUploadKnowledgeBase(agent.agent_id)"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                :disabled="uploading[agent.agent_id] || propertiesLoading || !properties?.length"
              >
                <span v-if="!uploading[agent.agent_id]">
                  Générer et uploader la base de connaissances
                </span>
                <span v-else class="flex items-center gap-2">
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Génération en cours...
                </span>
              </button>
              
              <!-- Properties Status -->
              <div class="mt-2 text-sm">
                <p v-if="propertiesLoading" class="text-gray-600">
                  Chargement des propriétés...
                </p>
                <p v-else-if="!properties?.length" class="text-amber-600">
                  Aucune propriété disponible. Veuillez ajouter des propriétés pour générer la base de connaissances.
                </p>
                <p v-else class="text-green-600">
                  {{ properties.length }} propriété(s) disponible(s) pour la base de connaissances
                </p>
              </div>
            </div>

            <!-- Upload Status -->
            <div v-if="uploadStatus[agent.agent_id]" 
              :class="{
                'bg-green-100 text-green-800': uploadStatus[agent.agent_id].success,
                'bg-red-100 text-red-800': !uploadStatus[agent.agent_id].success
              }"
              class="p-4 rounded-md text-sm"
            >
              <p v-if="uploadStatus[agent.agent_id].success">
                Base de connaissances mise à jour avec succès !
                <br>
                ID: {{ uploadStatus[agent.agent_id].id }}
              </p>
              <p v-else>
                Erreur: {{ uploadStatus[agent.agent_id].error }}
              </p>
            </div>

            <!-- Knowledge Base Documents List -->
            <div v-if="knowledgeBase.length > 0" class="mt-6">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Documents disponibles</h4>
              <div class="space-y-2">
                <div v-for="doc in knowledgeBase" :key="doc.id" 
                  class="border rounded-lg p-3"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <p class="font-medium">{{ doc.name }}</p>
                      <!-- Assignment Status Badge -->
                      <span 
                        v-if="isDocumentAssignedToAgent(doc.id, agent)"
                        class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
                      >
                        Assigné
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span 
                        v-if="doc.access_info.creator_email === userEmail"
                        class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                      >
                        Mon document
                      </span>
                      <button
                        v-if="!isDocumentAssignedToAgent(doc.id, agent)"
                        @click="assignDocument(agent.agent_id, doc.id)"
                        class="text-blue-600 hover:text-blue-800 text-sm"
                        :disabled="assigning === `${agent.agent_id}-${doc.id}`"
                      >
                        <span v-if="assigning !== `${agent.agent_id}-${doc.id}`">Assigner</span>
                        <span v-else>...</span>
                      </button>
                      <button
                        v-if="canDeleteDocument(doc)"
                        @click="deleteDocument(doc.id)"
                        class="text-red-600 hover:text-red-800"
                        :disabled="deletingDoc === doc.id"
                      >
                        <span v-if="deletingDoc !== doc.id">Supprimer</span>
                        <span v-else>...</span>
                      </button>
                    </div>
                  </div>
                  <div class="text-xs text-gray-500 space-y-1">
                    <p>Type: {{ doc.type }}</p>
                    <p>Créé le: {{ formatDate(doc.metadata.created_at_unix_secs) }}</p>
                    <p>Taille: {{ formatBytes(doc.metadata.size_bytes) }}</p>
                    <p>Créateur: {{ doc.access_info.creator_name }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="!loadingKB" class="text-sm text-gray-500 text-center py-4">
              Aucun document dans la base de connaissances
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-gray-50 rounded-lg p-8 text-center">
      <p class="text-gray-600">Aucun agent IA ne vous a été assigné.</p>
      <p class="text-sm text-gray-500 mt-2">Contactez un administrateur pour obtenir l'accès à un agent.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProperties } from '~/composables/useProperties';

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
      prompt?: {
        knowledge_base?: Array<{
          type: string;
          id: string;
          name?: string;
          usage_mode: string;
        }>;
      };
    };
  };
}

interface UploadStatus {
  success: boolean;
  id?: string;
  error?: string;
  message?: string;
}

interface DocumentMetadata {
  created_at_unix_secs: number;
  last_updated_at_unix_secs: number;
  size_bytes: number;
}

interface KnowledgeBaseDocument {
  id: string;
  name: string;
  type: string;
  metadata: DocumentMetadata;
  prompt_injectable: boolean;
  access_info: AccessInfo;
  dependent_agents: Array<{
    id: string;
    name: string;
    type: string;
    created_at_unix_secs: number;
    access_level: string;
  }>;
  url?: string;
}

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const userEmail = computed(() => user.value?.email || '');

const agents = ref<Agent[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const uploading = ref<Record<string, boolean>>({});
const uploadStatus = ref<Record<string, UploadStatus>>({});

// Knowledge Base state
const knowledgeBase = ref<KnowledgeBaseDocument[]>([]);
const loadingKB = ref(false);
const deletingDoc = ref<string | null>(null);
const isAdmin = ref(false);
const assigning = ref<string | null>(null);
const unassigning = ref<string | null>(null);

const { properties, loading: propertiesLoading, fetchProperties } = useProperties();

const formatDate = (unixTimestamp: number) => {
  return new Date(unixTimestamp * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const canDeleteDocument = (doc: KnowledgeBaseDocument) => {
  return isAdmin.value || doc.access_info.creator_email === userEmail.value;
};

const isDocumentAssignedToAgent = (documentId: string, agent: Agent) => {
  return agent.conversation_config?.agent?.prompt?.knowledge_base?.some(kb => kb.id === documentId) || false;
};

const generateKnowledgeBaseText = (properties: any[]): string => {
  return properties.map(property => {
    const parts = [
      `Propriété à ${property.city}:`,
      `- Type: ${property.type === 'apartment' ? 'Appartement' : 'Maison'}`,
      `- Adresse: ${property.address}`,
      `- Prix: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(property.price)}`,
      `- Surface: ${property.surface}m²`,
      property.bedrooms ? `- Chambres: ${property.bedrooms}` : null,
      property.description ? `- Description: ${property.description}` : null
    ].filter(Boolean);

    return parts.join('\n');
  }).join('\n\n');
};

const generateAndUploadKnowledgeBase = async (agentId: string) => {
  if (!properties.value?.length) {
    uploadStatus.value[agentId] = {
      success: false,
      error: 'Aucune propriété disponible pour générer la base de connaissances'
    };
    return;
  }

  uploading.value[agentId] = true;
  uploadStatus.value[agentId] = { success: false };

  try {
    // Generate knowledge base text from properties
    const knowledgeText = generateKnowledgeBaseText(properties.value);

    // Call our secure server API endpoint
    const response = await $fetch('/api/ai-agent/upload-knowledge', {
      method: 'POST',
      body: { knowledgeText }
    });

    uploadStatus.value[agentId] = {
      success: true,
      id: response.documentId
    };

    // Refresh knowledge base list
    await fetchKnowledgeBase();
  } catch (e) {
    console.error('Error uploading knowledge base:', e);
    uploadStatus.value[agentId] = {
      success: false,
      error: e instanceof Error ? e.message : "Une erreur s'est produite"
    };
  } finally {
    uploading.value[agentId] = false;
  }
};

const fetchKnowledgeBase = async () => {
  loadingKB.value = true;
  try {
    const response = await $fetch('/api/ai-agent/knowledge-base');
    knowledgeBase.value = response.documents;
    isAdmin.value = response.isAdmin;
  } catch (e) {
    console.error('Error fetching knowledge base:', e);
    error.value = e instanceof Error ? e.message : "Une erreur s'est produite lors du chargement de la base de connaissances";
  } finally {
    loadingKB.value = false;
  }
};

const deleteDocument = async (documentId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
    return;
  }

  deletingDoc.value = documentId;
  try {
    await $fetch(`/api/ai-agent/knowledge-base/${documentId}`, {
      method: 'DELETE'
    });
    
    // Remove the document from the list
    knowledgeBase.value = knowledgeBase.value.filter(doc => doc.id !== documentId);
  } catch (e) {
    console.error('Error deleting document:', e);
    error.value = e instanceof Error ? e.message : "Une erreur s'est produite lors de la suppression";
  } finally {
    deletingDoc.value = null;
  }
};

const assignDocument = async (agentId: string, documentId: string) => {
  const assignmentKey = `${agentId}-${documentId}`;
  assigning.value = assignmentKey;
  
  try {
    const response = await $fetch('/api/ai-agent/assign-knowledge-base', {
      method: 'POST',
      body: { agentId, documentId }
    });
    
    // Update the agent in the list with the new configuration
    if (response.agent) {
      const index = agents.value.findIndex(a => a.agent_id === agentId);
      if (index !== -1) {
        agents.value[index] = response.agent;
      }
    }
    
    // Show success message
    uploadStatus.value[agentId] = {
      success: true,
      message: response.message || 'Base de connaissances assignée avec succès'
    };
  } catch (e: any) {
    console.error('Error assigning knowledge base:', e);
    uploadStatus.value[agentId] = {
      success: false,
      error: e.data?.statusMessage || e.message || "Une erreur s'est produite lors de l'assignation"
    };
  } finally {
    assigning.value = null;
  }
};

const unassignKnowledgeBase = async (agentId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir dissocier la base de connaissances ?')) {
    return;
  }

  unassigning.value = agentId;
  try {
    await $fetch('/api/ai-agent/unassign-knowledge-base', {
      method: 'POST',
      body: { agentId }
    });

    // Update the agent in the list
    const index = agents.value.findIndex(a => a.agent_id === agentId);
    if (index !== -1) {
      agents.value[index] = {
        ...agents.value[index],
        conversation_config: {
          ...agents.value[index].conversation_config,
          agent: {
            ...agents.value[index].conversation_config?.agent,
            prompt: {
              ...agents.value[index].conversation_config?.agent?.prompt,
              knowledge_base: []
            }
          }
        }
      };
    }

    // Show success message
    uploadStatus.value[agentId] = {
      success: true,
      message: 'Base de connaissances dissociée avec succès'
    };
  } catch (e) {
    console.error('Error unassigning knowledge base:', e);
    uploadStatus.value[agentId] = {
      success: false,
      error: e instanceof Error ? e.message : "Une erreur s'est produite lors de la dissociation"
    };
  } finally {
    unassigning.value = null;
  }
};

const fetchAssignedAgents = async () => {
  if (!user.value) {
    loading.value = false;
    return;
  }
  
  try {
    // Get all agent assignments for the user
    const { data: assignments, error: err1 } = await supabase
      .from('user_agents')
      .select('agent_id')
      .eq('user_id', user.value.id);

    if (err1) throw err1;

    // If no assignments found, return early
    if (!assignments || assignments.length === 0) {
      loading.value = false;
      return;
    }

    // Fetch the agent details from ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      headers: {
        'xi-api-key': 'sk_c6ce660f7fe4911d0d903a694f1b2c6c9e10d67c20b5b561'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des agents (${response.status})`);
    }

    const data = await response.json();
    
    // Filter agents to only include those assigned to the user
    const assignedAgentIds = assignments.map(a => a.agent_id);
    agents.value = data.agents.filter((a: Agent) => assignedAgentIds.includes(a.agent_id));
    
    if (agents.value.length === 0) {
      error.value = "Aucun des agents assignés n'a été trouvé";
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Une erreur s'est produite";
    console.error('Error fetching assigned agents:', e);
  } finally {
    loading.value = false;
  }
};

// Initialize data
onMounted(async () => {
  try {
    await Promise.all([
      fetchAssignedAgents(),
      fetchProperties(),
      fetchKnowledgeBase()
    ]);
  } catch (e) {
    console.error('Error initializing data:', e);
    error.value = "Une erreur s'est produite lors du chargement des données";
  }
});

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});
</script>