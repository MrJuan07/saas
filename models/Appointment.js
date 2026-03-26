/**
 * models/Appointment.js
 * Modelo de Cita
 *
 * Tabla: appointments
 * Descripción: Almacena todas las citas agendadas en el sistema.
 * Relaciones:
 *   - Pertenece a un User (cliente) (N:1)
 *   - Pertenece a una Company (N:1)
 */

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    // ─── Participantes ─────────────────────────────────────────────────────────

    // Cliente que agenda la cita
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El cliente es obligatorio'],
    },

    // Empresa donde se agenda la cita
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'La empresa es obligatoria'],
    },

    // ─── Fecha y Hora ──────────────────────────────────────────────────────────

    // Fecha y hora de inicio de la cita (UTC)
    startTime: {
      type: Date,
      required: [true, 'La fecha/hora de inicio es obligatoria'],
    },

    // Fecha y hora de fin de la cita (calculada automáticamente)
    endTime: {
      type: Date,
      required: [true, 'La fecha/hora de fin es obligatoria'],
    },

    // Duración de la cita en minutos (snapshot del momento de creación)
    duration: {
      type: Number,
      required: true,
      min: 5,
    },

    // ─── Detalles de la cita ───────────────────────────────────────────────────

    // Servicio o motivo de la cita
    service: {
      type: String,
      trim: true,
      maxlength: [200, 'El servicio no puede superar 200 caracteres'],
      default: 'Cita general',
    },

    // Notas adicionales del cliente
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las notas no pueden superar 1000 caracteres'],
      default: '',
    },

    // ─── Estado ────────────────────────────────────────────────────────────────

    // Estado de la cita
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
        message: 'Estado no válido',
      },
      default: 'confirmed',
    },

    // Razón de cancelación (si aplica)
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },

    // Fecha en que fue cancelada
    cancelledAt: {
      type: Date,
      default: null,
    },

    // ─── Reprogramación ────────────────────────────────────────────────────────

    // Referencia a la cita original (si fue reprogramada)
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },

    // Indica si esta cita es una reprogramación
    isRescheduled: {
      type: Boolean,
      default: false,
    },

    // ─── Notificaciones ────────────────────────────────────────────────────────

    // Control de recordatorios enviados
    reminders: {
      sent24h: { type: Boolean, default: false },
      sent1h:  { type: Boolean, default: false },
    },

    // ─── Datos de contacto al momento de la cita ──────────────────────────────
    // (Snapshot por si el usuario cambia su info después)
    clientSnapshot: {
      name:  { type: String },
      email: { type: String },
      phone: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Índices para consultas frecuentes ────────────────────────────────────────
appointmentSchema.index({ company: 1, startTime: 1, status: 1 });
appointmentSchema.index({ client: 1, startTime: -1 });
appointmentSchema.index({ startTime: 1, endTime: 1 });
appointmentSchema.index({ status: 1 });

// ─── Métodos de instancia ─────────────────────────────────────────────────────

/**
 * Cancela la cita con una razón
 * @param {string} reason
 */
appointmentSchema.methods.cancel = function (reason = 'Cancelada por el usuario') {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

/**
 * Verifica si la cita puede ser cancelada
 * Regla: solo se puede cancelar hasta 1 hora antes
 */
appointmentSchema.methods.canBeCancelled = function () {
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  return this.status !== 'cancelled' &&
         this.status !== 'completed' &&
         this.startTime > oneHourFromNow;
};

// ─── Statics (métodos de clase) ───────────────────────────────────────────────

/**
 * Verifica si hay conflicto de horario en una empresa para un rango de tiempo
 * @param {ObjectId} companyId
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {ObjectId} [excludeId] - ID de cita a excluir (para reprogramaciones)
 * @param {number} maxConcurrent - máximo de citas simultáneas permitidas
 */
appointmentSchema.statics.hasConflict = async function (
  companyId, startTime, endTime, excludeId = null, maxConcurrent = 1
) {
  const query = {
    company: companyId,
    status: { $nin: ['cancelled'] },
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime:   { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflictCount = await this.countDocuments(query);
  return conflictCount >= maxConcurrent;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
