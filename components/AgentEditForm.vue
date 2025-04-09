<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Basic Information -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Nom de l'agent
        </label>
        <input
          v-model="formData.name"
          type="text"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Premier message
        </label>
        <textarea
          v-model="formData.firstMessage"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          System Prompt
        </label>
        <textarea
          v-model="formData.systemPrompt"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Instructions système pour l'agent..."
        ></textarea>
        <p class="mt-1 text-sm text-gray-500">
          Définit le comportement et les connaissances de base de l'agent
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Langue
        </label>
        <select
          v-model="formData.language"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>

    <!-- Voice Settings -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">Paramètres de voix</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Modèle TTS
        </label>
        <select
          v-model="formData.ttsModel"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="eleven_turbo_v2">Eleven Turbo v2</option>
          <option value="eleven_turbo_v2_5">Eleven Turbo v2.5</option>
          <option value="eleven_flash_v2">Eleven Flash v2</option>
          <option value="eleven_flash_v2_5">Eleven Flash v2.5</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Stabilité
        </label>
        <input
          v-model.number="formData.stability"
          type="range"
          min="0"
          max="1"
          step="0.1"
          class="w-full"
        />
        <div class="text-sm text-gray-500 mt-1">
          {{ formData.stability }}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Vitesse
        </label>
        <input
          v-model.number="formData.speed"
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          class="w-full"
        />
        <div class="text-sm text-gray-500 mt-1">
          {{ formData.speed }}x
        </div>
      </div>
    </div>

    <!-- Conversation Settings -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">Paramètres de conversation</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Délai d'inactivité (secondes)
        </label>
        <input
          v-model.number="formData.turnTimeout"
          type="number"
          min="1"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Durée maximale (minutes)
        </label>
        <input
          v-model.number="formData.maxDuration"
          type="number"
          min="1"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- Webhook Settings -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">Paramètres Webhook</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          URL du Webhook
        </label>
        <input
          v-model="formData.webhookUrl"
          type="url"
          pattern="https?://.*"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          En-têtes HTTP
        </label>
        <div class="space-y-2">
          <div v-for="(header, index) in formData.webhookHeaders" :key="index" class="flex gap-2">
            <input
              v-model="header.key"
              type="text"
              placeholder="Clé"
              class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              v-model="header.value"
              type="text"
              placeholder="Valeur"
              class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              @click="removeWebhookHeader(index)"
              class="px-3 py-2 text-red-600 hover:text-red-800"
            >
              <Icon name="heroicons:trash" class="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            @click="addWebhookHeader"
            class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Ajouter un en-tête
          </button>
        </div>
      </div>
    </div>

    <!-- Evaluation Settings -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">Critères d'évaluation</h3>
      
      <div class="space-y-4">
        <div v-for="(criteria, index) in formData.evaluationCriteria" :key="index" class="space-y-2 p-4 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <input
                v-model="criteria.name"
                type="text"
                placeholder="Nom du critère"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              @click="removeEvaluationCriteria(index)"
              class="px-3 py-2 text-red-600 hover:text-red-800"
            >
              <Icon name="heroicons:trash" class="w-5 h-5" />
            </button>
          </div>
          
          <textarea
            v-model="criteria.prompt"
            placeholder="Prompt d'évaluation"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
          
          <label class="flex items-center gap-2">
            <input
              v-model="criteria.useKnowledgeBase"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">Utiliser la base de connaissances</span>
          </label>
        </div>
        
        <button
          type="button"
          @click="addEvaluationCriteria"
          class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <Icon name="heroicons:plus" class="w-4 h-4" />
          Ajouter un critère
        </button>
      </div>
    </div>

    <!-- Widget Settings -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">Paramètres du widget</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Variante
          </label>
          <select
            v-model="formData.widgetVariant"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="compact">Compact</option>
            <option value="full">Complet</option>
            <option value="expandable">Extensible</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Mode d'extension
          </label>
          <select
            v-model="formData.widgetExpandable"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="never">Jamais</option>
            <option value="mobile">Mobile uniquement</option>
            <option value="desktop">Desktop uniquement</option>
            <option value="always">Toujours</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Mode de feedback
          </label>
          <select
            v-model="formData.widgetFeedbackMode"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">Aucun</option>
            <option value="during">Pendant l'appel</option>
            <option value="end">Fin d'appel</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Type d'avatar
          </label>
          <select
            v-model="formData.widgetAvatarType"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="orb">Orbe</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>
      </div>

      <!-- Colors -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Couleur de fond
          </label>
          <input
            v-model="formData.widgetBgColor"
            type="color"
            class="w-full h-10 p-1 rounded"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Couleur du texte
          </label>
          <input
            v-model="formData.widgetTextColor"
            type="color"
            class="w-full h-10 p-1 rounded"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Couleur du bouton
          </label>
          <input
            v-model="formData.widgetBtnColor"
            type="color"
            class="w-full h-10 p-1 rounded"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Couleur du texte du bouton
          </label>
          <input
            v-model="formData.widgetBtnTextColor"
            type="color"
            class="w-full h-10 p-1 rounded"
          />
        </div>
      </div>

      <!-- Avatar Colors -->
      <div v-if="formData.widgetAvatarType === 'orb'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Couleur 1 de l'avatar
          </label>
          <input
            v-model="formData.widgetAvatarColor1"
            type="color"
            class="w-full h-10 p-1 rounded"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Couleur 2 de l'avatar
          </label>
          <input
            v-model="formData.widgetAvatarColor2"
            type="color"
            class="w-full h-10 p-1 rounded"
          />
        </div>
      </div>

      <!-- Custom Avatar URL -->
      <div v-else>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          URL de l'avatar personnalisé
        </label>
        <input
          v-model="formData.widgetCustomAvatarUrl"
          type="url"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Text Settings -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Texte d'action
          </label>
          <input
            v-model="formData.widgetActionText"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Texte de début d'appel
          </label>
          <input
            v-model="formData.widgetStartCallText"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Texte de fin d'appel
          </label>
          <input
            v-model="formData.widgetEndCallText"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Toggles -->
      <div class="space-y-3">
        <label class="flex items-center gap-2">
          <input
            v-model="formData.widgetShowAvatar"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">Afficher l'avatar quand réduit</span>
        </label>

        <label class="flex items-center gap-2">
          <input
            v-model="formData.widgetDisableBanner"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">Désactiver la bannière</span>
        </label>

        <label class="flex items-center gap-2">
          <input
            v-model="formData.widgetMicMuting"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">Activer la mise en sourdine du micro</span>
        </label>

        <label class="flex items-center gap-2">
          <input
            v-model="formData.widgetLanguageSelector"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">Afficher le sélecteur de langue</span>
        </label>
      </div>
    </div>

    <!-- Call Limits -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">Limites d'appels</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Limite de concurrence
        </label>
        <input
          v-model.number="formData.concurrencyLimit"
          type="number"
          min="-1"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p class="mt-1 text-sm text-gray-500">
          -1 pour illimité
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Limite quotidienne
        </label>
        <input
          v-model.number="formData.dailyLimit"
          type="number"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- Authentication Settings -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">Paramètres d'authentification</h3>
      
      <label class="flex items-center gap-2">
        <input
          v-model="formData.enableAuth"
          type="checkbox"
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">Activer l'authentification</span>
      </label>

      <div v-if="formData.enableAuth">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Domaines autorisés
        </label>
        <div class="space-y-2">
          <div v-for="(domain, index) in formData.allowedDomains" :key="index" class="flex gap-2">
            <input
              v-model="formData.allowedDomains[index]"
              type="text"
              placeholder="example.com"
              class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              @click="removeAllowedDomain(index)"
              class="px-3 py-2 text-red-600 hover:text-red-800"
            >
              <Icon name="heroicons:trash" class="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            @click="addAllowedDomain"
            class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Ajouter un domaine
          </button>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end gap-3">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-gray-700 hover:text-gray-900"
        :disabled="loading"
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
interface WebhookHeader {
  key: string;
  value: string;
}

