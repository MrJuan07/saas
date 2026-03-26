/**
 * models/User.js
 * Modelo de Usuario
 *
 * Tabla: users
 * Descripción: Almacena todos los usuarios del sistema (dueños de empresa y clientes).
 * Relaciones:
 *   - Un usuario puede ser dueño de una Company (1:1)
 *   - Un usuario puede tener muchas Appointments como cliente (1:N)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Nombre completo del usuario
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede superar 100 caracteres'],
    },

    // Email único para autenticación
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'El email no tiene un formato válido'],
    },

    // Contraseña encriptada con bcrypt
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // No incluir en queries por defecto (seguridad)
    },

    // Rol del usuario: 'admin' (dueño de empresa) o 'client' (cliente)
    role: {
      type: String,
      enum: ['admin', 'client'],
      default: 'client',
    },

    // Referencia a la empresa que administra (solo para role='admin')
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },

    // Teléfono opcional
    phone: {
      type: String,
      trim: true,
      default: null,
    },

    // Estado de la cuenta
    isActive: {
      type: Boolean,
      default: true,
    },

    // Fecha del último login
    lastLogin: {
      type: Date,
      default: null,
    },

    // Google Calendar Integration
    googleAccessToken: { type: String, default: null },
    googleRefreshToken: { type: String, default: null },
    googleTokenExpiry: { type: Date, default: null },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    versionKey: false,
  }
);

// ─── Hooks (Middleware de Mongoose) ──────────────────────────────────────────

/**
 * Pre-save: encripta la contraseña antes de guardar
 * Solo se ejecuta si el campo 'password' fue modificado
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12); // 12 rounds = buen balance seguridad/velocidad
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Métodos de instancia ─────────────────────────────────────────────────────

/**
 * Compara una contraseña en texto plano con la contraseña encriptada
 * @param {string} candidatePassword - Contraseña sin encriptar
 * @returns {boolean} true si coincide
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Retorna el usuario sin información sensible
 */
userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// ─── Índices ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
