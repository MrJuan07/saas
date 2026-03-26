const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  cancelAppointment,
  suggestSlots,
} = require('../controllers/appointmentController');
const { protect } = require('../backend/authMiddleware');

// ─── Rutas Protegidas ─────────────────────────────────────────────────────────
router.post('/', protect, createAppointment);
router.get('/', protect, getAppointments);
router.put('/:id/cancel', protect, cancelAppointment);
router.get('/suggest', protect, suggestSlots);

module.exports = router;
