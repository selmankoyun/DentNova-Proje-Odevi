<<<<<<< HEAD
#  DentNova — Diş Kliniği Online Randevu Sistemi

DentNova, bir ağız ve diş sağlığı kliniği için geliştirilmiş **online randevu yönetim sistemi**dir. Hastalar doktor seçip uygun saatlere randevu alabilir; doktorlar randevuları yönetebilir; yöneticiler tüm sistemi kontrol edebilir.

Proje **saf HTML, CSS ve JavaScript** ile yazılmıştır. Herhangi bir framework, derleme adımı veya backend gerektirmez. Veriler tarayıcının `localStorage` alanında tutulur.

---

##  Özellikler

###  Hasta
- Kayt olma ve giriş yapma
- Doktor, tarih, tedavi ve saat seçerek randevu oluşturma
- Dolu ve geçmiş saatlerin otomatik devre dışı bırakılması
- Randevuları görüntüleme ve iptal etme
- Randevu durumuna göre bildirim "mailleri" (uygulama içi gelen kutusu)

###  Doktor
- Gelen randevu taleplerini onaylama, tamamlama veya iptal etme
- İstatistikler: durum dağılımı, en yoğun saatler, tedavi dağılımı, yaklaşan randevular
- Profil (ünvan, uzmanlık, biyografi, telefon) düzenleme
- Haftalık çalışma saatlerini belirleme (ana sayfadaki kartta görünür)

###  Yönetici
- Genel bakış: hasta/doktor sayısı, randevu istatistikleri, son 6 ay trendi
- Kullanıcı rollerini değiştirme (Hasta ↔ Doktor) ve kullanıcı silme
- Tüm randevuları yönetme ve silme

###  Genel
- Duyarlı (responsive) arayüz
- Ortak header/footer şablonu (`partials.html`)
- Özel SVG ikon kütüphanesi
- Türkçe arayüz ve tarih biçimleri

---

##  Kullanılan Teknolojiler

| Teknoloji | Kullanım |
|-----------|----------|
| HTML5 | Sayfa yapısı |
| CSS3 | Stil ve duyarlı tasarım |
| JavaScript (ES6+) | Uygulama mantığı |
| localStorage | Veri ve oturum saklama |

---

##  Proje Yapısı

```
dentnova/
├── index.html            # Ana sayfa (doktorlar, hizmetler)
├── login.html            # Giriş sayfası
├── register.html         # Kayıt sayfası
├── dashboard.html        # Hasta / Doktor / Yönetici paneli
├── partials.html         # Ortak header ve footer şablonları
├── icon.ico              # Favicon
└── assets/
    ├── styles.css        # Tüm stiller
    ├── app.js            # Başlatma + global olay yöneticisi
    ├── core/
    │   ├── config.js     # Sabitler (günler, durumlar, tedaviler)
    │   ├── icons.js      # SVG ikon kütüphanesi
    │   ├── utils.js      # Yardımcı fonksiyonlar
    │   ├── store.js      # Veri katmanı (localStorage)
    │   ├── ui.js         # Toast, header, partial yükleme
    │   └── booking.js    # Randevu modalı ve durum güncelleme
    └── pages/
        ├── home.js       # Ana sayfa mantığı
        ├── login.js      # Giriş mantığı
        ├── register.js   # Kayıt mantığı
        └── dashboard.js  # Panel mantığı
```

> Dosyaları GitHub'a yüklerken yukarıdaki klasör yapısını koruyun; HTML dosyaları `assets/...` yollarına göre yazılmıştır.

---

##  Kurulum ve Çalıştırma

Header ve footer `fetch()` ile yüklendiği için proje `file://` ile **doğrudan açıldığında çalışmaz**. Basit bir yerel sunucu kullanın:

```bash
# Depoyu klonlayın
git clone https://github.com/<kullanici-adi>/<repo-adi>.git
cd <repo-adi>

# Python ile
python -m http.server 8000

# veya Node.js ile
npx serve .
```

Ardından tarayıcıda `http://localhost:8000` adresini açın.

VS Code kullanıyorsanız **Live Server** eklentisi de işinizi görür.

###  GitHub Pages ile Yayınlama

1. Depo sayfasında **Settings → Pages** bölümüne gidin.
2. **Source** olarak `Deploy from a branch` seçin.
3. Branch olarak `main` ve klasör olarak `/ (root)` seçip kaydedin.
4. Birkaç dakika sonra site `https://<kullanici-adi>.github.io/<repo-adi>/` adresinde yayında olur.

---

##  Demo Hesaplar

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Yönetici | `admin@dentnova.com` | `admin123` |
| Doktor | `elif@dentnova.com` | `123456` |
| Doktor | `mert@dentnova.com` | `123456` |
| Doktor | `zeynep@dentnova.com` | `123456` |
| Hasta | `ahmet@ornek.com` | `123456` |
| Hasta | `selin@ornek.com` | `123456` |

Demo hesaplar tarayıcıda eksik veya bozuk kalırsa uygulama açılışta bunları otomatik olarak geri yükler.

### Verileri sıfırlama

Tüm verileri başlangıç durumuna döndürmek için tarayıcı konsolunda (F12) şunu çalıştırın:

```js
localStorage.removeItem('dentnova.db.v2');
localStorage.removeItem('dentnova.session.v1');
localStorage.removeItem('dentnova_read_mails');
location.reload();
```

---

##  Randevu Akışı

```
Hasta randevu oluşturur
        │
        ▼
  [Onay Bekliyor] ──► Doktor/Yönetici onaylar ──► [Onaylandı] ──► [Tamamlandı]
        │                                              │
        └────────────── İptal ◄────────────────────────┘
                          │
                          ▼
                    [İptal Edildi]
```

- Aynı doktor, tarih ve saat için çift randevu alınamaz.
- Doktorun çalışmadığı günlerde saat seçimi kapalıdır.
- Slotlar 30 dakikalık aralıklarla üretilir.

---

##  Özelleştirme

| Ne yapmak istiyorsunuz? | Dosya |
|-------------------------|-------|
| Tedavi türlerini değiştirmek | `assets/core/config.js` → `TREATMENTS` |
| Randevu durumlarını / renklerini değiştirmek | `assets/core/config.js` → `STATUS` |
| Demo kullanıcıları düzenlemek | `assets/core/store.js` → `seedDB()` |
| Slot aralığını değiştirmek | `assets/core/booking.js` → `timeSlots(..., 30)` |
| Klinik adres ve iletişim bilgileri | `partials.html` |
| Yeni ikon eklemek | `assets/core/icons.js` → `ICONS` |

---

##  Güvenlik Notu

Bu proje yalnızca ön yüz (frontend) içerir. Kimlik doğrulama ve yetkilendirme tarayıcı tarafında yapıldığından herkes `localStorage` verisini görebilir ve değiştirebilir. Üretim ortamında mutlaka sunucu tarafı doğrulama ve şifre hash'leme kullanılmalıdır.

---

##  Katkıda Bulunma

1. Depoyu fork'layın
2. Yeni bir dal oluşturun: `git checkout -b ozellik/yeni-ozellik`
3. Değişikliklerinizi commit'leyin: `git commit -m "Yeni özellik eklendi"`
4. Dalınızı push'layın: `git push origin ozellik/yeni-ozellik`
5. Pull Request açın

---

##  Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır. *(Lisans dosyasını eklemeyi unutmayın.)*
=======
# DentNova-Proje-Odevi
>>>>>>> 9d680244271313053aa042562b16f0c8091ca50d
