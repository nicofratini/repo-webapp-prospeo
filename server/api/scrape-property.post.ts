import { defineEventHandler, readBody } from 'h3';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

interface ExtractedProperty {
  address: string;
  city: string;
  type: 'apartment' | 'house';
  price: number;
  surface: number;
  bedrooms?: number;
  description?: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const extractPropertyLinks = async (html: string, baseUrl: string): Promise<string[]> => {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  // Common property link patterns
  const linkSelectors = [
    'a[href*="property"]',
    'a[href*="bien"]',
    'a[href*="annonce"]',
    'a[href*="maison"]',
    'a[href*="appartement"]',
    'a[href*="immobilier"]',
    '.property-card a',
    '.listing-item a',
    '.property-link',
    '.annonce a'
  ];

  // Extract links using selectors
  linkSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          // Convert relative URLs to absolute
          const absoluteUrl = new URL(href, baseUrl).href;
          if (absoluteUrl.startsWith(baseUrl)) {
            links.add(absoluteUrl);
          }
        } catch (error) {
          console.error(`Invalid URL: ${href}`);
        }
      }
    });
  });

  return Array.from(links);
};

const extractPagination = async (html: string, baseUrl: string): Promise<string[]> => {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  // Common pagination selectors
  const paginationSelectors = [
    '.pagination a',
    '.pager a',
    'a[href*="page"]',
    '.pages a',
    'nav[aria-label*="pagination"] a'
  ];

  paginationSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          if (absoluteUrl.startsWith(baseUrl)) {
            links.add(absoluteUrl);
          }
        } catch (error) {
          console.error(`Invalid pagination URL: ${href}`);
        }
      }
    });
  });

  return Array.from(links);
};

