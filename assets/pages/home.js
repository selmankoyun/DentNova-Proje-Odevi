/* =========================================================
   DentNova — Ana Sayfa
   ========================================================= */

function initHomePage(){
  document.getElementById('hero-tooth').innerHTML = icon('tooth', 110);
  document.querySelectorAll('[data-icon]').forEach(el => {
    el.innerHTML = icon(el.dataset.icon, 23);
  });

  document.getElementById('home-trust').innerHTML = `
    <div><b>${doctors().length}</b><span>Uzman Hekim</span></div>
    <div><b>${store.allAppts().filter(a => a.status === 'completed').length}+</b><span>Tamamlanan Tedavi</span></div>
    <div><b>${store.allUsers().filter(u => u.role === 'user').length}</b><span>Kayıtlı Hasta</span></div>
    <div><b>7/24</b><span>Online Randevu</span></div>`;

  const grid = document.getElementById('doctors-grid');
  const docs = doctors();
  if (!docs.length){
    grid.innerHTML = `<div class="card empty empty-card-full">
      <h3>Henüz doktor eklenmedi</h3>
      <p class="muted">Yönetici panelinden bir kullanıcıyı "doktor" yapın.</p></div>`;
    return;
  }

  grid.innerHTML = docs.map(d => `
    <article class="doc-card">
      <div class="doc-head">
        <div class="avatar">${esc(initials(d.name))}</div>
        <div>
          <h3>Dr. ${esc(d.name)}</h3>
          <div class="doc-spec">${esc(d.specialty || d.title || 'Diş Hekimi')}</div>
        </div>
      </div>
      <div class="doc-body">
        <p class="doc-bio">${esc(d.bio || 'Kliniğimizin uzman diş hekimlerinden biri.')}</p>
        <div class="doc-meta">
          <span class="chip">${esc(d.title || 'Diş Hekimi')}</span>
          <span class="chip">${apptOfDoctor(d.id).filter(a => a.status === 'completed').length} tamamlanan tedavi</span>
        </div>
      </div>
      <div class="doc-actions">
        <button class="btn btn-primary btn-block" data-book-doc="${d.id}">
          ${icon('calendar',17)} Randevu Al
        </button>
      </div>
      <div class="schedule">
        <div class="schedule-title">${icon('clock',15)} Haftalık Çalışma Saatleri</div>
        ${scheduleList(d)}
      </div>
    </article>
  `).join('');

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-book-doc]');
    if (b) openBookingModal(b.dataset.bookDoc);
  });
}

function scheduleList(u){
  const todayKey = dayKeyOf(todayISO());
  return `<ul>${DAYS.map(d => {
    const h = u.workingHours ? u.workingHours[d.key] : null;
    return `<li class="${h ? '' : 'off'} ${d.key === todayKey ? 'today' : ''}">
      <span class="day">${d.short}${d.key === todayKey ? ' •' : ''}</span>
      <span class="hrs">${h ? `${h.start} – ${h.end}` : 'Kapalı'}</span>
    </li>`;
  }).join('')}</ul>`;
}