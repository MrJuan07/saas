/**
 * backend/utils/googleCalendar.js
 * Utilidad para interactuar con la API de Google Calendar
 */

const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Genera la URL de autenticación de Google
 */
exports.getAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
};

/**
 * Obtiene los tokens a partir del código de autorización
 */
exports.getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Crea un evento en el calendario del usuario
 */
exports.createEvent = async (user, appointment, company) => {
  if (!user.googleAccessToken) return null;

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: `Cita: ${company.name}`,
    location: company.address || 'Consultar ubicación',
    description: `Cita agendada a través de Agendly.\nNotas: ${appointment.notes || 'Ninguna'}`,
    start: {
      dateTime: appointment.startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: appointment.endTime.toISOString(),
      timeZone: 'UTC',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    return res.data;
  } catch (error) {
    console.error('Error al crear evento en Google Calendar:', error);
    return null;
  }
};
