<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Gestion des Propriétés</h1>
      <button
        @click="showAddModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Ajouter une propriété
      </button>
    </div>

    <!-- Search and Filter -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <div class="flex gap-4">
        <div class="flex-1">
          <input
            v-model="search"
            type="text"
            placeholder="Rechercher une propriété..."
            class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            v-model="filter"
            class="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les types</option>
            <option value="apartment">Appartements</option>
            <option value="house">Maisons</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Import Section -->
    <div class="bg-white p-6 rounded-lg shadow mb-6">
      <h2 class="text-lg font-semibold mb-4">Importer des propriétés</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Import from URL -->
        <div class="border p-4 rounded-lg">
          <h3 class="font-medium mb-2">Import depuis URL</h3>
          <div class="space-y-2">
            <div class="space-y-2">
              <div v-for="(url, index) in websiteUrls" :key="index" class="flex gap-2">
                <input
                  v-model="websiteUrls[index]"
                  type="url"
                  placeholder="https://..."
                  class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  @click="removeUrl(index)"
                  class="text-red-600 hover:text-red-800 px-2"
                >
                  ×
                </button>
              </div>
              <button
                @click="addUrlField"
                class="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Ajouter une URL
              </button>
            </div>
            <button
              @click="scanWebsites"
              :disabled="!hasValidUrls || scanning"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!scanning">Scanner ({{ validUrlCount }} URL{{ validUrlCount > 1 ? 's' : '' }})</span>
              <span v-else>Scan en cours...</span>
            </button>
            <p v-if="scanError" class="text-sm text-red-600">{{ scanError }}</p>
          </div>
        </div>

        <!-- Import from CSV -->
        <div class="border p-4 rounded-lg">
          <h3 class="font-medium mb-2">Import CSV</h3>
          <div class="space-y-2">
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              @change="handleFileUpload"
              class="hidden"
            />
            <div
              v-if="!selectedFile"
              @click="fileInput?.click()"
              class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500"
            >
              <p class="text-gray-600">Cliquez pour sélectionner un fichier CSV</p>
            </div>
            <div v-else class="border rounded-lg p-2">
              <div class="flex items-center justify-between">
                <span class="text-sm truncate">{{ selectedFile.name }}</span>
                <button
                  @click="removeFile"
                  class="text-red-600 hover:text-red-800"
                >
                  <span class="sr-only">Supprimer</span>
                  ×
                </button>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatFileSize(selectedFile.size) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Import from PDF -->
        <div class="border p-4 rounded-lg">
          <h3 class="font-medium mb-2">Import PDF</h3>
          <div class="space-y-2">
            <input
              ref="pdfInput"
              type="file"
              accept=".pdf"
              multiple
              @change="handlePDFUpload"
              class="hidden"
            />
            <div
              v-if="selectedPDFs.length === 0"
              @click="pdfInput?.click()"
              class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500"
            >
              <p class="text-gray-600">Cliquez pour sélectionner des fichiers PDF</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="(file, index) in selectedPDFs"
                :key="index"
                class="border rounded-lg p-2"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm truncate">{{ file.name }}</span>
                  <button
                    @click="removePDF(index)"
                    class="text-red-600 hover:text-red-800"
                  >
                    <span class="sr-only">Supprimer</span>
                    ×
                  </button>
                </div>
                <div class="text-xs text-gray-500">
                  {{ formatFileSize(file.size) }}
                </div>
              </div>
              <button
                @click="processPDFs"
                :disabled="importingPDF"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <span v-if="!importingPDF">Importer les PDF</span>
                <span v-else>Importation en cours...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Properties Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ville</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surface</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chambres</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading" class="animate-pulse">
              <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                Chargement...
              </td>
            </tr>
            <tr v-else-if="error" class="bg-red-50">
              <td colspan="8" class="px-6 py-4 text-center text-red-500">
                {{ error }}
              </td>
            </tr>
            <tr v-else-if="filteredProperties.length === 0">
              <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                Aucune propriété trouvée
              </td>
            </tr>
            <tr v-for="property in filteredProperties" :key="property.id" v-else>
              <td class="px-6 py-4 whitespace-nowrap">{{ property.address || 'N/A' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ property.city || 'N/A' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ property.type ? (property.type === 'apartment' ? 'Appartement' : 'Maison') : 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">{{ formatPrice(property.price) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ property.surface ? `${property.surface}m²` : 'N/A' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ property.bedrooms || 'N/A' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="property.source"
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="{
                    'bg-blue-100 text-blue-800': property.source === 'url',
                    'bg-green-100 text-green-800': property.source === 'csv',
                    'bg-purple-100 text-purple-800': property.source === 'pdf'
                  }"
                >
                  {{ property.source }}
                </span>
                <span v-else>N/A</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editProperty(property)"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Modifier
                </button>
                <button
                  @click="deleteProperty(property.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div class="p-6">
          <h2 class="text-xl font-semibold mb-4">
            {{ showEditModal ? 'Modifier la propriété' : 'Ajouter une propriété' }}
          </h2>
          <PropertyForm
            :property="editedProperty"
            :loading="saving"
            @submit="handleFormSubmit"
            @cancel="closeModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProperties, type Property } from '~/composables/useProperties';

// State
const {
  properties,
  loading,
  error,
  fetchProperties,
  createProperty,
  updateProperty,
  deleteProperty: removeProperty,
  importCSV,
  importPDF,
  scanWebsite: scanWebsiteApi
} = useProperties();

const selectedFile = ref<File | null>(null);
const selectedPDFs = ref<File[]>([]);
const websiteUrls = ref<string[]>(['']); // Initialize with one empty field
const importing = ref(false);
const importingPDF = ref(false);
const scanning = ref(false);
const scanError = ref<string | null>(null);
const search = ref('');
const filter = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

// Modal state
const showAddModal = ref(false);
const showEditModal = ref(false);
const editedProperty = ref<Property | null>(null);
const saving = ref(false);

// Fetch properties on mount
onMounted(() => {
  fetchProperties();
});

// Computed
const hasValidUrls = computed(() => {
  return websiteUrls.value.some(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
});

const validUrlCount = computed(() => {
  return websiteUrls.value.filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }).length;
});