interface EvaluationCriteria {
  name: string;
  prompt: string;
  useKnowledgeBase: boolean;
}

interface FormData {
  name: string;
  firstMessage: string;
  systemPrompt: string;
  language: string;
  ttsModel: string;
  stability: number;
  speed: number;
  turnTimeout: number;
  maxDuration: number;
  webhookUrl: string;
  webhookHeaders: WebhookHeader[];
  evaluationCriteria: EvaluationCriteria[];
  widgetVariant: 'compact' | 'full' | 'expandable';
  widgetExpandable: 'never' | 'mobile' | 'desktop' | 'always';
  widgetFeedbackMode: 'none' | 'during' | 'end';
  widgetBgColor: string;
  widgetTextColor: string;
  widgetBtnColor: string;
  widgetBtnTextColor: string;
  widgetAvatarType: 'orb' | 'custom';
  widgetCustomAvatarUrl: string;
  widgetAvatarColor1: string;
  widgetAvatarColor2: string;
  widgetActionText: string;
  widgetStartCallText: string;
  widgetEndCallText: string;
  widgetShowAvatar: boolean;
  widgetDisableBanner: boolean;
  widgetMicMuting: boolean;
  widgetLanguageSelector: boolean;
  concurrencyLimit: number;
  dailyLimit: number;
  enableAuth: boolean;
  allowedDomains: string[];
}

