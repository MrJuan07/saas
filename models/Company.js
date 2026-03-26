/**
 * models/Company.js
 * Modelo de Empresa
 *
 * Tabla: companies
 * Descripción: Almacena el perfil de cada empresa registrada en el SaaS.
 * Relaciones:
 *   - Pertenece a un User (dueño) (N:1)
 *   - Tiene muchas Appointments (1:N)
 */

const mongoose = require('mongoose');

// ─── Sub-schema: Horario de un día específico ─────────────────────────────────
const dayScheduleSchema = new mongoose.Schema(
  {
    // Si este día está habilitado para citas
    enabled: { type: Boolean, default: false },
    // Hora de apertura (formato "HH:MM")
    open: { type: String, default: '09:00' },
    // Hora de cierre (formato "HH:MM")
    close: { type: String, default: '18:00' },
  },
  { _id: false }
);

// ─── Sub-schema: Horario semanal completo ─────────────────────────────────────
const scheduleSchema = new mongoose.Schema(
  {
    monday:    { type: dayScheduleSchema, default: () => ({ enabled: true,  open: '09:00', close: '18:00' }) },
    tuesday:   { type: dayScheduleSchema, default: () => ({ enabled: true,  open: '09:00', close: '18:00' }) },
    wednesday: { type: dayScheduleSchema, default: () => ({ enabled: true,  open: '09:00', close: '18:00' }) },
    thursday:  { type: dayScheduleSchema, default: () => ({ enabled: true,  open: '09:00', close: '18:00' }) },
    friday:    { type: dayScheduleSchema, default: () => ({ enabled: true,  open: '09:00', close: '17:00' }) },
    saturday:  { type: dayScheduleSchema, default: () => ({ enabled: false, open: '10:00', close: '14:00' }) },
    sunday:    { type: dayScheduleSchema, default: () => ({ enabled: false, open: '10:00', close: '14:00' }) },
  },
  { _id: false }
);

// ─── Schema principal de la empresa ──────────────────────────────────────────
const companySchema = new mongoose.Schema(
  {
    // Nombre comercial de la empresa
    name: {
      type: String,
      required: [true, 'El nombre de la empresa es obligatorio'],
      trim: true,
      maxlength: [150, 'El nombre no puede superar 150 caracteres'],
    },

    // Descripción o eslogan de la empresa
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede superar 500 caracteres'],
      default: '',
    },

    // Categoría de la empresa (ej: "Salud", "Belleza", "Legal", etc.)
    category: {
      type: String,
      trim: true,
      default: 'General',
    },

    // Dirección física
    address: {
      type: String,
      trim: true,
      default: '',
    },

    // Teléfono de contacto
    phone: {
      type: String,
      trim: true,
      default: '',
    },

    // Email de contacto de la empresa
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },

    // Referencia al usuario dueño/administrador
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Duración estándar de cada cita (en minutos)
    appointmentDuration: {
      type: Number,
      default: 30,
      min: [5, 'La duración mínima es 5 minutos'],
      max: [480, 'La duración máxima es 480 minutos (8 horas)'],
    },

    // Tiempo de preparación entre citas (en minutos)
    bufferTime: {
      type: Number,
      default: 0,
      min: 0,
      max: 60,
    },

    // Máximo de citas simultáneas por franja horaria
    maxConcurrentAppointments: {
      type: Number,
      default: 1,
      min: 1,
      max: 20,
    },

    // Horario de atención semanal
    schedule: {
      type: scheduleSchema,
      default: () => ({}),
    },

    // Días festivos o cierres especiales
    blockedDates: [
      {
        date: { type: Date },
        reason: { type: String, default: 'Día no disponible' },
      },
    ],

    // Estado activo de la empresa
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Índices ──────────────────────────────────────────────────────────────────
companySchema.index({ owner: 1 });
companySchema.index({ name: 'text', description: 'text' }); // Búsqueda de texto completo

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
