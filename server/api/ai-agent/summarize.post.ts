import { defineEventHandler, readBody, createError } from 'h3';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default defineEventHandler(async (event) => {
  try {
    const { messages } = await readBody(event);

    if (!messages || !Array.isArray(messages)) {
      throw createError({
        statusCode: 400,
        message: 'Messages array is required'
      });
    }

    // Convert conversation to text format
    const conversationText = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.message}`)
      .join('\n');

    // Make API call with explicit JSON request in the prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Vous êtes un expert en analyse de conversations immobilières.
          
Analysez la conversation suivante entre un agent IA et un client.

IMPORTANT: Répondez UNIQUEMENT avec un objet JSON valide qui suit EXACTEMENT ce format, sans texte supplémentaire :

{
  "keyPoints": ["point 1", "point 2", "point 3"],
  "searchCriteria": {
    "type": "apartment" ou "house" ou null,
    "location": "ville ou quartier recherché" ou null,
    "budget": {
      "min": nombre ou null,
      "max": nombre ou null
    },
    "surface": {
      "min": nombre ou null,
      "max": nombre ou null
    },
    "bedrooms": nombre ou null,
    "keywords": ["mot-clé 1", "mot-clé 2"]
  },
  "appointment": {
    "scheduled": true ou false,
    "date": "YYYY-MM-DD" ou null,
    "time": "HH:mm" ou null,
    "location": "lieu du rendez-vous" ou null
  },
  "outcome": "résultat de la conversation",
  "nextSteps": "prochaines étapes à suivre"
}

Assurez-vous que :
1. Les points clés (3-5 points) capturent les informations essentielles
2. Les critères de recherche reflètent les préférences exprimées par le client
3. Les informations de rendez-vous sont précises si un RDV a été fixé
4. Le résultat résume clairement l'issue de la conversation
5. Les prochaines étapes indiquent les actions concrètes à suivre`
        },
        {
          role: "user",
          content: conversationText
        }
      ],
      temperature: 0.3
    });

    // Get response text
    const responseText = completion.choices[0].message.content;
    console.log('[API Summary] Raw response:', responseText);

    // Try to parse JSON from response
    let summary;
    try {
      // Find JSON object in response using regex
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[API Summary] No JSON found in response');
        throw new Error('Invalid response format');
      }

      summary = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!summary.keyPoints || !Array.isArray(summary.keyPoints) || 
          !summary.outcome || typeof summary.outcome !== 'string' ||
          !summary.nextSteps || typeof summary.nextSteps !== 'string' ||
          !summary.searchCriteria || typeof summary.searchCriteria !== 'object' ||
          !summary.appointment || typeof summary.appointment !== 'object' ||
          typeof summary.appointment.scheduled !== 'boolean') {
        throw new Error('Missing or invalid fields in response');
      }

      // Clean up search criteria
      if (summary.searchCriteria.keywords && !Array.isArray(summary.searchCriteria.keywords)) {
        summary.searchCriteria.keywords = [];
      }

      // Validate appointment date format if present
      if (summary.appointment.date && !/^\d{4}-\d{2}-\d{2}$/.test(summary.appointment.date)) {
        summary.appointment.date = null;
      }

      // Validate appointment time format if present
      if (summary.appointment.time && !/^\d{2}:\d{2}$/.test(summary.appointment.time)) {
        summary.appointment.time = null;
      }
    } catch (parseError) {
      console.error('[API Summary] JSON parsing error:', parseError);
      throw new Error('Failed to parse summary from response');
    }

    return {
      success: true,
      summary
    };
  } catch (error: any) {
    console.error('[API Summary] Error:', error);
    
    throw createError({
      statusCode: error.status || 500,
      message: error.message || "Une erreur s'est produite lors de la génération du résumé"
    });
  }
});