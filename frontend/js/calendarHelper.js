/**
 * calendarHelper.js - Generador de enlaces para calendarios externos
 */

const CalendarHelper = {
  /**
   * Genera un enlace para Google Calendar
   * @param {Object} event - Datos de la cita
   * @returns {string} URL de Google Calendar
   */
  generateGoogleUrl(event) {
    const { title, start, end, details, location } = event;
    const fmt = (date) => new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
      text: title,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: details || '',
      location: location || '',
      sf: 'true',
      output: 'xml'
    });
    
    return `${baseUrl}&${params.toString()}`;
  },

  /**
   * Genera el contenido de un archivo .ics (Outlook/Apple)
   * @param {Object} event 
   * @returns {string} String con formato iCalendar
   */
  generateIcs(event) {
    const { title, start, end, details, location } = event;
    const fmt = (date) => new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details || ''}`,
      `LOCATION:${location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  },

  /**
   * Descarga el archivo .ics
   */
  downloadIcs(event) {
    const content = this.generateIcs(event);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cita.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

window.CalendarHelper = CalendarHelper;
