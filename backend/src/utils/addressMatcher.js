const pool = require('../db/config');

/**
 * Address normalization and fuzzy matching utilities
 * Handles typos, variations, and common address issues
 */

// Common Philippine city/municipality variations and corrections
const CITY_VARIATIONS = {
  // Metro Manila variations
  'manila': ['manila city', 'city of manila', 'manila'],
  'quezon city': ['qc', 'quezon city', 'quezon'],
  'makati city': ['makati', 'makati city'],
  'taguig city': ['taguig', 'taguig city'],
  'pasig city': ['pasig', 'pasig city'],
  'mandaluyong city': ['mandaluyong', 'mandaluyong city'],
  'san juan city': ['san juan', 'san juan city'],
  'marikina city': ['marikina', 'marikina city'],
  'pasay city': ['pasay', 'pasay city'],
  'paranaque city': ['paranaque', 'paranaque city', 'parañaque'],
  'las pinas city': ['las pinas', 'las piñas', 'las pinas city'],
  'muntinlupa city': ['muntinlupa', 'muntinlupa city'],
  'caloocan city': ['caloocan', 'caloocan city'],
  'malabon city': ['malabon', 'malabon city'],
  'navotas city': ['navotas', 'navotas city'],
  'valenzuela city': ['valenzuela', 'valenzuela city'],
  
  // Cebu variations
  'cebu city': ['cebu', 'cebu city'],
  'lapu-lapu city': ['lapu-lapu', 'lapu lapu', 'lapulapu', 'lapu-lapu city'],
  'mandaue city': ['mandaue', 'mandaue city'],
  'talamban': ['talamban', 'talamban cebu'],
  
  // Davao variations
  'davao city': ['davao', 'davao city'],
  'tagum city': ['tagum', 'tagum city'],
  
  // Other major cities
  'iloilo city': ['iloilo', 'iloilo city'],
  'bacolod city': ['bacolod', 'bacolod city'],
  'cagayan de oro city': ['cagayan de oro', 'cdo', 'cagayan de oro city'],
  'zamboanga city': ['zamboanga', 'zamboanga city'],
  'general santos city': ['general santos', 'gensan', 'general santos city'],
  'butuan city': ['butuan', 'butuan city'],
  'cotabato city': ['cotabato', 'cotabato city'],
  'dipolog city': ['dipolog', 'dipolog city'],
  'pagadian city': ['pagadian', 'pagadian city'],
  'tacloban city': ['tacloban', 'tacloban city'],
  'calbayog city': ['calbayog', 'calbayog city'],
  'ormoc city': ['ormoc', 'ormoc city'],
  'baybay city': ['baybay', 'baybay city'],
  'maasin city': ['maasin', 'maasin city'],
  'catbalogan city': ['catbalogan', 'catbalogan city'],
  'borongan city': ['borongan', 'borongan city'],
  'calapan city': ['calapan', 'calapan city'],
  'san jose city': ['san jose', 'san jose city'],
  'antipolo city': ['antipolo', 'antipolo city'],
  'calamba city': ['calamba', 'calamba city'],
  'san pablo city': ['san pablo', 'san pablo city'],
  'lipa city': ['lipa', 'lipa city'],
  'batangas city': ['batangas', 'batangas city'],
  'tanauan city': ['tanauan', 'tanauan city'],
  'santa rosa city': ['santa rosa', 'santa rosa city'],
  'biñan city': ['biñan', 'binan', 'biñan city'],
  'cabuyao city': ['cabuyao', 'cabuyao city'],
  'san pedro city': ['san pedro', 'san pedro city'],
  'los baños': ['los banos', 'los baños'],
  'calauag': ['calauag', 'calauag quezon'],
  'lucena city': ['lucena', 'lucena city'],
  'tayabas city': ['tayabas', 'tayabas city'],
  'sariaya': ['sariaya', 'sariaya quezon'],
  'candelaria': ['candelaria', 'candelaria quezon'],
  'tiaong': ['tiaong', 'tiaong quezon'],
  'dolores': ['dolores', 'dolores quezon'],
  'gumaca': ['gumaca', 'gumaca quezon'],
  'atimonan': ['atimonan', 'atimonan quezon'],
  'mauban': ['mauban', 'mauban quezon'],
  'real': ['real', 'real quezon'],
  'infanta': ['infanta', 'infanta quezon'],
  'general nakar': ['general nakar', 'general nakar quezon'],
  'polillo': ['polillo', 'polillo quezon'],
  'panukulan': ['panukulan', 'panukulan quezon'],
  'patnanungan': ['patnanungan', 'patnanungan quezon'],
  'jomalig': ['jomalig', 'jomalig quezon'],
  'burdeos': ['burdeos', 'burdeos quezon'],
  'alabat': ['alabat', 'alabat quezon'],
  'quezon': ['quezon', 'quezon province'],
  'aurora': ['aurora', 'aurora province'],
  'bataan': ['bataan', 'bataan province'],
  'bulacan': ['bulacan', 'bulacan province'],
  'nueva ecija': ['nueva ecija', 'nueva ecija province'],
  'pampanga': ['pampanga', 'pampanga province'],
  'tarlac': ['tarlac', 'tarlac province'],
  'zambales': ['zambales', 'zambales province'],
  'batanes': ['batanes', 'batanes province'],
  'cagayan': ['cagayan', 'cagayan province'],
  'isabela': ['isabela', 'isabela province'],
  'nueva vizcaya': ['nueva vizcaya', 'nueva vizcaya province'],
  'quirino': ['quirino', 'quirino province'],
  'ilocos norte': ['ilocos norte', 'ilocos norte province'],
  'ilocos sur': ['ilocos sur', 'ilocos sur province'],
  'la union': ['la union', 'la union province'],
  'pangasinan': ['pangasinan', 'pangasinan province'],
  'abra': ['abra', 'abra province'],
  'benguet': ['benguet', 'benguet province'],
  'ifugao': ['ifugao', 'ifugao province'],
  'kalinga': ['kalinga', 'kalinga province'],
  'mountain province': ['mountain province', 'mountain province province'],
  'apayao': ['apayao', 'apayao province'],
  'albay': ['albay', 'albay province'],
  'camarines norte': ['camarines norte', 'camarines norte province'],
  'camarines sur': ['camarines sur', 'camarines sur province'],
  'catanduanes': ['catanduanes', 'catanduanes province'],
  'masbate': ['masbate', 'masbate province'],
  'sorsogon': ['sorsogon', 'sorsogon province'],
  'aklan': ['aklan', 'aklan province'],
  'antique': ['antique', 'antique province'],
  'capiz': ['capiz', 'capiz province'],
  'guimaras': ['guimaras', 'guimaras province'],
  'negros occidental': ['negros occidental', 'negros occidental province'],
  'negros oriental': ['negros oriental', 'negros oriental province'],
  'bohol': ['bohol', 'bohol province'],
  'siquijor': ['siquijor', 'siquijor province'],
  'biliran': ['biliran', 'biliran province'],
  'eastern samar': ['eastern samar', 'eastern samar province'],
  'leyte': ['leyte', 'leyte province'],
  'northern samar': ['northern samar', 'northern samar province'],
  'samar': ['samar', 'samar province'],
  'southern leyte': ['southern leyte', 'southern leyte province'],
  'western samar': ['western samar', 'western samar province'],
  'agusan del norte': ['agusan del norte', 'agusan del norte province'],
  'agusan del sur': ['agusan del sur', 'agusan del sur province'],
  'surigao del norte': ['surigao del norte', 'surigao del norte province'],
  'surigao del sur': ['surigao del sur', 'surigao del sur province'],
  'dinagat islands': ['dinagat islands', 'dinagat islands province'],
  'bukidnon': ['bukidnon', 'bukidnon province'],
  'camiguin': ['camiguin', 'camiguin province'],
  'lanao del norte': ['lanao del norte', 'lanao del norte province'],
  'misamis occidental': ['misamis occidental', 'misamis occidental province'],
  'misamis oriental': ['misamis oriental', 'misamis oriental province'],
  'basilan': ['basilan', 'basilan province'],
  'lanao del sur': ['lanao del sur', 'lanao del sur province'],
  'maguindanao': ['maguindanao', 'maguindanao province'],
  'sulu': ['sulu', 'sulu province'],
  'tawi-tawi': ['tawi-tawi', 'tawi-tawi province'],
  'cotabato': ['cotabato', 'cotabato province'],
  'south cotabato': ['south cotabato', 'south cotabato province'],
  'sultan kudarat': ['sultan kudarat', 'sultan kudarat province'],
  'sarangani': ['sarangani', 'sarangani province'],
  'north cotabato': ['north cotabato', 'north cotabato province'],
  'compostela valley': ['compostela valley', 'compostela valley province'],
  'davao del norte': ['davao del norte', 'davao del norte province'],
  'davao del sur': ['davao del sur', 'davao del sur province'],
  'davao occidental': ['davao occidental', 'davao occidental province'],
  'davao oriental': ['davao oriental', 'davao oriental province']
};

