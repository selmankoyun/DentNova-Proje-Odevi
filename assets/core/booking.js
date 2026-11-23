/* =========================================================
   DentNova — Randevu Modalı + Durum Güncelleme
   ========================================================= */

let bookingState = { doctorId:'', date:'', time:'', treatment: TREATMENTS[0] };

function openBookingModal(presetDoctorId){
  const u = currentUser();
  if (!u){
    toast('Randevu için giriş yapmalısınız.', 'err');
    setTimeout(() => location.href = 'login.html', 900);
    return;
  }
  if (u.role !== 'user'){
    toast('Sadece hasta hesapları randevu oluşturabilir.', 'err');
    return;
  }

  const docs = doctors();
  if (!docs.length){ toast('Henüz doktor bulunmuyor.', 'err'); return; }

  bookingState = {
    doctorId: presetDoctorId || '',
    date: '',
    time: '',
    treatment: TREATMENTS[0]
  };

  const existing = document.getElementById('booking-backdrop');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'booking-backdrop';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head">
        <h3 id="modal-title">${icon('calendar',18)} Randevu Oluştur</h3>
        <button class="modal-close" data-action="close-modal" aria-label="Kapat">${icon('x',20)}</button>
      </div>
      <div class="modal-body">
        ${!presetDoctorId ? `
          <div class="field">
            <label for="modal-doctor">Doktor Seçin</label>
            <select id="modal-doctor" class="input">
              <option value="">— Doktor seçin —</option>
              ${docs.map(d => `<option value="${d.id}">Dr. ${esc(d.name)} — ${esc(d.specialty || '')}</option>`).join('')}
            </select>
          </div>
        ` : (() => {
          const d = userById(presetDoctorId);
          return d ? `
            <div class="modal-doc-info">
              <div class="avatar">${esc(initials(d.name))}</div>
              <div>
                <div class="cell-main">Dr. ${esc(d.name)}</div>
                <div class="cell-sub">${esc(d.specialty || d.title || '')}</div>
              </div>
            </div>` : '';
        })()}
        <div class="field-row">
          <div class="field">
            <label for="modal-date">Tarih</label>
            <input type="date" id="modal-date" class="input" min="${todayISO()}" value="">
          </div>
          <div class="field">
            <label for="modal-treatment">Tedavi</label>
            <select id="modal-treatment" class="input">
              ${TREATMENTS.map(t => `<option>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="modal-slots-wrap">
          <p class="muted" style="margin:0">Uygun saatleri görmek için doktor ve tarih seçin.</p>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" data-action="close-modal">Vazgeç</button>
        <button class="btn btn-primary" id="modal-confirm" disabled>${icon('check',16)} Randevu Oluştur</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  const doctorSel = document.getElementById('modal-doctor');
  if (doctorSel) doctorSel.value = bookingState.doctorId;

  doctorSel?.addEventListener('change', e => {
    bookingState.doctorId = e.target.value;
    bookingState.time = '';
    renderModalSlots();
  });
  document.getElementById('modal-date').addEventListener('change', e => {
    bookingState.date = e.target.value;
    bookingState.time = '';
    renderModalSlots();
  });
  document.getElementById('modal-treatment').addEventListener('change', e => {
    bookingState.treatment = e.target.value;
  });
  document.getElementById('modal-confirm').addEventListener('click', confirmBooking);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeBookingModal();
  });
  document.addEventListener('keydown', modalEscHandler);
}

function modalEscHandler(e){
  if (e.key === 'Escape') closeBookingModal();
}

function closeBookingModal(){
  const m = document.getElementById('booking-backdrop');
  if (m) m.remove();
  document.body.style.overflow = '';
  document.removeEventListener('keydown', modalEscHandler);
}

function renderModalSlots(){
  const wrap = document.getElementById('modal-slots-wrap');
  const confirmBtn = document.getElementById('modal-confirm');
  if (!wrap || !confirmBtn) return;

  const doc = userById(bookingState.doctorId);
  const date = bookingState.date;

  if (!doc || !date){
    wrap.innerHTML = '<p class="muted" style="margin:0">Uygun saatleri görmek için doktor ve tarih seçin.</p>';
    confirmBtn.disabled = true;
    return;
  }

  const dayKey = dayKeyOf(date);
  const hours = doc.workingHours?.[dayKey];

  if (!hours){
    wrap.innerHTML = `<div class="alert err" style="margin:0">${icon('info',16)}<span>Dr. ${esc(doc.name)} bu gün (${DAYS.find(d=>d.key===dayKey).label}) çalışmıyor. Lütfen başka bir gün seçin.</span></div>`;
    confirmBtn.disabled = true;
    return;
  }

  const slots = timeSlots(hours.start, hours.end, 30);
  const taken = store.allAppts()
    .filter(a => a.doctorId === doc.id && a.date === date && a.status !== 'cancelled')
    .map(a => a.time);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (!slots.length){
    wrap.innerHTML = '<p class="muted">Bu gün için uygun saat bulunmuyor.</p>';
    confirmBtn.disabled = true;
    return;
  }

  wrap.innerHTML = `
    <label style="font-size:13.5px;font-weight:700;margin-bottom:8px;display:block">Saat Seçin</label>
    <div class="slots">
      ${slots.map(s => {
        const isTaken = taken.includes(s);
        const isPast = date === todayISO() && (Number(s.split(':')[0]) * 60 + Number(s.split(':')[1])) <= nowMin;
        const dis = isTaken || isPast;
        return `<button type="button" class="slot ${bookingState.time === s ? 'selected' : ''}"
          ${dis ? 'disabled' : ''} data-time="${s}"
          title="${isTaken ? 'Dolu' : isPast ? 'Geçmiş saat' : 'Seç'}">${s}</button>`;
      }).join('')}
    </div>`;

  wrap.querySelectorAll('.slot[data-time]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      bookingState.time = btn.dataset.time;
      wrap.querySelectorAll('.slot').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      confirmBtn.disabled = false;
    });
  });

  confirmBtn.disabled = !bookingState.time;
}

function confirmBooking(){
  const u = currentUser();
  if (!u) return;

  if (!bookingState.doctorId || !bookingState.date || !bookingState.time){
    toast('Lütfen doktor, tarih ve saat seçin.', 'err');
    return;
  }

  const clash = store.allAppts().some(a =>
    a.doctorId === bookingState.doctorId &&
    a.date === bookingState.date &&
    a.time === bookingState.time &&
    a.status !== 'cancelled');
  if (clash){ toast('Bu saat az önce doldu, başka bir saat seçin.', 'err'); renderModalSlots(); return; }

  store.createAppointment({
    id: uid(),
    userId: u.id,
    doctorId: bookingState.doctorId,
    date: bookingState.date,
    time: bookingState.time,
    status: 'pending',
    treatment: bookingState.treatment,
    note:'',
    createdAt: new Date().toISOString()
  });

  closeBookingModal();
  toast('Randevu talebiniz oluşturuldu! Doktor onayı bekleniyor.');

  if (document.body.dataset.page === 'dashboard' && typeof renderDashboard === 'function'){
    renderDashboard();
  }
}

/* ---------- Randevu durum güncelleme ---------- */
function updateAppointmentStatus(appointmentId, newStatus){
  const a = store.allAppts().find(x => x.id === appointmentId);
  if (!a || a.status === newStatus) return;
  store.updateAppointment(appointmentId, { status: newStatus });
  toast(`Randevu durumu "${STATUS[newStatus].label}" olarak güncellendi.`);
}