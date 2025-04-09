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
    const body = await readBody<{ agentId: string }>(event);
    const { agentId } = body;

    if (!agentId) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Agent ID is required' 
      });
    }

    // Get API key
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      throw createError({ 
        statusCode: 500, 
        statusMessage: 'Server configuration error: ElevenLabs API Key missing' 
      });
    }

    // Verify permissions
    const supabase = await serverSupabaseClient(event);

    // Check agent assignment
    const { data: agentAssignment, error: agentError } = await supabase
      .from('user_agents')
      .select('agent_id')
      .eq('user_id', user.id)
      .eq('agent_id', agentId)
      .maybeSingle();

    if (agentError) throw agentError;
    
    if (!agentAssignment) {
      throw createError({
        statusCode: 403,
        statusMessage: "Vous n'avez pas accès à cet agent"
      });
    }

    // Get current agent configuration
    const getAgentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      headers: {
        'xi-api-key': elevenLabsApiKey,
      }
    });

    if (!getAgentResponse.ok) {
      throw createError({ 
        statusCode: getAgentResponse.status,
        statusMessage: `Error fetching agent configuration: ${getAgentResponse.statusText}`
      });
    }

    const agentConfig = await getAgentResponse.json();

    // Update agent configuration to remove knowledge base
    const updatedConfig = {
      ...agentConfig,
      conversation_config: {
        ...agentConfig.conversation_config,
        agent: {
          ...agentConfig.conversation_config.agent,
          prompt: {
            ...agentConfig.conversation_config.agent.prompt,
            knowledge_base: [] // Remove all knowledge base assignments
          }
        }
      }
    };

    // Update agent configuration
    const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedConfig)
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      throw createError({ 
        statusCode: updateResponse.status,
        statusMessage: errorData.detail || `Error updating agent: ${updateResponse.statusText}`
      });
    }

    // Remove assignment from database
    const { error: deleteError } = await supabase
      .from('agent_knowledge_base')
      .delete()
      .eq('agent_id', agentId);

    if (deleteError) throw deleteError;

    return { 
      success: true,
      message: 'Base de connaissances dissociée avec succès'
    };

  } catch (error: any) {
    // If it's already a H3 error, throw it as is
    if (error.statusCode) throw error;
    
    // Otherwise, create a new error
    throw createError({ 
      statusCode: error.status || 500,
      statusMessage: error.message || 'Internal server error'
    });
  }
});