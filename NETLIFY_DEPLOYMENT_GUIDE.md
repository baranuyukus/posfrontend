# 🚀 Netlify Deployment Guide - MEEZY POS

Bu rehber, MEEZY POS uygulamasını Netlify'a deploy etmek için adım adım talimatlar içerir.

---

## 📋 Ön Hazırlık (Tamamlandı ✅)

Projeniz şu dosyalarla Netlify'a deploy edilmeye hazır:

- ✅ `netlify.toml` - Netlify yapılandırması
- ✅ `.gitignore` - Git için ignore dosyası
- ✅ `package.json` - Build scriptleri
- ✅ `next.config.js` - Next.js yapılandırması

---

## 🎯 ADIM 1: Git Repository Oluşturma

### A) GitHub'da Yeni Repo Oluşturun:

1. **GitHub'a gidin**: https://github.com
2. **Sağ üstte "+" butonuna** tıklayın → **"New repository"**
3. **Repository ayarları**:
   - **Repository name**: `kasafrontend` (veya istediğiniz isim)
   - **Description**: "Shopify POS & Inventory Management Frontend"
   - **Visibility**: Private (önerilen) veya Public
   - ⚠️ **"Add a README file" seçeneğini TIKLAMAYIN** (boş repo olmalı)
4. **"Create repository"** butonuna tıklayın

### B) Projenizi Git'e Bağlayın:

Terminal'de şu komutları çalıştırın:

```bash
# 1. Git'i başlatın (eğer başlatılmadıysa)
cd /Users/baranuyukus/Desktop/kasafrontend
git init

# 2. Tüm dosyaları ekleyin
git add .

# 3. İlk commit'i yapın
git commit -m "Initial commit - MEEZY POS Frontend"

# 4. Ana branch'i main olarak ayarlayın
git branch -M main

# 5. GitHub repo'nuzu remote olarak ekleyin
# ⚠️ BURAYA KENDİ GITHUB KULLANICI ADINIZI YAZIN!
git remote add origin https://github.com/KULLANICI_ADINIZ/kasafrontend.git

# 6. Kodu GitHub'a push edin
git push -u origin main
```

**⚠️ ÖNEMLİ**: `KULLANICI_ADINIZ` yerine kendi GitHub kullanıcı adınızı yazın!

---

## 🌐 ADIM 2: Netlify'da Deploy

### A) Netlify'a Giriş Yapın:

1. **Netlify'a gidin**: https://app.netlify.com
2. **GitHub ile giriş yapın** (veya email ile kayıt olun)

### B) Yeni Site Ekleyin:

1. **"Add new site"** butonuna tıklayın → **"Import an existing project"**
2. **"Deploy with GitHub"** seçeneğini seçin
3. **GitHub hesabınıza erişim izni verin** (ilk kez yapıyorsanız)
4. **Repository listesinden** `kasafrontend` repo'nuzu seçin

### C) Build Ayarlarını Yapın:

Netlify otomatik olarak `netlify.toml` dosyanızı okuyacak, ancak kontrol edin:

```
Build command: npm run build
Publish directory: .next
```

**⚠️ ÖNEMLİ**: "Deploy site" butonuna **henüz tıklamayın!**

---

## 🔐 ADIM 3: Environment Variables (Çevre Değişkenleri)

Deploy etmeden önce API URL'inizi eklemeniz gerekiyor:

### A) Environment Variables Ekleyin:

1. **"Site settings"** → **"Environment variables"** bölümüne gidin
   (veya deploy ekranında "Advanced" → "New variable")

2. **Yeni değişken ekleyin**:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Backend API URL'iniz
   
   **Örnek değerler**:
   ```
   # Yerel test için (çalışmaz, sadece örnek):
   http://localhost:8080
   
   # Production API (kendi backend URL'inizi yazın):
   https://your-backend-api.com
   
   # Eğer backend'iniz de Heroku/Railway/Render'da ise:
   https://your-app.herokuapp.com
   https://your-app.railway.app
   https://your-app.onrender.com
   ```

3. **"Save"** butonuna tıklayın

### ⚠️ BACKEND API HAZIR MI?

**Netlify'da deploy edilen frontend'iniz için backend'inizin de online olması gerekiyor!**

**Backend deployment seçenekleri**:
- ✅ **Heroku** (ücretsiz plan kaldırıldı, ücretli)
- ✅ **Railway** (ücretsiz plan mevcut, sınırlı)
- ✅ **Render** (ücretsiz plan mevcut, 15 dk inactivity sonrası sleep)
- ✅ **DigitalOcean** (ücretli, $5/ay)
- ✅ **AWS/Google Cloud** (karmaşık, ücretli)

**Eğer backend'iniz henüz online değilse**:
- Önce backend'i deploy edin
- Sonra frontend'i deploy edin
- Environment variable olarak backend URL'ini ekleyin

