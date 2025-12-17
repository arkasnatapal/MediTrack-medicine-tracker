/**
 * Drug Lookup Service
 * Fetches drug indications from external sources with fallback chain
 */

const axios = require('axios');

// Rate limiting configuration
const RATE_LIMITS = {
  openfda: { maxPerMinute: 240, maxPerDay: 120000 },
  rxnorm: { maxPerMinute: 20 },
  webscrape: { maxPerMinute: 5 },
};

// Request tracking for rate limiting
const requestCounts = {
  openfda: { minute: 0, day: 0, lastReset: Date.now(), lastDayReset: Date.now() },
  rxnorm: { minute: 0, lastReset: Date.now() },
  webscrape: { minute: 0, lastReset: Date.now() },
};

// Exponential backoff configuration
const BACKOFF_CONFIG = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxRetries: 3,
};

/**
 * Reset rate limit counters if time window has passed
 */
function resetRateLimits(source) {
  const now = Date.now();
  const counts = requestCounts[source];
  
  if (now - counts.lastReset > 60000) {
    counts.minute = 0;
    counts.lastReset = now;
  }
  
  if (counts.lastDayReset && now - counts.lastDayReset > 86400000) {
    counts.day = 0;
    counts.lastDayReset = now;
  }
}

/**
 * Check if we can make a request to the source
 */
function canMakeRequest(source) {
  resetRateLimits(source);
  const counts = requestCounts[source];
  const limits = RATE_LIMITS[source];
  
  if (counts.minute >= limits.maxPerMinute) return false;
  if (limits.maxPerDay && counts.day >= limits.maxPerDay) return false;
  
  return true;
}

/**
 * Increment request counter
 */
function incrementRequestCount(source) {
  requestCounts[source].minute++;
  if (requestCounts[source].day !== undefined) {
    requestCounts[source].day++;
  }
}

/**
 * Sleep for exponential backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Lookup drug indications from OpenFDA
 * @param {string} drugName - Normalized drug name
 * @returns {Promise<{indications: string[], source: string, confidence: number}>}
 */
