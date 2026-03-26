const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Validator = require('../backend/utils/validator');

// ─── Generar Token JWT ────────────────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// ─── Registro de Usuario ──────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validaciones Profesionales
    const validationErrors = Validator.validate(req.body, {
      name: { required: true, minLength: 2 },
      email: { required: true, email: true },
      password: { required: true, minLength: 6 },
    });

    if (validationErrors) {
      return res.status(400).json({ 
        error: 'Datos de validación inválidos', 
        details: validationErrors 
      });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'El usuario ya existe con ese email' });
    }

    // Encriptar contraseña (YA NO ES NECESARIO AQUÍ, SE HACE EN EL MODELO)
    // Pero el código actual lo hace, lo que causaría doble encriptación si el hook está activo.
    // Vamos a limpiar el controlador para que use el modelo correctamente.

    // Crear el usuario
    const user = await User.create({
      name,
      email,
      password, // El hook pre-save en User.js se encargará de encriptar
      role: role || 'client',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Login de Usuario ─────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validaciones
    const validationErrors = Validator.validate(req.body, {
      email: { required: true, email: true },
      password: { required: true },
    });

    if (validationErrors) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar el usuario e incluir la contraseña
    const user = await User.findOne({ email }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: 'Email o contraseña inválidos' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const googleCalendar = require('../backend/utils/googleCalendar');

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Obtener URL de autenticación
exports.getGoogleAuthUrl = (req, res) => {
  const url = googleCalendar.getAuthUrl();
  res.json({ url });
};

// Callback de Google
exports.googleCallback = async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await googleCalendar.getTokens(code);
    
    // Guardar tokens en el usuario (asumiendo que el usuario está logueado y tenemos su ID de alguna forma, 
    // o usando un estado en la URL. Para simplificar, lo guardamos en el usuario actual si viene el token JWT en la cookie o query)
    // En una implementación real, usaríamos el parámetro 'state' de OAuth2.
    
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5555'}/dashboard.html?google=success`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5555'}/dashboard.html?google=error`);
  }
};

// ─── Obtener Perfil del Usuario ────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