// Province variations
const PROVINCE_VARIATIONS = {
  'metro manila': ['metro manila', 'ncr', 'national capital region', 'manila'],
  'cebu': ['cebu', 'cebu province'],
  'davao del sur': ['davao del sur', 'davao del sur province'],
  'laguna': ['laguna', 'laguna province'],
  'cavite': ['cavite', 'cavite province'],
  'rizal': ['rizal', 'rizal province'],
  'batangas': ['batangas', 'batangas province'],
  'quezon': ['quezon', 'quezon province'],
  'aurora': ['aurora', 'aurora province'],
  'bataan': ['bataan', 'bataan province'],
  'bulacan': ['bulacan', 'bulacan province'],
  'nueva ecija': ['nueva ecija', 'nueva ecija province'],
  'pampanga': ['pampanga', 'pampanga province'],
  'tarlac': ['tarlac', 'tarlac province'],
  'zambales': ['zambales', 'zambales province'],
  'batanes': ['batanes', 'batanes province'],
  'cagayan': ['cagayan', 'cagayan province'],
  'isabela': ['isabela', 'isabela province'],
  'nueva vizcaya': ['nueva vizcaya', 'nueva vizcaya province'],
  'quirino': ['quirino', 'quirino province'],
  'ilocos norte': ['ilocos norte', 'ilocos norte province'],
  'ilocos sur': ['ilocos sur', 'ilocos sur province'],
  'la union': ['la union', 'la union province'],
  'pangasinan': ['pangasinan', 'pangasinan province'],
  'abra': ['abra', 'abra province'],
  'benguet': ['benguet', 'benguet province'],
  'ifugao': ['ifugao', 'ifugao province'],
  'kalinga': ['kalinga', 'kalinga province'],
  'mountain province': ['mountain province', 'mountain province province'],
  'apayao': ['apayao', 'apayao province'],
  'albay': ['albay', 'albay province'],
  'camarines norte': ['camarines norte', 'camarines norte province'],
  'camarines sur': ['camarines sur', 'camarines sur province'],
  'catanduanes': ['catanduanes', 'catanduanes province'],
  'masbate': ['masbate', 'masbate province'],
  'sorsogon': ['sorsogon', 'sorsogon province'],
  'aklan': ['aklan', 'aklan province'],
  'antique': ['antique', 'antique province'],
  'capiz': ['capiz', 'capiz province'],
  'guimaras': ['guimaras', 'guimaras province'],
  'negros occidental': ['negros occidental', 'negros occidental province'],
  'negros oriental': ['negros oriental', 'negros oriental province'],
  'bohol': ['bohol', 'bohol province'],
  'siquijor': ['siquijor', 'siquijor province'],
  'biliran': ['biliran', 'biliran province'],
  'eastern samar': ['eastern samar', 'eastern samar province'],
  'leyte': ['leyte', 'leyte province'],
  'northern samar': ['northern samar', 'northern samar province'],
  'samar': ['samar', 'samar province'],
  'southern leyte': ['southern leyte', 'southern leyte province'],
  'western samar': ['western samar', 'western samar province'],
  'agusan del norte': ['agusan del norte', 'agusan del norte province'],
  'agusan del sur': ['agusan del sur', 'agusan del sur province'],
  'surigao del norte': ['surigao del norte', 'surigao del norte province'],
  'surigao del sur': ['surigao del sur', 'surigao del sur province'],
  'dinagat islands': ['dinagat islands', 'dinagat islands province'],
  'bukidnon': ['bukidnon', 'bukidnon province'],
  'camiguin': ['camiguin', 'camiguin province'],
  'lanao del norte': ['lanao del norte', 'lanao del norte province'],
  'misamis occidental': ['misamis occidental', 'misamis occidental province'],
  'misamis oriental': ['misamis oriental', 'misamis oriental province'],
  'basilan': ['basilan', 'basilan province'],
  'lanao del sur': ['lanao del sur', 'lanao del sur province'],
  'maguindanao': ['maguindanao', 'maguindanao province'],
  'sulu': ['sulu', 'sulu province'],
  'tawi-tawi': ['tawi-tawi', 'tawi-tawi province'],
  'cotabato': ['cotabato', 'cotabato province'],
  'south cotabato': ['south cotabato', 'south cotabato province'],
  'sultan kudarat': ['sultan kudarat', 'sultan kudarat province'],
  'sarangani': ['sarangani', 'sarangani province'],
  'north cotabato': ['north cotabato', 'north cotabato province'],
  'compostela valley': ['compostela valley', 'compostela valley province'],
  'davao del norte': ['davao del norte', 'davao del norte province'],
  'davao del sur': ['davao del sur', 'davao del sur province'],
  'davao occidental': ['davao occidental', 'davao occidental province'],
  'davao oriental': ['davao oriental', 'davao oriental province']
};

