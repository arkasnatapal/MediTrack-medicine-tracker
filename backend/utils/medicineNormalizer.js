/**
 * Medicine Name Normalizer
 * Normalizes medicine names by removing dosage info, punctuation, and handling synonyms
 */

// Common medicine synonyms mapping
const MEDICINE_SYNONYMS = {
  'paracetamol': ['acetaminophen', 'tylenol', 'pan', 'p'],
  'ibuprofen': ['advil', 'motrin', 'brufen'],
  'aspirin': ['acetylsalicylic acid', 'asa'],
  'amoxicillin': ['amoxil', 'trimox'],
  'metformin': ['glucophage'],
  'omeprazole': ['prilosec'],
  'atorvastatin': ['lipitor'],
  'simvastatin': ['zocor'],
  'lisinopril': ['prinivil', 'zestril'],
  'amlodipine': ['norvasc'],
  'cetirizine': ['zyrtec'],
  'loratadine': ['claritin'],
  'ranitidine': ['zantac'],
  'diclofenac': ['voltaren'],
  'cefixime': ['suprax'],
  'azithromycin': ['zithromax', 'azee'],
  'ciprofloxacin': ['cipro'],
  'levofloxacin': ['levaquin'],
  'pantoprazole': ['protonix', 'pan'],
  'domperidone': ['motilium'],
  'ondansetron': ['zofran'],
};

// Build reverse mapping
const SYNONYM_TO_CANONICAL = {};
Object.entries(MEDICINE_SYNONYMS).forEach(([canonical, synonyms]) => {
  synonyms.forEach(syn => {
    SYNONYM_TO_CANONICAL[syn.toLowerCase()] = canonical;
  });
  SYNONYM_TO_CANONICAL[canonical.toLowerCase()] = canonical;
});

/**
 * Normalize a medicine name
 * @param {string} name - Raw medicine name
 * @returns {string} - Normalized name
 */
function normalizeMedicineName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let normalized = name.toLowerCase().trim();

  // Remove common dosage patterns
  // Examples: "500mg", "40 mg", "500", "5ml", "10%"
  normalized = normalized.replace(/\d+\s*(mg|ml|g|mcg|iu|%|units?)\b/gi, '');
  normalized = normalized.replace(/\b\d+\s*$/, ''); // trailing numbers
  normalized = normalized.replace(/\b\d+\s*-\s*\d+\b/g, ''); // ranges like "500-1000"

  // Remove common formulation indicators
  normalized = normalized.replace(/\b(tablet|capsule|syrup|suspension|injection|cream|ointment|gel|drops?|solution)s?\b/gi, '');

  // Remove punctuation and extra spaces
  normalized = normalized.replace(/[^\w\s+]/g, ' '); // keep + for combinations
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Handle combination medicines (e.g., "cefixime + ofloxacin")
  if (normalized.includes('+')) {
    const parts = normalized.split('+').map(p => p.trim());
    // Normalize each component
    const normalizedParts = parts.map(part => {
      const cleaned = part.replace(/\s+/g, ' ').trim();
      return SYNONYM_TO_CANONICAL[cleaned] || cleaned;
    });
    return normalizedParts.join(' + ');
  }

  // Map to canonical name if it's a known synonym
  const canonical = SYNONYM_TO_CANONICAL[normalized];
  if (canonical) {
    return canonical;
  }

  return normalized;
}

/**
 * Extract potential medicine components from a name
 * Useful for combination medicines
 * @param {string} name - Medicine name
 * @returns {string[]} - Array of component names
 */
function extractMedicineComponents(name) {
  const normalized = normalizeMedicineName(name);
  
  if (normalized.includes('+')) {
    return normalized.split('+').map(c => c.trim()).filter(Boolean);
  }
  
  return [normalized];
}

/**
 * Check if two medicine names are likely the same
 * @param {string} name1 
 * @param {string} name2 
 * @returns {boolean}
 */
function areMedicineNamesSimilar(name1, name2) {
  const norm1 = normalizeMedicineName(name1);
  const norm2 = normalizeMedicineName(name2);
  
  if (norm1 === norm2) return true;
  
  // Check if one is a component of the other (for combinations)
  const components1 = extractMedicineComponents(name1);
  const components2 = extractMedicineComponents(name2);
  
  return components1.some(c1 => components2.includes(c1));
}

module.exports = {
  normalizeMedicineName,
  extractMedicineComponents,
  areMedicineNamesSimilar,
  MEDICINE_SYNONYMS,
};
