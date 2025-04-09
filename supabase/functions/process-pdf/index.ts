import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import { PDFExtract } from 'npm:pdf.js-extract@0.2.1';
import OpenAI from 'npm:openai@4.29.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ExtractedProperty {
  address: string;
  city: string;
  type: 'apartment' | 'house';
  price: number;
  surface: number;
  bedrooms?: number;
  description?: string;
}

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

const extractPropertiesWithLLM = async (text: string): Promise<ExtractedProperty[]> => {
  const prompt = `
Extract real estate properties from the following text. For each property, provide:
- address (required)
- city (required)
- type (either "apartment" or "house", required)
- price (number in euros, required)
- surface (number in square meters, required)
- bedrooms (number, optional)
- description (text, optional)

Format the output as a JSON array of properties.

Text to analyze:
${text}

Example output format:
[{
  "address": "123 rue de Paris",
  "city": "Paris",
  "type": "apartment",
  "price": 250000,
  "surface": 65,
  "bedrooms": 2,
  "description": "Bel appartement lumineux"
}]
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a real estate data extraction expert. Extract property information from text and format it as JSON. Only include properties where you can identify the required fields (address, city, type, price, surface). Skip incomplete entries."
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

    const arrayBuffer = await file.arrayBuffer();
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extractBuffer(Buffer.from(arrayBuffer));

    // Combine all text from the PDF
    const fullText = data.pages.map(page => 
      page.content.map(item => item.str).join(' ')
    ).join('\n\n');

    // Use LLM to extract properties
    const properties = await extractPropertiesWithLLM(fullText);

    // Insert properties
    const results = [];
    const batchSize = 100;

    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize).map(property => ({
        ...property,
        user_id: user.id,
        source: 'pdf',
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
        total: properties.length
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