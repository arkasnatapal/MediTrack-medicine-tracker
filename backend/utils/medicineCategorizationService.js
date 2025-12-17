/**
 * Medicine Categorization Service
 * Maps drug indications to medicine categories using heuristic rules
 */

// Category mapping with keywords
const CATEGORY_MAPPINGS = {
  'Pain Relief': {
    keywords: ['pain', 'analgesic', 'ache', 'headache', 'migraine', 'arthritis', 'muscle pain', 'back pain'],
    color: '#ef4444', // red-500
  },
  'Fever': {
    keywords: ['fever', 'pyrexia', 'antipyretic', 'temperature'],
    color: '#f97316', // orange-500
  },
  'Anti-inflammatory': {
    keywords: ['inflammation', 'anti-inflammatory', 'nsaid', 'swelling', 'inflammatory'],
    color: '#8b5cf6', // violet-500
  },
  'Antibiotic': {
    keywords: ['antibiotic', 'antibacterial', 'infection', 'bacterial', 'antimicrobial'],
    color: '#06b6d4', // cyan-500
  },
  'Antiviral': {
    keywords: ['antiviral', 'viral', 'virus', 'influenza', 'flu'],
    color: '#0ea5e9', // sky-500
  },
  'Antifungal': {
    keywords: ['antifungal', 'fungal', 'yeast', 'candida'],
    color: '#14b8a6', // teal-500
  },
  'Digestive Health': {
    keywords: ['digestive', 'stomach', 'gastric', 'indigestion', 'dyspepsia', 'gas', 'bloating', 'acid', 'heartburn', 'gerd', 'ulcer'],
    color: '#10b981', // emerald-500
  },
  'Nausea & Vomiting': {
    keywords: ['nausea', 'vomiting', 'antiemetic', 'motion sickness'],
    color: '#84cc16', // lime-500
  },
  'Allergy': {
    keywords: ['allergy', 'allergic', 'antihistamine', 'hay fever', 'rhinitis', 'urticaria', 'hives'],
    color: '#f59e0b', // amber-500
  },
  'Respiratory': {
    keywords: ['respiratory', 'asthma', 'bronchitis', 'cough', 'cold', 'congestion', 'bronchodilator'],
    color: '#3b82f6', // blue-500
  },
  'Cardiovascular': {
    keywords: ['heart', 'cardiovascular', 'blood pressure', 'hypertension', 'cardiac', 'angina', 'cholesterol'],
    color: '#ec4899', // pink-500
  },
  'Diabetes': {
    keywords: ['diabetes', 'diabetic', 'blood sugar', 'glucose', 'insulin', 'hypoglycemic'],
    color: '#a855f7', // purple-500
  },
  'Mental Health': {
    keywords: ['depression', 'anxiety', 'antidepressant', 'anxiolytic', 'psychiatric', 'mental', 'mood'],
    color: '#6366f1', // indigo-500
  },
  'Vitamins & Supplements': {
    keywords: ['vitamin', 'supplement', 'mineral', 'calcium', 'iron', 'multivitamin', 'nutritional'],
    color: '#22c55e', // green-500
  },
  'Skin Care': {
    keywords: ['skin', 'dermatological', 'topical', 'rash', 'eczema', 'psoriasis', 'acne'],
    color: '#f472b6', // pink-400
  },
  'Eye Care': {
    keywords: ['eye', 'ophthalmic', 'vision', 'glaucoma', 'conjunctivitis'],
    color: '#60a5fa', // blue-400
  },
  'Hormonal': {
    keywords: ['hormone', 'thyroid', 'contraceptive', 'birth control', 'estrogen', 'testosterone'],
    color: '#c084fc', // purple-400
  },
  'Antacid': {
    keywords: ['antacid', 'proton pump inhibitor', 'h2 blocker', 'acid reflux'],
    color: '#34d399', // emerald-400
  },
};

/**
 * Categorize a medicine based on its indications
 * @param {string[]} indications - Array of indication strings
 * @returns {Array<{category: string, confidence: number, color: string}>}
 */
function categorizeMedicine(indications) {
  if (!indications || indications.length === 0) {
    return [{
      category: 'Unsorted',
      confidence: 0.1,
      color: '#6b7280', // gray-500
    }];
  }

  const categoryScores = {};
  const indicationsText = indications.join(' ').toLowerCase();

  // Score each category based on keyword matches
  Object.entries(CATEGORY_MAPPINGS).forEach(([category, config]) => {
    let score = 0;
    let matchCount = 0;

    config.keywords.forEach(keyword => {
      if (indicationsText.includes(keyword.toLowerCase())) {
        score += 1;
        matchCount++;
      }
    });

    if (matchCount > 0) {
      // Normalize score by number of keywords in category
      const normalizedScore = score / config.keywords.length;
      categoryScores[category] = {
        score: normalizedScore,
        matchCount,
        color: config.color,
      };
    }
  });

  // Convert to array and sort by score
  const categories = Object.entries(categoryScores)
    .map(([category, data]) => ({
      category,
      confidence: Math.min(data.score * 0.8 + (data.matchCount * 0.1), 1.0),
      color: data.color,
      matchCount: data.matchCount,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  // Return top 3 categories or Unsorted if none match
  if (categories.length === 0) {
    return [{
      category: 'Unsorted',
      confidence: 0.1,
      color: '#6b7280',
    }];
  }

  // Only return categories with confidence > 0.3
  const filteredCategories = categories.filter(c => c.confidence > 0.3).slice(0, 3);
  
  if (filteredCategories.length === 0) {
    return [{
      category: 'Unsorted',
      confidence: 0.2,
      color: '#6b7280',
    }];
  }

  return filteredCategories;
}

/**
 * Get category color
 * @param {string} categoryName 
 * @returns {string} - Hex color code
 */
function getCategoryColor(categoryName) {
  const mapping = CATEGORY_MAPPINGS[categoryName];
  return mapping ? mapping.color : '#6b7280';
}

/**
 * Get all available categories
 * @returns {Array<{name: string, color: string}>}
 */
function getAllCategories() {
  return Object.entries(CATEGORY_MAPPINGS).map(([name, config]) => ({
    name,
    color: config.color,
    keywords: config.keywords,
  }));
}

module.exports = {
  categorizeMedicine,
  getCategoryColor,
  getAllCategories,
  CATEGORY_MAPPINGS,
};
