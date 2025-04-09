import { defineEventHandler, createError } from 'h3';
import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server';

export default defineEventHandler(async (event) => {
  try {
    // Verify required environment variables
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!serviceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error: SUPABASE_SERVICE_KEY is missing'
      });
    }

    if (!elevenLabsApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error: ELEVENLABS_API_KEY is missing'
      });
    }

    // Get Supabase client and service role client
    const supabase = await serverSupabaseClient(event);
    const serviceRole = await serverSupabaseServiceRole(event);

    // Try to get authenticated user, fallback to service role for admin operations
    let user;
    try {
      user = await serverSupabaseUser(event);
    } catch (authError) {
      console.warn('[API KB List] Auth session missing, falling back to service role');
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    if (!user) {
      // If no user session, check Authorization header
      const authHeader = event.node.req.headers.authorization;
      if (!authHeader) {
        throw createError({ 
          statusCode: 401, 
          statusMessage: 'Authentication required' 
        });
      }
    }

    // Use service role to check if user is admin (bypasses RLS)
    const { data: profile, error: profileError } = await serviceRole
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single();

    if (profileError) {
      console.error('[API KB List] Error fetching profile:', profileError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching user profile'
      });
    }

    const isAdmin = profile?.is_admin ?? false;

    // Use service role for database operations to bypass RLS
    const query = serviceRole
      .from('knowledge_base_documents')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by user if not admin
    if (!isAdmin && user) {
      query.eq('user_id', user.id);
    }

    const { data: documents, error: dbError } = await query;

    if (dbError) {
      console.error('[API KB List] Database error:', dbError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching documents from database'
      });
    }

    // Get full document details from ElevenLabs
    const documentDetails = [];
    for (const doc of documents) {
      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${doc.id}`, {
          headers: {
            'xi-api-key': elevenLabsApiKey,
          }
        });

        if (response.ok) {
          const data = await response.json();
          documentDetails.push(data);
        } else {
          console.error(`[API KB List] Failed to fetch document ${doc.id} from ElevenLabs:`, await response.text());
          // Delete from Supabase if not found in ElevenLabs
          if (response.status === 404) {
            await serviceRole
              .from('knowledge_base_documents')
              .delete()
              .eq('id', doc.id);
          }
        }
      } catch (error) {
        console.error(`[API KB List] Error fetching document ${doc.id}:`, error);
      }
    }

    return { 
      success: true, 
      documents: documentDetails,
      isAdmin
    };

  } catch (error: any) {
    console.error('[API KB List] Error:', error);
    
    // If it's already a H3 error, throw it as is
    if (error.statusCode) throw error;
    
    // Otherwise, create a new error
    throw createError({ 
      statusCode: error.status || 500,
      statusMessage: error.message || 'Internal server error'
    });
  }
});