const props = withDefaults(defineProps<{
  agent?: any;
  loading?: boolean;
}>(), {
  agent: undefined,
  loading: false
});

const emit = defineEmits<{
  (e: 'submit', data: any): void;
  (e: 'cancel'): void;
}>();

const formData = ref<FormData>({
  name: props.agent?.name || '',
  firstMessage: props.agent?.conversation_config?.agent?.first_message || '',
  systemPrompt: props.agent?.conversation_config?.agent?.prompt?.prompt || '',
  language: props.agent?.conversation_config?.agent?.language || 'fr',
  ttsModel: props.agent?.conversation_config?.tts?.model_id || 'eleven_turbo_v2',
  stability: props.agent?.conversation_config?.tts?.stability || 0.5,
  speed: props.agent?.conversation_config?.tts?.speed || 1.0,
  turnTimeout: props.agent?.conversation_config?.turn?.turn_timeout || 30,
  maxDuration: Math.round((props.agent?.conversation_config?.conversation?.max_duration_seconds || 3600) / 60),
  webhookUrl: props.agent?.platform_settings?.workspace_overrides?.conversation_initiation_client_data_webhook?.url || '',
  webhookHeaders: Object.entries(props.agent?.platform_settings?.workspace_overrides?.conversation_initiation_client_data_webhook?.request_headers || {}).map(([key, value]) => ({ key, value: value as string })),
  evaluationCriteria: props.agent?.platform_settings?.evaluation?.criteria?.map((c: any) => ({
    name: c.name || '',
    prompt: c.conversation_goal_prompt || '',
    useKnowledgeBase: c.use_knowledge_base || false
  })) || [],
  widgetVariant: props.agent?.platform_settings?.widget?.variant || 'compact',
  widgetExpandable: props.agent?.platform_settings?.widget?.expandable || 'never',
  widgetFeedbackMode: props.agent?.platform_settings?.widget?.feedback_mode || 'none',
  widgetBgColor: props.agent?.platform_settings?.widget?.bg_color || '#ffffff',
  widgetTextColor: props.agent?.platform_settings?.widget?.text_color || '#000000',
  widgetBtnColor: props.agent?.platform_settings?.widget?.btn_color || '#000000',
  widgetBtnTextColor: props.agent?.platform_settings?.widget?.btn_text_color || '#ffffff',
  widgetAvatarType: props.agent?.platform_settings?.widget?.avatar?.type || 'orb',
  widgetCustomAvatarUrl: props.agent?.platform_settings?.widget?.custom_avatar_path || '',
  widgetAvatarColor1: props.agent?.platform_settings?.widget?.avatar?.color_1 || '#2792dc',
  widgetAvatarColor2: props.agent?.platform_settings?.widget?.avatar?.color_2 || '#9ce6e6',
  widgetActionText: props.agent?.platform_settings?.widget?.action_text || 'Parler à un agent',
  widgetStartCallText: props.agent?.platform_settings?.widget?.start_call_text || "Démarrer l'appel",
  widgetEndCallText: props.agent?.platform_settings?.widget?.end_call_text || "Terminer l'appel",
  widgetShowAvatar: props.agent?.platform_settings?.widget?.show_avatar_when_collapsed ?? true,
  widgetDisableBanner: props.agent?.platform_settings?.widget?.disable_banner ?? false,
  widgetMicMuting: props.agent?.platform_settings?.widget?.mic_muting_enabled ?? false,
  widgetLanguageSelector: props.agent?.platform_settings?.widget?.language_selector ?? false,
  concurrencyLimit: props.agent?.platform_settings?.call_limits?.agent_concurrency_limit ?? -1,
  dailyLimit: props.agent?.platform_settings?.call_limits?.daily_limit ?? 100000,
  enableAuth: props.agent?.platform_settings?.auth?.enable_auth ?? false,
  allowedDomains: props.agent?.platform_settings?.auth?.allowlist?.map((item: any) => item.hostname) || []
});

