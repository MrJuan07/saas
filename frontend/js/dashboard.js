// ─── Estado Global ──────────────────────────────────────────────────────────
let state = {
  user: JSON.parse(localStorage.getItem('user')),
  activePage: 'overview'
};

// ─── Inicialización ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!state.user) {
    // Si no hay usuario, redirigir a index.html (pero quitando la barra inicial si existe)
    window.location.href = 'index.html';
    return;
  }
  setupUI();
  showPage('overview');
});

function setupUI() {
  // Update Header
  document.getElementById('userName').textContent = state.user.name;
  document.getElementById('userRole').textContent = state.user.role === 'admin' ? 'Administrador' : 'Cliente';
  document.getElementById('userAvatar').textContent = state.user.name.charAt(0).toUpperCase();
  document.getElementById('welcomeName').textContent = state.user.name;

  // Role based navigation
  if (state.user.role === 'admin') {
    document.getElementById('adminNav').classList.remove('hidden');
    document.getElementById('adminStats').classList.remove('hidden');
  } else {
    document.getElementById('clientNav').classList.remove('hidden');
  }

  // Init Tilt effect for cards
  initTiltEffect();
  initBackgroundMovement();
}

function initBackgroundMovement() {
  document.addEventListener('mousemove', (e) => {
    const bgLines = document.getElementById('bgLines');
    if (!bgLines) return;
    
    const moveX = (e.clientX - window.innerWidth / 2) / 50;
    const moveY = (e.clientY - window.innerHeight / 2) / 50;
    
    bgLines.style.transform = `translate(${moveX}px, ${moveY}px)`;
    
    // Update body spot gradients
    const xPct = (e.clientX / window.innerWidth) * 100;
    const yPct = (e.clientY / window.innerHeight) * 100;
    document.body.style.setProperty('--bg-x', `${xPct}%`);
    document.body.style.setProperty('--bg-y', `${yPct}%`);
  });
}

function initTiltEffect() {
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.card, .stat-card-v2');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
      } else {
        card.style.transform = '';
      }
    });
  });
}

// ─── Navegación ─────────────────────────────────────────────────────────────
window.showPage = async (pageId) => {
  state.activePage = pageId;
  
  // Update UI Links
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('onclick')?.includes(`'${pageId}'`)) {
      link.classList.add('active');
    }
  });

  // Show Section
  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  const activeSection = document.getElementById(`page-${pageId}`);
  if (activeSection) {
    activeSection.classList.remove('hidden');
    activeSection.classList.add('animate-fade');
  }

  // Close sidebar on mobile
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('active')) {
    sidebar.classList.remove('active');
  }

  // Page Specific Loaders
  switch(pageId) {
    case 'overview':
      await loadDashboardOverview();
      break;
    case 'appointments':
      await loadAppointments();
      break;
    case 'today':
      if (window.loadTodayAppointments) await window.loadTodayAppointments();
      break;
    case 'book':
      await loadBookingData();
      break;
    case 'company':
      if (window.loadCompanyProfile) await window.loadCompanyProfile();
      break;
    case 'profile':
      document.getElementById('profName').value = state.user.name;
      document.getElementById('profEmail').value = state.user.email;
      break;
  }
};

window.toggleSidebar = () => {
  document.getElementById('sidebar').classList.toggle('active');
};

