/* =========================================================
   DentNova — Dashboard (Panel) Mantığı
   ========================================================= */

function initDashboardPage(){
  if (!currentUser()){ location.href = 'login.html'; return; }
  renderDashboard();
  window.addEventListener('hashchange', renderDashboard);
}

function renderDashboard(){
  const u = currentUser();
  if (!u){ location.href = 'login.html'; return; }

  const tab = (location.hash || '#').replace('#', '') || '';
  let tabs, active = tab, content;

  if (u.role === 'admin'){
    tabs = [
      ['stats','Genel Bakış','chart'],
      ['users','Kullanıcılar','users'],
      ['appointments','Randevular','calendar']
    ];
    if (!['stats','users','appointments'].includes(active)) active = 'stats';
    content = active === 'users'        ? adminUsersView()
            : active === 'appointments' ? adminAppointmentsView()
            : adminStatsView();
  } else if (u.role === 'doctor'){
    tabs = [
      ['appointments','Randevular','calendar'],
      ['mails','Maillerim','mail'],
      ['stats','İstatistikler','chart'],
      ['hours','Çalışma Saatleri','clock']
    ];
    if (!['appointments','mails','stats','hours'].includes(active)) active = 'appointments';
    content = active === 'mails' ? mailView(u)
            : active === 'stats' ? doctorStatsView(u)
            : active === 'hours' ? doctorHoursView(u)
            : doctorAppointmentsView(u);
  } else {
    tabs = [
      ['appointments','Randevularım','calendar'],
      ['mails','Maillerim','mail']
    ];
    if (!['appointments','mails'].includes(active)) active = 'appointments';
    content = active === 'mails' ? mailView(u) : userAppointmentsView(u);
  }

  document.getElementById('dashboard-root').innerHTML = dashShell(u, active, tabs, content);
  bindDashboardEvents(u);
}

function dashShell(u, active, tabs, content){
  const roleLabel = u.role === 'admin' ? 'Yönetici' : u.role === 'doctor' ? 'Doktor' : 'Hasta';
  return `<div class="dash">
    <aside class="dash-side">
      <div class="dash-user">
        <div class="avatar">${esc(initials(u.name))}</div>
        <div>
          <div class="nm">${u.role === 'doctor' ? 'Dr. ' : ''}${esc(u.name)}</div>
          <div class="rl">${roleLabel}</div>
        </div>
      </div>
      <nav class="dash-nav">
        ${tabs.map(([key, label, ic]) => `
          <a href="#${key}" class="${active === key ? 'active' : ''}">
            ${icon(ic,17)} ${label}
          </a>`).join('')}
        <a href="index.html" class="nav-gap">${icon('home',17)} Siteye Dön</a>
        <a href="#" data-action="logout" class="nav-danger">${icon('logout',17)} Çıkış Yap</a>
      </nav>
    </aside>
    <section class="dash-main">${content}</section>
  </div>`;
}

function statCard(num, label, ic, cls){
  return `<div class="stat">
    <div class="st-top"><div class="st-ic ${cls}">${icon(ic,19)}</div></div>
    <div class="st-num">${num}</div>
    <div class="st-lab">${label}</div>
  </div>`;
}

function barsChart(rows){
  const max = Math.max(1, ...rows.map(r => r.value));
  return `<div class="bars">${rows.map(r => `
    <div class="bar-row">
      <span class="bar-label" title="${esc(r.label)}">${esc(r.label)}</span>
      <div class="bar-track"><div class="bar-fill ${r.cls || ''}" style="width:${Math.round(r.value / max * 100)}%"></div></div>
      <span class="bar-val">${r.value}</span>
    </div>`).join('')}</div>`;
}

function statusBadge(s){
  const m = STATUS[s] || STATUS.pending;
  return `<span class="badge ${m.cls}">${m.label}</span>`;
}

/* ==========================================================
   MAIL: okundu durumu (localStorage)
   ========================================================== */
const READ_KEY = 'dentnova_read_mails';
function readSet(){
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
  catch { return new Set(); }
}
function isMailRead(id){ return readSet().has(id); }
function markMailRead(id){
  const set = readSet();
  if (set.has(id)) return;
  set.add(id);
  localStorage.setItem(READ_KEY, JSON.stringify([...set]));
}

/* ==========================================================
   MAIL: üretim
   ========================================================== */
