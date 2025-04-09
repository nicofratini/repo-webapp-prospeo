import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import * as cheerio from "npm:cheerio@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Property {
  address: string;
  city: string;
  type: 'apartment' | 'house';
  price: number;
  surface: number;
  bedrooms?: number;
  description?: string;
}

const extractRossImmobilierProperty = (html: string): Property | null => {
  try {
    const $ = cheerio.load(html);
    
    // Extract price (remove non-numeric characters and convert to number)
    const priceText = $('.price').text().trim();
    const price = parseInt(priceText.replace(/[^\d]/g, ''), 10);
    
    // Extract type from title or description
    const titleText = $('.property-title').text().toLowerCase();
    const type = titleText.includes('appartement') ? 'apartment' : 'house';
    
    // Extract address and city
    const locationText = $('.property-location').text().trim();
    const [address = '', city = 'Nice'] = locationText.split(',').map(s => s.trim());
    
    // Extract surface area
    const surfaceText = $('.property-details').text();
    const surfaceMatch = surfaceText.match(/(\d+(?:[,.]\d+)?)\s*m²/);
    const surface = surfaceMatch ? parseFloat(surfaceMatch[1].replace(',', '.')) : 0;
    
    // Extract number of bedrooms
    const bedroomsMatch = $('.property-details').text().match(/(\d+)\s*chambre/i);
    const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1], 10) : undefined;
    
    // Extract description
    const description = $('.property-description').text().trim();

    if (!price || !surface || !address) {
      throw new Error("Impossible d'extraire toutes les informations requises");
    }

    return {
      address,
      city,
      type,
      price,
      surface,
      bedrooms,
      description: description || undefined
    };
  } catch (error) {
    console.error('Erreur lors de l\'extraction des données:', error);
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non autorisé');
    }

    const supabase = createClient(
      Denv.get('SUPABASE_URL') ?? '',
      Denv.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    const { url } = await req.json();
    
    if (!url || !url.startsWith('https://ross-immobilier.fr')) {
      throw new Error('URL invalide ou non autorisée');
    }

    // Fetch the webpage with custom headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la page: ${response.status}`);
    }

    const html = await response.text();
    const property = extractRossImmobilierProperty(html);

    if (!property) {
      throw new Error('Impossible d\'extraire les informations de la propriété');
    }

    // Save to database
    const { data, error: dbError } = await supabase
      .from('properties')
      .insert([{
        ...property,
        user_id: user.id,
        source: 'url',
        source_url: url
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: error.message === 'Non autorisé' ? 401 : 400
      }
    );
  }
});