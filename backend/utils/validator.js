/**
 * validator.js - Utilidad de validación personalizada para el backend
 */

const Validator = {
  /**
   * Valida un objeto contra un esquema de reglas
   * @param {Object} data - Datos a validar (req.body)
   * @param {Object} schema - Reglas de validación
   * @returns {Object|null} Error si falla, null si es válido
   */
  validate(data, schema) {
    const errors = {};

    for (const field in schema) {
      const value = data[field];
      const rules = schema[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[field] = `El campo ${field} es obligatorio`;
        continue;
      }

      if (value) {
        if (rules.email && !/^\S+@\S+\.\S+$/.test(value)) {
          errors[field] = 'Formato de email inválido';
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors[field] = `Mínimo ${rules.minLength} caracteres`;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors[field] = `Máximo ${rules.maxLength} caracteres`;
        }

        if (rules.numeric && isNaN(value)) {
          errors[field] = 'Debe ser un valor numérico';
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }
};

module.exports = Validator;
