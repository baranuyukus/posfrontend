# 🔧 Backend CORS Hatası Çözümü

## ❌ Sorun

Frontend'den sipariş oluştururken şu hata alınıyor:

```
INFO: 127.0.0.1:58778 - "OPTIONS /orders/create-cart HTTP/1.1" 405 Method Not Allowed
```

Bu, backend'in CORS preflight (OPTIONS) isteklerini desteklememesinden kaynaklanıyor.

---

## ✅ Çözüm

Backend'inizde (FastAPI) CORS middleware'ini ekleyin:

### 1. CORS Middleware Ekleyin

`main.py` dosyanıza şunu ekleyin:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URL'leri
    allow_credentials=True,
    allow_methods=["*"],  # Tüm HTTP metodları (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],  # Tüm header'lar
)
```

### 2. Production için

Production'da frontend URL'inizi ekleyin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://yourdomain.com",  # Production URL'iniz
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Backend'i Yeniden Başlatın

```bash
# Backend dizininizde
uvicorn main:app --reload --port 8080
```

---

## 🧪 Test

CORS düzeltmesinden sonra:

```bash
# OPTIONS isteği başarılı olmalı
curl -X OPTIONS http://localhost:8080/orders/create-cart \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Başarılı yanıt:
```
< HTTP/1.1 200 OK
< access-control-allow-origin: http://localhost:3000
< access-control-allow-methods: *
< access-control-allow-headers: *
```

---

## 📋 Kontrol Listesi

- [ ] `fastapi.middleware.cors` import edildi
- [ ] `CORSMiddleware` eklendi
- [ ] `allow_origins` frontend URL'ini içeriyor
- [ ] `allow_methods=["*"]` ayarlandı
- [ ] Backend yeniden başlatıldı
- [ ] Frontend'den sipariş testi yapıldı

---

## 🔍 Diğer Olası Sorunlar

### 1. Fiyat 0 Hatası

Shopify fiyatı 0 olan ürünlerle sipariş oluşturamaz:

```
{'errors': {'order': ['Transactions is invalid'], 
            'transactions': ['Amount must be greater than zero']}}
```

**Çözüm**: Frontend artık fiyatı 0 olan ürünleri kontrol ediyor ve uyarı veriyor.

### 2. Backend Port

Backend'in `http://localhost:8080` adresinde çalıştığından emin olun:

```bash
curl http://localhost:8080/
# {"status":"healthy","message":"Shopify POS & Inventory Backend is running","version":"1.0.0"}
```

---

## 📞 Destek

Sorun devam ederse:

1. Backend loglarını kontrol edin
2. Browser console'da network tab'ı açın
3. OPTIONS isteğinin response'unu inceleyin
4. CORS header'larının gelip gelmediğini kontrol edin

---

**Son Güncelleme**: 2025-11-15

