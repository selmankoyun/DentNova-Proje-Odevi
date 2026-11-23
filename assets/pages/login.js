/* =========================================================
   DentNova — Giriş Sayfası
   ========================================================= */

function initLoginPage(){
  document.getElementById('login-avatar').innerHTML = icon('tooth', 24);
  if (currentUser()){ location.href = 'dashboard.html'; return; }

  const form = document.getElementById('login-form');
  const errBox = document.getElementById('login-error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.email.value.trim().toLowerCase();
    const pass = form.password.value;
    const user = store.allUsers().find(u =>
      u.email.toLowerCase() === email && u.password === pass);

    if (!user){
      errBox.innerHTML = `<div class="alert err">${icon('info',18)}<span>E-posta veya şifre hatalı.</span></div>`;
      return;
    }
    store.login(user.id);
    toast(`Hoş geldiniz, ${user.name}!`);
    setTimeout(() => location.href = 'dashboard.html', 400);
  });
}