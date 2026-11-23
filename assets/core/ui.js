/* =========================================================
   DentNova — UI Parçaları (toast, header, partials)
   ========================================================= */

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg, type = 'ok'){
  let el = document.getElementById('toast');
  if (!el){
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3500);
}

/* ---------- Partials (header + footer) ---------- */
async function loadPartials(){
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (document.getElementById('site-header')) return;

  const app = document.getElementById('app');
  if (!app) return;

  try {
    const res = await fetch('partials.html');
    if (!res.ok) throw new Error('partials.html yüklenemedi: HTTP ' + res.status);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');

    const headerTpl = doc.getElementById('tpl-header');
    const footerTpl = doc.getElementById('tpl-footer');
    const headerEl  = headerTpl ? headerTpl.content.firstElementChild : null;
    const footerEl  = footerTpl ? footerTpl.content.firstElementChild : null;

    const parent = app.parentNode || document.body;

    if (headerEl) parent.insertBefore(document.importNode(headerEl, true), app);
    if (footerEl){
      if (app.nextSibling) parent.insertBefore(document.importNode(footerEl, true), app.nextSibling);
      else parent.appendChild(document.importNode(footerEl, true));
    }
  } catch (err){
    console.error('[DentNova] partials yüklenemedi:', err);
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#fef2f2;color:#b91c1c;padding:14px;text-align:center;font-family:sans-serif;font-size:14px;border-bottom:1px solid #fecaca';
    banner.textContent = 'Header/footer yüklenemedi: ' + err.message;
    document.body.insertBefore(banner, document.body.firstChild);
  }
}

/* ---------- Header actions (giriş / çıkış) ---------- */
function renderHeaderActions(){
  const el = document.getElementById('header-actions');
  if (!el) return;
  const u = currentUser();
  el.innerHTML = u ? `
    <a href="dashboard.html" class="btn btn-ghost btn-sm">
      ${icon('user',16)} ${esc(u.name.split(' ')[0])}
    </a>
    <button class="btn btn-primary btn-sm" data-action="logout">${icon('logout',16)} Çıkış</button>
  ` : `
    <a href="login.html" class="btn btn-ghost btn-sm">${icon('user',16)} Giriş Yap</a>
    <a href="register.html" class="btn btn-primary btn-sm">${icon('plus',16)} Kayıt Ol</a>
  `;
}