const { google } = require("googleapis");
const User = require("../models/User");

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URL,
  GOOGLE_CALENDAR_SCOPES,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_OAUTH_REDIRECT_URL) {
  console.warn("⚠️ Google OAuth env vars missing. Calendar integration will be disabled.");
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URL
  );
}

function getUtcDateForTargetTime(dateStr, timeStr, timeZone) {
  // dateStr: YYYY-MM-DD (from reminder.startDate or dynamically calculated)
  // timeStr: HH:MM (from reminder.times[0])
  // timeZone: e.g., 'Asia/Kolkata'

  const [year, month, day] = new Date(dateStr).toISOString().split('T')[0].split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // We need to find a UTC time such that when displayed in 'timeZone', it matches the target year, month, day, hours, minutes.
  // We can't just use setHours/setMinutes because those operate in local time (or UTC if using setUTCHours),
  // but we need the CONVERSION from Target TZ -> UTC.

  // Approach:
  // 1. Create a guess date in UTC.
  // 2. Format it to parts in the target timezone.
  // 3. Compare parts and adjust difference.
  
  // Better Approach using Intl (reliable in Node environment without external libs):
  // Construct a string in a format that Date.parse or new Date() accepts WITH timezone info? 
  // JS Date parsing with timezone is tricky without libraries.

  // Robust Native Approach:
  // Create a date object that represents the approximate time.
  // Then use Intl.DateTimeFormat to read what time that "moment" is in the target timezone.
  // Calculate the difference and Apply offset.
  
  // Let's rely on the input strings which are clean: YYYY, MM, DD, HH, MM.
  // We want to construct a Date object 'd' such that d.toLocaleString('en-US', {timeZone}) reads YYYY-MM-DD HH:MM.

  // Start with a UTC date assuming the inputs are UTC.
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  
  // Get what time this point-in-time actually is in the target timezone.
  const formatOptions = {
      timeZone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', formatOptions);
  const parts = formatter.formatToParts(utcDate);
  const getPart = (type) => parseInt(parts.find(p => p.type === type).value);
  
  const tzYear = getPart('year');
  const tzMonth = getPart('month');
  const tzDay = getPart('day');
  const tzHour = getPart('hour');
  const tzMinute = getPart('minute');

  // Create a Date from the timezone-projected values (treated as UTC for math)
  const tzProjectedAsUtc = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0));
  
  // The difference is the offset of that timezone at that specific time.
  const offsetMs = tzProjectedAsUtc.getTime() - utcDate.getTime();
  
  // To get the correct UTC instant, we SUBTRACT the offset from our initial assumption.
  // (e.g. if we want 9am IST, but 9am UTC is 2:30pm IST, we are ahead, so we subtract).
  
  return new Date(utcDate.getTime() - offsetMs);
}

function getAuthUrl(mode = "login") {
  const oAuth2Client = createOAuthClient();
  const scopes = (GOOGLE_CALENDAR_SCOPES || "https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/userinfo.profile")
    .split(",")
    .map((s) => s.trim());

  const state = JSON.stringify({ mode });

  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: mode === "signup" ? "consent" : "select_account",
    scope: scopes,
    state,
  });

  return url;
}

async function getAuthorizedClientForUser(userId) {
  const user = await User.findById(userId);
  if (!user || !user.google || !user.google.refreshToken) {
    return null;
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({
    access_token: user.google.accessToken,
    refresh_token: user.google.refreshToken,
  });

  // Attempt to refresh token silently if needed
  // googleapis handles token refresh automatically if refresh_token is present
  // but we might want to save the new access token if it changes.
  // We can listen to the 'tokens' event or just let it handle it.
  // However, to persist the new access token, we should manually check or handle the event.
  // For simplicity, we'll let the library handle the refresh in memory for this request,
  // but ideally we should capture the 'tokens' event.
  
  oAuth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
        user.google.accessToken = tokens.access_token;
        if (tokens.refresh_token) {
            user.google.refreshToken = tokens.refresh_token;
        }
        await user.save();
    }
  });

  return oAuth2Client;
}

