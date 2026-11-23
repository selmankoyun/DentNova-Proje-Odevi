/* =========================================================
   DentNova — Veri Katmanı
   localStorage + bellek içi db + session.
   ========================================================= */

const store = (() => {
  const DB_KEY      = 'dentnova.db.v2';
  const SESSION_KEY = 'dentnova.session.v1';

  function seedDB(){
    const mkHours = (sat, sun) => ({
      mon:{start:'09:00',end:'17:00'}, tue:{start:'09:00',end:'17:00'},
      wed:{start:'09:00',end:'17:00'}, thu:{start:'09:00',end:'17:00'},
      fri:{start:'09:00',end:'17:00'}, sat: sat || null, sun: sun || null
    });

    return {
      users: [
        { id:'admin-1', name:'Sistem Yöneticisi', email:'admin@dentnova.com',
          password:'admin123', role:'admin', phone:'0212 000 00 00',
          createdAt: new Date().toISOString() },
        { id:'doc-1', name:'Elif Yılmaz', email:'elif@dentnova.com', password:'123456',
          role:'doctor', title:'Ağız ve Diş Sağlığı Uzmanı',
          specialty:'İmplantoloji & Cerrahi', phone:'0212 555 01 01',
          bio:'12 yıllık klinik deneyim. İmplant cerrahisi ve ileri cerrahi işlemler alanında uzmanlaşmıştır.',
          workingHours: mkHours({start:'10:00',end:'14:00'}) },
        { id:'doc-2', name:'Mert Kaya', email:'mert@dentnova.com', password:'123456',
          role:'doctor', title:'Ortodonti Uzmanı',
          specialty:'Ortodonti & Şeffaf Plak', phone:'0212 555 02 02',
          bio:'Tel ve şeffaf plak tedavilerinde 9 yıllık tecrübe.',
          workingHours: mkHours(null) },
        { id:'doc-3', name:'Zeynep Demir', email:'zeynep@dentnova.com', password:'123456',
          role:'doctor', title:'Restoratif Diş Hekimi',
          specialty:'Estetik Diş Hekimliği', phone:'0212 555 03 03',
          bio:'Diş beyazlatma, porselen laminate ve estetik restorasyonlar.',
          workingHours: mkHours({start:'09:00',end:'13:00'}) },
        { id:'usr-1', name:'Ahmet Şahin', email:'ahmet@ornek.com', password:'123456',
          role:'user', phone:'0532 111 22 33', createdAt: new Date().toISOString() },
        { id:'usr-2', name:'Selin Aydın', email:'selin@ornek.com', password:'123456',
          role:'user', phone:'0533 444 55 66', createdAt: new Date().toISOString() }
      ],
      appointments: [],
      seededAt: new Date().toISOString()
    };
  }

  /* ---------- yükleme ---------- */
  let db;
  let needsSave = false;
  try {
    const raw = localStorage.getItem(DB_KEY);
    db = raw ? JSON.parse(raw) : seedDB();
    if (!raw) needsSave = true;
  } catch { db = seedDB(); needsSave = true; }

  // Bozuk / eksik yapıdaki kayıtları sıfırla
  if (!db || !Array.isArray(db.users) || !Array.isArray(db.appointments)){
    db = seedDB();
    needsSave = true;
  }

  /* Demo hesapların her zaman giriş yapılabilir olmasını garanti eder.
     Tarayıcıdaki eski/silinmiş kayıtlar yüzünden eksik kalan demo
     hesaplar (örn. usr-1, usr-2) geri eklenir; e-posta/şifresi
     değişmiş olanlar demo değerlerine döndürülür. */
  (function ensureDemoAccounts(){
    seedDB().users.forEach(demo => {
      const byId = db.users.find(u => u.id === demo.id);
      if (byId){
        if (byId.email !== demo.email || byId.password !== demo.password){
          byId.email = demo.email;
          byId.password = demo.password;
          needsSave = true;
        }
        return;
      }
      const emailTaken = db.users.some(u =>
        String(u.email || '').toLowerCase() === demo.email.toLowerCase());
      if (!emailTaken){
        db.users.push(demo);
        needsSave = true;
      }
    });
  })();

  let session = null;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}

  /* ---------- persist ---------- */
  function save(){
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch {}
  }
  function saveSession(){
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }
  if (needsSave) save();

  function login(userId){ session = { userId }; saveSession(); }
  function logout(){ session = null; saveSession(); }

  /* ---------- okuma ---------- */
  const allUsers     = () => db.users;
  const allAppts     = () => db.appointments;
  const currentUser  = () => session ? db.users.find(u => u.id === session.userId) || null : null;
  const userById     = id => db.users.find(u => u.id === id) || null;
  const doctors      = () => db.users.filter(u => u.role === 'doctor');
  const apptOfDoctor = id => db.appointments.filter(a => a.doctorId === id);
  const apptOfUser   = id => db.appointments.filter(a => a.userId === id);
  const doctorName   = id => { const u = userById(id); return u ? `Dr. ${u.name}` : 'Silinmiş Doktor'; };

  /* ---------- yazma ---------- */
  function createUser(user){
    db.users.push(user);
    save();
    return user;
  }
  function updateUser(userId, patch){
    const u = userById(userId);
    if (!u) return null;
    Object.assign(u, patch);
    save();
    return u;
  }
  function deleteUser(userId){
    db.users = db.users.filter(u => u.id !== userId);
    db.appointments = db.appointments.filter(a => a.userId !== userId && a.doctorId !== userId);
    save();
  }
  function createAppointment(appt){
    db.appointments.push(appt);
    save();
    return appt;
  }
  function updateAppointment(apptId, patch){
    const a = db.appointments.find(x => x.id === apptId);
    if (!a) return null;
    Object.assign(a, patch);
    save();
    return a;
  }
  function deleteAppointment(apptId){
    db.appointments = db.appointments.filter(a => a.id !== apptId);
    save();
  }

  return {
    allUsers, allAppts, currentUser, userById, doctors,
    apptOfUser, apptOfDoctor, doctorName,
    createUser, updateUser, deleteUser,
    createAppointment, updateAppointment, deleteAppointment,
    login, logout
  };
})();

/* Global kısayollar — tüm sayfalarda erişilebilir */
const currentUser  = store.currentUser;
const userById     = store.userById;
const doctors      = store.doctors;
const apptOfUser   = store.apptOfUser;
const apptOfDoctor = store.apptOfDoctor;
const doctorName   = store.doctorName;