function getMailsForUser(u){
  const mails = [];
  const applyRead = m => { m.unread = !isMailRead(m.id); return m; };

  if (u.role === 'user'){
    apptOfUser(u.id).forEach(a => {
      const doc = userById(a.doctorId);
      const docName = doc ? `Dr. ${doc.name}` : 'Doktor';
      const base = { appt: a, doc, docName };

      mails.push(applyRead({
        id: a.id + '-created',
        subject: 'Randevunuz Alındı — Onay Bekliyor',
        from: 'DentNova Klinik', fromEmail: 'dentnova@gmail.com', to: u.email,
        createdAt: a.date + 'T08:00',
        statusKind:'info', statusLabel:'⏳ Onay Bekliyor',
        title:'Randevu Talebiniz Alındı',
        intro:'Sayın hastamız, randevu talebiniz başarıyla alınmıştır. Klinik ekibimiz tarafından en kısa sürede onaylanacaktır.',
        closing:'Randevunuz onaylandığında bilgilendirme maili tarafınıza iletilecektir.',
        ...base
      }));

      if (a.status === 'confirmed' || a.status === 'completed'){
        mails.push(applyRead({
          id: a.id + '-confirmed',
          subject: 'Randevunuz Onaylandı ✅',
          from: 'DentNova Klinik', fromEmail: 'dentnova@gmail.com', to: u.email,
          createdAt: a.date + 'T09:30',
          statusKind:'success', statusLabel:'✅ Onaylandı',
          title:'Randevunuz Onaylandı',
          intro:'Sayın hastamız, randevunuz klinik ekibimiz tarafından onaylanmıştır. Belirtilen tarih ve saatte sizi aramızda görmekten mutluluk duyarız.',
          closing:'Lütfen randevunuzdan 10 dakika önce klinikte olunuz.',
          ...base
        }));
      }
      if (a.status === 'completed'){
        mails.push(applyRead({
          id: a.id + '-completed',
          subject: 'Randevunuz Tamamlandı — Bizi Değerlendirin 🌟',
          from: 'DentNova Klinik', fromEmail: 'dentnova@gmail.com', to: u.email,
          createdAt: a.date + 'T' + (a.time || '15:00'),
          statusKind:'done', statusLabel:'✔️ Tamamlandı',
          title:'Randevunuz Tamamlandı',
          intro:"Sayın hastamız, randevunuz başarıyla tamamlanmıştır. DentNova'yı tercih ettiğiniz için teşekkür ederiz.",
          closing:'Deneyiminizi bizimle paylaşmak isterseniz geri bildirim formunu doldurabilirsiniz.',
          ...base
        }));
      }
      if (a.status === 'cancelled'){
        mails.push(applyRead({
          id: a.id + '-cancelled',
          subject: 'Randevunuz İptal Edildi ❌',
          from: 'DentNova Klinik', fromEmail: 'dentnova@gmail.com', to: u.email,
          createdAt: a.date + 'T' + (a.time || '10:00'),
          statusKind:'danger', statusLabel:'❌ İptal Edildi',
          title:'Randevunuz İptal Edildi',
          intro:'Sayın hastamız, randevunuz iptal edilmiştir. Yeni bir randevu oluşturmak için web sitemizi ziyaret edebilirsiniz.',
          closing:'İptalin size ait olmadığını düşünüyorsanız lütfen klinik ile iletişime geçiniz.',
          ...base
        }));
      }
    });
  }
  else if (u.role === 'doctor'){
    apptOfDoctor(u.id).forEach(a => {
      const p = userById(a.userId);
      const pName = p ? p.name : 'Hasta';
      const base = { appt: a, patient: p, patientName: pName };

      mails.push(applyRead({
        id: a.id + '-doctor-new',
        subject: `Yeni Randevu Talebi: ${pName}`,
        from: 'DentNova Klinik', fromEmail: 'dentnova@gmail.com', to: u.email,
        createdAt: a.date + 'T08:15',
        statusKind:'info', statusLabel:'📥 Yeni Talep',
        title:'Yeni Randevu Talebi',
        intro:`${pName} adlı hasta için yeni bir randevu talebi oluşturuldu.`,
        closing:'Randevuyu onaylamak veya iptal etmek için panelinizdeki "Randevular" sekmesini kullanabilirsiniz.',
        ...base
      }));

      if (a.status === 'cancelled'){
        mails.push(applyRead({
          id: a.id + '-doctor-cancel',
          subject: `Randevu İptal Edildi: ${pName}`,
          from: 'DentNova Klinik', fromEmail: 'dentnova@gmail.com', to: u.email,
          createdAt: a.date + 'T09:45',
          statusKind:'danger', statusLabel:'❌ İptal Edildi',
          title:'Randevu İptal Edildi',
          intro:`${pName} adlı hastanın randevusu iptal edilmiştir.`,
          closing:'Detaylar için panelinizdeki "Randevular" sekmesini inceleyebilirsiniz.',
          ...base
        }));
      }
    });
  }

  mails.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return mails;
}

