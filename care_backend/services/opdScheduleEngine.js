/**
 * OPD Schedule, Doctor Availability, & Queue Operations Engine
 * MediTrack Care Network - Authoritative Operations Engine
 */

/**
 * Returns formatted time components for a given date in specified timezone.
 */
function getFacilityTime(timezone = 'Asia/Kolkata', now = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'long',
    });

    const parts = formatter.formatToParts(now);
    const partMap = {};
    parts.forEach(p => { partMap[p.type] = p.value; });

    // Handle hour '24' edge cases if formatted by Intl
    let hourStr = partMap.hour === '24' ? '00' : partMap.hour;
    const timeStr = `${hourStr}:${partMap.minute}`;
    const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
    const dayOfWeek = partMap.weekday;

    const currentMinutes = parseInt(hourStr, 10) * 60 + parseInt(partMap.minute, 10);

    return {
      dateStr,
      timeStr,
      dayOfWeek,
      currentMinutes,
      rawDate: now,
    };
  } catch (err) {
    // Fallback if timezone string is invalid
    const hour = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      dateStr: now.toISOString().split('T')[0],
      timeStr: `${hour}:${min}`,
      dayOfWeek: days[now.getDay()],
      currentMinutes: now.getHours() * 60 + now.getMinutes(),
      rawDate: now,
    };
  }
}

/**
 * Converts "HH:mm" string to total minutes from midnight.
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Authoritatively evaluates current OPD Operational Status.
 */