const extractPropertyWithAI = async (html: string): Promise<ExtractedProperty> => {
  console.log('-------------------------------------------');
  console.log('[API Scrape DEBUG] Starting AI extraction');
  
  // Pre-process HTML with cheerio to extract relevant text
  const $ = cheerio.load(html);
  
  // Remove unnecessary elements
  $('script').remove();
  $('style').remove();
  $('nav').remove();
  $('footer').remove();
  $('header').remove();
  $('iframe').remove();
  $('noscript').remove();
  
  // Define selectors for different websites
  const selectors = {
    // Main content areas
    mainContent: [
      // Address and location selectors (prioritized)
      'div[class*="location"]',
      'div[class*="address"]',
      'div[class*="adresse"]',
      'span[class*="location"]',
      'span[class*="address"]',
      'span[class*="adresse"]',
      'div[itemprop="address"]',
      'span[itemprop="address"]',
      'div[itemprop="streetAddress"]',
      'span[itemprop="streetAddress"]',
      'div[class*="postal"]',
      'span[class*="postal"]',
      'div[class*="city"]',
      'span[class*="city"]',
      'div[class*="ville"]',
      'span[class*="ville"]',
      
      // Bedroom selectors
      'div[class*="chambre"]',
      'span[class*="chambre"]',
      'div[class*="bedroom"]',
      'span[class*="bedroom"]',
      'li[class*="chambre"]',
      'li[class*="bedroom"]',
      
      // Generic content selectors
      'div[class*="description"]',
      'div[class*="details"]',
      'div[class*="features"]',
      'div[class*="property"]',
      'div[class*="bien"]',
      'div[class*="annonce"]',
      
      // Price selectors
      'div[class*="price"]',
      'div[class*="prix"]',
      'span[class*="price"]',
      'span[class*="prix"]',
      
      // Surface selectors
      'div[class*="surface"]',
      'div[class*="area"]',
      'span[class*="surface"]',
      'span[class*="area"]',
      
      // Features selectors
      'div[class*="features"]',
      'div[class*="amenities"]',
      'div[class*="caracteristiques"]',
      'ul[class*="features"]',
      'ul[class*="amenities"]',
      'ul[class*="caracteristiques"]'
    ],
    // Specific content areas to exclude
    exclude: [
      'div[class*="similar"]',
      'div[class*="related"]',
      'div[class*="suggestion"]',
      'div[class*="footer"]',
      'div[class*="header"]',
      'div[class*="menu"]',
      'div[class*="nav"]'
    ]
  };

  // Remove excluded content first
  selectors.exclude.forEach(selector => {
    $(selector).remove();
  });

  // Extract text from each selector and combine
  let combinedText = '';
  selectors.mainContent.forEach(selector => {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        combinedText += text + ' ';
      }
    });
  });

  // Clean up the combined text
  const cleanText = combinedText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\t+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim()
    .slice(0, 4000);

  console.log('[API Scrape DEBUG] Cleaned text length:', cleanText.length);
  console.log('[API Scrape DEBUG] First 200 chars of cleaned text:', cleanText.substring(0, 200));

  // If no text was extracted, try a more aggressive approach
  if (cleanText.length < 100) {
    console.log('[API Scrape DEBUG] Initial extraction yielded insufficient text, trying backup method');
    
    const bodyText = $('body')
      .clone()
      .children('script, style, nav, footer, header, iframe, noscript')
      .remove()
      .end()
      .text();

    const backupCleanText = bodyText
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);

    if (backupCleanText.length > cleanText.length) {
      console.log('[API Scrape DEBUG] Using backup text extraction');
      cleanText = backupCleanText;
    }
  }

  const prompt = `
Analyze this real estate listing text and extract the following information in JSON format.

CRITICAL EXTRACTION RULES:

1. ADDRESS AND LOCATION:
   - Address must be a complete street address WITHOUT postal code or city name
   - Look for patterns like "rue", "avenue", "boulevard", "chemin", etc.
   - Remove any postal codes (5 digits)
   - Remove the city name from the address
   - City should be ONLY the city name, no postal codes or extra text

2. BEDROOMS:
   - Look for mentions of "chambre(s)", "pièce(s)", "bedroom(s)"
   - Extract ONLY the numeric value
   - Common patterns:
     * "3 chambres"
     * "T3" (subtract 1 from the number for bedrooms)
     * "F4" (subtract 1 from the number for bedrooms)
     * "4 pièces" (subtract 1 from the number for bedrooms)
   - If found in multiple formats, use the most explicit mention
   - Only include if you're confident about the number

3. OTHER REQUIRED FIELDS:
   - Type: must be exactly "apartment" or "house"
   - Price: number in euros (no currency symbol)
   - Surface: number in square meters (just the number)
   - Description: detailed property description in French

Format the response as:
{
  "address": "complete street address (NO postal code or city)",
  "city": "city name only",
  "type": "apartment" or "house",
  "price": number,
  "surface": number,
  "bedrooms": number or null,
  "description": "detailed description"
}

Text to analyze:
${cleanText}

IMPORTANT:
- Address must NOT include the city name or postal code
- City must be ONLY the city name
- Bedrooms must be a number or null
- All numbers (price, surface, bedrooms) must be actual numbers, not strings
`;

  try {
    console.log('[API Scrape DEBUG] Calling OpenAI API with model: gpt-4');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a French real estate data extraction expert. Extract property information from text and format it as JSON.
Pay special attention to:
1. Correctly separating address from city name
2. Identifying the number of bedrooms from various French real estate formats
3. Maintaining clean, separate fields without overlapping information
4. Using proper French real estate terminology
Only include fields where you're confident about the extracted information.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1 // Reduced for more precise extraction
    });

    const content = completion.choices[0].message.content;
    console.log('[API Scrape DEBUG] Raw OpenAI response:');
    console.log(content);
    console.log('-------------------------------------------');

    // Extract JSON from response
    console.log('[API Scrape DEBUG] Attempting to find JSON in response');
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('[API Scrape DEBUG] No JSON pattern found in response');
      throw new Error("No valid JSON found in the response");
    }

    console.log('[API Scrape DEBUG] Found JSON pattern, attempting to parse');
    console.log('[API Scrape DEBUG] JSON string to parse:', jsonMatch[0]);
    
    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
      console.log('[API Scrape DEBUG] Successfully parsed JSON:', result);
    } catch (parseError) {
      console.error('[API Scrape DEBUG] JSON parsing failed:', parseError);
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
    
    // Validate required fields
    console.log('[API Scrape DEBUG] Validating required fields');
    const validationErrors = [];
    
    if (!result.address) validationErrors.push("Address not found");
    if (!result.city) validationErrors.push("City not found");
    if (!result.type || !['apartment', 'house'].includes(result.type)) validationErrors.push("Invalid property type");
    if (!result.price || typeof result.price !== 'number') validationErrors.push("Invalid or missing price");
    if (!result.surface || typeof result.surface !== 'number') validationErrors.push("Invalid or missing surface area");

    if (validationErrors.length > 0) {
      console.error('[API Scrape DEBUG] Validation errors:', validationErrors);
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Clean up address and city
    result.address = result.address
      .replace(/\b\d{5}\b/g, '') // Remove postal codes
      .replace(new RegExp(`\\b${result.city}\\b`, 'i'), '') // Remove city name if present in address
      .replace(/\s+/g, ' ') // Clean up spaces
      .trim();
    
    result.city = result.city
      .replace(/\b\d{5}\b/g, '') // Remove postal codes
      .replace(/\s+/g, ' ') // Clean up spaces
      .trim();

    // Validate and clean up bedrooms
    if (result.bedrooms !== undefined && result.bedrooms !== null) {
      result.bedrooms = Math.floor(result.bedrooms); // Ensure it's an integer
      if (isNaN(result.bedrooms) || result.bedrooms < 0) {
        result.bedrooms = undefined;
      }
    }

    console.log('[API Scrape DEBUG] Final cleaned result:', result);
    return result;
  } catch (error) {
    console.error('[API Scrape DEBUG] Error in AI extraction:', error);
    throw new Error(`Failed to extract property data: ${error.message}`);
  }
};

