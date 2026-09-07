/**
 * Bidirectional Mapper: MediTrack Vitals / Observations <-> FHIR R4 Observation Resource.
 */

const { getLoincCode } = require('../terminology/loinc');
const { getUcumUnit } = require('../terminology/ucum');
const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Convert individual vital reading (e.g. Temp, HR, BP, SpO2, Weight, BMI) to FHIR Observation.
 */
function toFhirObservation({
  id = null,
  patientId,
  type, // e.g. 'BODY_TEMP', 'HEART_RATE', 'SYSTOLIC_BP', 'OXYGEN_SATURATION', 'BODY_WEIGHT', 'BLOOD_GLUCOSE'
  value, // numeric or string
  unit = '',
  effectiveDateTime = new Date().toISOString(),
  performerId = null,
  status = 'final',
  notes = '',
  referenceRange = null
}) {
  const obsId = String(id || `obs-${type.toLowerCase()}-${patientId}-${Date.now()}`);
  const loincInfo = getLoincCode(type, type);
  const ucumInfo = getUcumUnit(unit || loincInfo.unit || '');

  const category = [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs'
        }
      ]
    }
  ];

  const code = {
    coding: [
      {
        system: loincInfo.system,
        code: loincInfo.code,
        display: loincInfo.display
      }
    ],
    text: loincInfo.display
  };

  const subject = {
    reference: `Patient/${patientId}`
  };

  let valueQuantity = undefined;
  let valueString = undefined;
  let component = undefined;

  // Handle Blood Pressure (Systolic + Diastolic)
  if (type === 'BLOOD_PRESSURE' && typeof value === 'object' && value.systolic && value.diastolic) {
    const sysLoinc = getLoincCode('SYSTOLIC_BP');
    const diaLoinc = getLoincCode('DIASTOLIC_BP');
    const mmhgUcum = getUcumUnit('mmHg');

    component = [
      {
        code: { coding: [{ system: sysLoinc.system, code: sysLoinc.code, display: sysLoinc.display }] },
        valueQuantity: { value: Number(value.systolic), unit: mmhgUcum.unit, system: mmhgUcum.system, code: mmhgUcum.code }
      },
      {
        code: { coding: [{ system: diaLoinc.system, code: diaLoinc.code, display: diaLoinc.display }] },
        valueQuantity: { value: Number(value.diastolic), unit: mmhgUcum.unit, system: mmhgUcum.system, code: mmhgUcum.code }
      }
    ];
  } else if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
    valueQuantity = {
      value: Number(value),
      unit: ucumInfo.unit,
      system: ucumInfo.system,
      code: ucumInfo.code
    };
  } else {
    valueString = String(value);
  }

  const performer = performerId ? [{ reference: `Practitioner/${performerId}` }] : undefined;

  const note = notes ? [{ text: notes }] : undefined;

  let refRange = undefined;
  if (referenceRange) {
    refRange = [
      {
        low: referenceRange.low ? { value: referenceRange.low, unit: ucumInfo.unit } : undefined,
        high: referenceRange.high ? { value: referenceRange.high, unit: ucumInfo.unit } : undefined,
        text: referenceRange.text || undefined
      }
    ];
  }

  return {
    resourceType: 'Observation',
    id: obsId,
    status: status,
    category: category,
    code: code,
    subject: subject,
    effectiveDateTime: new Date(effectiveDateTime).toISOString(),
    valueQuantity: valueQuantity,
    valueString: valueString,
    component: component,
    referenceRange: refRange,
    performer: performer,
    note: note
  };
}

/**
 * Convert FHIR R4 Observation resource back into MediTrack vital record object.
 */
function fromFhirObservation(fhirObservation) {
  if (!fhirObservation || fhirObservation.resourceType !== 'Observation') {
    throw new Error('Invalid FHIR Observation resource');
  }

  const validation = validateFhirResource(fhirObservation);
  if (!validation.valid) {
    throw new Error(`FHIR Observation Validation Failed: ${validation.errors.join(', ')}`);
  }

  const loincCode = fhirObservation.code?.coding?.[0]?.code;
  const display = fhirObservation.code?.text || fhirObservation.code?.coding?.[0]?.display || 'Observation';
  const patientRef = fhirObservation.subject?.reference || '';
  const patientId = patientRef.replace('Patient/', '');

  let numericValue = null;
  let unit = '';
  let textValue = null;

  if (fhirObservation.valueQuantity) {
    numericValue = fhirObservation.valueQuantity.value;
    unit = fhirObservation.valueQuantity.unit || fhirObservation.valueQuantity.code || '';
  } else if (fhirObservation.valueString) {
    textValue = fhirObservation.valueString;
  }

  return {
    fhirId: fhirObservation.id,
    patientId: patientId,
    loincCode: loincCode,
    display: display,
    value: numericValue !== null ? numericValue : textValue,
    unit: unit,
    effectiveDateTime: fhirObservation.effectiveDateTime,
    status: fhirObservation.status
  };
}

module.exports = {
  toFhirObservation,
  fromFhirObservation
};
