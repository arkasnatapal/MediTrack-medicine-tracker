// Multi-criteria Ranking Engine for Public Healthcare Facilities

export const careRecommendationService = {
  rankFacilities: ({ facilities = [], userLocation, requiredService = '', isEmergency = false }) => {
    if (!facilities || facilities.length === 0) return [];

    const reqServiceLower = requiredService.toLowerCase().trim();

    const scoredFacilities = facilities.map(f => {
      let score = 100;
      let reasons = [];

      // 1. Distance penalty (minus 3 points per km)
      const distancePen = (f.distanceKm || 0) * 3;
      score -= distancePen;

      // 2. Emergency capability match
      if (isEmergency) {
        if (f.emergencyAvailable) {
          score += 40;
          reasons.push('24/7 Emergency Care Available');
        } else {
          score -= 50;
        }

        if (f.facilityType === 'DISTRICT_HOSPITAL' || f.facilityType === 'RURAL_HOSPITAL') {
          score += 25;
          reasons.push('ICU / Advanced Trauma Center');
        }
      }

      // 3. Service Match (e.g. ECG, X-Ray, Teleconsultation, Medicine)
      if (reqServiceLower !== '') {
        const hasDiagnosticMatch = f.diagnostics?.some(d => d.name.toLowerCase().includes(reqServiceLower) && d.available);
        const hasSpecialtyMatch = f.specialties?.some(s => s.toLowerCase().includes(reqServiceLower));
        const hasTeleMatch = reqServiceLower.includes('tele') && f.teleconsultationAvailable;

        if (hasDiagnosticMatch) {
          score += 35;
          reasons.push(`${requiredService.toUpperCase()} Diagnostic Unit Active`);
        }
        if (hasSpecialtyMatch) {
          score += 30;
          reasons.push(`Specialist ${requiredService} On Duty`);
        }
        if (hasTeleMatch) {
          score += 20;
          reasons.push('Teleconsultation Supported');
        }
        if (!hasDiagnosticMatch && !hasSpecialtyMatch && !hasTeleMatch) {
          score -= 20;
        }
      }

      // 4. Public facility priority score
      if (f.isPublicFacility) {
        score += 15;
        reasons.push('Government Public Health Network');
      }

      return {
        ...f,
        matchScore: Math.max(10, Math.round(score)),
        recommendationReason: reasons.length > 0 ? reasons.join(' • ') : `Suitable public healthcare facility within ${f.distanceKm} km.`
      };
    });

    return scoredFacilities.sort((a, b) => b.matchScore - a.matchScore);
  }
};
