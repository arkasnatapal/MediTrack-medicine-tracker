/**
 * UCUM (Unified Code for Units of Measure) mapping dictionary.
 */

const UCUM_MAP = {
  CELSIUS: { code: 'cel', unit: '°C', system: 'http://unitsofmeasure.org' },
  FAHRENHEIT: { code: '[degF]', unit: '°F', system: 'http://unitsofmeasure.org' },
  BEATS_PER_MIN: { code: '/min', unit: 'bpm', system: 'http://unitsofmeasure.org' },
  BREATHS_PER_MIN: { code: '/min', unit: 'breaths/min', system: 'http://unitsofmeasure.org' },
  MMHG: { code: 'mmHg', unit: 'mmHg', system: 'http://unitsofmeasure.org' },
  PERCENT: { code: '%', unit: '%', system: 'http://unitsofmeasure.org' },
  KILOGRAM: { code: 'kg', unit: 'kg', system: 'http://unitsofmeasure.org' },
  GRAM: { code: 'g', unit: 'g', system: 'http://unitsofmeasure.org' },
  MILLIGRAM: { code: 'mg', unit: 'mg', system: 'http://unitsofmeasure.org' },
  CENTIMETER: { code: 'cm', unit: 'cm', system: 'http://unitsofmeasure.org' },
  METER: { code: 'm', unit: 'm', system: 'http://unitsofmeasure.org' },
  BMI: { code: 'kg/m2', unit: 'kg/m²', system: 'http://unitsofmeasure.org' },
  MG_PER_DL: { code: 'mg/dL', unit: 'mg/dL', system: 'http://unitsofmeasure.org' },
  G_PER_DL: { code: 'g/dL', unit: 'g/dL', system: 'http://unitsofmeasure.org' }
};

function getUcumUnit(unitStr = '') {
  if (!unitStr) return { code: '1', unit: 'unit', system: 'http://unitsofmeasure.org' };
  const clean = String(unitStr).toLowerCase().trim();
  if (clean.includes('c') || clean.includes('celsius')) return UCUM_MAP.CELSIUS;
  if (clean.includes('f') || clean.includes('fahrenheit')) return UCUM_MAP.FAHRENHEIT;
  if (clean.includes('bpm') || clean.includes('beat')) return UCUM_MAP.BEATS_PER_MIN;
  if (clean.includes('mmhg')) return UCUM_MAP.MMHG;
  if (clean.includes('%') || clean.includes('percent')) return UCUM_MAP.PERCENT;
  if (clean === 'kg' || clean.includes('kilo')) return UCUM_MAP.KILOGRAM;
  if (clean === 'cm') return UCUM_MAP.CENTIMETER;
  if (clean.includes('kg/m')) return UCUM_MAP.BMI;
  if (clean.includes('mg/dl')) return UCUM_MAP.MG_PER_DL;
  if (clean.includes('g/dl')) return UCUM_MAP.G_PER_DL;

  return { code: clean, unit: unitStr, system: 'http://unitsofmeasure.org' };
}

module.exports = {
  UCUM_MAP,
  getUcumUnit
};
