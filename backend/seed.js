/**
 * backend/seed.js
 * Script para inicializar la base de datos con datos de prueba profesionales.
 * Uso: node backend/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Appointment = require('../models/Appointment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment_saas';

const seedDatabase = async () => {
  try {
    console.log('⏳ Conectando a MongoDB para inicialización...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión establecida.');

    // 1. Limpiar colecciones
    console.log('🧹 Limpiando base de datos...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Appointment.deleteMany({});

    // 2. Crear Usuarios (Admins/Empresas)
    console.log('👥 Creando usuarios administradores...');
    
    // Contraseña por defecto para todos: 'password123' (el hook pre-save la encriptará)
    const admin1 = await User.create({
      name: 'Alejandro Valdéz',
      email: 'admin@studio.com',
      password: 'password123',
      role: 'admin',
      phone: '+1 555-0101'
    });

    const admin2 = await User.create({
      name: 'Elena Rodríguez',
      email: 'contacto@techlab.io',
      password: 'password123',
      role: 'admin',
      phone: '+1 555-0202'
    });

    // 3. Crear Empresas
    console.log('🏢 Creando perfiles de empresa...');
    
    const company1 = await Company.create({
      name: 'Minimalist Design Studio',
      description: 'Estudio de diseño de interiores con enfoque en estética monocromática y funcional.',
      category: 'Arquitectura & Diseño',
      address: 'Av. Reforma 405, CDMX',
      phone: '+1 555-1000',
      email: 'hello@minimalist.studio',
      owner: admin1._id,
      appointmentDuration: 60,
      schedule: {
        monday:    { enabled: true,  open: '09:00', close: '18:00' },
        tuesday:   { enabled: true,  open: '09:00', close: '18:00' },
        wednesday: { enabled: true,  open: '09:00', close: '18:00' },
        thursday:  { enabled: true,  open: '09:00', close: '18:00' },
        friday:    { enabled: true,  open: '09:00', close: '17:00' },
        saturday:  { enabled: false, open: '10:00', close: '14:00' },
        sunday:    { enabled: false, open: '10:00', close: '14:00' },
      }
    });

    const company2 = await Company.create({
      name: 'TechLab Solutions',
      description: 'Consultoría especializada en optimización de procesos digitales y desarrollo premium.',
      category: 'Tecnología',
      address: 'Silicon Valley 101, CA',
      phone: '+1 555-2000',
      email: 'support@techlab.io',
      owner: admin2._id,
      appointmentDuration: 30,
      schedule: {
        monday:    { enabled: true,  open: '08:00', close: '20:00' },
        tuesday:   { enabled: true,  open: '08:00', close: '20:00' },
        wednesday: { enabled: true,  open: '08:00', close: '20:00' },
        thursday:  { enabled: true,  open: '08:00', close: '20:00' },
        friday:    { enabled: true,  open: '08:00', close: '18:00' },
        saturday:  { enabled: true,  open: '09:00', close: '13:00' },
        sunday:    { enabled: false, open: '10:00', close: '14:00' },
      }
    });

    // Actualizar referencia de empresa en los usuarios
    admin1.company = company1._id;
    await admin1.save();
    admin2.company = company2._id;
    await admin2.save();

    // 4. Crear Clientes de Prueba
    console.log('👤 Creando clientes de prueba...');
    const client1 = await User.create({
      name: 'Juan Pérez',
      email: 'juan@gmail.com',
      password: 'password123',
      role: 'client'
    });

    const client2 = await User.create({
      name: 'Sofía García',
      email: 'sofia@outlook.com',
      password: 'password123',
      role: 'client'
    });

    // 5. Crear Citas de Prueba
    console.log('📅 Agendando algunas citas iniciales...');
    
    // Cita para hoy a las 10:00 AM
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    
    await Appointment.create({
      client: client1._id,
      company: company1._id,
      startTime: today,
      endTime: new Date(today.getTime() + 60 * 60000), // +1h
      duration: 60,
      service: 'Asesoría de Interiorismo',
      notes: 'Quiero renovar mi oficina personal.'
    });

    // Cita para mañana a las 11:30 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 30, 0, 0);

    await Appointment.create({
      client: client2._id,
      company: company2._id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000), // +30m
      duration: 30,
      service: 'Consultoría Técnica',
      notes: 'Discusión sobre arquitectura de microservicios.'
    });

    console.log('\n🚀 ¡Base de datos inicializada correctamente!');
    console.log('-------------------------------------------');
    console.log('Admins: admin@studio.com, contacto@techlab.io');
    console.log('Clientes: juan@gmail.com, sofia@outlook.com');
    console.log('Password para todos: password123');
    console.log('-------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

seedDatabase();
