/**
 * routes/aiRoutes.js
 * Rutas para el Asistente de IA
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../backend/authMiddleware');

router.post('/ask', protect, aiController.askAI);

module.exports = router;
