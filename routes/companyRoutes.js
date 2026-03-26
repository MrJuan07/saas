const express = require('express');
const router = express.Router();
const {
  createCompany,
  getCompanyProfile,
  updateCompany,
  getAllCompanies,
} = require('../controllers/companyController');
const { protect, authorize } = require('../backend/authMiddleware');

// ─── Rutas Públicas ───────────────────────────────────────────────────────────
router.get('/', getAllCompanies);
router.get('/me', protect, getCompanyProfile);
router.get('/:id', getCompanyProfile);

// ─── Rutas Protegidas ─────────────────────────────────────────────────────────
router.post('/register', protect, createCompany);
router.put('/update', protect, authorize('admin'), updateCompany);

module.exports = router;
