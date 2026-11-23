/* =========================================================
   DentNova — Kayıt Sayfası
   ========================================================= */

function initRegisterPage(){
  document.getElementById('reg-avatar').innerHTML = icon('plus', 24);
  if (currentUser()){ location.href = 'dashboard.html'; return; }

  const form = document.getElementById('register-form');
  const errBox = document.getElementById('reg-error');
  const fail = m => {
    errBox.innerHTML = `<div class="alert err">${icon('info',18)}<span>${esc(m)}</span></div>`;
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    errBox.innerHTML = '';
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const p1 = form.password.value;
    const p2 = form.password2.value;

    if (name.length < 3) return fail('Lütfen adınızı ve soyadınızı girin.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Geçerli bir e-posta adresi girin.');
    if (store.allUsers().some(u => u.email.toLowerCase() === email.toLowerCase()))
      return fail('Bu e-posta adresi zaten kayıtlı.');
    if (p1.length < 6) return fail('Şifre en az 6 karakter olmalıdır.');
    if (p1 !== p2) return fail('Şifreler birbiriyle eşleşmiyor.');

    const newUser = store.createUser({
      id: uid(),
      name, email, phone,
      password: p1,
      role: 'user',
      createdAt: new Date().toISOString()
    });
    store.login(newUser.id);
    toast('Hesabınız oluşturuldu. Hoş geldiniz!');
    setTimeout(() => location.href = 'dashboard.html', 500);
  });
}