export default defineEventHandler(async (event) => {
  console.log('-------------------------------------------');
  console.log('[API Scrape DEBUG] Received new scraping request');
  
  try {
    const body = await readBody(event);
    const { url, mode = 'single' } = body;

    if (!url || typeof url !== 'string') {
      throw new Error('URL is required');
    }

    console.log(`[API Scrape DEBUG] Starting ${mode} mode extraction for:`, url);

    // Function to fetch and process a single URL
    const processUrl = async (targetUrl: string) => {
      const response = await fetch(targetUrl, {
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
      return await extractPropertyWithAI(html);
    };

    // Single property extraction
    if (mode === 'single') {
      const property = await processUrl(url);
      return { 
        success: true, 
        data: property 
      };
    }
    
    // Bulk extraction from listing page
    if (mode === 'bulk') {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch listing page: ${response.status}`);
      }

      const html = await response.text();
      
      // Extract property links from the current page
      const propertyLinks = await extractPropertyLinks(html, url);
      console.log('[API Scrape DEBUG] Found property links:', propertyLinks);

      // Extract pagination links
      const paginationLinks = await extractPagination(html, url);
      console.log('[API Scrape DEBUG] Found pagination links:', paginationLinks);

      // Process pagination pages to get more property links
      const allPropertyLinks = new Set(propertyLinks);
      
      for (const pageUrl of paginationLinks) {
        try {
          const pageResponse = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache'
            }
          });

          if (pageResponse.ok) {
            const pageHtml = await pageResponse.text();
            const pageLinks = await extractPropertyLinks(pageHtml, url);
            pageLinks.forEach(link => allPropertyLinks.add(link));
          }
        } catch (error) {
          console.error(`Error processing pagination page ${pageUrl}:`, error);
        }
      }

      // Process each property link
      const properties = [];
      const errors = [];

      for (const propertyUrl of allPropertyLinks) {
        try {
          const property = await processUrl(propertyUrl);
          properties.push({
            ...property,
            source_url: propertyUrl
          });
        } catch (error) {
          console.error(`Error processing property ${propertyUrl}:`, error);
          errors.push({
            url: propertyUrl,
            error: error.message
          });
        }
      }

      return {
        success: true,
        data: {
          properties,
          errors,
          total: allPropertyLinks.size,
          processed: properties.length,
          failed: errors.length
        }
      };
    }

    throw new Error('Invalid mode specified');
  } catch (error) {
    console.error('[API Scrape DEBUG] Error processing request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred"
    };
  } finally {
    console.log('[API Scrape DEBUG] Request processing completed');
    console.log('-------------------------------------------');
  }
});