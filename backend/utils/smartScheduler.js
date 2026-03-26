/**
 * utils/smartScheduler.js
 * Motor inteligente de sugerencia de horarios disponibles
 *
 * Simula inteligencia artificial para recomendar los mejores horarios
 * basándose en: disponibilidad, patrones de uso, y preferencias horarias.
 */

const Appointment = require('../../models/Appointment');

// Mapeo de días de la semana (JS usa 0=domingo, nosotros usamos nombre)
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Convierte "HH:MM" a minutos desde medianoche
 * @param {string} timeStr - Hora en formato "HH:MM"
 * @returns {number} Minutos desde las 00:00
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convierte minutos desde medianoche a "HH:MM"
 * @param {number} minutes
 * @returns {string}
 */
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * Calcula un "score de popularidad" para una franja horaria
 * Horarios de media mañana y primera tarde tienen mayor score
 * @param {number} minutesFromMidnight
 * @returns {number} Score entre 0 y 1
 */
const calculatePopularityScore = (minutesFromMidnight) => {
  // Horarios preferidos: 10:00-12:00 y 14:00-16:00
  const preferredSlots = [
    { center: 660,  spread: 90 }, // 11:00 ± 1.5h
    { center: 900,  spread: 60 }, // 15:00 ± 1h
    { center: 570,  spread: 60 }, // 09:30 ± 1h
  ];

  let maxScore = 0;
  for (const slot of preferredSlots) {
    const distance = Math.abs(minutesFromMidnight - slot.center);
    const score = Math.max(0, 1 - distance / slot.spread);
    maxScore = Math.max(maxScore, score);
  }
  return maxScore;
};

/**
 * Obtiene todos los slots ocupados de una empresa en una fecha
 * @param {string} companyId
 * @param {Date} date
 * @returns {Array<{start: number, end: number}>} Slots ocupados en minutos
 */
const getOccupiedSlots = async (companyId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    company: companyId,
    startTime: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['cancelled'] },
  }).select('startTime endTime');

  return appointments.map((appt) => ({
    start: appt.startTime.getHours() * 60 + appt.startTime.getMinutes(),
    end: appt.endTime.getHours() * 60 + appt.endTime.getMinutes(),
  }));
};

/**
 * Verifica si un slot entra en conflicto con los slots ocupados
 * @param {number} slotStart - Inicio en minutos
 * @param {number} slotEnd - Fin en minutos
 * @param {Array} occupiedSlots - Slots ya ocupados
 * @returns {boolean}
 */
const hasConflictWithOccupied = (slotStart, slotEnd, occupiedSlots) => {
  return occupiedSlots.some(
    (occupied) => slotStart < occupied.end && slotEnd > occupied.start
  );
};

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNCIÓN PRINCIPAL: Sugiere horarios disponibles de forma inteligente
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Algoritmo:
 * 1. Obtiene el horario de la empresa para el día solicitado
 * 2. Genera todas las franjas posibles según duración de cita
 * 3. Filtra las que ya están ocupadas
 * 4. Asigna un score de "popularidad" a cada slot disponible
 * 5. Ordena por score (mejores horarios primero)
 * 6. Retorna los N mejores slots recomendados
 *
 * @param {Object} company - Objeto Company con schedule y appointmentDuration
 * @param {string|Date} targetDate - Fecha objetivo
 * @param {number} [limit=5] - Cantidad de sugerencias a devolver
 * @returns {Array<Object>} Slots sugeridos con score y metadata
 */
const suggestAvailableSlots = async (company, targetDate, limit = 5) => {
  const date = new Date(targetDate);
  const dayName = DAY_NAMES[date.getDay()];
  const daySchedule = company.schedule[dayName];

  // Verificar si el día está habilitado
  if (!daySchedule || !daySchedule.enabled) {
    return [];
  }

  const openMinutes  = timeToMinutes(daySchedule.open);
  const closeMinutes = timeToMinutes(daySchedule.close);
  const duration     = company.appointmentDuration || 30;
  const buffer       = company.bufferTime || 0;
  const step         = duration + buffer;

  // Verificar que el horario sea válido
  if (closeMinutes <= openMinutes + duration) {
    return [];
  }

  // Obtener citas ya agendadas en este día
  const occupiedSlots = await getOccupiedSlots(company._id, date);

  // Generar todos los slots posibles del día
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : 0;

  const availableSlots = [];

  for (let slotStart = openMinutes; slotStart + duration <= closeMinutes; slotStart += step) {
    const slotEnd = slotStart + duration;

    // Si es hoy, ignorar slots ya pasados (+ 30 min de margen)
    if (isToday && slotStart < currentMinutes) continue;

    // Verificar conflicto con citas existentes
    if (hasConflictWithOccupied(slotStart, slotEnd, occupiedSlots)) continue;

    // Calcular score de popularidad (IA simulada)
    const popularityScore = calculatePopularityScore(slotStart);

    // Construir fecha completa para este slot
    const slotDateTime = new Date(date);
    slotDateTime.setHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0);

    const slotEndDateTime = new Date(date);
    slotEndDateTime.setHours(Math.floor(slotEnd / 60), slotEnd % 60, 0, 0);

    availableSlots.push({
      startTime:       slotDateTime.toISOString(),
      endTime:         slotEndDateTime.toISOString(),
      startFormatted:  minutesToTime(slotStart),
      endFormatted:    minutesToTime(slotEnd),
      duration,
      score:           popularityScore,
      // Etiqueta amigable basada en el score
      label: popularityScore > 0.7
        ? '⭐ Recomendado'
        : popularityScore > 0.3
          ? '✓ Disponible'
          : '○ Disponible',
    });
  }

  // Ordenar por score (mayor primero) y limitar resultados
  const sorted = availableSlots
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Ordenar los resultados finales por hora (cronológico)
  return sorted.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
};

/**
 * Genera sugerencias para los próximos N días
 * @param {Object} company - Objeto Company
 * @param {number} [daysAhead=7] - Días hacia adelante a revisar
 * @param {number} [slotsPerDay=3] - Slots por día
 * @returns {Array<Object>} Mapa de fecha -> slots
 */
const suggestNextAvailableDays = async (company, daysAhead = 7, slotsPerDay = 3) => {
  const suggestions = [];
  const startDate = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const slots = await suggestAvailableSlots(company, date, slotsPerDay);

    if (slots.length > 0) {
      suggestions.push({
        date: date.toISOString().split('T')[0],
        dateFormatted: date.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        slots,
        totalAvailable: slots.length,
      });
    }
  }

  return suggestions;
};

module.exports = { suggestAvailableSlots, suggestNextAvailableDays };