async function lookupOpenFDA(drugName) {
  if (!canMakeRequest('openfda')) {
    throw new Error('OpenFDA rate limit exceeded');
  }

  try {
    incrementRequestCount('openfda');
    
    // Search for drug label information
    const response = await axios.get('https://api.fda.gov/drug/label.json', {
      params: {
        search: `openfda.generic_name:"${drugName}" OR openfda.brand_name:"${drugName}"`,
        limit: 1,
      },
      timeout: 10000,
    });

    if (response.data?.results?.[0]) {
      const result = response.data.results[0];
      const indications = [];
      
      // Extract indications from various fields
      if (result.indications_and_usage) {
        indications.push(...result.indications_and_usage);
      }
      if (result.purpose) {
        indications.push(...result.purpose);
      }
      
      if (indications.length > 0) {
        return {
          indications: indications.slice(0, 5), // Limit to top 5
          source: 'openfda',
          confidence: 0.9,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('OpenFDA lookup error:', error.message);
    return null;
  }
}

/**
 * Lookup drug indications from RxNorm/RxClass
 * @param {string} drugName - Normalized drug name
 * @returns {Promise<{indications: string[], source: string, confidence: number}>}
 */
async function lookupRxNorm(drugName) {
  if (!canMakeRequest('rxnorm')) {
    throw new Error('RxNorm rate limit exceeded');
  }

  try {
    incrementRequestCount('rxnorm');
    
    // First, get RxCUI for the drug
    const searchResponse = await axios.get('https://rxnav.nlm.nih.gov/REST/drugs.json', {
      params: { name: drugName },
      timeout: 10000,
    });

    const drugGroup = searchResponse.data?.drugGroup?.conceptGroup?.find(
      g => g.tty === 'IN' || g.tty === 'PIN'
    );
    
    if (!drugGroup?.conceptProperties?.[0]?.rxcui) {
      return null;
    }

    const rxcui = drugGroup.conceptProperties[0].rxcui;
    
    // Get drug classes which can indicate usage
    const classResponse = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json`, {
      params: {
        rxcui,
        relaSource: 'ATC',
      },
      timeout: 10000,
    });

    const classes = classResponse.data?.rxclassDrugInfoList?.rxclassDrugInfo || [];
    const indications = classes
      .map(c => c.rxclassMinConceptItem?.className)
      .filter(Boolean)
      .slice(0, 5);

    if (indications.length > 0) {
      return {
        indications,
        source: 'rxnorm',
        confidence: 0.8,
      };
    }
    
    return null;
  } catch (error) {
    console.error('RxNorm lookup error:', error.message);
    return null;
  }
}

/**
 * Fallback web scraping from Drugs.com (minimal, respects robots.txt)
 * @param {string} drugName - Normalized drug name
 * @returns {Promise<{indications: string[], source: string, confidence: number}>}
 */
async function lookupWebScrape(drugName) {
  if (!canMakeRequest('webscrape')) {
    throw new Error('Web scrape rate limit exceeded');
  }

  try {
    incrementRequestCount('webscrape');
    
    // Search Drugs.com (respecting robots.txt - search is allowed)
    const searchUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(drugName)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'MediTrack-HealthApp/1.0 (Educational Purpose)',
      },
      timeout: 10000,
    });

    // Very basic extraction - look for common indication patterns
    const html = response.data;
    const indicationPatterns = [
      /used to treat ([^<.]+)/gi,
      /treatment of ([^<.]+)/gi,
      /indicated for ([^<.]+)/gi,
    ];

    const indications = new Set();
    indicationPatterns.forEach(pattern => {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && indications.size < 3) {
          indications.add(match[1].trim().substring(0, 100));
        }
      }
    });

    if (indications.size > 0) {
      return {
        indications: Array.from(indications),
        source: 'webscrape',
        confidence: 0.5,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Web scrape error:', error.message);
    return null;
  }
}

/**
 * Main lookup function with fallback chain and exponential backoff
 * @param {string} drugName - Normalized drug name
 * @returns {Promise<{indications: string[], source: string, confidence: number}>}
 */
async function lookupDrugIndications(drugName, retryCount = 0) {
  if (!drugName || typeof drugName !== 'string') {
    return {
      indications: [],
      source: 'heuristic',
      confidence: 0.1,
    };
  }

  const lookupChain = [
    { name: 'openfda', fn: lookupOpenFDA },
    { name: 'rxnorm', fn: lookupRxNorm },
    { name: 'webscrape', fn: lookupWebScrape },
  ];

  for (const lookup of lookupChain) {
    try {
      const result = await lookup.fn(drugName);
      if (result && result.indications.length > 0) {
        console.log(`Successfully looked up ${drugName} via ${lookup.name}`);
        return result;
      }
    } catch (error) {
      console.error(`${lookup.name} failed for ${drugName}:`, error.message);
      
      // Exponential backoff for rate limit errors
      if (error.message.includes('rate limit') && retryCount < BACKOFF_CONFIG.maxRetries) {
        const delay = Math.min(
          BACKOFF_CONFIG.initialDelay * Math.pow(2, retryCount),
          BACKOFF_CONFIG.maxDelay
        );
        console.log(`Backing off for ${delay}ms before retry ${retryCount + 1}`);
        await sleep(delay);
        return lookupDrugIndications(drugName, retryCount + 1);
      }
    }
  }

  // All lookups failed - return empty with low confidence
  console.log(`All lookups failed for ${drugName}, using heuristic fallback`);
  return {
    indications: [],
    source: 'heuristic',
    confidence: 0.1,
  };
}

module.exports = {
  lookupDrugIndications,
  lookupOpenFDA,
  lookupRxNorm,
  lookupWebScrape,
};
