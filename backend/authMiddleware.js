const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rutas
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener el token del header (Bearer token)
      token = req.headers.authorization.split(' ')[1];

      // Decodificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Buscar el usuario y adjuntarlo a la request
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error('🔴 Error de autenticación:', error.message);
      res.status(401).json({ error: 'No autorizado, token fallido' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'No autorizado, no hay token' });
  }
};

// Middleware para roles específicos (ej. admin/empresa)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `El rol '${req.user.role}' no tiene permisos para acceder a esta ruta`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
