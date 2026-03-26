// ─── Estado de la Cita ──────────────────────────────────────────────────────
let apptState = {
  selectedCompany: null,
  selectedCompanyName: '',
  selectedDate: null,
  selectedTime: null,
  selectedStartTime: null,
  currentStep: 1
};

let apptToCancel = null;

// ─── Carga de Listas ────────────────────────────────────────────────────────
window.loadAppointments = async () => {
  try {
    const container = document.getElementById('appointmentsList');
    container.innerHTML = '<div class="spinner"></div>';

    const appointments = await API.get('/api/appointments');
    
    if (appointments.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:4rem; border: 1px dashed var(--c-border);">
          <p class="text-muted">Aún no tienes citas programadas.</p>
          ${state.user.role === 'client' ? '<button class="btn btn-primary" onclick="showPage(\'book\')" style="margin-top:1.5rem;">Agendar mi primera cita</button>' : ''}
        </div>
      `;
      return;
    }

    container.innerHTML = appointments.map(appt => {
      const startDate = new Date(appt.startTime);
      const day = startDate.getDate();
      const month = startDate.toLocaleString('es-ES', { month: 'short' });
      const time = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const calendarEvent = {
        title: `Cita: ${appt.company.name}`,
        start: appt.startTime,
        end: appt.endTime,
        details: appt.notes,
        location: appt.company.address || 'Consultar'
      };

      const googleUrl = CalendarHelper.generateGoogleUrl(calendarEvent);

      return `
        <div class="appointment-card animate-up">
          <div class="appt-time-v2">
            <div class="day">${day}</div>
            <div class="month">${month}</div>
          </div>
          
          <div class="appt-info-v2">
            <h4>${state.user.role === 'admin' ? appt.client.name : appt.company.name}</h4>
            <p>${time} • ${appt.notes || 'Consulta General'}</p>
            <div style="margin-top: 0.75rem;">
              <span class="status-badge status-${appt.status}">${appt.status}</span>
            </div>
          </div>

          <div class="appt-actions" style="display:flex; flex-direction:column; gap:0.5rem; margin-left: auto;">
            ${appt.status !== 'cancelled' ? `
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="window.open('${googleUrl}', '_blank')" title="Añadir a Google Calendar">
                  <span style="font-size: 1.2rem;">📅</span> Google
                </button>
                <button class="btn btn-secondary btn-sm" onclick='CalendarHelper.downloadIcs(${JSON.stringify(calendarEvent)})' title="Descargar iCal">
                  <span style="font-size: 1.2rem;">📎</span> iCal
                </button>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="openCancelModal('${appt._id}')" style="color: var(--c-danger); font-size: 0.7rem;">
                Cancelar Cita
              </button>
            ` : '<span style="font-size: 0.7rem; color: var(--c-text-muted); font-weight: 700;">CANCELADA</span>'}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// ─── Wizard Navigation ──────────────────────────────────────────────────────
window.nextStep = (step) => {
  if (step === 2) {
    const companyId = document.getElementById('bookCompany').value;
    if (!companyId) return;
    loadCompanyDetails(companyId);
  }
  
  apptState.currentStep = step;
  updateWizardUI();
};

window.prevStep = (step) => {
  apptState.currentStep = step;
  updateWizardUI();
};

function updateWizardUI() {
  // Update Steps
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`bookStep${apptState.currentStep}`)?.classList.add('active');
  
  // Update Progress Bar
  document.querySelectorAll('.progress-step').forEach(s => {
    const sNum = parseInt(s.getAttribute('data-step'));
    s.classList.remove('active');
    if (sNum <= apptState.currentStep) s.classList.add('active');
  });

  // Success hide progress
  if (apptState.currentStep === 4) {
    document.getElementById('bookProgress').classList.add('hidden');
    document.getElementById('bookSuccess').classList.add('active');
  } else {
    document.getElementById('bookProgress').classList.remove('hidden');
    document.getElementById('bookSuccess').classList.remove('active');
  }
}

window.resetWizard = () => {
  apptState = {
    selectedCompany: null,
    selectedCompanyName: '',
    selectedDate: null,
    selectedTime: null,
    selectedStartTime: null,
    currentStep: 1
  };
  const bookComp = document.getElementById('bookCompany');
  if(bookComp) bookComp.value = '';
  
  document.getElementById('bookDate').value = '';
  document.getElementById('bookNotes').value = '';
  updateWizardUI();
};

// ─── Proceso de Agendamiento ────────────────────────────────────────────────
window.loadBookingData = async () => {
  try {
    resetWizard();
    const companies = await API.get('/api/companies');
    const container = document.getElementById('companiesContainer');
    
    if (!companies || companies.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; border: 1px dashed var(--glass-border); border-radius: 16px;">
          <p class="text-muted">No hay negocios registrados en este momento.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = companies.map(c => `
      <div class="card glass animate-up" style="cursor: pointer; padding: 1.5rem;" onclick="selectCompany('${c._id}', '${c.name.replace(/'/g, "\\'")}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <span style="font-size: 2rem;">🏢</span>
          <span class="badge" style="background: var(--c-primary); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.65rem; color: black; font-weight: 800;">${c.category}</span>
        </div>
        <h4 style="color: white; font-size: 1.1rem; margin-bottom: 0.5rem;">${c.name}</h4>
        <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 1rem;">${c.description || 'Sin descripción'}</p>
        <div style="font-size: 0.75rem; color: var(--c-text-muted); display: flex; align-items: center; gap: 0.5rem;">
          <span>📍</span> ${c.address || 'Consultar dirección'}
        </div>
      </div>
    `).join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.selectCompany = (id, name) => {
  apptState.selectedCompany = id;
  apptState.selectedCompanyName = name;
  document.getElementById('bookCompany').value = id;
  nextStep(2);
};

window.loadCompanyDetails = async (companyId) => {
  // Ya no se usa para inyectar detalles en el step 1, pero se mantiene por si se necesita
  try {
    const company = await API.get(`/api/companies/${companyId}`);
    apptState.selectedCompany = companyId;
    apptState.selectedCompanyName = company.name;
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.loadSuggestions = async () => {
  const date = document.getElementById('bookDate').value;
  if (!date) return;

  apptState.selectedDate = date;
  const slotsGrid = document.getElementById('slotsGrid');
  const noSlotsMsg = document.getElementById('noSlotsMsg');
  
  slotsGrid.innerHTML = '<div class="spinner"></div>';
  noSlotsMsg.classList.add('hidden');

  try {
    const suggestions = await API.get(`/api/appointments/suggest?companyId=${apptState.selectedCompany}&date=${apptState.selectedDate}`);

    if (suggestions.length === 0) {
      slotsGrid.innerHTML = '';
      noSlotsMsg.classList.remove('hidden');
      return;
    }

    slotsGrid.innerHTML = suggestions.map((slot, index) => `
      <div class="slot-pill animate-up" 
           style="animation-delay: ${index * 0.05}s"
           onclick="selectSlot('${slot.startTime}', '${slot.startFormatted}')">
        ${slot.startFormatted}
      </div>
    `).join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.selectSlot = (startTime, formatted) => {
  apptState.selectedStartTime = startTime;
  apptState.selectedTime = formatted;

  // UI Summary update
  document.getElementById('summaryTime').textContent = `${apptState.selectedDate} a las ${formatted}`;
  document.getElementById('summaryCompany').textContent = apptState.selectedCompanyName;

  nextStep(3);
};

window.confirmAppointment = async () => {
  const notes = document.getElementById('bookNotes').value;
  const btn = document.getElementById('btnConfirm');

  try {
    btn.disabled = true;
    btn.textContent = 'Procesando reserva...';

    const res = await API.post('/api/appointments', {
      companyId: apptState.selectedCompany,
      startTime: apptState.selectedStartTime,
      notes
    });

    // Setup Success Tools
    const calendarEvent = {
      title: `Cita: ${apptState.selectedCompanyName}`,
      start: apptState.selectedStartTime,
      end: res.endTime, // Use the end time returned by the server
      details: notes || 'Consulta General',
      location: 'Consultar ubicación en el perfil'
    };

    const googleUrl = CalendarHelper.generateGoogleUrl(calendarEvent);
    document.getElementById('successGoogleBtn').onclick = () => window.open(googleUrl, '_blank');
    document.getElementById('successIcsBtn').onclick = () => CalendarHelper.downloadIcs(calendarEvent);

    notifySimulatedEmail(state.user.email, 'Cita Agendada — Agendly');
    apptState.currentStep = 4;
    updateWizardUI();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar Cita ✨';
  }
};

// ─── Cancelación ────────────────────────────────────────────────────────────
window.openCancelModal = (id) => {
  apptToCancel = id;
  openModal('cancelModal');
};

window.confirmCancelAppointment = async () => {
  try {
    await API.put(`/api/appointments/${apptToCancel}/cancel`);
    showToast('Cita cancelada correctamente', 'success');
    closeModal('cancelModal');
    if (state.activePage === 'appointments') loadAppointments();
    if (state.activePage === 'today') loadTodayAppointments();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// ─── Citas de Hoy (Admin) ──────────────────────────────────────────────────
window.loadTodayAppointments = async () => {
  try {
    const container = document.getElementById('todayList');
    container.innerHTML = '<div class="spinner"></div>';

    const appointments = await API.get('/api/appointments');
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.startTime.startsWith(today));

    document.getElementById('todayDateLabel').textContent = new Intl.DateTimeFormat('es-ES', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }).format(new Date());

    if (todayAppts.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:4rem; border: 1px dashed var(--glass-border);">
          <p class="text-muted">No hay citas programadas para hoy.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = todayAppts.map(appt => {
      const time = new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="appointment-card animate-up">
          <div class="appt-time-v2">
            <div class="day" style="font-size: 1.2rem;">${time}</div>
          </div>
          <div class="appt-info-v2">
            <h4>${appt.client.name}</h4>
            <p>${appt.notes || 'Consulta General'}</p>
          </div>
          <div style="display: flex; gap: 1rem; align-items: center; margin-left: auto;">
            <span class="status-badge status-${appt.status}">${appt.status}</span>
            ${appt.status !== 'cancelled' ? `
              <button class="btn btn-ghost btn-sm" onclick="openCancelModal('${appt._id}')" style="color: var(--c-danger);">Cancelar</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
};
