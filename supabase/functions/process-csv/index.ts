import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { parse } from 'npm:csv-parse@5.5.5';
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import OpenAI from 'npm:openai@4.29.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CSVProperty {
  address: string;
  city: string;
  type: 'apartment' | 'house';
  price: string;
  surface: string;
  bedrooms?: string;
  description?: string;
}

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

const validateAndEnrichWithLLM = async (properties: CSVProperty[]) => {
  const prompt = `
Validate and enrich these real estate properties. For each property:
1. Verify required fields (address, city, type, price, surface)
2. Standardize the type to either "apartment" or "house"
3. Clean and format the price and surface as numbers
4. Generate a brief description if missing
5. Remove any invalid entries

Input properties:
${JSON.stringify(properties, null, 2)}

Return only valid properties in JSON format.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a real estate data validation expert. Clean and validate property data, ensuring all required fields are present and correctly formatted."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0
  });

  try {
    const response = JSON.parse(completion.choices[0].message.content);
    return response.properties || [];
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    return [];
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    const content = await file.text();

    // Parse CSV
    const records: CSVProperty[] = await new Promise((resolve, reject) => {
      parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true,
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Validate and enrich with LLM
    const validatedProperties = await validateAndEnrichWithLLM(records);

    // Insert properties in batches
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < validatedProperties.length; i += batchSize) {
      const batch = validatedProperties.slice(i, i + batchSize).map(property => ({
        ...property,
        user_id: user.id,
        source: 'csv',
        created_at: new Date(),
        updated_at: new Date()
      }));

      const { data, error } = await supabaseClient
        .from('properties')
        .insert(batch)
        .select();

      if (error) throw error;
      if (data) results.push(...data);
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: results.length,
        total: validatedProperties.length
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message === 'Unauthorized' ? 401 : 400,
      }
    );
  }
});