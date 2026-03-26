const Company = require('../models/Company');
const Validator = require('../backend/utils/validator');

// ─── Crear Perfil de Empresa ──────────────────────────────────────────────────
exports.createCompany = async (req, res) => {
  try {
    const { name, email, phone, description, schedule, appointmentDuration } = req.body;

    // 1. Validaciones
    const validationErrors = Validator.validate(req.body, {
      name: { required: true, minLength: 3 },
      email: { email: true },
      appointmentDuration: { numeric: true },
    });

    if (validationErrors) {
      return res.status(400).json({ error: 'Datos inválidos', details: validationErrors });
    }

    // Verificar si ya tiene una empresa registrada
    const existingCompany = await Company.findOne({ owner: req.user._id });
    if (existingCompany) {
      return res.status(400).json({ error: 'Ya tienes una empresa registrada' });
    }

    const company = await Company.create({
      name,
      email,
      phone,
      description,
      owner: req.user._id,
      schedule,
      appointmentDuration,
    });

    // Actualizar el rol del usuario a 'admin' si no lo es
    if (req.user.role !== 'admin') {
      req.user.role = 'admin';
      await req.user.save();
    }

    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Obtener Perfil de Empresa (Propia o por ID) ───────────────────────────────
exports.getCompanyProfile = async (req, res) => {
  try {
    const companyId = req.params.id;
    let company;

    if (companyId) {
      company = await Company.findById(companyId);
    } else {
      company = await Company.findOne({ owner: req.user._id });
    }

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Actualizar Configuración de Empresa ──────────────────────────────────────
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const { name, description, phone, email, schedule, appointmentDuration } = req.body;

    company.name = name || company.name;
    company.description = description || company.description;
    company.phone = phone || company.phone;
    company.email = email || company.email;
    company.schedule = schedule || company.schedule;
    company.appointmentDuration = appointmentDuration || company.appointmentDuration;

    await company.save();

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Listar todas las empresas (para clientes) ───────────────────────────────
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().select('name description email phone');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