/**
 * Normalize address text by removing extra spaces, converting to lowercase, and handling common variations
 */
function normalizeAddress(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\b(city|municipality|province)\b/g, '') // Remove common suffixes
    .trim();
}

/**
 * Find the best match for a city from the variations dictionary
 */
function findCityMatch(inputCity) {
  const normalizedInput = normalizeAddress(inputCity);
  
  // Direct match first
  for (const [standardCity, variations] of Object.entries(CITY_VARIATIONS)) {
    if (variations.includes(normalizedInput)) {
      return standardCity;
    }
  }
  
  // Fuzzy match using Levenshtein distance
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [standardCity, variations] of Object.entries(CITY_VARIATIONS)) {
    for (const variation of variations) {
      const similarity = calculateSimilarity(normalizedInput, variation);
      if (similarity > bestScore && similarity > 0.7) { // 70% similarity threshold
        bestScore = similarity;
        bestMatch = standardCity;
      }
    }
  }
  
  return bestMatch;
}

/**
 * Find the best match for a province from the variations dictionary
 */
function findProvinceMatch(inputProvince) {
  const normalizedInput = normalizeAddress(inputProvince);
  
  // Direct match first
  for (const [standardProvince, variations] of Object.entries(PROVINCE_VARIATIONS)) {
    if (variations.includes(normalizedInput)) {
      return standardProvince;
    }
  }
  
  // Fuzzy match using Levenshtein distance
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [standardProvince, variations] of Object.entries(PROVINCE_VARIATIONS)) {
    for (const variation of variations) {
      const similarity = calculateSimilarity(normalizedInput, variation);
      if (similarity > bestScore && similarity > 0.7) { // 70% similarity threshold
        bestScore = similarity;
        bestMatch = standardProvince;
      }
    }
  }
  
  return bestMatch;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Get delivery price with fuzzy matching for vendor and location
 */
