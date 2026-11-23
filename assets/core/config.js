/* =========================================================
   DentNova — Sabitler
   ========================================================= */

const DAYS = [
  { key:'mon', label:'Pazartesi', short:'Pzt' },
  { key:'tue', label:'Salı',      short:'Sal' },
  { key:'wed', label:'Çarşamba',  short:'Çar' },
  { key:'thu', label:'Perşembe',  short:'Per' },
  { key:'fri', label:'Cuma',      short:'Cum' },
  { key:'sat', label:'Cumartesi', short:'Cmt' },
  { key:'sun', label:'Pazar',     short:'Paz' }
];

const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];

const STATUS = {
  pending:   { label:'Onay Bekliyor', cls:'warn',   color:'warn'   },
  confirmed: { label:'Onaylandı',     cls:'info',   color:'info'   },
  completed: { label:'Tamamlandı',    cls:'ok',     color:'ok'     },
  cancelled: { label:'İptal Edildi',  cls:'danger', color:'danger' }
};

const TREATMENTS = [
  'Muayene / Kontrol',
  'Diş Temizliği',
  'Dolgu',
  'Kanal Tedavisi',
  'Diş Çekimi',
  'İmplant',
  'Ortodonti Konsültasyonu',
  'Diş Beyazlatma'
];