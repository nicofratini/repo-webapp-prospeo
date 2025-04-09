import { defineEventHandler, readBody, createError } from 'h3';
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Authentication required' 
      });
    }

    // Read request body
    const body = await readBody<{ knowledgeText: string }>(event);
    const textToUpload = body?.knowledgeText;

    if (!textToUpload || typeof textToUpload !== 'string' || textToUpload.trim() === '') {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Missing or empty "knowledgeText" in request body' 
      });
    }

    // Get API key from environment
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      console.error('[API Upload KB] ElevenLabs API Key missing on server!');
      throw createError({ 
        statusCode: 500, 
        statusMessage: 'Server configuration error: ElevenLabs API Key missing' 
      });
    }

    const documentName = `Properties Knowledge Base - ${new Date().toLocaleDateString('fr-FR')}`;
    const documentDescription = 'Base de connaissances des propriétés immobilières';

    // Call ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base/text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: textToUpload,
        name: documentName,
        description: documentDescription
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createError({ 
        statusCode: response.status,
        statusMessage: errorData.detail || `ElevenLabs API Error: ${response.statusText}`
      });
    }

    const data = await response.json();

    // Store document info in Supabase
    const supabase = await serverSupabaseClient(event);
    const { error: dbError } = await supabase
      .from('knowledge_base_documents')
      .insert({
        id: data.id,
        user_id: user.id,
        name: documentName,
        description: documentDescription,
        size_bytes: textToUpload.length // Approximate size in bytes
      });

    if (dbError) {
      console.error('[API Upload KB] Database error:', dbError);
      // Try to delete the document from ElevenLabs if database insert fails
      try {
        await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${data.id}`, {
          method: 'DELETE',
          headers: { 'xi-api-key': elevenLabsApiKey }
        });
      } catch (deleteError) {
        console.error('[API Upload KB] Failed to delete document after DB error:', deleteError);
      }
      throw dbError;
    }

    return { 
      success: true, 
      documentId: data.id,
      documentName
    };

  } catch (error: any) {
    console.error('[API Upload KB] Error:', error);
    
    // If it's already a H3 error, throw it as is
    if (error.statusCode) throw error;
    
    // Otherwise, create a new error
    throw createError({ 
      statusCode: error.status || 500,
      statusMessage: error.message || 'Internal server error'
    });
  }
});