async function getDeliveryPriceWithFuzzyMatching(vendorId, inputCity, inputProvince) {
  try {
    // First try exact match
    const [exactMatch] = await pool.query(`
      SELECT delivery_price, city, province
      FROM vendor_delivery_pricing
      WHERE vendor_id = ? 
        AND city = ? 
        AND province = ? 
        AND is_active = 1
    `, [vendorId, inputCity, inputProvince]);
    
    if (exactMatch.length > 0) {
      return {
        success: true,
        delivery_price: parseFloat(exactMatch[0].delivery_price),
        match_type: 'exact',
        matched_location: {
          city: exactMatch[0].city,
          province: exactMatch[0].province
        },
        original_input: {
          city: inputCity,
          province: inputProvince
        }
      };
    }
    
    // Try fuzzy matching
    const matchedCity = findCityMatch(inputCity);
    const matchedProvince = findProvinceMatch(inputProvince);
    
    if (matchedCity && matchedProvince) {
      const [fuzzyMatch] = await pool.query(`
        SELECT delivery_price, city, province
        FROM vendor_delivery_pricing
        WHERE vendor_id = ? 
          AND city = ? 
          AND province = ? 
          AND is_active = 1
      `, [vendorId, matchedCity, matchedProvince]);
      
      if (fuzzyMatch.length > 0) {
        return {
          success: true,
          delivery_price: parseFloat(fuzzyMatch[0].delivery_price),
          match_type: 'fuzzy',
          matched_location: {
            city: fuzzyMatch[0].city,
            province: fuzzyMatch[0].province
          },
          original_input: {
            city: inputCity,
            province: inputProvince
          },
          suggestions: {
            city: matchedCity,
            province: matchedProvince
          }
        };
      }
    }
    
    // No match found - return suggestions
    const suggestions = [];
    if (!matchedCity) {
      suggestions.push(`City "${inputCity}" not recognized. Did you mean: ${getCitySuggestions(inputCity)}`);
    }
    if (!matchedProvince) {
      suggestions.push(`Province "${inputProvince}" not recognized. Did you mean: ${getProvinceSuggestions(inputProvince)}`);
    }
    
    return {
      success: false,
      delivery_price: 0,
      match_type: 'none',
      original_input: {
        city: inputCity,
        province: inputProvince
      },
      suggestions: suggestions,
      message: 'Delivery not available to this location'
    };
    
  } catch (error) {
    console.error('Error in fuzzy delivery matching:', error);
    return {
      success: false,
      delivery_price: 0,
      error: 'Failed to check delivery availability'
    };
  }
}

