/**
 * server.js - Punto de entrada principal del servidor
 * Sistema SaaS de Agendación de Citas
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar rutas
const authRoutes = require('../routes/authRoutes');
const companyRoutes = require('../routes/companyRoutes');
const appointmentRoutes = require('../routes/appointmentRoutes');
const aiRoutes = require('../routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const Appointment = require('../models/Appointment');

// ─── Tareas Programadas Automáticas (Simulación de Cron) ──────────────────────
/**
 * Tarea: Actualizar estados de citas automáticamente.
 * Se ejecuta cada hora para marcar citas pasadas como 'completed'.
 */
const startAutomaticUpdates = () => {
  console.log('🕒 Iniciando motor de actualización automática de base de datos...');
  
  // Tarea 1: Citas completadas (cada 15 minutos para mayor precisión)
  setInterval(async () => {
    try {
      const now = new Date();
      const result = await Appointment.updateMany(
        { 
          status: 'confirmed', 
          endTime: { $lt: now } 
        },
        { $set: { status: 'completed' } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ [AUTO] ${result.modifiedCount} citas marcadas como completadas.`);
      }
    } catch (error) {
      console.error('❌ Error en actualización automática (completados):', error.message);
    }
  }, 1000 * 60 * 15);

  // Tarea 2: Limpieza de tokens de Google expirados (cada 24 horas)
  setInterval(async () => {
    try {
      const now = new Date();
      const User = require('../models/User');
      const result = await User.updateMany(
        { googleTokenExpiry: { $lt: now } },
        { $set: { googleAccessToken: null, googleTokenExpiry: null } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ [AUTO] ${result.modifiedCount} sesiones de Google Calendar expiradas limpiadas.`);
      }
    } catch (error) {
      console.error('❌ Error en limpieza de tokens:', error.message);
    }
  }, 1000 * 60 * 60 * 24);
};

// ─── Conexión a MongoDB ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/appointment_saas')
  .then(() => {
    console.log('✅ MongoDB conectado correctamente');
    startAutomaticUpdates(); // Iniciar tareas automáticas al conectar
  })
  .catch((err) => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    // process.exit(1);
  });

// ─── Middlewares globales ─────────────────────────────────────────────────────

// Limitar peticiones para prevenir ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  message: { error: 'Demasiadas peticiones, intenta más tarde.' },
});

app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Middlewares de seguridad básicos manuales
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas específicas para asegurar que los HTML se sirvan correctamente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// ─── Rutas de la API ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor de agendación funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Ruta catch-all: devuelve el frontend para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── Manejo de errores global ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔴 Error no controlado:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Docs disponibles en http://localhost:${PORT}/api/health`);
});

module.exports = app;
