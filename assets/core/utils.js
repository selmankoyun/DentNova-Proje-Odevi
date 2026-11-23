/* =========================================================
   DentNova — Yardımcı Fonksiyonlar
   ========================================================= */

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

const toISO = d =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const todayISO = () => toISO(new Date());

const shiftISO = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
};

const dayKeyOf = dateStr =>
  DAY_KEYS[new Date(dateStr + 'T00:00:00').getDay()];

function fmtDate(s){
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('tr-TR',
    { day:'numeric', month:'long', year:'numeric', weekday:'long' });
}

function fmtShortDate(s){
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('tr-TR',
    { day:'2-digit', month:'short', year:'numeric' });
}

function initials(name){
  return String(name || '?').replace(/^Dr\.?\s*/i, '').trim()
    .split(/\s+/).map(w => w[0] || '').slice(0,2).join('').toUpperCase();
}

function timeSlots(start, end, step = 30){
  const out = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  while (h * 60 + m < eh * 60 + em){
    out.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    m += step;
    if (m >= 60){ m -= 60; h++; }
    if (h >= 24) break;
  }
  return out;
}

function defaultHours(){
  return {
    mon:{start:'09:00',end:'17:00'}, tue:{start:'09:00',end:'17:00'},
    wed:{start:'09:00',end:'17:00'}, thu:{start:'09:00',end:'17:00'},
    fri:{start:'09:00',end:'17:00'}, sat:{start:'10:00',end:'14:00'}, sun:null
  };
}