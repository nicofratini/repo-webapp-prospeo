import { defineEventHandler, createError } from 'h3';
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Authentication required' 
      });
    }

    // Get document ID from URL
    const documentId = event.context.params?.id;
    if (!documentId) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Document ID is required' 
      });
    }

    // Get API key from environment
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      console.error('[API KB Delete] ElevenLabs API Key missing on server!');
      throw createError({ 
        statusCode: 500, 
        statusMessage: 'Server configuration error: ElevenLabs API Key missing' 
      });
    }

    const supabase = await serverSupabaseClient(event);

    // Check document ownership and user permissions
    const { data: document, error: docError } = await supabase
      .from('knowledge_base_documents')
      .select('user_id')
      .eq('id', documentId)
      .single();

    if (docError) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching user profile'
      });
    }

    const isAdmin = profile?.is_admin ?? false;

    // Check if user has permission to delete
    if (!isAdmin && document.user_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "Vous n'avez pas la permission de supprimer ce document"
      });
    }

    // Delete from ElevenLabs
    const deleteResponse = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      }
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}));
      throw createError({ 
        statusCode: deleteResponse.status,
        statusMessage: errorData.detail || `ElevenLabs API Error: ${deleteResponse.statusText}`
      });
    }

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('knowledge_base_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('[API KB Delete] Database error:', deleteError);
      throw deleteError;
    }

    return { 
      success: true
    };

  } catch (error: any) {
    console.error('[API KB Delete] Error:', error);
    
    // If it's already a H3 error, throw it as is
    if (error.statusCode) throw error;
    
    // Otherwise, create a new error
    throw createError({ 
      statusCode: error.status || 500,
      statusMessage: error.message || 'Internal server error'
    });
  }
});