/* ==========================================================
   MAIL: görünüm
   ========================================================== */
function mailView(u){
  const mails = getMailsForUser(u);

  if (!mails.length){
    return `
      <div class="page-head">
        <div>
          <h1>${u.role === 'admin' ? 'Mailler' : 'Maillerim'}</h1>
          <p class="sub">Randevu bildirimleriniz burada görüntülenir.</p>
        </div>
      </div>
      <div class="mail-empty">
        <svg width="76" height="76" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.4"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <h3>Mail kutunuz boş</h3>
        <p>Henüz bir randevu bildirimi bulunmuyor. Randevu oluşturduğunuzda veya randevu durumunuz değiştiğinde bildirimler burada görünecektir.</p>
      </div>`;
  }

  window.__currentMails = mails;
  const unreadCount = mails.filter(m => m.unread).length;

  const listHtml = mails.map((m, i) => `
    <div class="mail-item-row ${m.unread ? 'unread' : ''} ${i === 0 ? 'active' : ''}"
         data-mail-idx="${i}">
      <div class="mi-avatar">DN</div>
      <div class="mi-content">
        <div class="mi-from">
          <span>${esc(m.from)}</span>
          <span class="t">${esc(fmtShortDate(m.appt.date))}</span>
        </div>
        <div class="mi-subject">${esc(m.subject)}</div>
        <div class="mi-snippet">${esc(m.intro)}</div>
      </div>
    </div>`).join('');

  return `
    <div class="page-head">
      <div>
        <h1>${u.role === 'admin' ? 'Mailler' : 'Maillerim'}</h1>
        <p class="sub">Randevu bildirimlerinizi buradan görüntüleyebilirsiniz.</p>
      </div>
      <span class="chip" id="mail-unread-count">
        ${icon('mail',13)} ${unreadCount} okunmamış
      </span>
    </div>
    <div class="mail-layout">
      <aside class="mail-side">
        <div class="mail-side-head">
          <h3>Gelen Kutusu</h3>
          <p>Gönderen: <strong>DentNova Klinik</strong> <code>dentnova@gmail.com</code></p>
        </div>
        ${listHtml}
      </aside>
      <section class="mail-reader" id="mail-reader">
        <div class="mail-reader-inner" id="mail-reader-inner">
          ${renderMailReader(mails[0])}
        </div>
      </section>
    </div>`;
}

function renderMailReader(m){
  const a = m.appt;
  const doc = m.doc || userById(a.doctorId);
  const docName = doc ? `Dr. ${doc.name}` : 'Doktor';
  const recipientName = m.patientName
    || (userById(a.userId)?.name) || 'Hasta';
  const code = (a.id || '').replace(/[^a-z0-9]/gi,'').slice(-8).toUpperCase();

  return `
    <div class="mail-meta-card">
      <h2 class="subject">${esc(m.subject)}</h2>
      <div class="sender-row">
        <div class="avatar">DN</div>
        <div class="who">
          <div class="from">${esc(m.from)}
            <span class="addr">&lt;${esc(m.fromEmail)}&gt;</span>
          </div>
          <div class="to">Alıcı: <code>${esc(m.to)}</code></div>
        </div>
        <div class="date">${esc(fmtShortDate(a.date))}</div>
      </div>
    </div>
    <div class="mail-body-card">
      <div class="email-brand-header">
        <div class="logo">DentNova</div>
        <div class="tag">Sağlıklı Gülüşler, Güvenli Dokunuşlar</div>
      </div>
      <div class="email-content">
        <span class="email-badge ${m.statusKind}">${m.statusLabel}</span>
        <h2>${esc(m.title)}</h2>
        <p>Sayın <strong>${esc(recipientName)}</strong>,</p>
        <p>${esc(m.intro)}</p>
        <div class="appt-detail-box">
          <div class="box-title">Randevu Bilgileri</div>
          <div class="appt-detail-row"><span class="k">Randevu Kodu</span><span class="v">DN-${esc(code)}</span></div>
          <div class="appt-detail-row"><span class="k">Hekim</span><span class="v">${esc(docName)}</span></div>
          <div class="appt-detail-row"><span class="k">Tedavi</span><span class="v">${esc(a.treatment || '—')}</span></div>
          <div class="appt-detail-row"><span class="k">Tarih</span><span class="v">${esc(fmtShortDate(a.date))}</span></div>
          <div class="appt-detail-row"><span class="k">Saat</span><span class="v">${esc(a.time)}</span></div>
        </div>
        <p>${esc(m.closing)}</p>
      </div>
      <div class="email-footer">
        <p><span class="brand-name">DentNova Klinik</span> — Ağız ve Diş Sağlığı Merkezi</p>
        <p>Bu e-posta <strong>${esc(m.to)}</strong> adresine randevu bildirimi amacıyla gönderilmiştir.</p>
        <p>Gönderen: DentNova Klinik &lt;dentnova@gmail.com&gt;</p>
      </div>
    </div>`;
}