async function createCalendarEvent(userId, reminder) {
  try {
    const auth = await getAuthorizedClientForUser(userId);
    if (!auth) return null;

    const calendar = google.calendar({ version: "v3", auth });

    const startDateTime = new Date(reminder.startDate); 
    // If reminder has specific times, we might need to create multiple events or a recurring one.
    // For simplicity based on requirements: "When reminders are created... corresponding events are created"
    // If a reminder has multiple times (e.g. 9am, 9pm), we might want to create one event per time or a recurring series.
    // However, the prompt example suggests a single event. Let's try to make it meaningful.
    // If reminder.times has values, pick the first one for the start time on the start date.
    
    const timeZone = reminder.timezone || "Asia/Kolkata";
    
    let eventStart;
    if (reminder.times && reminder.times.length > 0) {
        // Use the new helper to get precise UTC start time
        eventStart = getUtcDateForTargetTime(reminder.startDate, reminder.times[0], timeZone);
    } else {
        // Fallback if no specific time is set
        eventStart = new Date(startDateTime);
    }

    const endDateTime = new Date(eventStart.getTime() + 30 * 60 * 1000); // 30 min duration

    const event = {
      summary: `Take ${reminder.medicineName || "medicine"}`,
      description: `Medication reminder for ${reminder.medicineName || "medicine"}.`,
      start: {
        dateTime: eventStart.toISOString(),
        timeZone: reminder.timezone || "Asia/Kolkata",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: reminder.timezone || "Asia/Kolkata",
      },
      reminders: {
        useDefault: true,
      },
    };

    // Recurrence
    // If daysOfWeek is present, we can build an RRULE
    // e.g. RRULE:FREQ=WEEKLY;BYDAY=MO,TU
    if (reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
        const dayMap = {
            "Mon": "MO", "Tue": "TU", "Wed": "WE", "Thu": "TH", "Fri": "FR", "Sat": "SA", "Sun": "SU",
            "monday": "MO", "tuesday": "TU", "wednesday": "WE", "thursday": "TH", "friday": "FR", "saturday": "SA", "sunday": "SU"
        };
        const byDay = reminder.daysOfWeek.map(d => dayMap[d] || d.substring(0,2).toUpperCase()).join(",");
        event.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`];
    } else {
        // If no specific days, maybe it's daily? 
        // If daysOfWeek is empty, the model comment says "every day".
        event.recurrence = ["RRULE:FREQ=DAILY"];
    }

    // If endDate is present
    if (reminder.endDate) {
        // RRULE format for UNTIL is YYYYMMDDTHHMMSSZ
        const until = new Date(reminder.endDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        event.recurrence[0] += `;UNTIL=${until}`;
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return response.data; 
  } catch (err) {
    console.error("Failed to create Google Calendar event:", err.message);
    return null;
  }
}

async function updateCalendarEvent(userId, googleEventId, reminder) {
  try {
    const auth = await getAuthorizedClientForUser(userId);
    if (!auth || !googleEventId) return null;

    const calendar = google.calendar({ version: "v3", auth });

    const timeZone = reminder.timezone || "Asia/Kolkata";

    let eventStart;
    if (reminder.times && reminder.times.length > 0) {
       eventStart = getUtcDateForTargetTime(reminder.startDate, reminder.times[0], timeZone);
    } else {
       eventStart = new Date(reminder.startDate); 
    }
    const endDateTime = new Date(eventStart.getTime() + 30 * 60 * 1000);

    const event = {
      summary: `Take ${reminder.medicineName || "medicine"}`,
      description: `Medication reminder updated for ${reminder.medicineName || "medicine"}.`,
      start: { dateTime: eventStart.toISOString(), timeZone: reminder.timezone || "Asia/Kolkata" },
      end: { dateTime: endDateTime.toISOString(), timeZone: reminder.timezone || "Asia/Kolkata" },
    };

    if (reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
        const dayMap = {
            "Mon": "MO", "Tue": "TU", "Wed": "WE", "Thu": "TH", "Fri": "FR", "Sat": "SA", "Sun": "SU",
            "monday": "MO", "tuesday": "TU", "wednesday": "WE", "thursday": "TH", "friday": "FR", "saturday": "SA", "sunday": "SU"
        };
        const byDay = reminder.daysOfWeek.map(d => dayMap[d] || d.substring(0,2).toUpperCase()).join(",");
        event.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`];
    } else {
        event.recurrence = ["RRULE:FREQ=DAILY"];
    }

    if (reminder.endDate) {
        const until = new Date(reminder.endDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        event.recurrence[0] += `;UNTIL=${until}`;
    }

    const response = await calendar.events.update({
      calendarId: "primary",
      eventId: googleEventId,
      requestBody: event,
    });

    return response.data;
  } catch (err) {
    console.error("Failed to update Google Calendar event:", err.message);
    return null;
  }
}

async function deleteCalendarEvent(userId, googleEventId) {
  try {
    const auth = await getAuthorizedClientForUser(userId);
    if (!auth || !googleEventId) return;

    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
    });
  } catch (err) {
    console.error("Failed to delete Google Calendar event:", err.message);
  }
}

module.exports = {
  getAuthUrl,
  createOAuthClient,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
