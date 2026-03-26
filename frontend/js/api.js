/**
 * api.js - Cliente API base con interceptor de token
 */

const API = {
  // Base URL (se asume relativa si corre en el mismo servidor)
  baseUrl: '',

  // Almacenamiento local para respuestas (Cache)
  _db: {
    appointments: [],
    companies: [],
    lastSync: null
  },

  /**
   * Realiza una petición fetch con el token de autenticación si existe
   */
  async fetch(url, options = {}) {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Configurar headers por defecto
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Agregar token si está disponible
    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
    });

    // Si el token expiró (401), redirigir al login
    if (response.status === 401 && !url.includes('/login')) {
      localStorage.removeItem('user');
      window.location.href = 'index.html';
      return;
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error en la petición');
    }

    // Actualizar base de datos local (Cache dinámico)
    if (url === '/api/appointments' && options.method === 'GET') {
      this._db.appointments = data;
      this._db.lastSync = new Date();
    }
    if (url === '/api/companies' && options.method === 'GET') {
      this._db.companies = data;
    }

    return data;
  },

  /**
   * Obtener datos de la base de datos local (sin petición de red)
   */
  getLocal(collection) {
    return this._db[collection] || [];
  },

  // Métodos HTTP abreviados
  get(url) { return this.fetch(url, { method: 'GET' }); },
  post(url, body) { return this.fetch(url, { method: 'POST', body: JSON.stringify(body) }); },
  put(url, body) { return this.fetch(url, { method: 'PUT', body: JSON.stringify(body) }); },
  delete(url) { return this.fetch(url, { method: 'DELETE' }); },
};

window.API = API;
