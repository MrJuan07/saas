/**
 * company.js - Lógica de perfil de empresa y horarios
 */

// ─── Estado de Empresa ───────────────────────────────────────────────────────
let currentCompany = null;

// ─── Cargar Perfil de Empresa ────────────────────────────────────────────────
window.loadCompanyProfile = async () => {
  const form = document.getElementById('companyForm');
  const noMsg = document.getElementById('noCompanyMsg');
  
  try {
    const company = await API.get('/api/companies/me');
    
    if (!company) {
      noMsg.classList.remove('hidden');
      form.classList.add('hidden');
      return;
    }

    currentCompany = company;
    noMsg.classList.add('hidden');
    form.classList.remove('hidden');

    // Llenar formulario
    document.getElementById('compName').value = company.name;
    document.getElementById('compDescription').value = company.description || '';
    document.getElementById('compAddress').value = company.address || '';
    document.getElementById('compPhone').value = company.phone || '';
    document.getElementById('compEmail').value = company.email || '';
    document.getElementById('compCategory').value = company.category || 'General';
    document.getElementById('compDuration').value = company.appointmentDuration || 30;

    // Update booking link
    const slug = company.name.toLowerCase().replace(/ /g, '-');
    document.getElementById('compBookingLink').value = `https://agendly.io/book/${slug}`;

    // Cargar horarios
    renderSchedule(company.schedule);
  } catch (error) {
    if (error.message.includes('encontrada')) {
      noMsg.classList.remove('hidden');
      form.classList.add('hidden');
    } else {
      showToast(error.message, 'error');
    }
  }
};

function renderSchedule(schedule) {
  const container = document.getElementById('scheduleEditor');
  if (!container) return;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
  };

  container.innerHTML = days.map(day => {
    const s = schedule[day] || { enabled: false, open: '09:00', close: '18:00' };
    return `
      <div class="schedule-row ${s.enabled ? 'active' : ''}" id="row-${day}">
        <div class="day-check">
          <input type="checkbox" id="check-${day}" ${s.enabled ? 'checked' : ''} onchange="toggleDay('${day}')" />
          <label for="check-${day}">${dayNames[day]}</label>
        </div>
        <div class="day-times ${s.enabled ? '' : 'hidden'}">
          <input type="time" id="open-${day}" value="${s.open}" class="time-input" />
          <span>a</span>
          <input type="time" id="close-${day}" value="${s.close}" class="time-input" />
        </div>
        <div class="day-closed ${s.enabled ? 'hidden' : ''}">Cerrado</div>
      </div>
    `;
  }).join('');
}

window.toggleDay = (day) => {
  const row = document.getElementById(`row-${day}`);
  const times = row.querySelector('.day-times');
  const closed = row.querySelector('.day-closed');
  const checked = document.getElementById(`check-${day}`).checked;

  row.classList.toggle('active', checked);
  times.classList.toggle('hidden', !checked);
  closed.classList.toggle('hidden', checked);
};

window.saveCompany = async () => {
  const btn = event.currentTarget;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const schedule = {};
  days.forEach(day => {
    schedule[day] = {
      enabled: document.getElementById(`check-${day}`).checked,
      open: document.getElementById(`open-${day}`).value,
      close: document.getElementById(`close-${day}`).value,
    };
  });

  const payload = {
    name: document.getElementById('compName').value,
    description: document.getElementById('compDescription').value,
    address: document.getElementById('compAddress').value,
    phone: document.getElementById('compPhone').value,
    email: document.getElementById('compEmail').value,
    category: document.getElementById('compCategory').value,
    appointmentDuration: parseInt(document.getElementById('compDuration').value),
    schedule,
  };

  try {
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    if (currentCompany) {
      await API.put('/api/companies/update', payload);
    } else {
      await API.post('/api/companies/register', payload);
    }

    showToast('Empresa guardada con éxito', 'success');
    loadCompanyProfile();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>💾</span> Guardar cambios';
  }
};

window.copyBookingLink = () => {
  const link = document.getElementById('compBookingLink');
  link.select();
  link.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(link.value);
  showToast('¡Enlace copiado al portapapeles!', 'success');
};