/**
 * Get suggestions for unrecognized city
 */
function getCitySuggestions(inputCity) {
  const normalizedInput = normalizeAddress(inputCity);
  const suggestions = [];
  
  for (const [standardCity, variations] of Object.entries(CITY_VARIATIONS)) {
    for (const variation of variations) {
      const similarity = calculateSimilarity(normalizedInput, variation);
      if (similarity > 0.5) { // 50% similarity threshold for suggestions
        suggestions.push(standardCity);
        break;
      }
    }
  }
  
  return suggestions.slice(0, 3).join(', ') || 'a nearby city';
}

/**
 * Get suggestions for unrecognized province
 */
function getProvinceSuggestions(inputProvince) {
  const normalizedInput = normalizeAddress(inputProvince);
  const suggestions = [];
  
  for (const [standardProvince, variations] of Object.entries(PROVINCE_VARIATIONS)) {
    for (const variation of variations) {
      const similarity = calculateSimilarity(normalizedInput, variation);
      if (similarity > 0.5) { // 50% similarity threshold for suggestions
        suggestions.push(standardProvince);
        break;
      }
    }
  }
  
  return suggestions.slice(0, 3).join(', ') || 'a nearby province';
}

/**
 * Validate and suggest corrections for address
 */
function validateAndSuggestAddress(city, province) {
  const matchedCity = findCityMatch(city);
  const matchedProvince = findProvinceMatch(province);
  
  const result = {
    original: { city, province },
    corrected: { city: matchedCity, province: matchedProvince },
    has_corrections: !!(matchedCity || matchedProvince),
    suggestions: []
  };
  
  if (!matchedCity) {
    result.suggestions.push({
      field: 'city',
      message: `City "${city}" not recognized`,
      suggestions: getCitySuggestions(city)
    });
  }
  
  if (!matchedProvince) {
    result.suggestions.push({
      field: 'province',
      message: `Province "${province}" not recognized`,
      suggestions: getProvinceSuggestions(province)
    });
  }
  
  return result;
}

module.exports = {
  normalizeAddress,
  findCityMatch,
  findProvinceMatch,
  calculateSimilarity,
  getDeliveryPriceWithFuzzyMatching,
  validateAndSuggestAddress,
  CITY_VARIATIONS,
  PROVINCE_VARIATIONS
};
