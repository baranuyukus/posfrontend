# 🛍️ Meezy POS - Shopify POS & Inventory Frontend

Modern, hızlı ve kullanıcı dostu bir Shopify POS (Point of Sale) ve envanter yönetim sistemi frontend uygulaması.

## 🚀 Özellikler

### 🎨 v3.0.0 - Tam Özellikli POS Sistemi
- ✅ **Ürün Arama**: Barkod, SKU, ürün adı ile arama
- ✅ **Akıllı Sepet**: Otomatik ekleme, Enter tuşu desteği, LocalStorage
- ✅ **Sipariş Oluşturma**: Ödeme yöntemi, müşteri, indirim desteği
- ✅ **Müşteri Yönetimi**: Dinamik müşteri arama ve ekleme
- ✅ **Özel Ürün**: Barkod olmayan ürünler için manuel ekleme
- ✅ **Raporlar Sayfası**: 
  - Haftalık/Aylık/Özel tarih aralığı raporları
  - Satış istatistikleri ve grafikler
  - Ödeme yöntemi filtreleme (POS, Cash, Online)
  - Sipariş durumu filtreleme
  - İade görüntüleme
  - Satılan ürünler Excel tablosu
  - Günlük satış dökümü

### 🔍 Temel Özellikler
- ✅ **Gerçek Zamanlı Senkronizasyon**: Shopify backend ile entegre
- ✅ **Responsive Tasarım**: Mobil, tablet ve masaüstü uyumlu
- ✅ **TypeScript**: Tip güvenli kod yapısı
- ✅ **React Query**: Akıllı veri yönetimi ve cache
- ✅ **Toast Notifications**: Kullanıcı geri bildirimleri
- ✅ **Modern UI**: Minimalist siyah-beyaz tasarım

## 🛠️ Teknolojiler

- **Framework**: Next.js 15
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3
- **State Management**: TanStack React Query (v5)
- **HTTP Client**: Axios
- **Language**: TypeScript
- **Package Manager**: npm

## 📦 Kurulum

### Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Backend API çalışır durumda olmalı (http://localhost:8080)

### Adımlar

1. **Bağımlılıkları yükleyin:**

```bash
npm install
```

2. **Environment dosyasını oluşturun:**

`.env.local` dosyası zaten oluşturulmuş durumda:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

3. **Development sunucusunu başlatın:**

```bash
npm run dev
```

4. **Tarayıcıda açın:**

```
http://localhost:3000
```

## 📁 Proje Yapısı

```
kasafrontend/
├── pages/
│   ├── _app.tsx          # React Query Provider
│   ├── _document.tsx     # HTML Document
│   └── index.tsx         # Ana sayfa (Ürün Arama)
├── lib/
│   ├── api.ts            # Axios client
│   └── types.ts          # TypeScript tip tanımları
├── styles/
│   └── globals.css       # Global CSS + Tailwind
├── components/           # React bileşenleri (gelecek)
├── public/               # Statik dosyalar
├── .env.local            # Environment variables
├── next.config.js        # Next.js yapılandırması
├── tailwind.config.js    # Tailwind yapılandırması
├── tsconfig.json         # TypeScript yapılandırması
└── package.json          # Proje bağımlılıkları
```

## 🎯 Kullanım

### Ürün Arama ve Sepet

1. **Arama**: Ana sayfada arama kutusuna ürün adı veya barkod girin
2. **Filtreleme**: Sonuçlar otomatik olarak filtrelenir (300ms debounce)
3. **Sepete Ekle**: Ürün kartındaki "🛒 Sepete Ekle" butonuna tıklayın
4. **Sepet Yönetimi**: Sağ taraftaki sepet sidebar'ından:
   - Miktar artır/azalt
   - Ürün sil
   - Sepeti temizle
   - Toplam tutarı görüntüle
5. **Ödeme**: "💳 Ödemeye Geç" butonu ile ödeme ekranına geçin (yakında)

### API Entegrasyonu

Uygulama şu endpoint'leri kullanır:

- `GET /products?limit=50` - Varsayılan ürün listesi
- `GET /products/barcode/{barcode}` - Barkod ile arama
- `GET /products?limit=200` - Geniş ürün listesi (filtreleme için)

## 🔧 Yapılandırma

### Backend URL Değiştirme

`.env.local` dosyasını düzenleyin:

```env
NEXT_PUBLIC_API_URL=http://your-backend-url:port
```

### Tailwind Özelleştirme

