const express = require('express');
const router = express.Router();
const { register, login, getProfile, getGoogleAuthUrl, googleCallback } = require('../controllers/authController');
const { protect } = require('../backend/authMiddleware');

// ─── Rutas Públicas ───────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);

// ─── Rutas Protegidas ─────────────────────────────────────────────────────────
router.get('/profile', protect, getProfile);

// Google Calendar OAuth
router.get('/google/url', protect, getGoogleAuthUrl);
router.get('/google/callback', googleCallback);

module.exports = router;
