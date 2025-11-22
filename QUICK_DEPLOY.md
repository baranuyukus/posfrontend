# ⚡ Hızlı Deploy Rehberi

## 🚀 3 Adımda Netlify'a Deploy

### 1️⃣ Git'e Yükle

```bash
cd /Users/baranuyukus/Desktop/kasafrontend

# Git başlat (eğer başlatılmadıysa)
git init

# Dosyaları ekle
git add .

# Commit yap
git commit -m "Initial commit - MEEZY POS"

# GitHub'a yükle (KENDİ KULLANICI ADINIZI YAZIN!)
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/kasafrontend.git
git push -u origin main
```

### 2️⃣ Netlify'da Deploy

1. https://app.netlify.com → Giriş yap
2. "Add new site" → "Import an existing project"
3. GitHub → `kasafrontend` repo'sunu seç
4. **Environment Variables ekle**:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-backend-api-url.com`
5. "Deploy site" → Bekle (2-5 dk)

### 3️⃣ Backend CORS Ayarı

Backend'inizde (FastAPI):

```python
origins = [
    "http://localhost:3000",
    "https://your-app.netlify.app",  # ← Netlify URL'inizi buraya
]
```

## ✅ Hazır!

Site linkiniz: `https://your-app.netlify.app`

---

**Detaylı rehber için**: `NETLIFY_DEPLOYMENT_GUIDE.md` dosyasını okuyun