function evaluateOpdStatus(opdSchedule, manualOverride = 'NONE', now = new Date()) {
  const tz = opdSchedule?.timezone || 'Asia/Kolkata';
  const facTime = getFacilityTime(tz, now);

  const defaultSchedule = {
    openTime: '09:00',
    closeTime: '13:00',
    breakStart: '11:30',
    breakEnd: '12:00',
    lastTokenTime: '12:30',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    closingWarningMinutes: 30,
    queueMode: 'SHARED_QUEUE',
    closingPolicy: 'COMPLETE_EXISTING',
    holidays: [],
    specialDateOverrides: [],
  };

  const schedule = { ...defaultSchedule, ...opdSchedule?.toObject?.() || opdSchedule };

  // Manual Override Evaluation
  if (manualOverride && manualOverride !== 'NONE') {
    if (manualOverride === 'PAUSED') {
      return {
        opdStatus: 'PAUSED',
        registrationOpen: false,
        queueActive: false,
        reason: 'OPD has been manually paused by facility staff.',
        breakRemainingMinutes: 0,
        facTime,
        schedule,
      };
    }
    if (manualOverride === 'CLOSED') {
      return {
        opdStatus: 'CLOSED',
        registrationOpen: false,
        queueActive: false,
        reason: 'OPD has been manually closed by facility staff.',
        breakRemainingMinutes: 0,
        facTime,
        schedule,
      };
    }
    if (manualOverride === 'REGISTRATION_CLOSED') {
      return {
        opdStatus: 'REGISTRATION_CLOSED',
        registrationOpen: false,
        queueActive: true,
        reason: 'OPD registration has been manually closed by facility staff.',
        breakRemainingMinutes: 0,
        facTime,
        schedule,
      };
    }
    if (manualOverride === 'OPEN') {
      return {
        opdStatus: 'OPEN',
        registrationOpen: true,
        queueActive: true,
        reason: 'OPD is open (manual override).',
        breakRemainingMinutes: 0,
        facTime,
        schedule,
      };
    }
  }

  // 1. Holiday Check
  const holidayMatch = schedule.holidays?.find(h => h.date === facTime.dateStr);
  if (holidayMatch) {
    return {
      opdStatus: 'HOLIDAY',
      registrationOpen: false,
      queueActive: false,
      reason: `OPD Closed for Holiday: ${holidayMatch.description || 'Public Holiday'}`,
      breakRemainingMinutes: 0,
      facTime,
      schedule,
    };
  }

  // 2. Special Date Override Check
  const specialOverride = schedule.specialDateOverrides?.find(s => s.date === facTime.dateStr);
  let effectiveOpen = schedule.openTime;
  let effectiveClose = schedule.closeTime;
  let effectiveBreakStart = schedule.breakStart;
  let effectiveBreakEnd = schedule.breakEnd;
  let effectiveLastToken = schedule.lastTokenTime;

  if (specialOverride) {
    if (specialOverride.status === 'CLOSED') {
      return {
        opdStatus: 'CLOSED',
        registrationOpen: false,
        queueActive: false,
        reason: `OPD Closed Today: ${specialOverride.reason || 'Special Notice'}`,
        breakRemainingMinutes: 0,
        facTime,
        schedule,
      };
    }
    if (specialOverride.status === 'HOLIDAY') {
      return {
        opdStatus: 'HOLIDAY',
        registrationOpen: false,
        queueActive: false,
        reason: `OPD Holiday Today: ${specialOverride.reason || 'Special Holiday'}`,
        breakRemainingMinutes: 0,
        facTime,
        schedule,
      };
    }
    if (specialOverride.openTime) effectiveOpen = specialOverride.openTime;
    if (specialOverride.closeTime) effectiveClose = specialOverride.closeTime;
    if (specialOverride.breakStart) effectiveBreakStart = specialOverride.breakStart;
    if (specialOverride.breakEnd) effectiveBreakEnd = specialOverride.breakEnd;
    if (specialOverride.lastTokenTime) effectiveLastToken = specialOverride.lastTokenTime;
  }

  // 3. Operating Days Check
  if (!schedule.operatingDays.includes(facTime.dayOfWeek)) {
    return {
      opdStatus: 'CLOSED',
      registrationOpen: false,
      queueActive: false,
      reason: `OPD is closed on ${facTime.dayOfWeek}s.`,
      breakRemainingMinutes: 0,
      facTime,
      schedule,
    };
  }

  const currentMin = facTime.currentMinutes;
  const openMin = timeToMinutes(effectiveOpen);
  const closeMin = timeToMinutes(effectiveClose);
  const breakStartMin = timeToMinutes(effectiveBreakStart);
  const breakEndMin = timeToMinutes(effectiveBreakEnd);
  const lastTokenMin = timeToMinutes(effectiveLastToken);
  const warningStartMin = Math.max(openMin, closeMin - (schedule.closingWarningMinutes || 30));

  // 4. Before Opening Time
  if (currentMin < openMin) {
    return {
      opdStatus: 'SCHEDULED',
      registrationOpen: false,
      queueActive: false,
      reason: `OPD opens at ${effectiveOpen}.`,
      nextAvailableTime: effectiveOpen,
      breakRemainingMinutes: 0,
      facTime,
      schedule,
    };
  }

  // 5. After Closing Time
  if (currentMin >= closeMin) {
    return {
      opdStatus: 'CLOSED',
      registrationOpen: false,
      queueActive: false,
      reason: `OPD closed for today at ${effectiveClose}.`,
      breakRemainingMinutes: 0,
      facTime,
      schedule,
    };
  }

  // 6. During OPD Break
  if (breakStartMin > 0 && breakEndMin > breakStartMin && currentMin >= breakStartMin && currentMin < breakEndMin) {
    const breakRemainingMinutes = breakEndMin - currentMin;
    return {
      opdStatus: 'BREAK',
      registrationOpen: false,
      queueActive: false,
      reason: `OPD is on break until ${effectiveBreakEnd}.`,
      nextAvailableTime: effectiveBreakEnd,
      breakRemainingMinutes,
      facTime,
      schedule,
    };
  }

  // 7. After Last Token Acceptance Cutoff
  if (lastTokenMin > 0 && currentMin >= lastTokenMin) {
    return {
      opdStatus: 'REGISTRATION_CLOSED',
      registrationOpen: false,
      queueActive: true, // Existing patients continue
      reason: `Token registration closed at ${effectiveLastToken}. Existing queue is being served.`,
      breakRemainingMinutes: 0,
      facTime,
      schedule,
    };
  }

  // 8. Closing Soon Warning Window
  if (currentMin >= warningStartMin) {
    return {
      opdStatus: 'CLOSING_SOON',
      registrationOpen: true,
      queueActive: true,
      reason: `OPD closes soon at ${effectiveClose}. Registration open until ${effectiveLastToken}.`,
      breakRemainingMinutes: 0,
      facTime,
      schedule,
    };
  }

  // 9. Otherwise OPEN
  return {
    opdStatus: 'OPEN',
    registrationOpen: true,
    queueActive: true,
    reason: 'OPD is open.',
    breakRemainingMinutes: 0,
    facTime,
    schedule,
  };
}

