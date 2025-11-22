# 🚀 Meezy POS - Kurulum ve Çalıştırma Rehberi

## ✅ Kurulum Tamamlandı!

Tebrikler! Shopify POS & Inventory frontend uygulamanız başarıyla kuruldu.

## 📋 Kurulu Bileşenler

### ✅ Temel Yapı
- [x] Next.js 16.0.3 (Turbopack)
- [x] React 19
- [x] TypeScript
- [x] Tailwind CSS 3 + @tailwindcss/postcss
- [x] TanStack React Query v5
- [x] Axios

### ✅ Sayfa ve Bileşenler
- [x] Ana sayfa (Product Search) - `/pages/index.tsx`
- [x] React Query Provider - `/pages/_app.tsx`
- [x] Document yapılandırması - `/pages/_document.tsx`

### ✅ Kütüphaneler
- [x] API Client - `/lib/api.ts`
- [x] TypeScript Types - `/lib/types.ts`

### ✅ Yapılandırma Dosyaları
- [x] `next.config.js` - Next.js yapılandırması
- [x] `tailwind.config.js` - Tailwind yapılandırması
- [x] `postcss.config.js` - PostCSS yapılandırması
- [x] `tsconfig.json` - TypeScript yapılandırması
- [x] `.env.local` - Environment variables
- [x] `.gitignore` - Git ignore kuralları

## 🎯 Çalıştırma

### 1. Backend'i Başlatın

Önce backend API'nin çalıştığından emin olun:

```bash
# Backend dizinine gidin
cd /path/to/backend

# Backend'i başlatın
uvicorn main:app --reload --port 8080
```

Backend şu adreste çalışmalı: `http://localhost:8080`

### 2. Frontend'i Başlatın

```bash
# Frontend dizininde
npm run dev
```

Frontend şu adreste açılacak: `http://localhost:3000`

## 🧪 Test Adımları

### 1. Health Check
Backend'in çalıştığını doğrulayın:
```bash
curl http://localhost:8080/
```

Beklenen yanıt:
```json
{
  "status": "healthy",
  "message": "Shopify POS & Inventory Backend is running",
  "version": "1.0.0"
}
```

### 2. Ürün Senkronizasyonu
Backend'de ürünleri senkronize edin:
```bash
curl -X POST http://localhost:8080/sync-products
```

### 3. Frontend Test
1. Tarayıcıda `http://localhost:3000` adresini açın
2. Arama kutusuna bir ürün adı yazın
3. Veya bir barkod numarası girin (örn: 88834856)
4. Ürünlerin yüklendiğini görmelisiniz

## 🎨 Özellikler

### Ana Sayfa (Product Search)
- ✅ **Debounced Search**: 300ms gecikme ile akıllı arama
- ✅ **Barkod Desteği**: Sayısal giriş otomatik barkod araması yapar
- ✅ **Metin Arama**: Ürün başlığına göre filtreleme
- ✅ **Responsive Grid**: Mobil, tablet, desktop uyumlu
- ✅ **Loading States**: Yükleme animasyonu
- ✅ **Error Handling**: Hata mesajları
- ✅ **Stok Gösterimi**: Stokta var/yok durumu
- ✅ **Fiyat Formatı**: TL sembolü ile fiyat
- ✅ **Image Fallback**: Resim yoksa placeholder

### API Entegrasyonu
- ✅ Axios interceptors (hata yönetimi)
- ✅ React Query cache yönetimi
- ✅ Otomatik retry logic
- ✅ Stale time: 1 dakika

## 📱 Responsive Breakpoints

```
Mobile:  < 640px   → 1 sütun
Tablet:  640-1024px → 2 sütun
Desktop: 1024-1280px → 3 sütun
Large:   > 1280px   → 4 sütun
```

## 🔧 Yapılandırma

### Backend URL Değiştirme
`.env.local` dosyasını düzenleyin:
```env
NEXT_PUBLIC_API_URL=http://your-backend-url:port
```

### Port Değiştirme
```bash
# Farklı bir portta çalıştırın
npm run dev -- -p 3001
```

## 🐛 Sorun Giderme

### "Cannot connect to backend"
- Backend'in çalıştığından emin olun
- `.env.local` dosyasındaki URL'yi kontrol edin
- CORS ayarlarını kontrol edin

### "No products found"
- Backend'de ürün senkronizasyonu yapın:
  ```bash
  curl -X POST http://localhost:8080/sync-products
  ```

### Build hatası
```bash
# node_modules'u temizleyin
rm -rf node_modules .next
npm install
npm run build
```

## 📊 Proje İstatistikleri

- **Toplam Dosya**: 15+
- **Kod Satırı**: ~800 satır
- **Bağımlılık**: 361 paket
- **Build Süresi**: ~1 saniye
- **Bundle Boyutu**: Optimize edilmiş

## 🚀 Sonraki Adımlar

### Planlanan Özellikler
1. **Müşteri Yönetimi** (`/customers`)
   - Müşteri arama
   - Yeni müşteri ekleme
   - Müşteri detayları

2. **Sipariş Oluşturma** (`/orders`)
   - Sepet sistemi
   - Barkod ile ürün ekleme
   - Custom ürün ekleme
   - İndirim uygulama
   - Ödeme yöntemi seçimi

3. **Dashboard** (`/dashboard`)
   - Günlük satış istatistikleri
   - Ödeme yöntemi dağılımı
   - Grafik ve chartlar

4. **Webhook Logları** (`/webhooks`)
   - Webhook event listesi
   - Hata logları
   - İstatistikler

### Geliştirme Önerileri
- [ ] Sepet sistemi (localStorage)
- [ ] Dark mode
- [ ] Çoklu dil desteği (i18n)
- [ ] PWA desteği
- [ ] Print receipt özelliği
- [ ] Barcode scanner entegrasyonu

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. `README.md` dosyasını okuyun
2. `API_DOCUMENTATION.md` dosyasını kontrol edin
3. Browser console'u inceleyin (F12)
4. Network tab'inde API isteklerini kontrol edin

## ✅ Başarı Kriterleri

Aşağıdakiler çalışıyorsa kurulum başarılı:
- [x] `npm run dev` hatasız çalışıyor
- [x] `npm run build` başarılı
- [x] http://localhost:3000 açılıyor
- [x] Ürün arama çalışıyor
- [x] Barkod arama çalışıyor
- [x] Responsive tasarım çalışıyor
- [x] Loading ve error states çalışıyor

---

**Tebrikler! Meezy POS kullanıma hazır! 🎉**

Version: 1.0.0  
Last Updated: Kasım 2024