const addWebhookHeader = () => {
  formData.value.webhookHeaders.push({ key: '', value: '' });
};

const removeWebhookHeader = (index: number) => {
  formData.value.webhookHeaders.splice(index, 1);
};

const addEvaluationCriteria = () => {
  formData.value.evaluationCriteria.push({
    name: '',
    prompt: '',
    useKnowledgeBase: false
  });
};

const removeEvaluationCriteria = (index: number) => {
  formData.value.evaluationCriteria.splice(index, 1);
};

const addAllowedDomain = () => {
  formData.value.allowedDomains.push('');
};

const removeAllowedDomain = (index: number) => {
  formData.value.allowedDomains.splice(index, 1);
};

const isValidUrl = (url: string): boolean => {
  if (!url) return true; // Allow empty URL
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const handleSubmit = () => {
  // Validate webhook URL if provided
  if (formData.value.webhookUrl && !isValidUrl(formData.value.webhookUrl)) {
    alert('Please enter a valid webhook URL');
    return;
  }

  // Ensure maxDuration is a valid number
  const maxDuration = formData.value.maxDuration || 60; // Default to 60 minutes if not set

  const apiData = {
    name: formData.value.name,
    conversation_config: {
      agent: {
        first_message: formData.value.firstMessage,
        language: formData.value.language,
        prompt: {
          prompt: formData.value.systemPrompt,
          knowledge_base: props.agent?.conversation_config?.agent?.prompt?.knowledge_base || []
        }
      },
      tts: {
        model_id: formData.value.ttsModel,
        stability: formData.value.stability,
        speed: formData.value.speed
      },
      turn: {
        turn_timeout: formData.value.turnTimeout
      },
      conversation: {
        max_duration_seconds: Math.round(maxDuration * 60)
      }
    },
    platform_settings: {
      workspace_overrides: {
        conversation_initiation_client_data_webhook: formData.value.webhookUrl ? {
          url: formData.value.webhookUrl,
          request_headers: Object.fromEntries(
            formData.value.webhookHeaders
              .filter(h => h.key && h.value)
              .map(h => [h.key, h.value])
          )
        } : null
      },
      evaluation: {
        criteria: formData.value.evaluationCriteria.map(c => ({
          name: c.name,
          conversation_goal_prompt: c.prompt,
          use_knowledge_base: c.useKnowledgeBase
        }))
      },
      widget: {
        variant: formData.value.widgetVariant,
        expandable: formData.value.widgetExpandable,
        feedback_mode: formData.value.widgetFeedbackMode,
        bg_color: formData.value.widgetBgColor,
        text_color: formData.value.widgetTextColor,
        btn_color: formData.value.widgetBtnColor,
        btn_text_color: formData.value.widgetBtnTextColor,
        avatar: formData.value.widgetAvatarType === 'custom' ? {
          type: 'custom',
          custom_avatar_path: formData.value.widgetCustomAvatarUrl
        } : {
          type: 'orb',
          color_1: formData.value.widgetAvatarColor1,
          color_2: formData.value.widgetAvatarColor2
        },
        action_text: formData.value.widgetActionText,
        start_call_text: formData.value.widgetStartCallText,
        end_call_text: formData.value.widgetEndCallText,
        show_avatar_when_collapsed: formData.value.widgetShowAvatar,
        disable_banner: formData.value.widgetDisableBanner,
        mic_muting_enabled: formData.value.widgetMicMuting,
        language_selector: formData.value.widgetLanguageSelector
      },
      call_limits: {
        agent_concurrency_limit: formData.value.concurrencyLimit,
        daily_limit: formData.value.dailyLimit
      },
      auth: formData.value.enableAuth ? {
        enable_auth: true,
        allowlist: formData.value.allowedDomains.filter(d => d.trim()).map(hostname => ({ hostname }))
      } : {
        enable_auth: false,
        allowlist: []
      }
    }
  };

  emit('submit', apiData);
};
</script>