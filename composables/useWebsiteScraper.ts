import { load } from 'cheerio';

export interface ExtractedProperty {
  address: string;
  city: string;
  type: 'apartment' | 'house';
  price: number;
  surface: number;
  bedrooms?: number;
  description?: string;
}

export function useWebsiteScraper() {
  const extractRossImmobilierProperty = async (url: string): Promise<ExtractedProperty> => {
    try {
      // Fetch the webpage content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch webpage: ${response.status}`);
      }

      const html = await response.text();
      const $ = load(html);

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
      throw new Error(`Erreur lors de l'extraction des données: ${error.message}`);
    }
  };

  return {
    extractRossImmobilierProperty
  };
}