// ─── Dashboard Logic ───────────────────────────────────────────────────────
async function loadDashboardOverview() {
  try {
    const appointments = await API.get('/api/appointments');
    const recent = appointments.slice(0, 5);
    
    // Stats for Admin
    if (state.user.role === 'admin') {
      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointments.filter(a => a.startTime && a.startTime.startsWith(today));
      const confirmed = appointments.filter(a => a.status === 'confirmed').length;
      const cancelled = appointments.filter(a => a.status === 'cancelled').length;

      const statsContainer = document.getElementById('adminStats');
      
      // Si es admin pero no hay actividad ni empresa configurada (asumiendo 0 citas)
      if (appointments.length === 0) {
        statsContainer.innerHTML = `
          <div class="card animate-fade" style="border: 1px dashed var(--c-primary); background: rgba(255,255,255,0.02); text-align: center; padding: 3rem;">
            <h3 style="color: white; margin-bottom: 1rem;">🚀 ¡Casi listo!</h3>
            <p class="text-muted" style="margin-bottom: 2rem;">Configura tu perfil de empresa para empezar a recibir citas.</p>
            <button class="btn btn-primary" onclick="showPage('company')">Configurar mi Negocio ahora</button>
          </div>
        `;
      } else {
        statsContainer.innerHTML = `
          <div class="stats-grid">
            <div class="stat-card-v2 animate-up" style="animation-delay: 0.1s">
              <div class="icon-bg">📅</div>
              <div class="stat-details-v2">
                <span class="value">${todayAppts.length}</span>
                <span class="label">Citas hoy</span>
              </div>
            </div>
            <div class="stat-card-v2 animate-up" style="animation-delay: 0.2s">
              <div class="icon-bg">📊</div>
              <div class="stat-details-v2">
                <span class="value">${appointments.length}</span>
                <span class="label">Total histórico</span>
              </div>
            </div>
            <div class="stat-card-v2 animate-up" style="animation-delay: 0.3s">
              <div class="icon-bg">✅</div>
              <div class="stat-details-v2">
                <span class="value">${confirmed}</span>
                <span class="label">Confirmadas</span>
              </div>
            </div>
            <div class="stat-card-v2 animate-up" style="animation-delay: 0.4s">
              <div class="icon-bg">❌</div>
              <div class="stat-details-v2">
                <span class="value">${cancelled}</span>
                <span class="label">Canceladas</span>
              </div>
            </div>
          </div>
        `;
      }
    }

    // Recent List
    const container = document.getElementById('recentAppointments');
    if (recent.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay actividad reciente.</p>';
      return;
    }

    container.innerHTML = recent.map(appt => {
      const startDate = new Date(appt.startTime);
      const day = startDate.getDate();
      const month = startDate.toLocaleDateString('es-ES', { month: 'short' });
      const time = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="appointment-card animate-up">
          <div class="appt-time-v2">
            <div class="day">${day}</div>
            <div class="month">${month}</div>
          </div>
          <div class="appt-info-v2">
            <h4>${state.user.role === 'admin' ? appt.client.name : appt.company.name}</h4>
            <p>${time} • ${appt.service || 'Consulta'}</p>
          </div>
          <div class="status-badge status-${appt.status}">${appt.status}</div>
        </div>
      `;
    }).join('');

  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ─── Utilidades Globales ──────────────────────────────────────────────────────
window.updateProfile = async () => {
  const name = document.getElementById('profName').value;
  if (!name) return showToast('El nombre es requerido', 'error');

  try {
    const updatedUser = await API.put('/api/auth/profile', { name });
    state.user = updatedUser;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setupUI();
    showToast('Perfil actualizado correctamente', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.logout = () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

window.syncGoogleCalendar = async () => {
  try {
    const { url } = await API.get('/api/auth/google/url');
    window.location.href = url;
  } catch (error) {
    showToast('Error al conectar con Google: ' + error.message, 'error');
  }
};

window.showToast = (message, type = 'info') => {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

window.copyBookingLink = () => {
  const linkInput = document.getElementById('compBookingLink');
  linkInput.select();
  document.execCommand('copy');
  showToast('¡Enlace copiado al portapapeles!', 'success');
};

window.notifySimulatedEmail = (to, subject) => {
  console.log(`%c[Email Simulator] Enviando a: ${to} | Asunto: ${subject}`, 'color: #6366f1; font-weight: bold; background: #0f172a; padding: 5px; border-radius: 4px;');
  showToast(`📧 Notificación enviada a ${to}`, 'info');
};