/* ==========================================================
   HASTA
   ========================================================== */
function userAppointmentsView(u){
  const list = apptOfUser(u.id).slice().sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));
  const upcoming = list.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const completed = list.filter(a => a.status === 'completed');
  const cancelled = list.filter(a => a.status === 'cancelled');

  const rows = list.slice().reverse().map(a => `
    <tr>
      <td><div class="cell-main">${esc(fmtShortDate(a.date))}</div>
          <div class="cell-sub">${esc(a.time)}</div></td>
      <td><div class="cell-main">${esc(doctorName(a.doctorId))}</div>
          <div class="cell-sub">${esc(userById(a.doctorId)?.specialty || '')}</div></td>
      <td>${esc(a.treatment || '—')}</td>
      <td>${statusBadge(a.status)}</td>
      <td>
        ${(a.status === 'pending' || a.status === 'confirmed')
          ? `<button class="btn btn-danger btn-sm" data-action="cancel-appt" data-id="${a.id}">İptal Et</button>`
          : `<span class="muted muted-sm">—</span>`}
      </td>
    </tr>`).join('');

  return `
    <div class="page-head">
      <div><h1>Randevularım</h1><p class="sub">Tüm randevularınızı buradan takip edebilirsiniz.</p></div>
      <button class="btn btn-primary btn-sm" id="new-appt-btn">${icon('plus',16)} Yeni Randevu</button>
    </div>
    <div class="stat-grid">
      ${statCard(upcoming.length, 'Yaklaşan Randevu', 'calendar', 'ic-teal')}
      ${statCard(completed.length, 'Tamamlanan', 'checkCircle', 'ic-ok')}
      ${statCard(cancelled.length, 'İptal Edilen', 'x', 'ic-danger')}
      ${statCard(list.length, 'Toplam Randevu', 'chart', 'ic-info')}
    </div>
    <div class="table-wrap">
      ${list.length ? `<div class="table-scroll"><table>
        <thead><tr><th>Tarih / Saat</th><th>Doktor</th><th>Tedavi</th><th>Durum</th><th>İşlem</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">${icon('calendar',46)}<h3>Henüz randevunuz yok</h3>
            <p class="muted">Aşağıdaki butonla ilk randevunuzu oluşturun.</p>
            <button class="btn btn-primary" id="new-appt-btn-empty">${icon('plus',16)} Yeni Randevu</button></div>`}
    </div>`;
}

/* ==========================================================
   DOKTOR
   ========================================================== */
