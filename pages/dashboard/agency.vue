<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Agence</h1>
      <p class="mt-2 text-gray-600">Gérez les informations de votre agence et invitez des collaborateurs</p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-3">
      <Icon name="heroicons:exclamation-circle" class="w-5 h-5" />
      <p>{{ error }}</p>
    </div>

    <!-- Only admin can see this page content -->
    <div v-if="!isAdmin" class="bg-yellow-100 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6 flex items-center gap-3">
      <Icon name="heroicons:shield-exclamation" class="w-5 h-5" />
      <p>Seuls les administrateurs peuvent accéder à cette page.</p>
    </div>

    <div v-else>
      <!-- Agency Information -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <AgencyInfoForm
          v-model="agencyInfo"
          title="Informations de l'agence"
          :loading="saving"
          @save="saveAgencyInfo"
        />
      </div>

      <!-- Agency History -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <AgencyHistoryForm
          v-model="agencyHistory"
          title="Historique de l'agence"
          :loading="saving"
          @save="saveAgencyHistory"
        />
      </div>

      <!-- Collaborators -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <AgencyCollaboratorsList
          :collaborators="collaborators"
          title="Collaborateurs"
          @invite="showInviteModal = true"
          @resend="resendInvitation"
          @remove="removeCollaborator"
        />
      </div>

      <!-- Invite Modal -->
      <AgencyInviteModal
        v-model="showInviteModal"
        :loading="inviting"
        @submit="handleInvitation"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgencyInfo, AgencyHistory, Collaborator } from '~/types/agency';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const profileStore = useProfileStore();

// Agency Info State
const agencyInfo = ref<AgencyInfo>({
  name: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  description: ''
});

// Agency History State
const agencyHistory = ref<AgencyHistory>({
  foundedDate: '',
  history: '',
  milestones: []
});

// Collaborators State
const collaborators = ref<Collaborator[]>([]);
const showInviteModal = ref(false);
const inviting = ref(false);
const saving = ref(false);
const lastInviteSent = ref(0);
const error = ref<string | null>(null);

// Check if user is admin
const isAdmin = computed(() => profileStore.isAdmin);

// Create default agency info if it doesn't exist
const ensureAgencyData = async () => {
  if (!isAdmin.value) return;

  try {
    // Call the database function to initialize agency data
    const { data, error: funcError } = await supabase.rpc('initialize_agency_data');
    
    if (funcError) throw funcError;
    
  } catch (err) {
    console.error('Error initializing agency data:', err);
    error.value = 'Erreur lors de l\'initialisation des données.';
  }
};

// Load Agency Data
const loadAgencyData = async () => {
  error.value = null;
  
  try {
    if (isAdmin.value) {
      await ensureAgencyData();
    }

    // Load agency info
    const { data: infoData, error: infoError } = await supabase
      .from('agency_info')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (infoError) throw infoError;
    if (infoData) {
      agencyInfo.value = infoData;
    }

    // Load agency history
    const { data: historyData, error: historyError } = await supabase
      .from('agency_history')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (historyError) throw historyError;
    if (historyData) {
      agencyHistory.value = {
        id: historyData.id,
        foundedDate: historyData.founded_date || '',
        history: historyData.history || '',
        milestones: historyData.milestones || []
      };
    }

    // Load collaborators
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, status');
    
    if (usersError) throw usersError;
    if (users) {
      collaborators.value = users.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        status: (user.status || 'active') as 'active' | 'pending'
      }));
    }
  } catch (err) {
    console.error('Error loading agency data:', err);
    error.value = 'Erreur lors du chargement des données.';
  }
};

// Save Agency Info
const saveAgencyInfo = async () => {
  if (!isAdmin.value) return;
  
  saving.value = true;
  error.value = null;

  try {
    const { error: saveError } = await supabase
      .from('agency_info')
      .upsert({
        id: agencyInfo.value.id,
        name: agencyInfo.value.name,
        email: agencyInfo.value.email,
        phone: agencyInfo.value.phone,
        website: agencyInfo.value.website,
        address: agencyInfo.value.address,
        description: agencyInfo.value.description
      });
    
    if (saveError) throw saveError;
  } catch (err) {
    console.error('Error saving agency info:', err);
    error.value = 'Erreur lors de l\'enregistrement des informations.';
  } finally {
    saving.value = false;
  }
};

