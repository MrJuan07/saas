/**
 * auth.js - Manejo de autenticación en el frontend
 */

const API_URL = '/api/auth';

// ─── Utilidades de LocalStorage ───────────────────────────────────────────────
const saveUser = (user) => localStorage.setItem('user', JSON.stringify(user));
const getUser = () => JSON.parse(localStorage.getItem('user'));
const logout = () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

// ─── Interfaz de Usuario ──────────────────────────────────────────────────────
const showTab = (tab) => {
  const loginForm = document.getElementById('formLogin');
  const registerForm = document.getElementById('formRegister');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
};

const showAlert = (message, type = 'error') => {
  const alert = document.getElementById('authAlert');
  alert.textContent = message;
  alert.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
  alert.classList.remove('hidden');
  setTimeout(() => alert.classList.add('hidden'), 5000);
};

// ─── Acciones de Autenticación ───────────────────────────────────────────────

const handleLogin = async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('btnLogin');

  // 1. Validación frontend
  if (!email || !password) {
    return showAlert('Todos los campos son obligatorios');
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return showAlert('Email no tiene un formato válido');
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> Iniciando...';

    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

    saveUser(data);
    window.location.href = 'dashboard.html';
  } catch (error) {
    showAlert(error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🔑</span> Iniciar sesión';
  }
};

const handleRegister = async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const role = document.querySelector('input[name="regRole"]:checked').value;
  const btn = document.getElementById('btnRegister');

  // 1. Validación frontend
  if (!name || !email || !password) {
    return showAlert('Nombre, email y contraseña son obligatorios');
  }

  if (password.length < 6) {
    return showAlert('La contraseña debe tener al menos 6 caracteres');
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> Creando cuenta...';

    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al registrarse');

    saveUser(data);
    showAlert('¡Cuenta creada con éxito! Redirigiendo a tu panel...', 'success');
    
    // Pequeño delay para que el usuario vea el mensaje de éxito
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  } catch (error) {
    showAlert(error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🚀</span> Crear cuenta';
  }
};

const fillDemo = (role) => {
  if (role === 'admin') {
    document.getElementById('loginEmail').value = 'admin@demo.com';
    document.getElementById('loginPassword').value = 'demo123';
  }
};

// Verificar si ya está logueado
document.addEventListener('DOMContentLoaded', () => {
  if (getUser() && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
    window.location.href = 'dashboard.html';
  }
});