function doctorAppointmentsView(u){
  const list = apptOfDoctor(u.id).slice().sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));
  const rows = list.slice().reverse().map(a => {
    const p = userById(a.userId);
    return `<tr>
      <td><div class="cell-main">${esc(fmtShortDate(a.date))}</div>
          <div class="cell-sub">${esc(a.time)}</div></td>
      <td><div class="cell-main">${esc(p ? p.name : 'Silinmiş')}</div>
          <div class="cell-sub">${esc(p?.phone || p?.email || '')}</div></td>
      <td>${esc(a.treatment || '—')}</td>
      <td>${statusBadge(a.status)}</td>
      <td><div class="actions">
        ${a.status === 'pending' ? `<button class="btn btn-ok btn-sm" data-action="set-status" data-id="${a.id}" data-status="confirmed">Onayla</button>` : ''}
        ${a.status === 'confirmed' ? `<button class="btn btn-ok btn-sm" data-action="set-status" data-id="${a.id}" data-status="completed">Tamamla</button>` : ''}
        ${(a.status === 'pending' || a.status === 'confirmed') ? `<button class="btn btn-danger btn-sm" data-action="set-status" data-id="${a.id}" data-status="cancelled">İptal</button>` : ''}
      </div></td>
    </tr>`;
  }).join('');

  const pending = list.filter(a => a.status === 'pending').length;

  return `
    <div class="page-head">
      <div><h1>Randevularım</h1><p class="sub">Hastalarınızın randevu taleplerini yönetin.</p></div>
      ${pending ? `<span class="badge warn">${icon('info',13)} ${pending} onay bekliyor</span>` : ''}
    </div>
    <div class="table-wrap">
      ${list.length ? `<div class="table-scroll"><table>
        <thead><tr><th>Tarih / Saat</th><th>Hasta</th><th>Tedavi</th><th>Durum</th><th>İşlemler</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">${icon('calendar',46)}<h3>Henüz randevu yok</h3><p class="muted">Hastalar randevu aldığında burada görünür.</p></div>`}
    </div>`;
}

function doctorStatsView(u){
  const list = apptOfDoctor(u.id);
  const c = s => list.filter(a => a.status === s).length;
  const today = todayISO();
  const weekEnd = shiftISO(7);
  const thisWeek = list.filter(a => a.date >= today && a.date <= weekEnd && a.status !== 'cancelled').length;
  const todayCount = list.filter(a => a.date === today && a.status !== 'cancelled').length;

  const byHour = {};
  list.forEach(a => { if (a.status !== 'cancelled') byHour[a.time] = (byHour[a.time] || 0) + 1; });
  const hourRows = Object.entries(byHour).sort((a,b) => b[1] - a[1]).slice(0,6)
    .map(([t, v]) => ({ label: t, value: v }));

  const byTreat = {};
  list.forEach(a => { byTreat[a.treatment || 'Diğer'] = (byTreat[a.treatment || 'Diğer'] || 0) + 1; });
  const treatRows = Object.entries(byTreat).sort((a,b) => b[1] - a[1]).slice(0,6)
    .map(([t, v]) => ({ label: t, value: v }));

  const upcoming = list.filter(a => a.date >= today && (a.status === 'pending' || a.status === 'confirmed'))
    .sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0,5);

  return `
    <div class="page-head"><div><h1>İstatistikler</h1><p class="sub">Randevu performansınızın özeti.</p></div></div>
    <div class="stat-grid">
      ${statCard(list.length, 'Toplam Randevu', 'calendar', 'ic-teal')}
      ${statCard(c('pending'), 'Onay Bekleyen', 'clock', 'ic-warn')}
      ${statCard(c('confirmed'), 'Onaylanan', 'check', 'ic-info')}
      ${statCard(c('completed'), 'Tamamlanan', 'checkCircle', 'ic-ok')}
      ${statCard(c('cancelled'), 'İptal', 'x', 'ic-danger')}
      ${statCard(thisWeek, 'Bu Hafta', 'chart', 'ic-teal')}
    </div>
    <div class="grid-2">
      <div class="panel"><h3>${icon('chart',18)} Durum Dağılımı</h3>
        ${barsChart([
          { label:'Onay Bekliyor', value:c('pending'),   cls:'warn'   },
          { label:'Onaylandı',     value:c('confirmed'), cls:'info'   },
          { label:'Tamamlandı',    value:c('completed'), cls:'ok'     },
          { label:'İptal Edildi',  value:c('cancelled'), cls:'danger' }
        ])}</div>
      <div class="panel"><h3>${icon('clock',18)} En Yoğun Saatler</h3>
        ${hourRows.length ? barsChart(hourRows) : '<p class="muted">Yeterli veri yok.</p>'}</div>
    </div>
    <div class="grid-2">
      <div class="panel"><h3>${icon('stethoscope',18)} Tedavi Dağılımı</h3>
        ${treatRows.length ? barsChart(treatRows) : '<p class="muted">Yeterli veri yok.</p>'}</div>
      <div class="panel"><h3>${icon('calendar',18)} Yaklaşan Randevular ${todayCount ? `<span class="chip ml-auto">Bugün ${todayCount}</span>` : ''}</h3>
        ${upcoming.length ? `<div class="upcoming-list">${upcoming.map(a => {
          const p = userById(a.userId);
          return `<div class="upcoming-item">
            <div><div style="font-weight:700">${esc(p ? p.name : 'Silinmiş')}</div>
            <div class="cell-sub">${esc(fmtShortDate(a.date))} • ${esc(a.time)} • ${esc(a.treatment || '')}</div></div>
            ${statusBadge(a.status)}</div>`;
        }).join('')}</div>` : '<p class="muted">Yaklaşan randevu bulunmuyor.</p>'}</div>
    </div>`;
}

function doctorHoursView(u){
  const wh = u.workingHours || {};
  const rows = DAYS.map(d => {
    const h = wh[d.key];
    return `<div class="hour-row">
      <label class="switch">
        <input type="checkbox" name="enabled_${d.key}" ${h ? 'checked' : ''}>
        <span>${d.label}</span>
      </label>
      <input type="time" name="start_${d.key}" value="${h ? h.start : '09:00'}" ${h ? '' : 'disabled'}>
      <span class="dash">–</span>
      <input type="time" name="end_${d.key}" value="${h ? h.end : '17:00'}" ${h ? '' : 'disabled'}>
    </div>`;
  }).join('');

  return `
    <div class="page-head"><div><h1>Çalışma Saatleri & Profil</h1>
      <p class="sub">Haftalık planınız ana sayfadaki kartınızın hemen altında görüntülenir.</p></div></div>
    <div class="panel"><h3>${icon('user',18)} Profil Bilgileri</h3>
      <form id="doc-profile-form">
        <div class="field-row">
          <div class="field"><label>Ad Soyad</label><input class="input" name="name" value="${esc(u.name)}" required></div>
          <div class="field"><label>Ünvan</label><input class="input" name="title" value="${esc(u.title || '')}"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Uzmanlık</label><input class="input" name="specialty" value="${esc(u.specialty || '')}"></div>
          <div class="field"><label>Telefon</label><input class="input" name="phone" value="${esc(u.phone || '')}"></div>
        </div>
        <div class="field"><label>Biyografi</label><textarea class="input" name="bio" rows="3">${esc(u.bio || '')}</textarea></div>
        <button class="btn btn-primary" type="submit">Profili Kaydet</button>
      </form>
    </div>
    <div class="panel"><h3>${icon('clock',18)} Haftalık Çalışma Planı</h3>
      <form id="hours-form">
        <div style="margin-bottom:16px">${rows}</div>
        <button class="btn btn-primary" type="submit">Planı Kaydet</button>
      </form>
    </div>`;
}

/* ==========================================================
   ADMİN
   ========================================================== */
function adminStatsView(){
  const allUsers = store.allUsers();
  const totalUsers = allUsers.filter(u => u.role === 'user').length;
  const totalDocs = doctors().length;
  const list = store.allAppts();
  const c = s => list.filter(a => a.status === s).length;

  const perDoc = doctors().map(d => ({ label: `Dr. ${d.name}`, value: apptOfDoctor(d.id).length }))
    .sort((a,b) => b.value - a.value);

  const months = (() => {
    const out = []; const d = new Date(); d.setDate(1);
    for (let i = 5; i >= 0; i--){
      const t = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push({ key: `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`,
                 label: t.toLocaleDateString('tr-TR', { month:'short', year:'2-digit' }) });
    }
    return out;
  })();
  const monthRows = months.map(m => ({
    label: m.label,
    value: list.filter(a => (a.date || '').slice(0,7) === m.key).length
  }));

  const todayCount = list.filter(a => a.date === todayISO() && a.status !== 'cancelled').length;

  return `
    <div class="page-head"><div><h1>Genel Bakış</h1><p class="sub">Klinik genelindeki tüm veriler.</p></div>
      <span class="chip">${icon('calendar',13)} Bugün ${todayCount} randevu</span></div>
    <div class="stat-grid">
      ${statCard(totalUsers, 'Kayıtlı Hasta', 'users', 'ic-info')}
      ${statCard(totalDocs, 'Doktor', 'stethoscope', 'ic-teal')}
      ${statCard(list.length, 'Toplam Randevu', 'calendar', 'ic-teal')}
      ${statCard(c('pending'), 'Onay Bekleyen', 'clock', 'ic-warn')}
      ${statCard(c('completed'), 'Tamamlanan', 'checkCircle', 'ic-ok')}
      ${statCard(c('cancelled'), 'İptal', 'x', 'ic-danger')}
    </div>
    <div class="grid-2">
      <div class="panel"><h3>${icon('chart',18)} Durum Dağılımı</h3>
        ${barsChart([
          { label:'Onay Bekliyor', value:c('pending'),   cls:'warn'   },
          { label:'Onaylandı',     value:c('confirmed'), cls:'info'   },
          { label:'Tamamlandı',    value:c('completed'), cls:'ok'     },
          { label:'İptal Edildi',  value:c('cancelled'), cls:'danger' }
        ])}</div>
      <div class="panel"><h3>${icon('stethoscope',18)} Doktor Bazlı Randevular</h3>
        ${perDoc.length ? barsChart(perDoc) : '<p class="muted">Doktor yok.</p>'}</div>
    </div>
    <div class="panel"><h3>${icon('calendar',18)} Son 6 Ay Randevu Trendi</h3>${barsChart(monthRows)}</div>`;
}

function adminUsersView(){
  const rows = store.allUsers().map(u => {
    const cnt = u.role === 'doctor' ? apptOfDoctor(u.id).length : apptOfUser(u.id).length;
    const roleLabel = u.role === 'admin' ? 'Yönetici' : u.role === 'doctor' ? 'Doktor' : 'Hasta';
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:11px">
        <div class="avatar avatar-sm">${esc(initials(u.name))}</div>
        <div><div class="cell-main">${esc(u.name)}</div><div class="cell-sub">${esc(u.email)}</div></div></div></td>
      <td>${esc(u.phone || '—')}</td>
      <td>${u.role === 'admin'
        ? `<span class="badge danger">${icon('shield',12)} ${roleLabel}</span>`
        : `<select class="input role-select" data-action="change-role" data-id="${u.id}">
            <option value="user" ${u.role === 'user' ? 'selected' : ''}>Hasta</option>
            <option value="doctor" ${u.role === 'doctor' ? 'selected' : ''}>Doktor</option>
          </select>`}</td>
      <td><span class="chip">${cnt} randevu</span></td>
      <td>${u.role === 'admin'
        ? '<span class="muted muted-sm">Korumalı</span>'
        : `<button class="btn btn-danger btn-sm" data-action="delete-user" data-id="${u.id}">${icon('trash',14)} Sil</button>`}</td>
    </tr>`;
  }).join('');

  return `
    <div class="page-head"><div><h1>Kullanıcılar</h1>
      <p class="sub">Rolü "Doktor" yapılan kullanıcılar ana sayfada görünür.</p></div>
      <span class="chip">${icon('stethoscope',13)} ${doctors().length} doktor</span></div>
    <div class="table-wrap"><div class="table-scroll"><table>
      <thead><tr><th>Kullanıcı</th><th>Telefon</th><th>Rol</th><th>Randevu</th><th>İşlem</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
}

function adminAppointmentsView(){
  const list = store.allAppts().slice().sort((a,b) => (b.date + b.time).localeCompare(a.date + a.time));
  const rows = list.map(a => {
    const p = userById(a.userId);
    return `<tr>
      <td><div class="cell-main">${esc(fmtShortDate(a.date))}</div><div class="cell-sub">${esc(a.time)}</div></td>
      <td><div class="cell-main">${esc(p ? p.name : 'Silinmiş')}</div><div class="cell-sub">${esc(p?.email || '')}</div></td>
      <td>${esc(doctorName(a.doctorId))}</td>
      <td>${esc(a.treatment || '—')}</td>
      <td>${statusBadge(a.status)}</td>
      <td><div class="actions">
        ${a.status === 'pending' ? `<button class="btn btn-ok btn-sm" data-action="set-status" data-id="${a.id}" data-status="confirmed">Onayla</button>` : ''}
        ${a.status === 'confirmed' ? `<button class="btn btn-ok btn-sm" data-action="set-status" data-id="${a.id}" data-status="completed">Tamamla</button>` : ''}
        ${(a.status === 'pending' || a.status === 'confirmed') ? `<button class="btn btn-warn btn-sm" data-action="set-status" data-id="${a.id}" data-status="cancelled">İptal</button>` : ''}
        <button class="btn btn-danger btn-sm" data-action="delete-appt" data-id="${a.id}">${icon('trash',14)}</button>
      </div></td>
    </tr>`;
  }).join('');

  return `
    <div class="page-head"><div><h1>Randevular</h1><p class="sub">Tüm randevuları yönetin.</p></div>
      <span class="chip">${icon('calendar',13)} ${list.length} kayıt</span></div>
    <div class="table-wrap">${list.length ? `<div class="table-scroll"><table>
      <thead><tr><th>Tarih / Saat</th><th>Hasta</th><th>Doktor</th><th>Tedavi</th><th>Durum</th><th>İşlemler</th></tr></thead>
      <tbody>${rows}</tbody></table></div>` : `<div class="empty">${icon('calendar',46)}<h3>Randevu kaydı yok</h3></div>`}</div>`;
}

/* ==========================================================
   OLAY BAĞLAMA (dashboard içi)
   ========================================================== */
function bindDashboardEvents(u){
  // Randevu butonları
  ['new-appt-btn', 'new-appt-btn-empty'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => openBookingModal());
  });

  // Çalışma saati checkbox → time input enable/disable
  document.querySelectorAll('.hour-row input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const row = cb.closest('.hour-row');
      row.querySelectorAll('input[type=time]').forEach(i => { i.disabled = !cb.checked; });
    });
  });

  // Rol değiştir
  document.querySelectorAll('[data-action="change-role"]').forEach(sel => {
    sel.addEventListener('change', e => {
      const me = currentUser();
      if (!me || me.role !== 'admin') return;
      const target = userById(sel.dataset.id);
      if (!target || target.role === 'admin') return;
      store.updateUser(target.id, {
        role: sel.value,
        ...(sel.value === 'doctor' && !target.workingHours
          ? { workingHours: defaultHours() }
          : {})
      });
      toast(`${target.name} artık ${sel.value === 'doctor' ? 'doktor' : 'hasta'} olarak görünecek.`);
      renderDashboard();
    });
  });

  // Profil formu
  const profForm = document.getElementById('doc-profile-form');
  if (profForm){
    profForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = currentUser();
      if (!me || me.role !== 'doctor') return;
      store.updateUser(me.id, {
        name:      profForm.name.value.trim() || me.name,
        title:     profForm.title.value.trim(),
        specialty: profForm.specialty.value.trim(),
        phone:     profForm.phone.value.trim(),
        bio:       profForm.bio.value.trim()
      });
      toast('Profil kaydedildi.');
      renderDashboard();
    });
  }

  // Çalışma saati formu
  const hoursForm = document.getElementById('hours-form');
  if (hoursForm){
    hoursForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = currentUser();
      if (!me || me.role !== 'doctor') return;
      const wh = {};
      for (const d of DAYS){
        const enabled = hoursForm[`enabled_${d.key}`].checked;
        if (!enabled){ wh[d.key] = null; continue; }
        const start = hoursForm[`start_${d.key}`].value || '09:00';
        const end = hoursForm[`end_${d.key}`].value || '17:00';
        if (start >= end){ toast(`${d.label}: başlangıç bitişten önce olmalı.`, 'err'); return; }
        wh[d.key] = { start, end };
      }
      store.updateUser(me.id, { workingHours: wh });
      toast('Çalışma planı güncellendi.');
      renderDashboard();
    });
  }

  // Mail öğesi tıklama
  document.querySelectorAll('.mail-item-row').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.mailIdx);
      const m = (window.__currentMails || [])[idx];
      if (!m) return;

      document.querySelectorAll('.mail-item-row').forEach(x => x.classList.remove('active'));
      el.classList.add('active');

      if (m.unread){
        m.unread = false;
        el.classList.remove('unread');
        markMailRead(m.id);

        const chip = document.getElementById('mail-unread-count');
        if (chip){
          const count = (window.__currentMails || []).filter(x => x.unread).length;
          chip.innerHTML = `${icon('mail',13)} ${count} okunmamış`;
        }
      }

      const reader = document.getElementById('mail-reader-inner');
      if (reader) reader.innerHTML = renderMailReader(m);

      const readerPane = document.getElementById('mail-reader');
      if (readerPane) readerPane.classList.add('show');
    });
  });
}