// Save Agency History
const saveAgencyHistory = async () => {
  if (!isAdmin.value) return;
  
  saving.value = true;
  error.value = null;

  try {
    const { error: saveError } = await supabase
      .from('agency_history')
      .upsert({
        id: agencyHistory.value.id,
        founded_date: agencyHistory.value.foundedDate ? new Date(agencyHistory.value.foundedDate) : null,
        history: agencyHistory.value.history,
        milestones: agencyHistory.value.milestones
      });
    
    if (saveError) throw saveError;
  } catch (err) {
    console.error('Error saving agency history:', err);
    error.value = 'Erreur lors de l\'enregistrement de l\'historique.';
  } finally {
    saving.value = false;
  }
};

// Check if enough time has passed since last invitation
const canSendInvitation = () => {
  const now = Date.now();
  const timeSinceLastInvite = now - lastInviteSent.value;
  return timeSinceLastInvite >= 60000; // 60 seconds
};

// Handle invitation submission
const handleInvitation = async (data: { email: string; message: string }) => {
  if (!isAdmin.value) return;
  
  if (!canSendInvitation()) {
    const waitTime = Math.ceil((60000 - (Date.now() - lastInviteSent.value)) / 1000);
    alert(`Veuillez attendre ${waitTime} secondes avant d'envoyer une autre invitation.`);
    return;
  }
  
  inviting.value = true;
  error.value = null;

  try {
    // First check if a user with this email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .maybeSingle();
    
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà.');
    }
    
    // Create pending profile using the database function
    const { error: rpcError } = await supabase.rpc('create_pending_profile', {
      email_address: data.email
    });
    
    if (rpcError) throw rpcError;

    // Send invitation email via auth.signInWithOtp
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        data: {
          invitation_message: data.message
        }
      }
    });

    if (otpError) throw otpError;

    lastInviteSent.value = Date.now();
    showInviteModal.value = false;
    
    // Refresh collaborators list
    await loadAgencyData();
  } catch (err) {
    console.error('Error sending invitation:', err);
    
    // Handle specific errors
    if (err.message?.includes('rate_limit')) {
      error.value = 'Veuillez attendre avant d\'envoyer une autre invitation.';
    } else if (err.message?.includes('row-level security policy')) {
      error.value = 'Vous n\'avez pas les permissions nécessaires.';
    } else {
      error.value = `Erreur lors de l'envoi de l'invitation: ${err.message}`;
    }
  } finally {
    inviting.value = false;
  }
};

// Resend invitation to pending user
const resendInvitation = async (userId: string) => {
  if (!isAdmin.value) return;
  
  if (!canSendInvitation()) {
    const waitTime = Math.ceil((60000 - (Date.now() - lastInviteSent.value)) / 1000);
    alert(`Veuillez attendre ${waitTime} secondes avant d'envoyer une autre invitation.`);
    return;
  }

  const collaborator = collaborators.value.find(c => c.id === userId);
  if (!collaborator) return;

  error.value = null;
  
  try {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: collaborator.email
    });

    if (otpError) throw otpError;
    
    lastInviteSent.value = Date.now();
  } catch (err) {
    console.error('Error resending invitation:', err);
    
    if (err.message?.includes('rate_limit')) {
      error.value = 'Veuillez attendre avant d\'envoyer une autre invitation.';
    } else {
      error.value = `Erreur lors de l'envoi de l'invitation: ${err.message}`;
    }
  }
};

// Remove a collaborator
const removeCollaborator = async (userId: string) => {
  if (!isAdmin.value) return;
  
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce collaborateur ?')) return;

  error.value = null;
  
  try {
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteError) throw deleteError;

    collaborators.value = collaborators.value.filter(c => c.id !== userId);
  } catch (err) {
    console.error('Error removing collaborator:', err);
    error.value = 'Erreur lors de la suppression du collaborateur.';
  }
};

// Load initial data
onMounted(async () => {
  // Ensure profile is loaded
  if (!profileStore.profile) {
    await profileStore.fetchProfile();
  }
  
  // Load agency data
  await loadAgencyData();
});

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});
</script>