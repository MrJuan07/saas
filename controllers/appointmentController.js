const Appointment = require('../models/Appointment');
const Company = require('../models/Company');
const smartScheduler = require('../backend/utils/smartScheduler');

// ─── Agendar Cita ─────────────────────────────────────────────────────────────
exports.createAppointment = async (req, res) => {
  try {
    const { companyId, startTime, notes } = req.body;

    // 1. Obtener la empresa y su configuración
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // 2. Calcular endTime basado en la duración de la empresa
    const start = new Date(startTime);
    const duration = company.appointmentDuration || 30;
    const end = new Date(start.getTime() + duration * 60000);

    // 3. Validar disponibilidad (dentro de horario de la empresa)
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][start.getDay()];
    const schedule = company.schedule[dayOfWeek];

    if (!schedule || !schedule.enabled) {
      return res.status(400).json({ error: 'La empresa no abre este día' });
    }

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const [openH, openM] = schedule.open.split(':').map(Number);
    const [closeH, closeM] = schedule.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      return res.status(400).json({ error: 'La cita está fuera del horario de atención' });
    }

    // 4. Validar solapamiento con otras citas
    const overlapping = await Appointment.findOne({
      company: companyId,
      status: { $nin: ['cancelled'] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ error: 'Ya existe una cita en este horario' });
    }

    // 5. Crear la cita
    const appointment = await Appointment.create({
      client: req.user._id,
      company: companyId,
      startTime: start,
      endTime: end,
      duration: duration,
      notes,
    });

    console.log(`🔔 NOTIFICACIÓN (Simulada): Cita agendada para ${req.user.name} en ${company.name}`);

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Obtener Citas de Usuario/Empresa ─────────────────────────────────────────
exports.getAppointments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'admin') {
      const company = await Company.findOne({ owner: req.user._id });
      if (!company) {
        return res.json([]); // Si no hay empresa, no hay citas que mostrar
      }
      query = { company: company._id };
    } else {
      query = { client: req.user._id };
    }

    const appointments = await Appointment.find(query)
      .populate('client', 'name email')
      .populate('company', 'name')
      .sort({ startTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Cancelar Cita ────────────────────────────────────────────────────────────
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Verificar permisos (dueño de cita o dueño de empresa)
    const isOwner = appointment.client.toString() === req.user._id.toString();
    const company = await Company.findOne({ owner: req.user._id });
    const isCompanyOwner = company && appointment.company.toString() === company._id.toString();

    if (!isOwner && !isCompanyOwner) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar esta cita' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    console.log(`🔔 NOTIFICACIÓN (Simulada): Cita cancelada por ${req.user.name}`);

    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Sugerencia de Horarios Inteligente ───────────────────────────────────────
exports.suggestSlots = async (req, res) => {
  try {
    const { companyId, date } = req.query;
    if (!companyId || !date) {
      return res.status(400).json({ error: 'companyId y date son obligatorios' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Usar el motor de sugerencias
    const suggestions = await smartScheduler.suggestAvailableSlots(
      company,
      new Date(date)
    );

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