const filteredProperties = computed(() => {
  // Filter out null properties first
  let filtered = properties.value.filter((p): p is Property => {
    return p !== null && 
           p !== undefined && 
           typeof p === 'object' &&
           'address' in p &&
           'city' in p;
  });

  // Apply search
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(p => 
      (p.address?.toLowerCase().includes(searchLower) || false) ||
      (p.city?.toLowerCase().includes(searchLower) || false) ||
      (p.type?.toLowerCase().includes(searchLower) || false)
    );
  }

  // Apply type filter
  if (filter.value) {
    filtered = filtered.filter(p => p.type === filter.value);
  }

  return filtered;
});

// URL Management
const addUrlField = () => {
  websiteUrls.value.push('');
};

const removeUrl = (index: number) => {
  websiteUrls.value = websiteUrls.value.filter((_, i) => i !== index);
  if (websiteUrls.value.length === 0) {
    websiteUrls.value = [''];
  }
};

const scanWebsites = async () => {
  const validUrls = websiteUrls.value.filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) return;

  scanning.value = true;
  scanError.value = null;

  try {
    for (const url of validUrls) {
      await scanWebsiteApi(url);
    }
    websiteUrls.value = [''];
  } catch (e) {
    console.error('Error scanning websites:', e);
    scanError.value = "Une erreur s'est produite lors du scan des sites. Veuillez vérifier les URLs et réessayer.";
  } finally {
    scanning.value = false;
  }
};

// File Management
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input?.files?.[0]) {
    selectedFile.value = input.files[0];
    
    try {
      importing.value = true;
      await importCSV(input.files[0]);
      selectedFile.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    } catch (e) {
      console.error('Error importing CSV:', e);
      error.value = e instanceof Error ? e.message : "Une erreur s'est produite";
    } finally {
      importing.value = false;
    }
  }
};

const handlePDFUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input?.files) {
    selectedPDFs.value = Array.from(input.files);
  }
};

const processPDFs = async () => {
  if (selectedPDFs.value.length === 0) return;

  try {
    importingPDF.value = true;
    await importPDF(selectedPDFs.value);
    
    // Clear selected files
    selectedPDFs.value = [];
    if (pdfInput.value) {
      pdfInput.value.value = '';
    }
  } catch (e) {
    console.error('Error importing PDFs:', e);
    error.value = e instanceof Error ? e.message : "Une erreur s'est produite";
  } finally {
    importingPDF.value = false;
  }
};

const removeFile = () => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const removePDF = (index: number) => {
  selectedPDFs.value = selectedPDFs.value.filter((_, i) => i !== index);
  if (pdfInput.value) {
    pdfInput.value.value = '';
  }
};

const editProperty = (property: Property) => {
  editedProperty.value = property;
  showEditModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  editedProperty.value = null;
  saving.value = false;
};

const handleFormSubmit = async (data: Partial<Property>) => {
  saving.value = true;
  try {
    if (showEditModal.value && editedProperty.value?.id) {
      await updateProperty({
        ...data,
        id: editedProperty.value.id
      });
    } else {
      await createProperty(data as Omit<Property, 'id' | 'created_at' | 'updated_at' | 'user_id'>);
    }
    closeModal();
  } catch (e) {
    console.error('Error saving property:', e);
    error.value = e instanceof Error ? e.message : "Une erreur s'est produite";
  } finally {
    saving.value = false;
  }
};

const deleteProperty = async (id?: string) => {
  if (!id || !confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) return;

  try {
    await removeProperty(id);
  } catch (error) {
    console.error('Error deleting property:', error);
  }
};

// Template refs
const fileInput = ref<HTMLInputElement | null>(null);
const pdfInput = ref<HTMLInputElement | null>(null);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});
</script>