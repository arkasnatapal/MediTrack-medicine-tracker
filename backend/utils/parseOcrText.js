const parseOcrText = (ocrText) => {
  const result = {
    expiryDate: null,
    manufactureDate: null,
    batchNumber: null,
    medicineName: null,
  };

  // Patterns for expiry date
  const expiryPatterns = [
    /exp[iry]*\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /expiry\s*date\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /use\s*before\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /best\s*before\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
  ];

  // Patterns for manufacture date
  const mfgPatterns = [
    /mfg[\.]*\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /manufacture[d]*\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /mfd\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
  ];

  // Patterns for batch number
  const batchPatterns = [
    /batch\s*[no\.]*\s*[:\-]?\s*([A-Z0-9]+)/i,
    /lot\s*[no\.]*\s*[:\-]?\s*([A-Z0-9]+)/i,
    /b\.?\s*no\.?\s*[:\-]?\s*([A-Z0-9]+)/i,
  ];

  // Extract expiry date
  for (const pattern of expiryPatterns) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      result.expiryDate = normalizeDate(match[1]);
      break;
    }
  }

  // Extract manufacture date
  for (const pattern of mfgPatterns) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      result.manufactureDate = normalizeDate(match[1]);
      break;
    }
  }

  // Extract batch number
  for (const pattern of batchPatterns) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      result.batchNumber = match[1].trim();
      break;
    }
  }

  // Try to extract medicine name (first line that's not a date or batch)
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 2);
  for (const line of lines) {
    if (!line.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/) && 
        !line.match(/batch|lot|mfg|exp/i) &&
        line.length < 50) {
      result.medicineName = line;
      break;
    }
  }

  return result;
};

const normalizeDate = (dateStr) => {
  // Convert various date formats to YYYY-MM-DD
  const parts = dateStr.split(/[\/\-\.]/);
  
  if (parts.length !== 3) return null;

  let day, month, year;

  // Handle 2-digit year
  if (parts[2].length === 2) {
    year = parseInt(parts[2]) + 2000;
  } else {
    year = parseInt(parts[2]);
  }

  // Assume DD/MM/YYYY or MM/DD/YYYY format
  if (parseInt(parts[0]) > 12) {
    // First part is day
    day = parseInt(parts[0]);
    month = parseInt(parts[1]);
  } else if (parseInt(parts[1]) > 12) {
    // Second part is day
    month = parseInt(parts[0]);
    day = parseInt(parts[1]);
  } else {
    // Ambiguous - assume DD/MM/YYYY
    day = parseInt(parts[0]);
    month = parseInt(parts[1]);
  }

  // Validate
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Return in YYYY-MM-DD format
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

module.exports = { parseOcrText };
