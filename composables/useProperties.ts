import { ref } from 'vue';
import { useSupabaseClient } from '#imports';

export interface Property {
  id: string;
  user_id: string;
  address: string;
  city: string;
  type: 'apartment' | 'house';
  price: number;
  surface: number;
  bedrooms?: number;
  description?: string;
  source: 'url' | 'csv' | 'pdf';
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export function useProperties() {
  const supabase = useSupabaseClient();
  const properties = ref<Property[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchProperties = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.warn('User not authenticated, skipping fetchProperties');
        properties.value = [];
        loading.value = false;
        return;
      }

      // Get user profile to check if admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      const isAdmin = profile?.is_admin ?? false;

      // If admin, fetch all properties, otherwise only user's properties
      const query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query.eq('user_id', session.user.id);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      properties.value = (data || []).filter((p): p is Property => p !== null);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Une erreur s'est produite";
      console.error('Error fetching properties:', e);
    } finally {
      loading.value = false;
    }
  };

  const createProperty = async (property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Non authentifié');
      }

      const { data, error: err } = await supabase
        .from('properties')
        .insert({
          ...property,
          user_id: session.user.id
        })
        .select()
        .single();

      if (err) throw err;
      if (data) {
        properties.value = [data, ...properties.value];
      }
      return data;
    } catch (e) {
      throw e;
    }
  };

  const createProperties = async (newProperties: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'user_id'>[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Non authentifié');
      }

      const propertiesToInsert = newProperties.map(property => ({
        ...property,
        user_id: session.user.id
      }));

      const { data, error: err } = await supabase
        .from('properties')
        .insert(propertiesToInsert)
        .select();

      if (err) throw err;
      if (data) {
        properties.value = [...data, ...properties.value];
      }
      return data;
    } catch (e) {
      throw e;
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (err) throw err;
      properties.value = properties.value.filter(p => p.id !== id);
    } catch (e) {
      throw e;
    }
  };

  const updateProperty = async (property: Partial<Property> & { id: string }) => {
    try {
      const { data, error: err } = await supabase
        .from('properties')
        .update(property)
        .eq('id', property.id)
        .select()
        .single();

      if (err) throw err;
      if (data) {
        const index = properties.value.findIndex(p => p.id === property.id);
        if (index !== -1) {
          properties.value = [
            ...properties.value.slice(0, index),
            data,
            ...properties.value.slice(index + 1)
          ];
        }
      }
      return data;
    } catch (e) {
      throw e;
    }
  };

  const scanWebsite = async (url: string, mode: 'single' | 'bulk' = 'single') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/scrape-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ url, mode })
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des données (${response.status})`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Une erreur s'est produite");
      }

      if (mode === 'single') {
        // Save the single extracted property
        const property = await createProperty({
          ...result.data,
          source: 'url',
          source_url: url
        });
        return { success: true, data: property };
      } else {
        // Save multiple properties from bulk extraction
        const { properties: extractedProperties, errors, total, processed, failed } = result.data;
        
        if (extractedProperties.length > 0) {
          await createProperties(
            extractedProperties.map(p => ({
              ...p,
              source: 'url'
            }))
          );
        }

        return {
          success: true,
          data: {
            total,
            processed,
            failed,
            errors
          }
        };
      }
    } catch (error) {
      console.error('Error scanning website:', error);
      throw new Error(error instanceof Error ? error.message : "Une erreur s'est produite lors de l'analyse du site");
    }
  };

  const importCSV = async (file: File) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Non authentifié');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/process-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de l'importation (${response.status})`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Une erreur s'est produite");
      }

      await fetchProperties(); // Refresh the properties list
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Une erreur s'est produite lors de l'importation");
    }
  };

  const importPDF = async (files: File[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Non authentifié');
      }

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Erreur lors de l'importation de ${file.name} (${response.status})`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Une erreur s'est produite");
        }
      }

      await fetchProperties(); // Refresh the properties list
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Une erreur s'est produite lors de l'importation");
    }
  };

  return {
    properties,
    loading,
    error,
    fetchProperties,
    createProperty,
    createProperties,
    updateProperty,
    deleteProperty,
    scanWebsite,
    importCSV,
    importPDF
  };
}