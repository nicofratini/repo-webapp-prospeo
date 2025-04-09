<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Historique des Appels</h1>
      <p class="mt-2 text-gray-600">Consultez et gérez vos conversations avec l'agent IA</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Agent</label>
          <select
            v-model="filters.agentId"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tous les agents</option>
            <option v-for="agent in uniqueAgents" :key="agent.id" :value="agent.id">
              {{ agent.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            v-model="filters.status"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="success">Réussi</option>
            <option value="failure">Échoué</option>
            <option value="unknown">Inconnu</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date début</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-center py-8">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      <div class="flex items-center gap-3">
        <Icon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-500" />
        <p class="font-medium">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="filteredConversations.length > 0">
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total</p>
              <p class="text-2xl font-semibold text-gray-900">{{ filteredConversations.length }}</p>
            </div>
            <Icon name="heroicons:chat-bubble-left-right" class="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Réussis</p>
              <p class="text-2xl font-semibold text-green-600">{{ successCount }}</p>
            </div>
            <Icon name="heroicons:check-circle" class="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Échoués</p>
              <p class="text-2xl font-semibold text-red-600">{{ failureCount }}</p>
            </div>
            <Icon name="heroicons:x-circle" class="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Durée moyenne</p>
              <p class="text-2xl font-semibold text-gray-900">{{ averageDuration }}</p>
            </div>
            <Icon name="heroicons:clock" class="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <!-- Conversations List -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
        <div v-for="conversation in filteredConversations" :key="conversation.conversation_id" 
          class="p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 class="font-medium text-gray-900">{{ conversation.agent_name }}</h3>
                <div class="mt-1 space-y-1">
                  <p class="text-sm text-gray-500">{{ formatDate(conversation.start_time_unix_secs) }}</p>
                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <div class="flex items-center gap-1">
                      <Icon name="heroicons:identification" class="w-4 h-4" />
                      <span>ID: {{ conversation.conversation_id }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Icon name="heroicons:phone" class="w-4 h-4" />
                      <span>{{ conversation.caller_id || 'Numéro masqué' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-2 text-gray-600">
                  <Icon name="heroicons:clock" class="w-4 h-4" />
                  {{ formatDuration(conversation.call_duration_secs) }}
                </div>
                <div class="flex items-center gap-2 text-gray-600">
                  <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-4 h-4" />
                  {{ conversation.message_count }}
                </div>
              </div>

              <div :class="{
                'text-green-600 bg-green-50': conversation.call_successful === 'success',
                'text-red-600 bg-red-50': conversation.call_successful === 'failure',
                'text-gray-600 bg-gray-50': conversation.call_successful === 'unknown'
              }" class="px-3 py-1 rounded-full text-sm font-medium">
                {{ getCallStatus(conversation.call_successful) }}
              </div>

              <div class="flex items-center gap-3">
                <button 
                  @click="playAudio(conversation)"
                  class="text-blue-600 hover:text-blue-800"
                  :disabled="loadingAudio === conversation.conversation_id"
                >
                  <Icon 
                    :name="isPlaying(conversation.conversation_id) ? 'heroicons:pause' : 'heroicons:play'" 
                    class="w-5 h-5"
                  />
                </button>

                <button 
                  @click="downloadAudio(conversation)"
                  class="text-blue-600 hover:text-blue-800"
                  :disabled="loadingAudio === conversation.conversation_id"
                >
                  <Icon name="heroicons:arrow-down-tray" class="w-5 h-5" />
                </button>

                <button 
                  @click="showTranscript(conversation)"
                  class="text-blue-600 hover:text-blue-800"
                >
                  <Icon name="heroicons:document-text" class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <div class="max-w-md mx-auto">
        <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon name="heroicons:chat-bubble-left-right" class="w-6 h-6 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Aucune conversation trouvée</h3>
        <p class="text-gray-600">Les conversations apparaîtront ici une fois que votre agent aura effectué des appels.</p>
      </div>
    </div>

    <!-- Transcript Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div class="p-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Transcription de la conversation</h3>
              <p class="text-sm text-gray-500 mt-1">
                {{ selectedConversation?.agent_name }} - {{ formatDate(selectedConversation?.start_time_unix_secs || 0) }}
              </p>
            </div>
            <button 
              @click="closeModal" 
              class="text-gray-400 hover:text-gray-600"
            >
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <div class="p-4 overflow-y-auto flex-1">
          <div v-if="loadingTranscript" class="flex items-center justify-center py-8">
            <Icon name="heroicons:arrow-path" class="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          
          <div v-else-if="transcriptError" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center gap-3 text-red-700">
              <Icon name="heroicons:exclamation-circle" class="w-5 h-5" />
              <p class="font-medium">{{ transcriptError }}</p>
            </div>
          </div>
          
          <div v-else-if="transcript.length" class="space-y-6">
            <!-- Transcript Summary -->
            <div class="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 class="text-sm font-semibold text-blue-900 mb-3">Résumé de la conversation</h4>
              <div v-if="loadingSummary" class="flex items-center gap-2 text-blue-600">
                <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
                <span class="text-sm">Génération du résumé...</span>
              </div>
              <div v-else-if="summaryError" class="text-red-600 text-sm">
                {{ summaryError }}
              </div>
              <div v-else-if="summary" class="space-y-3">
                <div v-if="summary.keyPoints.length > 0">
                  <h5 class="text-xs font-medium text-blue-800 mb-1">Points clés :</h5>
                  <ul class="list-disc list-inside text-sm text-blue-900 space-y-1">
                    <li v-for="(point, index) in summary.keyPoints" :key="index">
                      {{ point }}
                    </li>
                  </ul>
                </div>
                <div v-if="summary.outcome">
                  <h5 class="text-xs font-medium text-blue-800 mb-1">Résultat :</h5>
                  <p class="text-sm text-blue-900">{{ summary.outcome }}</p>
                </div>
                <div v-if="summary.nextSteps">
                  <h5 class="text-xs font-medium text-blue-800 mb-1">Prochaines étapes :</h5>
                  <p class="text-sm text-blue-900">{{ summary.nextSteps }}</p>
                </div>
              </div>
            </div>

            <!-- Transcript Messages -->
            <div class="space-y-3">
              <div v-for="(message, index) in transcript" :key="index" 
                class="flex gap-3"
                :class="message.role === 'agent' ? 'justify-start' : 'justify-end'"
              >
                <div 
                  class="max-w-[80%] rounded-lg p-3"
                  :class="message.role === 'agent' ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-900'"
                >
                  <div class="flex items-center gap-2 mb-1 text-xs">
                    <Icon 
                      :name="message.role === 'agent' ? 'heroicons:cpu-chip' : 'heroicons:user'" 
                      class="w-3 h-3"
                      :class="message.role === 'agent' ? 'text-blue-600' : 'text-gray-600'"
                    />
                    <span class="font-medium">{{ message.role === 'agent' ? 'Agent' : 'Client' }}</span>
                    <span class="text-gray-500">·</span>
                    <span class="text-gray-500">{{ formatDuration(message.time_in_call_secs) }}</span>
                  </div>
                  <p class="text-sm">{{ message.message }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8">
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Icon name="heroicons:chat-bubble-left" class="w-6 h-6 text-gray-400" />
            </div>
            <p class="text-gray-600">Aucun message dans cette conversation.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Audio player component -->
    <div v-if="currentAudio" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button 
            @click="togglePlay"
            class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
          >
            <Icon :name="isPlaying(currentAudio.id) ? 'heroicons:pause' : 'heroicons:play'" class="w-6 h-6" />
          </button>
          
          <div>
            <p class="font-medium text-gray-900">{{ currentAudio.agent_name }}</p>
            <p class="text-sm text-gray-500">{{ formatDate(currentAudio.start_time_unix_secs) }}</p>
          </div>
        </div>

        <div class="flex-1 mx-8">
          <div class="relative">
            <input
              type="range"
              min="0"
              :max="audioDuration"
              v-model="audioProgress"
              @input="seekAudio"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div 
              class="absolute left-0 top-0 h-2 bg-blue-600 rounded-lg pointer-events-none"
              :style="{ width: `${(audioProgress / audioDuration) * 100}%` }"
            ></div>
          </div>
          <div class="flex justify-between mt-1 text-xs text-gray-500">
            <span>{{ formatDuration(Math.floor(audioProgress)) }}</span>
            <span>{{ formatDuration(Math.floor(audioDuration)) }}</span>
          </div>
        </div>

        <button 
          @click="closeAudioPlayer"
          class="text-gray-400 hover:text-gray-600"
        >
          <Icon name="heroicons:x-mark" class="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Conversation {
  agent_id: string;
  agent_name: string;
  conversation_id: string;
  caller_id?: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  status: string;
  call_successful: 'success' | 'failure' | 'unknown';
}

interface Message {
  role: 'agent' | 'user';
  message: string | null;
  time_in_call_secs: number;
}

interface TranscriptResponse {
  transcript: Message[];
}

interface ConversationSummary {
  keyPoints: string[];
  outcome: string;
  nextSteps: string;
}

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const conversations = ref<Conversation[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Filters
const filters = ref({
  agentId: '',
  status: '',
  startDate: '',
  endDate: ''
});

// Modal state
const showModal = ref(false);
const selectedConversation = ref<Conversation | null>(null);
const transcript = ref<Message[]>([]);
const loadingTranscript = ref(false);
const transcriptError = ref<string | null>(null);

// Summary state
const summary = ref<ConversationSummary | null>(null);
const loadingSummary = ref(false);
const summaryError = ref<string | null>(null);

// Audio state
const audioElement = ref<HTMLAudioElement | null>(null);
const currentAudio = ref<Conversation | null>(null);
const loadingAudio = ref<string | null>(null);
const audioProgress = ref(0);
const audioDuration = ref(0);
const isAudioPlaying = ref(false);

// Computed properties
const uniqueAgents = computed(() => {
  const agents = new Map();
  conversations.value.forEach(conv => {
    agents.set(conv.agent_id, { id: conv.agent_id, name: conv.agent_name });
  });
  return Array.from(agents.values());
});

const filteredConversations = computed(() => {
  return conversations.value.filter(conv => {
    if (filters.value.agentId && conv.agent_id !== filters.value.agentId) return false;
    if (filters.value.status && conv.call_successful !== filters.value.status) return false;
    
    const convDate = new Date(conv.start_time_unix_secs * 1000);
    
    if (filters.value.startDate) {
      const startDate = new Date(filters.value.startDate);
      if (convDate < startDate) return false;
    }
    
    if (filters.value.endDate) {
      const endDate = new Date(filters.value.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (convDate > endDate) return false;
    }
    
    return true;
  });
});

const successCount = computed(() => {
  return filteredConversations.value.filter(conv => conv.call_successful === 'success').length;
});

const failureCount = computed(() => {
  return filteredConversations.value.filter(conv => conv.call_successful === 'failure').length;
});

const averageDuration = computed(() => {
  const total = filteredConversations.value.reduce((acc, conv) => acc + conv.call_duration_secs, 0);
  const avg = total / filteredConversations.value.length || 0;
  return formatDuration(Math.round(avg));
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

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getCallStatus = (status: string) => {
  switch (status) {
    case 'success':
      return 'Réussi';
    case 'failure':
      return 'Échoué';
    default:
      return 'Inconnu';
  }
};

const fetchConversations = async () => {
  if (!user.value) {
    loading.value = false;
    return;
  }

  try {
    // Get user's assigned agents
    const { data: assignments, error: err1 } = await supabase
      .from('user_agents')
      .select('agent_id')
      .eq('user_id', user.value.id);

    if (err1) throw err1;

    if (!assignments || assignments.length === 0) {
      loading.value = false;
      return;
    }

    // Fetch conversations for each assigned agent
    const allConversations: Conversation[] = [];
    
    for (const assignment of assignments) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${assignment.agent_id}`,
        {
          headers: {
            'xi-api-key': 'sk_c6ce660f7fe4911d0d903a694f1b2c6c9e10d67c20b5b561'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des conversations (${response.status})`);
      }

      const data = await response.json();
      allConversations.push(...data.conversations);
    }

    // Sort conversations by start time (most recent first)
    conversations.value = allConversations.sort(
      (a, b) => b.start_time_unix_secs - a.start_time_unix_secs
    );
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Une erreur s'est produite";
    console.error('Error fetching conversations:', e);
  } finally {
    loading.value = false;
  }
};

const generateSummary = async (messages: Message[]) => {
  loadingSummary.value = true;
  summaryError.value = null;
  summary.value = null;

  try {
    const response = await fetch('/api/ai-agent/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la génération du résumé');
    }

    const data = await response.json();
    if (data.success) {
      summary.value = data.summary;
    } else {
      throw new Error(data.message || 'Erreur lors de la génération du résumé');
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    summaryError.value = "Impossible de générer le résumé de la conversation";
  } finally {
    loadingSummary.value = false;
  }
};

const showTranscript = async (conversation: Conversation) => {
  selectedConversation.value = conversation;
  showModal.value = true;
  loadingTranscript.value = true;
  transcriptError.value = null;
  transcript.value = [];
  summary.value = null;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversation.conversation_id}`,
      {
        headers: {
          'xi-api-key': 'sk_c6ce660f7fe4911d0d903a694f1b2c6c9e10d67c20b5b561'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la transcription (${response.status})`);
    }

    const data = await response.json();
    transcript.value = data.transcript.filter((msg: Message) => msg.message !== null);

    // Generate summary after getting transcript
    if (transcript.value.length > 0) {
      await generateSummary(transcript.value);
    }
  } catch (e) {
    transcriptError.value = e instanceof Error ? e.message : "Une erreur s'est produite";
    console.error('Error fetching transcript:', e);
  } finally {
    loadingTranscript.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  selectedConversation.value = null;
  transcript.value = [];
  transcriptError.value = null;
};

const playAudio = async (conversation: Conversation) => {
  try {
    // If already playing this conversation, just toggle play/pause
    if (currentAudio.value?.conversation_id === conversation.conversation_id) {
      togglePlay();
      return;
    }

    loadingAudio.value = conversation.conversation_id;
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversation.conversation_id}/audio`,
      {
        headers: {
          'xi-api-key': 'sk_c6ce660f7fe4911d0d903a694f1b2c6c9e10d67c20b5b561'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching audio: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create new audio element if needed
    if (!audioElement.value) {
      audioElement.value = new Audio();
      
      // Add event listeners
      audioElement.value.addEventListener('timeupdate', updateProgress);
      audioElement.value.addEventListener('loadedmetadata', () => {
        audioDuration.value = audioElement.value?.duration || 0;
      });
      audioElement.value.addEventListener('ended', () => {
        isAudioPlaying.value = false;
      });
    }

    // Set new audio source
    audioElement.value.src = audioUrl;
    currentAudio.value = conversation;
    
    // Play audio
    await audioElement.value.play();
    isAudioPlaying.value = true;

  } catch (error) {
    console.error('Error playing audio:', error);
    alert('Error playing audio. Please try again.');
  } finally {
    loadingAudio.value = null;
  }
};

const downloadAudio = async (conversation: Conversation) => {
  try {
    loadingAudio.value = conversation.conversation_id;
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversation.conversation_id}/audio`,
      {
        headers: {
          'xi-api-key': 'sk_c6ce660f7fe4911d0d903a694f1b2c6c9e10d67c20b5b561'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error downloading audio: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const url = window.URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.conversation_id}.mp3`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading audio:', error);
    alert('Error downloading audio. Please try again.');
  } finally {
    loadingAudio.value = null;
  }
};

const togglePlay = () => {
  if (!audioElement.value) return;
  
  if (isAudioPlaying.value) {
    audioElement.value.pause();
  } else {
    audioElement.value.play();
  }
  
  isAudioPlaying.value = !isAudioPlaying.value;
};

const updateProgress = () => {
  if (!audioElement.value) return;
  audioProgress.value = audioElement.value.currentTime;
};

const seekAudio = ()  => {
  if (!audioElement.value) return;
  audioElement.value.currentTime = audioProgress.value;
};

const closeAudioPlayer = () => {
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.src = '';
  }
  currentAudio.value = null;
  isAudioPlaying.value = false;
  audioProgress.value = 0;
  audioDuration.value = 0;
};

const isPlaying = (id: string) => {
  return currentAudio.value?.conversation_id === id && isAudioPlaying.value;
};

// Fetch conversations on component mount
onMounted(() => {
  fetchConversations();
});

// Clean up audio element on component unmount
onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.src = '';
  }
});
</script>