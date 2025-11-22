import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Head from "next/head";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

type Product = {
  id: number;
  shopify_id: number;
  title: string;
  variant_title?: string;
  price: number;
  inventory_quantity: number;
  image_url?: string;
  barcode?: string;
  sku?: string;
};

type CartItem = {
  product: Product;
  quantity: number;
  type?: "custom";
  size?: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCustomProductModal, setShowCustomProductModal] = useState(false);
  const [customProduct, setCustomProduct] = useState({
    title: "",
    size: "",
    price: 0,
    quantity: 1,
  });
  const [checkout, setCheckout] = useState({
    payment_method: "",
    customerType: "",
    email: "",
    new_customer: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: {
        address1: "",
        city: "",
        zip: "",
        country: "Turkey",
      },
    },
    discount: 0,
    discount_reason: "",
  });

  // Customer search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("meezy-cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("meezy-cart", JSON.stringify(cart));
  }, [cart]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", debounced],
    queryFn: async () => {
      // Sadece arama yapıldığında sonuç getir
      if (!debounced || debounced.trim().length < 2) {
        return null;
      }

      const searchTerm = debounced.trim();
      console.log("🔍 Arama yapılıyor:", searchTerm);

      // Önce barkod/SKU ile direkt arama dene (daha hızlı)
      if (/^\d+$/.test(searchTerm) || searchTerm.length > 8) {
        try {
          console.log("📱 Barkod/SKU araması:", searchTerm);
          const res = await api.get(`/product/${searchTerm}`);
          
          console.log("🔍 Direkt arama response:", res.data);
          
          // Farklı response formatlarını destekle
          let products = null;
          if (Array.isArray(res.data)) {
            products = res.data;
          } else if (res.data.products && Array.isArray(res.data.products)) {
            products = res.data.products;
          } else if (res.data.data && Array.isArray(res.data.data)) {
            products = res.data.data;
          }
          
          if (products && products.length > 0) {
            console.log(`✅ ${products.length} ürün bulundu (direkt)`);
            return products;
          }
        } catch (err: any) {
          console.log("⚠️ Direkt arama sonuç vermedi:", err.response?.status, err.message);
          console.log("⚠️ Genel aramaya geçiliyor...");
          // Bulunamazsa genel aramaya devam et
        }
      }

      // Genel arama: Tüm ürünleri çek ve filtrele
      try {
        console.log("📦 Genel arama yapılıyor...");
        const res = await api.get(`/products?limit=10000`);
        
        // Debug: Response yapısını kontrol et
        console.log("🔍 API Response:", res.data);
        console.log("🔍 Response keys:", Object.keys(res.data || {}));
        
        // Farklı response formatlarını destekle
        let allProducts = [];
        if (Array.isArray(res.data)) {
          // Direkt array dönüyorsa
          allProducts = res.data;
        } else if (res.data.products && Array.isArray(res.data.products)) {
          // { products: [...] } formatında dönüyorsa
          allProducts = res.data.products;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          // { data: [...] } formatında dönüyorsa
          allProducts = res.data.data;
        } else {
          console.error("❌ Beklenmeyen response formatı:", res.data);
          throw new Error("Ürünler yüklenemedi - geçersiz format");
        }
        
        console.log(`📦 Toplam ${allProducts.length} ürün yüklendi`);

        // Arama filtresi
        const filtered = allProducts.filter((p: any) => {
          // Null/undefined kontrolü
          if (!p) return false;
          
          const titleMatch = p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase());
          const skuMatch = p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase());
          const barcodeMatch = p.barcode && p.barcode.toString().includes(searchTerm);
          
          return titleMatch || skuMatch || barcodeMatch;
        });

        console.log(`✅ ${filtered.length} ürün bulundu`);
        
        // Eğer hiç sonuç yoksa debug bilgisi ver
        if (filtered.length === 0 && allProducts.length > 0) {
          console.log("⚠️ Ürünler var ama filtreleme sonuç vermedi");
          console.log("📝 İlk ürün örneği:", allProducts[0]);
          console.log("🔍 Arama terimi:", searchTerm);
        }
        
        // Sonuçları sırala: Önce tam eşleşenler, sonra kısmi eşleşenler
        const sorted = filtered.sort((a: any, b: any) => {
          // Barkod tam eşleşme
          if (a.barcode === searchTerm) return -1;
          if (b.barcode === searchTerm) return 1;
          
          // SKU tam eşleşme
          if (a.sku === searchTerm) return -1;
          if (b.sku === searchTerm) return 1;
          
          // Başlık tam eşleşme
          if (a.title.toLowerCase() === searchTerm.toLowerCase()) return -1;
          if (b.title.toLowerCase() === searchTerm.toLowerCase()) return 1;
          
          // Stokta olanlar önce
          if (a.inventory_quantity > 0 && b.inventory_quantity === 0) return -1;
          if (a.inventory_quantity === 0 && b.inventory_quantity > 0) return 1;
          
          return 0;
        });

        return sorted;
      } catch (err: any) {
        console.error("❌ Arama hatası:", err);
        console.error("❌ Hata detayı:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url,
        });
        
        // Kullanıcıya anlamlı hata mesajı göster
        if (err.response?.status === 404) {
          toast.error("Ürün bulunamadı!");
        } else if (err.response?.status >= 500) {
          toast.error("Sunucu hatası! Lütfen tekrar deneyin.");
        } else if (err.message === "Network Error") {
          toast.error("Bağlantı hatası! Backend'e ulaşılamıyor.");
        } else {
          toast.error("Arama sırasında bir hata oluştu!");
        }
        
        return [];
      }
    },
    enabled: debounced.trim().length >= 2,
    staleTime: 30000, // 30 saniye cache
    retry: 1, // Sadece 1 kez tekrar dene
  });

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    if (confirm("Sepeti temizlemek istediğinizden emin misiniz?")) {
      setCart([]);
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Auto-add to cart when single product found (for barcode scanners)
  useEffect(() => {
    if (data && data.length === 1 && debounced && debounced.trim().length >= 2) {
      const product = data[0];
      
      // Check if already added (prevent duplicate additions)
      const alreadyInCart = cart.some((item) => item.product.id === product.id);
      if (alreadyInCart) {
        return;
      }

      // Check if product has valid price
      if (product.price <= 0) {
        toast.error(`⚠️ "${product.title}" ürününün fiyatı 0₺. Sepete eklenemez.`);
        return;
      }

      // Check stock
      if (product.inventory_quantity <= 0) {
        toast.error(`⚠️ "${product.title}" stokta yok!`);
        return;
      }

      // Auto-add to cart
      addToCart(product);
      toast.success(`✅ ${product.title} otomatik sepete eklendi!`);
      
      // Clear search after a short delay
      setTimeout(() => {
        setQuery("");
        setDebounced("");
      }, 500);
    }
  }, [data, debounced, cart]);

  // Auto-add to cart on Enter (for barcode scanner)
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      // Check if we have search results
      if (data && data.length > 0) {
        const firstProduct = data[0];
        
        // Check if product has valid price
        if (firstProduct.price <= 0) {
          toast.error(`⚠️ "${firstProduct.title}" ürününün fiyatı 0₺. Sepete eklenemez.`);
          return;
        }

        // Check stock
        if (firstProduct.inventory_quantity <= 0) {
          toast.error(`⚠️ "${firstProduct.title}" stokta yok!`);
          return;
        }

        // Add to cart
        addToCart(firstProduct);
        toast.success(`✅ ${firstProduct.title} sepete eklendi!`);
        
        // Clear search
        setQuery("");
        setDebounced("");
      } else {
        toast.error("Ürün bulunamadı!");
      }
    }
  };

  // Customer Search
  const searchCustomerByEmail = async (email: string) => {
    if (!email || email.length < 3) {
      setCustomerSearchResults([]);
      setSelectedCustomer(null);
      return;
    }

    setIsSearchingCustomer(true);
    try {
      const res = await api.get(`/customers/search?email=${encodeURIComponent(email)}`);
      
      console.log("🔍 Customer search response:", res.data);
      
      // Response formatını kontrol et - hem "customers" hem direkt array olabilir
      let customers = [];
      
      if (Array.isArray(res.data)) {
        // Direkt array dönüyorsa
        customers = res.data;
      } else if (res.data.customers && Array.isArray(res.data.customers)) {
        // "customers" key'i içinde array varsa
        customers = res.data.customers;
      } else if (res.data.customer) {
        // Tek "customer" key'i varsa
        customers = [res.data.customer];
      }
      
      console.log("✅ Found customers:", customers.length, customers);
      
      if (customers.length > 0) {
        setCustomerSearchResults(customers);
        
        // Tek müşteri bulunursa otomatik seç
        if (customers.length === 1) {
          setSelectedCustomer(customers[0]);
          toast.success(`✅ Müşteri bulundu: ${customers[0].first_name} ${customers[0].last_name}`);
        }
      } else {
        setCustomerSearchResults([]);
        setSelectedCustomer(null);
      }
    } catch (err: any) {
      // 404 normal - müşteri bulunamadı demek (toast gösterme)
      console.log("❌ Customer search error:", err.response?.data || err.message);
      setCustomerSearchResults([]);
      setSelectedCustomer(null);
      
      // Sadece 404 dışındaki hatalarda toast göster
      if (err.response?.status && err.response.status !== 404) {
        toast.error("Arama sırasında hata oluştu!");
      }
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchQuery.trim().length >= 3) {
        searchCustomerByEmail(customerSearchQuery);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  // Custom Product
  const addCustomProduct = () => {
    if (!customProduct.title || customProduct.price <= 0) {
      toast.error("Ürün adı ve fiyat gerekli!");
      return;
    }

    const customItem: CartItem = {
      product: {
        id: Date.now(), // Unique temporary ID
        shopify_id: 0,
        title: customProduct.title,
        variant_title: customProduct.size || undefined,
        price: customProduct.price,
        inventory_quantity: 999,
        barcode: undefined,
        sku: undefined,
      },
      quantity: customProduct.quantity,
      type: "custom",
      size: customProduct.size || undefined,
    };

    setCart([...cart, customItem]);
    toast.success(`✅ ${customProduct.title} sepete eklendi!`);
    
    // Reset form
    setCustomProduct({
      title: "",
      size: "",
      price: 0,
      quantity: 1,
    });
    setShowCustomProductModal(false);
  };

  // Checkout / Order Creation
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error("Sepetiniz boş!");
      return;
    }

    // Check for zero-price items
    const zeroPrice = cart.find((item) => item.product.price <= 0);
    if (zeroPrice) {
      toast.error(`⚠️ "${zeroPrice.product.title}" ürününün fiyatı 0₺. Lütfen fiyatı düzenleyin veya sepetten çıkarın.`);
      return;
    }
    
    if (!checkout.payment_method) {
      toast.error("Lütfen ödeme yöntemini seçin!");
      return;
    }

    if (!checkout.customerType) {
      toast.error("Lütfen müşteri türünü seçin!");
      return;
    }

    // Build items array
    const items = cart.map((item) => {
      if (item.type === "custom") {
        return {
          type: "custom",
          title: item.product.title,
          size: item.size || undefined,
          price: item.product.price,
          quantity: item.quantity,
        };
      } else {
        return {
          barcode: item.product.barcode || item.product.sku,
          quantity: item.quantity,
        };
      }
    });

    // Validate customer info
    if (checkout.customerType === "existing") {
      if (!checkout.email || checkout.email === "") {
        toast.error("Müşteri email'i gerekli!");
        return;
      }
    }

    if (checkout.customerType === "new") {
      if (
        !checkout.new_customer.first_name ||
        !checkout.new_customer.last_name ||
        !checkout.new_customer.email
      ) {
        toast.error("Yeni müşteri için ad, soyad, email zorunlu!");
        return;
      }
    }

    // Build payload
    const payload: any = {
      items,
      payment_method: checkout.payment_method,
    };

    if (checkout.customerType === "existing") {
      payload.email = checkout.email;
    }

    if (checkout.customerType === "new") {
      payload.new_customer = checkout.new_customer;
    }

    if (checkout.discount > 0) {
      payload.discount = checkout.discount;
      if (checkout.discount_reason) {
        payload.discount_reason = checkout.discount_reason;
      }
    }

    console.log("📤 Sipariş gönderiliyor:", payload);
    console.log("🌐 API URL:", process.env.NEXT_PUBLIC_API_URL);

    try {
      const res = await api.post("/orders/create-cart", payload);
      console.log("✅ Sipariş yanıtı:", res.data);
      
      toast.success(
        `✅ Sipariş oluşturuldu! Shopify No: ${res.data.shopify_order_number}`
      );
      
      // Reset and close
      setShowCheckoutModal(false);
      setCart([]);
      setCheckout({
        payment_method: "",
        customerType: "",
        email: "",
        new_customer: {
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          address: {
            address1: "",
            city: "",
            zip: "",
            country: "Turkey",
          },
        },
        discount: 0,
        discount_reason: "",
      });
    } catch (error: any) {
      console.error("❌ Sipariş hatası:", error);
      toast.error(
        error.response?.data?.detail ||
          "Sipariş oluşturulurken bir hata oluştu."
      );
    }
  };

  return (
    <>
      <Head>
        <title>Meezy POS - Ürün Arama</title>
        <meta name="description" content="Shopify POS & Inventory System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Toaster position="top-right" />

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Black Header */}
        <header className="bg-black text-white shadow-xl sticky top-0 z-50 border-b-4 border-white">
          <div className="max-w-full px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">🛍️</div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">MEEZY POS</h1>
                  <p className="text-sm text-gray-300 font-medium mt-1">
                    Shopify Ürün Arama ve Envanter Yönetimi
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Reports Button */}
                <Link 
                  href="/reports"
                  className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-3 rounded-lg transition-all font-bold shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Raporlar</span>
                </Link>

                {/* Custom Product Button */}
                <button
                  onClick={() => setShowCustomProductModal(true)}
                  className="flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 px-5 py-3 rounded-lg transition-all font-bold shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Özel Ürün</span>
                </button>

                {/* Cart Toggle Button */}
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="flex items-center space-x-3 bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-lg transition-all font-bold shadow-lg"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="text-lg">
                    Sepet ({cartItemCount})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Products Section */}
          <div
            className={`flex-1 overflow-y-auto transition-all duration-300 ${
              showCart ? "mr-0 lg:mr-[470px]" : ""
            }`}
          >
            <div className="max-w-7xl mx-auto px-8 py-8">
              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <svg
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Ürün adı, barkod veya SKU ile ara... (Enter ile sepete ekle)"
                    className="w-full pl-20 pr-6 py-6 text-xl border-3 border-gray-300 rounded-2xl shadow-lg focus:ring-4 focus:ring-gray-200 focus:border-black transition-all bg-white font-medium"
                    autoFocus
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-400 hover:text-black transition-colors"
                    >
                      <svg
                        className="h-7 w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {debounced && debounced.length >= 2 && (
                  <div className="mt-3 ml-2">
                    <p className="text-sm text-gray-600 font-medium">
                      🔍 "{debounced}" için arama yapılıyor...
                    </p>
                    {data && data.length === 1 && (
                      <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                        🚀 Tek ürün bulundu - Otomatik sepete ekleniyor...
                      </p>
                    )}
                  </div>
                )}
                {query && query.length < 2 && (
                  <p className="mt-3 text-sm text-gray-500 ml-2">
                    En az 2 karakter girin...
                  </p>
                )}
              </div>

              {/* Initial State - No Search */}
              {!debounced || debounced.length < 2 ? (
                <div className="text-center py-32">
                  <div className="inline-block p-12 bg-white rounded-3xl mb-8 shadow-lg border-2 border-gray-200">
                    <svg
                      className="mx-auto h-32 w-32 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4">
                    Ürün Aramaya Başlayın
                  </h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">
                    Yukarıdaki arama kutusuna ürün adı, barkod veya SKU girerek arama yapabilirsiniz.
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black">🏷️</span>
                      <span>Barkod</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black">📦</span>
                      <span>SKU</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black">🔤</span>
                      <span>Ürün Adı</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-32">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-24 w-24 border-4 border-gray-200 border-t-black"></div>
                        <p className="mt-6 text-gray-700 font-bold text-xl">
                          Ürünler aranıyor...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-xl shadow-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-7 w-7 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-red-900 font-bold text-lg">
                            Bağlantı Hatası
                          </h3>
                          <p className="text-sm text-red-700 mt-2 font-medium">
                            Backend sunucusuna bağlanılamadı. Lütfen sunucunun
                            çalıştığından emin olun.
                          </p>
                          <code className="text-xs bg-red-100 px-3 py-1 rounded mt-3 inline-block font-mono">
                            {process.env.NEXT_PUBLIC_API_URL}
                          </code>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products Grid */}
                  {!isLoading && !error && data && (
                    <>
                      <div className="mb-6 flex items-center justify-between">
                        <p className="text-lg font-bold text-gray-700">
                          <span className="text-black text-2xl">
                            {data.length}
                          </span>{" "}
                          ürün bulundu
                        </p>
                      </div>

                      {data.length === 0 ? (
                        <div className="text-center py-24">
                          <div className="inline-block p-8 bg-gray-100 rounded-full mb-6">
                            <svg
                              className="mx-auto h-20 w-20 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Ürün bulunamadı
                          </h3>
                          <p className="text-gray-600 text-lg">
                            "{debounced}" için sonuç bulunamadı. Farklı bir arama terimi deneyin.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {data.map((product: Product, index: number) => (
                            <div
                              key={product.id}
                              className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border-2 flex flex-col ${
                                index === 0
                                  ? "border-green-500 ring-4 ring-green-200"
                                  : "border-gray-200 hover:border-black"
                              }`}
                            >
                              {/* Product Image */}
                              <div className="relative h-56 bg-white overflow-hidden border-b-2 border-gray-100">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.title}
                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="w-full h-full flex items-center justify-center bg-gray-50">
                                            <div class="text-center">
                                              <svg class="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                              </svg>
                                              <p class="text-xs text-gray-400 mt-2">Görsel Yok</p>
                                            </div>
                                          </div>
                                        `;
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <div className="text-center">
                                      <svg
                                        className="mx-auto h-16 w-16 text-gray-300"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      <p className="text-xs text-gray-400 mt-2">Görsel Yok</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Stock Overlay */}
                                {product.inventory_quantity === 0 && (
                                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-white font-black text-lg px-4 py-2 bg-red-600 rounded-lg">
                                      STOKTA YOK
                                    </span>
                                  </div>
                                )}
                                
                                {/* First Product Badge */}
                                {index === 0 && product.inventory_quantity > 0 && product.price > 0 && (
                                  <div className="absolute top-3 left-3">
                                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-pulse flex items-center gap-1">
                                      {data.length === 1 ? "🚀 OTOMATİK EKLEME" : "⏎ ENTER İLE EKLE"}
                                    </span>
                                  </div>
                                )}

                                {/* Low Stock Badge */}
                                {product.inventory_quantity > 0 &&
                                  product.inventory_quantity <= 5 && (
                                    <div className="absolute top-3 right-3">
                                      <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-lg">
                                        SON {product.inventory_quantity} ADET!
                                      </span>
                                    </div>
                                  )}
                              </div>

                              {/* Product Info */}
                              <div className="p-5 flex-1 flex flex-col">
                                <h2 className="font-bold text-gray-900 text-base mb-3 line-clamp-2 min-h-[3rem]">
                                  {product.title}
                                </h2>

                                {product.variant_title && (
                                  <div className="mb-3">
                                    <span className="text-xs font-bold text-black bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300 inline-block">
                                      BEDEN: {product.variant_title}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-end justify-between mb-3 mt-auto">
                                  <div>
                                    <p className="text-2xl font-black text-black">
                                      ₺{product.price.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`text-xs font-bold ${
                                        product.inventory_quantity > 5
                                          ? "text-green-600"
                                          : product.inventory_quantity > 0
                                          ? "text-orange-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {product.inventory_quantity > 0
                                        ? `✓ ${product.inventory_quantity} ADET`
                                        : "✗ TÜKENDİ"}
                                    </p>
                                  </div>
                                </div>

                                {product.barcode && (
                                  <p className="text-xs text-gray-500 font-mono mb-1 bg-gray-50 px-2 py-1 rounded">
                                    🏷️ {product.barcode}
                                  </p>
                                )}

                                {product.sku && (
                                  <p className="text-xs text-gray-500 font-mono mb-3 bg-gray-50 px-2 py-1 rounded">
                                    📦 {product.sku}
                                  </p>
                                )}

                                {/* Action Button */}
                                <button
                                  onClick={() => addToCart(product)}
                                  className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-all transform active:scale-95 ${
                                    product.inventory_quantity > 0
                                      ? "bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg"
                                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  }`}
                                  disabled={product.inventory_quantity === 0}
                                >
                                  {product.inventory_quantity > 0
                                    ? "🛒 SEPETE EKLE"
                                    : "STOKTA YOK"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Shopping Cart Sidebar - MİNİMALİST */}
          {showCart && (
            <div className="hidden lg:block fixed right-6 top-[120px] bottom-6 w-[440px] bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden z-40 border border-gray-200">
              <div className="flex flex-col h-full">
                {/* Cart Header - Modern */}
                <div className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Sepetim</h2>
                        <p className="text-xs text-gray-300">{cartItemCount} Ürün</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCart(false)}
                      className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Cart Items - Modern */}
                <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-900 font-bold text-base mb-1">
                        Sepetiniz Boş
                      </p>
                      <p className="text-gray-500 text-sm">
                        Ürün ekleyerek başlayın
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className={`rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                            item.product.price <= 0
                              ? "bg-red-50 border-red-300"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex gap-3 items-start">
                            {/* Ürün Görseli - Daha Büyük */}
                            {item.product.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={item.product.title}
                                className="w-20 h-20 object-contain rounded-lg bg-gray-50 border-2 border-gray-200 flex-shrink-0 p-2"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f3f4f6' width='80' height='80'/%3E%3C/svg%3E";
                                }}
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            
                            {/* Ürün Bilgisi */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2">
                                <h3 className="font-bold text-sm text-gray-900 line-clamp-2 flex-1">
                                  {item.product.title}
                                </h3>
                                {item.type === "custom" && (
                                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0">
                                    ÖZEL
                                  </span>
                                )}
                              </div>
                              {item.product.variant_title && (
                                <div className="mb-2">
                                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-semibold">
                                    {item.product.variant_title}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <p className={`font-black text-base ${
                                  item.product.price <= 0 ? "text-red-600" : "text-gray-900"
                                }`}>
                                  ₺{item.product.price.toFixed(2)}
                                </p>
                                {item.product.price <= 0 && (
                                  <span className="text-xs text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full">
                                    ⚠️ Fiyat 0!
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Sil Butonu */}
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition-all flex items-center justify-center flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Miktar Kontrolleri - Modern */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1
                                  )
                                }
                                className="w-8 h-8 rounded-md bg-white border-2 border-gray-200 hover:border-black hover:bg-black hover:text-white font-bold transition-all flex items-center justify-center shadow-sm"
                              >
                                −
                              </button>
                              <span className="w-10 text-center font-black text-black">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1
                                  )
                                }
                                className="w-8 h-8 rounded-md bg-white border-2 border-gray-200 hover:border-black hover:bg-black hover:text-white font-bold transition-all flex items-center justify-center shadow-sm"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-0.5">Toplam</p>
                              <p className="font-black text-black text-base">
                                ₺{(item.product.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Footer - Modern Gradient */}
                {cart.length > 0 && (
                  <div className="border-t border-gray-200 p-5 bg-gradient-to-b from-white to-gray-50">
                    {/* Toplam Özeti */}
                    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                        <span>Ürün Sayısı</span>
                        <span className="font-semibold">{cartItemCount} Adet</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-3 pb-3 border-b border-gray-200">
                        <span>Ara Toplam</span>
                        <span className="font-bold text-gray-900">₺{cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-900">TOPLAM</span>
                        <span className="text-2xl font-black text-black">₺{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Fiyat 0 Uyarısı */}
                    {cart.some((item) => item.product.price <= 0) && (
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-3 mb-3">
                        <p className="text-red-700 text-xs font-bold text-center">
                          ⚠️ Sepetinizde fiyatı 0₺ olan ürün var!
                        </p>
                      </div>
                    )}

                    {/* Sipariş Tamamla Butonu */}
                    <button 
                      onClick={() => setShowCheckoutModal(true)}
                      disabled={cart.some((item) => item.product.price <= 0)}
                      className={`w-full py-4 rounded-xl font-bold text-base transition-all shadow-lg mb-3 ${
                        cart.some((item) => item.product.price <= 0)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-xl active:scale-98"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>Siparişi Tamamla</span>
                      </div>
                    </button>

                    {/* Sepeti Temizle */}
                    <button
                      onClick={clearCart}
                      className="w-full bg-white text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-gray-300"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Sepeti Temizle</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Cart Button */}
        {!showCart && cartItemCount > 0 && (
          <button
            onClick={() => setShowCart(true)}
            className="lg:hidden fixed bottom-8 right-8 bg-black text-white p-5 rounded-full shadow-2xl z-50 transform hover:scale-110 transition-all border-4 border-white"
          >
            <div className="relative">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="absolute -top-3 -right-3 bg-red-600 text-white text-sm font-black rounded-full w-7 h-7 flex items-center justify-center border-2 border-white">
                {cartItemCount}
              </span>
            </div>
          </button>
        )}

        {/* Custom Product Modal */}
        {showCustomProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowCustomProductModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-bold mb-6">➕ Özel Ürün Ekle</h2>

              <div className="space-y-4">
                {/* Product Title */}
                <div>
                  <label className="block mb-2 font-semibold text-sm">Ürün Adı *</label>
                  <input
                    type="text"
                    placeholder="Örn: Özel Tasarım Tişört"
                    value={customProduct.title}
                    onChange={(e) => setCustomProduct({ ...customProduct, title: e.target.value })}
                    className="border-2 border-gray-300 w-full p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block mb-2 font-semibold text-sm">Beden/Boyut (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="Örn: XL, 42, One Size"
                    value={customProduct.size}
                    onChange={(e) => setCustomProduct({ ...customProduct, size: e.target.value })}
                    className="border-2 border-gray-300 w-full p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block mb-2 font-semibold text-sm">Fiyat (₺) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={customProduct.price || ""}
                    onChange={(e) => setCustomProduct({ ...customProduct, price: parseFloat(e.target.value) || 0 })}
                    className="border-2 border-gray-300 w-full p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block mb-2 font-semibold text-sm">Adet *</label>
                  <input
                    type="number"
                    placeholder="1"
                    min="1"
                    value={customProduct.quantity}
                    onChange={(e) => setCustomProduct({ ...customProduct, quantity: parseInt(e.target.value) || 1 })}
                    className="border-2 border-gray-300 w-full p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                  />
                </div>

                {/* Preview */}
                {customProduct.title && customProduct.price > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                    <h3 className="font-semibold text-sm mb-2">Önizleme:</h3>
                    <div className="text-sm">
                      <p className="font-bold">{customProduct.title}</p>
                      {customProduct.size && <p className="text-gray-600">Beden: {customProduct.size}</p>}
                      <p className="text-lg font-black mt-1">₺{customProduct.price.toFixed(2)}</p>
                      <p className="text-gray-600">Adet: {customProduct.quantity}</p>
                      <p className="text-green-600 font-bold mt-2">
                        Toplam: ₺{(customProduct.price * customProduct.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Button */}
              <button
                onClick={addCustomProduct}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95 mt-6"
              >
                ✅ Sepete Ekle
              </button>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  // Reset customer search
                  setCustomerSearchQuery("");
                  setCustomerSearchResults([]);
                  setSelectedCustomer(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-bold mb-6">💳 Siparişi Tamamla</h2>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-sm">Ödeme Yöntemi *</label>
                <select
                  value={checkout.payment_method}
                  onChange={(e) => setCheckout({ ...checkout, payment_method: e.target.value })}
                  className="border-2 border-gray-300 w-full p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  <option value="">Seçiniz</option>
                  <option value="cash">💵 Nakit</option>
                  <option value="pos">💳 POS</option>
                </select>
              </div>

              {/* Customer Type */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-sm">Müşteri Türü *</label>
                <select
                  value={checkout.customerType}
                  onChange={(e) => {
                    setCheckout({ ...checkout, customerType: e.target.value });
                    // Reset customer search when type changes
                    setCustomerSearchQuery("");
                    setCustomerSearchResults([]);
                    setSelectedCustomer(null);
                  }}
                  className="border-2 border-gray-300 w-full p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  <option value="">Seçiniz</option>
                  <option value="existing">👤 Mevcut Müşteri</option>
                  <option value="new">➕ Yeni Müşteri</option>
                </select>
              </div>

              {/* Existing Customer - Dynamic Search */}
              {checkout.customerType === "existing" && (
                <div className="mb-4">
                  <label className="block mb-2 font-semibold text-sm">
                    Müşteri Email * 
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (Yazarken otomatik arar)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="ornek@email.com"
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setCheckout({ ...checkout, email: e.target.value });
                      }}
                      className="border-2 border-gray-300 w-full p-3 pr-10 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                    
                    {/* Loading Spinner */}
                    {isSearchingCustomer && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Customer Info */}
                  {selectedCustomer && (
                    <div className="mt-3 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-green-900 text-base">
                            ✅ {selectedCustomer.first_name} {selectedCustomer.last_name}
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            📧 {selectedCustomer.email}
                          </p>
                          {selectedCustomer.phone && (
                            <p className="text-sm text-green-700">
                              📱 {selectedCustomer.phone}
                            </p>
                          )}
                          {selectedCustomer.city && (
                            <p className="text-sm text-green-700">
                              📍 {selectedCustomer.city}, {selectedCustomer.country}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Multiple Results */}
                  {customerSearchResults.length > 1 && (
                    <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-300 rounded-xl max-h-60 overflow-y-auto">
                      <p className="font-semibold text-sm text-blue-900 mb-2">
                        {customerSearchResults.length} müşteri bulundu - Seçiniz:
                      </p>
                      <div className="space-y-2">
                        {customerSearchResults.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCustomerSearchQuery(customer.email);
                              setCheckout({ ...checkout, email: customer.email });
                              toast.success(`✅ ${customer.first_name} ${customer.last_name} seçildi`);
                            }}
                            className="w-full text-left p-3 bg-white hover:bg-blue-100 rounded-lg border border-blue-200 transition-all"
                          >
                            <p className="font-bold text-sm text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </p>
                            <p className="text-xs text-gray-600">{customer.email}</p>
                            {customer.phone && (
                              <p className="text-xs text-gray-600">{customer.phone}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* No Results - Sadece geçerli email formatında göster */}
                  {customerSearchQuery.length >= 3 && 
                   customerSearchQuery.includes('@') && 
                   !isSearchingCustomer && 
                   !selectedCustomer && 
                   customerSearchResults.length === 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                      <p className="text-sm text-yellow-700 text-center font-semibold">
                        ⚠️ Bu email ile müşteri bulunamadı
                      </p>
                      <p className="text-xs text-yellow-600 text-center mt-1">
                        Yeni müşteri olarak eklemek için "Yeni Müşteri" seçeneğini kullanın
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* New Customer */}
              {checkout.customerType === "new" && (
                <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-3">Yeni Müşteri Bilgileri</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Ad *"
                      className="border-2 border-gray-300 p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                      value={checkout.new_customer.first_name}
                      onChange={(e) =>
                        setCheckout({
                          ...checkout,
                          new_customer: {
                            ...checkout.new_customer,
                            first_name: e.target.value,
                          },
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Soyad *"
                      className="border-2 border-gray-300 p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                      value={checkout.new_customer.last_name}
                      onChange={(e) =>
                        setCheckout({
                          ...checkout,
                          new_customer: {
                            ...checkout.new_customer,
                            last_name: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email *"
                    className="border-2 border-gray-300 w-full p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                    value={checkout.new_customer.email}
                    onChange={(e) =>
                      setCheckout({
                        ...checkout,
                        new_customer: {
                          ...checkout.new_customer,
                          email: e.target.value,
                        },
                      })
                    }
                  />

                  <input
                    type="tel"
                    placeholder="Telefon (+90...)"
                    className="border-2 border-gray-300 w-full p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                    value={checkout.new_customer.phone}
                    onChange={(e) =>
                      setCheckout({
                        ...checkout,
                        new_customer: {
                          ...checkout.new_customer,
                          phone: e.target.value,
                        },
                      })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Adres"
                    className="border-2 border-gray-300 w-full p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                    value={checkout.new_customer.address.address1}
                    onChange={(e) =>
                      setCheckout({
                        ...checkout,
                        new_customer: {
                          ...checkout.new_customer,
                          address: {
                            ...checkout.new_customer.address,
                            address1: e.target.value,
                          },
                        },
                      })
                    }
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Şehir"
                      className="border-2 border-gray-300 p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                      value={checkout.new_customer.address.city}
                      onChange={(e) =>
                        setCheckout({
                          ...checkout,
                          new_customer: {
                            ...checkout.new_customer,
                            address: {
                              ...checkout.new_customer.address,
                              city: e.target.value,
                            },
                          },
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Posta Kodu"
                      className="border-2 border-gray-300 p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                      value={checkout.new_customer.address.zip}
                      onChange={(e) =>
                        setCheckout({
                          ...checkout,
                          new_customer: {
                            ...checkout.new_customer,
                            address: {
                              ...checkout.new_customer.address,
                              zip: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Discount */}
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-sm">İndirim (Opsiyonel)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="İndirim Tutarı (₺)"
                    className="border-2 border-gray-300 p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                    value={checkout.discount || ""}
                    onChange={(e) =>
                      setCheckout({
                        ...checkout,
                        discount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="İndirim Nedeni"
                    className="border-2 border-gray-300 p-3 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all"
                    value={checkout.discount_reason}
                    onChange={(e) =>
                      setCheckout({ ...checkout, discount_reason: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Sipariş Özeti</h3>
                <div className="flex justify-between text-sm mb-1">
                  <span>Ürün Sayısı:</span>
                  <span className="font-semibold">{cartItemCount} adet</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Ara Toplam:</span>
                  <span className="font-semibold">₺{cartTotal.toFixed(2)}</span>
                </div>
                {checkout.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 mb-1">
                    <span>İndirim:</span>
                    <span className="font-semibold">-₺{checkout.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2 mt-2">
                  <span>TOPLAM:</span>
                  <span>₺{(cartTotal - checkout.discount).toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreateOrder}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                ✅ Siparişi Oluştur
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