/**
 * Calculates dynamic estimated wait time considering active serving doctors, breaks, and current patient.
 */
function calculateWaitTime({
  opdStatusObj,
  activeDoctorsCount = 1,
  doctorStatus = 'AVAILABLE',
  waitingCount = 0,
  averageConsultationMinutes = 7,
  currentPatientRemainingMinutes = 7,
  queueMode = 'SHARED_QUEUE',
}) {
  const { opdStatus, breakRemainingMinutes = 0 } = opdStatusObj || {};

  // If OPD is CLOSED, SCHEDULED, HOLIDAY, or PAUSED -> No valid wait estimate
  if (['CLOSED', 'SCHEDULED', 'HOLIDAY', 'PAUSED'].includes(opdStatus)) {
    return {
      estimatedWaitMinutes: null,
      displayText: 'Unavailable',
      isAvailable: false,
      reason: `Queue is ${opdStatus.toLowerCase()}`,
    };
  }

  // For DOCTOR_SPECIFIC_QUEUE, if specific doctor is UNAVAILABLE, ABSENT, LEFT_EARLY, ON_BREAK
  if (queueMode === 'DOCTOR_SPECIFIC_QUEUE') {
    if (['UNAVAILABLE', 'ABSENT', 'LEFT_EARLY'].includes(doctorStatus)) {
      return {
        estimatedWaitMinutes: null,
        displayText: 'Unavailable',
        isAvailable: false,
        reason: `Doctor is currently ${doctorStatus.toLowerCase().replace('_', ' ')}`,
      };
    }
    if (doctorStatus === 'ON_BREAK') {
      const breakAdd = breakRemainingMinutes > 0 ? breakRemainingMinutes : 15;
      const baseEstimate = currentPatientRemainingMinutes + (waitingCount * averageConsultationMinutes);
      const totalWait = baseEstimate + breakAdd;
      return {
        estimatedWaitMinutes: totalWait,
        displayText: `~${totalWait} mins (incl. break)`,
        isAvailable: true,
        reason: 'Doctor on break',
      };
    }
  }

  // For SHARED_QUEUE, check active serving doctors count
  const effectiveDoctors = Math.max(0, activeDoctorsCount);
  if (effectiveDoctors === 0) {
    return {
      estimatedWaitMinutes: null,
      displayText: 'Unavailable',
      isAvailable: false,
      reason: 'No active doctors available in department',
    };
  }

  // Formula: currentPatientRemaining + Math.ceil((waitingCount * avg) / effectiveDoctors) + breakRemaining
  const waitingTimeComponent = Math.ceil((waitingCount * averageConsultationMinutes) / effectiveDoctors);
  const breakComponent = opdStatus === 'BREAK' ? breakRemainingMinutes : 0;
  const rawEstimate = currentPatientRemainingMinutes + waitingTimeComponent + breakComponent;

  const estimatedWaitMinutes = Math.max(1, Math.round(rawEstimate));

  return {
    estimatedWaitMinutes,
    displayText: `~${estimatedWaitMinutes} mins`,
    isAvailable: true,
    activeDoctorsCount: effectiveDoctors,
  };
}

module.exports = {
  getFacilityTime,
  evaluateOpdStatus,
  calculateWaitTime,
};
