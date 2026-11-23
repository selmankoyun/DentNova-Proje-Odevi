/* =========================================================
   DentNova — Bootstrap + Global Event Handler
   ========================================================= */

/* ---------- Sayfa başlatma ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  await loadPartials();
  renderHeaderActions();

  const page = document.body.dataset.page;
  const initializers = {
    home:      'initHomePage',
    login:     'initLoginPage',
    register:  'initRegisterPage',
    dashboard: 'initDashboardPage'
  };
  const fn = initializers[page];
  if (fn && typeof window[fn] === 'function') window[fn]();
});

/* ---------- Global data-action handler ---------- */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const actions = {
    logout: () => {
      store.logout();
      toast('Çıkış yapıldı.');
      setTimeout(() => location.href = 'index.html', 400);
    },

    'close-modal': () => closeBookingModal(),

    'cancel-appt': () => {
      const me = currentUser();
      const a  = store.allAppts().find(x => x.id === btn.dataset.id);
      if (a && me && a.userId === me.id){
        updateAppointmentStatus(a.id, 'cancelled');
        if (typeof renderDashboard === 'function') renderDashboard();
      }
    },

    'set-status': () => {
      const me = currentUser();
      const a  = store.allAppts().find(x => x.id === btn.dataset.id);
      if (!me || !a) return;
      if (me.role !== 'admin' && a.doctorId !== me.id){
        toast('Yetkiniz yok.', 'err');
        return;
      }
      updateAppointmentStatus(a.id, btn.dataset.status);
      if (typeof renderDashboard === 'function') renderDashboard();
    },

    'delete-appt': () => {
      const me = currentUser();
      if (!me || me.role !== 'admin') return;
      if (!confirm('Bu randevu kalıcı olarak silinsin mi?')) return;
      store.deleteAppointment(btn.dataset.id);
      toast('Randevu silindi.');
      if (typeof renderDashboard === 'function') renderDashboard();
    },

    'delete-user': () => {
      const me = currentUser();
      const target = store.userById(btn.dataset.id);
      if (!me || me.role !== 'admin' || !target || target.role === 'admin') return;
      if (!confirm(`${target.name} adlı kullanıcı ve tüm randevuları silinsin mi?`)) return;
      store.deleteUser(target.id);
      toast('Kullanıcı silindi.');
      if (typeof renderDashboard === 'function') renderDashboard();
    }
  };

  const handler = actions[btn.dataset.action];
  if (handler){ e.preventDefault(); handler(); }
});