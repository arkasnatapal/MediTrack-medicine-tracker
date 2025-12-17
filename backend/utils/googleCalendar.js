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
    
    let eventStart = new Date(startDateTime);
    if (reminder.times && reminder.times.length > 0) {
        const [hours, minutes] = reminder.times[0].split(':').map(Number);
        eventStart.setHours(hours, minutes, 0, 0);
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

    let eventStart = new Date(reminder.startDate);
    if (reminder.times && reminder.times.length > 0) {
        const [hours, minutes] = reminder.times[0].split(':').map(Number);
        eventStart.setHours(hours, minutes, 0, 0);
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