`tailwind.config.js` dosyasından tema ayarlarını değiştirebilirsiniz.

### React Query Ayarları

`pages/_app.tsx` dosyasında cache ve retry ayarlarını yapabilirsiniz.

## 📱 Responsive Tasarım

- **Mobile**: 1 sütun grid
- **Tablet (sm)**: 2 sütun grid
- **Desktop (lg)**: 3 sütun grid
- **Large Desktop (xl)**: 4 sütun grid

## 🎨 UI Özellikleri

### Yeni Tasarım (v2.0.0)
- ✨ Gradient butonlar ve header
- 🎭 Smooth hover ve active animasyonlar
- 🛒 Tam özellikli sepet sistemi
- 📱 Floating cart button (mobile)
- 🏷️ Dinamik stok badge'leri
- 🖼️ Büyük, modern ürün kartları
- 💾 LocalStorage ile sepet kaydetme

### Temel Özellikler
- 🔄 Professional loading spinner
- ❌ Kullanıcı dostu hata mesajları
- 🖼️ Lazy image loading + fallback
- 📦 Akıllı stok durumu gösterimi
- 💰 TL formatında fiyat gösterimi
- 🏷️ Barkod ve SKU gösterimi
- 🎯 Empty state tasarımları

## 🚀 Deployment

### Netlify'a Deploy

Projeniz Netlify'a deploy edilmeye hazır! Detaylı adımlar için:

📖 **[NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)** - Detaylı rehber  
⚡ **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Hızlı başlangıç (3 adım)

**Hızlı özet**:
```bash
# 1. Git'e yükle
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/kasafrontend.git
git push -u origin main

# 2. Netlify'da deploy
# - https://app.netlify.com → Import from GitHub
# - Environment variable ekle: NEXT_PUBLIC_API_URL
# - Deploy!

# 3. Backend CORS ayarı
# - Backend'de Netlify URL'ini CORS origins'e ekle
```

**Gerekli dosyalar** (✅ Hazır):
- ✅ `netlify.toml` - Netlify yapılandırması
- ✅ `.gitignore` - Git ignore kuralları
- ✅ `package.json` - Build scriptleri
- ✅ `next.config.js` - Next.js config

## 🚧 Gelecek Özellikler

- [x] Müşteri yönetimi (dinamik arama)
- [x] Sipariş oluşturma sayfası
- [x] Dashboard ve istatistikler (Raporlar sayfası)
- [x] Sepet sistemi (localStorage)
- [x] Özel ürün ekleme
- [x] İndirim sistemi
- [ ] Webhook logları sayfası
- [ ] Çoklu dil desteği
- [ ] Dark mode

## 📝 Scriptler

```bash
# Development sunucusu
npm run dev

# Production build
npm run build

# Production sunucusu
npm start

# Linting
npm run lint
```

## 🐛 Hata Giderme

### Backend'e bağlanamıyor

1. Backend sunucusunun çalıştığından emin olun:
   ```bash
   uvicorn main:app --reload --port 8080
   ```

2. `.env.local` dosyasındaki URL'yi kontrol edin

3. CORS ayarlarını kontrol edin (backend'de)

### Ürünler yüklenmiyor

1. Backend'de ürün senkronizasyonu yapın:
   ```bash
   curl -X POST http://localhost:8080/sync-products
   ```

2. Tarayıcı console'unu kontrol edin (F12)

3. Network tab'inde API isteklerini inceleyin

## 📄 Lisans

MIT

## 👨‍💻 Geliştirici

Meezy POS - Shopify POS & Inventory System

---

## 📸 Ekran Görüntüleri

### Ana Sayfa (Ürün Arama)
- Modern gradient header
- Büyük arama kutusu
- 4 sütunlu ürün grid
- Sepet sidebar (sağda)

### Ürün Kartları
- 56px yüksekliğinde görseller
- Hover scale efekti
- Stok badge'leri
- Gradient butonlar

### Sepet Sistemi
- Ürün listesi
- Miktar kontrolleri
- Toplam hesaplama
- Ödeme butonu

---

**Version**: 3.0.0 (Full POS System + Reports)  
**Last Updated**: Kasım 2025  
**Backend API Version**: 1.0.0

## 📚 Dokümantasyon

- 📖 [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md) - Detaylı deployment rehberi
- ⚡ [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Hızlı başlangıç (3 adım)
- 🔧 [BACKEND_CORS_FIX.md](./BACKEND_CORS_FIX.md) - Backend CORS ayarları
- 📊 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Backend API dokümantasyonu