---

## 🚀 ADIM 4: Deploy!

1. **"Deploy site"** butonuna tıklayın
2. **Build işlemini izleyin** (2-5 dakika sürer)
3. **Deploy tamamlandığında** size bir URL verilecek:
   ```
   https://random-name-123456.netlify.app
   ```

---

## 🎨 ADIM 5: Custom Domain (Opsiyonel)

### A) Netlify Subdomain Değiştirme (Ücretsiz):

1. **"Site settings"** → **"Domain management"**
2. **"Options"** → **"Edit site name"**
3. **Yeni isim girin**: `meezy-pos` → URL: `https://meezy-pos.netlify.app`

### B) Kendi Domain'inizi Bağlama (Ücretli domain gerekli):

1. **"Add custom domain"** butonuna tıklayın
2. **Domain adınızı girin**: `meezypos.com`
3. **DNS ayarlarını yapın** (Netlify size talimat verecek)
4. **SSL sertifikası otomatik** oluşturulacak (Let's Encrypt)

---

## 🔧 ADIM 6: CORS Ayarları (Backend)

Frontend'iniz Netlify'da yayında olduğunda, backend'inizde CORS ayarlarını güncellemeniz gerekiyor:

**Backend'inizde (FastAPI) şu değişikliği yapın**:

```python
from fastapi.middleware.cors import CORSMiddleware

# Netlify URL'inizi ekleyin
origins = [
    "http://localhost:3000",           # Local development
    "https://your-app.netlify.app",    # Netlify deployment
    "https://meezy-pos.netlify.app",   # Custom Netlify subdomain
    "https://yourdomain.com",          # Custom domain (varsa)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ✅ Deploy Sonrası Kontrol Listesi

- [ ] Site açılıyor mu? → `https://your-app.netlify.app`
- [ ] Ürün arama çalışıyor mu?
- [ ] Sepete ekleme çalışıyor mu?
- [ ] Sipariş oluşturma çalışıyor mu?
- [ ] Raporlar sayfası çalışıyor mu?
- [ ] Console'da CORS hatası var mı? (F12 → Console)
- [ ] API istekleri backend'e gidiyor mu? (F12 → Network)

---

## 🐛 Yaygın Sorunlar ve Çözümleri

### 1. **Build Hatası: "Module not found"**
```bash
# Çözüm: Dependencies'leri kontrol edin
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### 2. **API İstekleri Çalışmıyor (CORS Hatası)**
```
❌ Access to fetch at 'http://localhost:8080' has been blocked by CORS policy
```
**Çözüm**:
- Backend'de CORS ayarlarına Netlify URL'inizi ekleyin
- Environment variable'da doğru API URL'i kullanın (https://)

### 3. **Environment Variable Değişiklikleri Yansımıyor**
**Çözüm**:
- Netlify dashboard → "Deploys" → "Trigger deploy" → "Clear cache and deploy"

### 4. **Sayfa Yenileme 404 Hatası**
**Çözüm**: `netlify.toml` dosyası zaten bu sorunu çözüyor (redirects ayarı)

### 5. **Build Süresi Çok Uzun**
**Çözüm**: 
- `package.json`'da `latest` yerine spesifik versiyonlar kullanın
- `.gitignore`'da `node_modules` ve `.next` var mı kontrol edin

---

## 🔄 Güncelleme Yapmak

Kod değişikliği yaptığınızda:

```bash
# 1. Değişiklikleri commit edin
git add .
git commit -m "Yeni özellik eklendi"

# 2. GitHub'a push edin
git push

# 3. Netlify otomatik olarak yeniden deploy edecek! 🎉
```

---

## 📊 Netlify Dashboard Özellikleri

### Ücretsiz Plan Limitleri:
- ✅ 100 GB bandwidth/ay
- ✅ 300 build dakikası/ay
- ✅ Otomatik SSL sertifikası
- ✅ Continuous deployment (Git push → otomatik deploy)
- ✅ Form handling
- ✅ Serverless functions (kullanmıyorsunuz)

### Faydalı Özellikler:
- **Deploy previews**: Her PR için otomatik test sitesi
- **Rollback**: Önceki versiyona geri dönme
- **Analytics**: Ziyaretçi istatistikleri
- **Split testing**: A/B testing

---

## 🎉 Tebrikler!

MEEZY POS uygulamanız artık canlıda! 🚀

**Paylaşabileceğiniz link**:
```
https://your-app.netlify.app
```

---

## 📞 Destek

Sorun yaşarsanız:
1. **Netlify Docs**: https://docs.netlify.com
2. **Netlify Community**: https://answers.netlify.com
3. **Next.js Docs**: https://nextjs.org/docs

---

**Son Güncelleme**: Kasım 2025
**Proje**: MEEZY POS - Shopify Inventory Management
**Tech Stack**: Next.js + React + Tailwind CSS + Axios

