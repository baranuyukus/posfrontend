import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import Link from "next/link";

type ReportPeriod = "today" | "weekly" | "monthly" | "custom";

type OrderItem = {
  title: string;
  quantity: number;
  price: number;
  total: number;
  sku: string | null;
  variant_title: string | null;
  variant_id: number | null;
  product_id: number | null;
  image: string | null;
};

type Order = {
  order_number: number;
  order_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  items_count: number;
  line_items: OrderItem[];
  financial_status: string;
  created_at: string;
  cancelled_at: string | null;
  tags?: string;
};

type TopProduct = {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
  sku: string | null;
  variant_title: string | null;
};

type RefundedOrder = {
  order_number: number;
  order_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  original_total: number;
  refunded_amount: number;
  net_payment: number;
  financial_status: string;
  refund_count: number;
  line_items: OrderItem[];
  created_at: string;
};

type ReportData = {
  status: string;
  period: string;
  start_date: string;
  end_date: string;
  summary: {
    total_orders: number;
    gross_revenue: number;
    total_refunded: number;
    net_revenue: number;
    total_revenue: number;
    average_order_value: number;
    cash_orders: number;
    pos_orders: number;
    total_products_sold: number;
    unique_products: number;
    cancelled_orders: number;
    cancelled_revenue: number;
    partially_refunded_count: number;
    fully_refunded_count: number;
    total_refund_transactions: number;
  };
  daily_breakdown: Record<string, { count: number; revenue: number; orders: Order[] }>;
  refund_details: {
    partially_refunded: RefundedOrder[];
    fully_refunded: RefundedOrder[];
    total_refunded_amount: number;
  };
  top_products: TopProduct[];
  orders: Order[];
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "refunds">("overview");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "pos" | "online">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "refunded" | "pending">("all");

  // API endpoint'i belirle
  const getEndpoint = () => {
    if (period === "today") return "/orders/stats/today";
    if (period === "weekly") return "/orders/reports/weekly";
    if (period === "monthly") return "/orders/reports/monthly";
    if (period === "custom" && customStartDate && customEndDate) {
      return `/orders/reports/custom?start_date=${customStartDate}&end_date=${customEndDate}`;
    }
    return "/orders/reports/weekly"; // default
  };

  const { data, isLoading, error, refetch } = useQuery<ReportData>({
    queryKey: ["reports", period, customStartDate, customEndDate],
    queryFn: async () => {
      const endpoint = getEndpoint();
      const res = await api.get(endpoint);
      return res.data;
    },
    enabled: period !== "custom" || (!!customStartDate && !!customEndDate),
  });

  const handleCustomDateSearch = () => {
    if (!customStartDate || !customEndDate) {
      toast.error("Lütfen başlangıç ve bitiş tarihini seçin!");
      return;
    }
    
    if (customStartDate > customEndDate) {
      toast.error("Başlangıç tarihi bitiş tarihinden sonra olamaz!");
      return;
    }

    refetch();
    toast.success("Rapor güncellendi!");
  };

  // Ödeme yöntemine göre sipariş türünü belirle
  const getPaymentType = (order: Order): "cash" | "pos" | "online" => {
    if (order.tags?.includes("cash")) return "cash";
    if (order.tags?.includes("pos") || order.tags?.includes("in-store")) return "pos";
    return "online";
  };

  // Filtrelenmiş siparişler
  const filteredOrders = data?.orders ? data.orders.filter((order) => {
    // Payment filter
    if (paymentFilter !== "all") {
      const paymentType = getPaymentType(order);
      if (paymentType !== paymentFilter) return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "paid" && order.financial_status !== "paid") return false;
      if (statusFilter === "refunded" && order.financial_status !== "refunded") return false;
      if (statusFilter === "pending" && order.financial_status !== "pending") return false;
    }

    return true;
  }) : [];

  // Ödeme yöntemlerine göre toplam hesapla
  const paymentStats = data?.orders ? {
    cash: {
      count: data.orders.filter(o => getPaymentType(o) === "cash").length,
      revenue: data.orders.filter(o => getPaymentType(o) === "cash" && o.financial_status === "paid").reduce((sum, o) => sum + o.total, 0),
    },
    pos: {
      count: data.orders.filter(o => getPaymentType(o) === "pos").length,
      revenue: data.orders.filter(o => getPaymentType(o) === "pos" && o.financial_status === "paid").reduce((sum, o) => sum + o.total, 0),
    },
    online: {
      count: data.orders.filter(o => getPaymentType(o) === "online").length,
      revenue: data.orders.filter(o => getPaymentType(o) === "online" && o.financial_status === "paid").reduce((sum, o) => sum + o.total, 0),
    },
  } : { cash: { count: 0, revenue: 0 }, pos: { count: 0, revenue: 0 }, online: { count: 0, revenue: 0 } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-black text-white border-b-4 border-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-black tracking-tight">📊 MEEZY REPORTS</h1>
                <p className="text-gray-300 text-sm mt-1">Satış Raporları ve Analiz</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Period Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">📅 Rapor Dönemi Seçin</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setPeriod("today")}
              className={`p-4 rounded-xl font-bold transition-all ${
                period === "today"
                  ? "bg-black text-white shadow-lg scale-105"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              📆 Bugün
            </button>
            <button
              onClick={() => setPeriod("weekly")}
              className={`p-4 rounded-xl font-bold transition-all ${
                period === "weekly"
                  ? "bg-black text-white shadow-lg scale-105"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              📅 Haftalık
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`p-4 rounded-xl font-bold transition-all ${
                period === "monthly"
                  ? "bg-black text-white shadow-lg scale-105"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              📊 Aylık
            </button>
            <button
              onClick={() => setPeriod("custom")}
              className={`p-4 rounded-xl font-bold transition-all ${
                period === "custom"
                  ? "bg-black text-white shadow-lg scale-105"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              🔧 Özel Tarih
            </button>
          </div>

          {/* Custom Date Range */}
          {period === "custom" && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="font-semibold text-sm mb-3 text-blue-900">Özel Tarih Aralığı Seçin:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-black focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-black focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCustomDateSearch}
                    className="w-full bg-black text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition-all"
                  >
                    🔍 Rapor Getir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Rapor yükleniyor...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 text-center">
            <p className="text-red-700 font-bold text-lg">❌ Rapor yüklenirken hata oluştu!</p>
            <p className="text-red-600 text-sm mt-2">Lütfen tekrar deneyin veya tarih aralığını kontrol edin.</p>
          </div>
        )}

        {/* Report Data */}
        {data && !isLoading && (
          <>
            {/* Date Range Info */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-90">Rapor Dönemi</p>
                  <h2 className="text-2xl font-black mt-1">
                    {data.start_date} - {data.end_date}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold opacity-90">Periyot</p>
                  <h2 className="text-2xl font-black mt-1 uppercase">{data.period}</h2>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Orders */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Toplam Sipariş</p>
                  <span className="text-2xl">🛍️</span>
                </div>
                <p className="text-3xl font-black text-gray-900">{data?.summary?.total_orders || 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {data?.summary?.cancelled_orders || 0} iptal • {data?.summary?.fully_refunded_count || 0} iade
                </p>
              </div>

              {/* Gross Revenue */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Brüt Gelir</p>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-3xl font-black text-green-600">₺{(data?.summary?.gross_revenue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Ortalama: ₺{(data?.summary?.average_order_value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Net Revenue */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Net Gelir</p>
                  <span className="text-2xl">💎</span>
                </div>
                <p className="text-3xl font-black text-purple-600">₺{(data?.summary?.net_revenue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-2">
                  İade: -₺{(data?.summary?.total_refunded || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Products Sold */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Satılan Ürün</p>
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-3xl font-black text-orange-600">{data?.summary?.total_products_sold || 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {data?.summary?.unique_products || 0} farklı ürün
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 py-4 px-6 font-bold transition-all ${
                      activeTab === "overview"
                        ? "bg-black text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    📊 Genel Bakış
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`flex-1 py-4 px-6 font-bold transition-all ${
                      activeTab === "orders"
                        ? "bg-black text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    🛍️ Siparişler ({data.orders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("products")}
                    className={`flex-1 py-4 px-6 font-bold transition-all ${
                      activeTab === "products"
                        ? "bg-black text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    📦 Satılan Ürünler ({data?.top_products?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("refunds")}
                    className={`flex-1 py-4 px-6 font-bold transition-all ${
                      activeTab === "refunds"
                        ? "bg-black text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    ↩️ İadeler ({data.refund_details.fully_refunded.length})
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Daily Breakdown */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                          📅 Günlük Satışlar
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {data?.daily_breakdown && Object.entries(data.daily_breakdown)
                            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                            .map(([date, info]) => (
                              <div key={date} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-bold text-gray-900">{date}</p>
                                  <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {info.count} sipariş
                                  </span>
                                </div>
                                <p className="text-2xl font-black text-green-600">
                                  ₺{info.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                          💳 Ödeme Yöntemleri
                        </h3>
                        <div className="space-y-4">
                          {/* POS Payments */}
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-lg">🏪</span>
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">POS Siparişleri</p>
                                  <p className="text-xs text-gray-600">Mağaza içi satışlar</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-blue-600">{paymentStats.pos.count}</p>
                                <p className="text-xs text-gray-600">sipariş</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <p className="text-sm font-semibold text-gray-700">Toplam Gelir:</p>
                              <p className="text-xl font-black text-blue-600">
                                ₺{paymentStats.pos.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-3 mt-3">
                              <div
                                className="bg-blue-600 h-3 rounded-full transition-all"
                                style={{
                                  width: `${data?.summary?.total_orders ? (paymentStats.pos.count / data.summary.total_orders) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Cash Payments */}
                          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-lg">💵</span>
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">Nakit Ödemeler</p>
                                  <p className="text-xs text-gray-600">Peşin nakit</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-green-600">{paymentStats.cash.count}</p>
                                <p className="text-xs text-gray-600">sipariş</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <p className="text-sm font-semibold text-gray-700">Toplam Gelir:</p>
                              <p className="text-xl font-black text-green-600">
                                ₺{paymentStats.cash.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-3 mt-3">
                              <div
                                className="bg-green-600 h-3 rounded-full transition-all"
                                style={{
                                  width: `${data?.summary?.total_orders ? (paymentStats.cash.count / data.summary.total_orders) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Online Payments */}
                          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-lg">🌐</span>
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">Online Siparişler</p>
                                  <p className="text-xs text-gray-600">Web sitesi satışları</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-purple-600">{paymentStats.online.count}</p>
                                <p className="text-xs text-gray-600">sipariş</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <p className="text-sm font-semibold text-gray-700">Toplam Gelir:</p>
                              <p className="text-xl font-black text-purple-600">
                                ₺{paymentStats.online.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="w-full bg-purple-200 rounded-full h-3 mt-3">
                              <div
                                className="bg-purple-600 h-3 rounded-full transition-all"
                                style={{
                                  width: `${data?.summary?.total_orders ? (paymentStats.online.count / data.summary.total_orders) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Cancelled Orders */}
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-4">
                            <p className="font-semibold text-red-900 text-sm mb-2">❌ İptal Edilen Siparişler</p>
                            <div className="flex items-center justify-between">
                              <p className="text-red-700 font-bold">{data?.summary?.cancelled_orders || 0} sipariş</p>
                              <p className="text-red-600 font-bold">
                                ₺{(data?.summary?.cancelled_revenue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === "orders" && (
                  <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-6 border-2 border-gray-300">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        🔍 Filtreleme Seçenekleri
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Payment Filter */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">💳 Ödeme Yöntemi</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setPaymentFilter("all")}
                              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                                paymentFilter === "all"
                                  ? "bg-black text-white shadow-lg scale-105"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                              }`}
                            >
                              Tümü ({data?.orders?.length || 0})
                            </button>
                            <button
                              onClick={() => setPaymentFilter("pos")}
                              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                                paymentFilter === "pos"
                                  ? "bg-blue-600 text-white shadow-lg scale-105"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                              }`}
                            >
                              🏪 POS ({paymentStats.pos.count})
                            </button>
                            <button
                              onClick={() => setPaymentFilter("cash")}
                              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                                paymentFilter === "cash"
                                  ? "bg-green-600 text-white shadow-lg scale-105"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                              }`}
                            >
                              💵 Nakit ({paymentStats.cash.count})
                            </button>
                            <button
                              onClick={() => setPaymentFilter("online")}
                              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                                paymentFilter === "online"
                                  ? "bg-purple-600 text-white shadow-lg scale-105"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                              }`}
                            >
                              🌐 Online ({paymentStats.online.count})
                            </button>
                          </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">📊 Sipariş Durumu</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setStatusFilter("all")}
                              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                                statusFilter === "all"
                                  ? "bg-black text-white shadow-lg scale-105"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                              }`}
                            >
                              Tümü
                            </button>
                            <button
                              onClick={() => setStatusFilter("paid")}
                              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                                statusFilter === "paid"
                                  ? "bg-green-600 text-white shadow-lg scale-105"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                              }`}
                            >
                              ✅ Ödendi
                            </button>
                            <button
                              onClick={() => setStatusFilter("refunded")}
                              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                                statusFilter === "refunded"
                                  ? "bg-red-600 text-white shadow-lg scale-105"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                              }`}
                            >
                              ↩️ İade
                            </button>
                            <button
                              onClick={() => setStatusFilter("pending")}
                              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                                statusFilter === "pending"
                                  ? "bg-yellow-600 text-white shadow-lg scale-105"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                              }`}
                            >
                              ⏳ Bekliyor
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Filter Results Summary */}
                      <div className="mt-4 bg-white rounded-lg p-4 border-2 border-gray-300">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900">
                            📋 Filtrelenen Sonuçlar: <span className="text-blue-600">{filteredOrders.length}</span> sipariş
                          </p>
                          {(paymentFilter !== "all" || statusFilter !== "all") && (
                            <button
                              onClick={() => {
                                setPaymentFilter("all");
                                setStatusFilter("all");
                                toast.success("Filtreler sıfırlandı!");
                              }}
                              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition-all text-sm"
                            >
                              🔄 Filtreleri Sıfırla
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {filteredOrders.length === 0 && (
                        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-center">
                          <p className="text-gray-600 font-bold text-lg">📭 Filtreye uygun sipariş bulunamadı!</p>
                          <p className="text-gray-500 text-sm mt-2">Farklı bir filtre kombinasyonu deneyin.</p>
                        </div>
                      )}
                      {filteredOrders.map((order) => {
                        const paymentType = getPaymentType(order);
                        return (
                      <div
                        key={order.order_id}
                        className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-600 font-semibold">Sipariş #{order.order_number}</p>
                            <p className="font-bold text-lg text-gray-900">{order.customer_name}</p>
                            <p className="text-sm text-gray-600">{order.customer_email}</p>
                            {order.customer_phone && (
                              <p className="text-sm text-gray-600">{order.customer_phone}</p>
                            )}
                            {/* Payment Type Badge */}
                            <div className="mt-2">
                              <span
                                className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                                  paymentType === "pos"
                                    ? "bg-blue-100 text-blue-700"
                                    : paymentType === "cash"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {paymentType === "pos" && "🏪 POS"}
                                {paymentType === "cash" && "💵 Nakit"}
                                {paymentType === "online" && "🌐 Online"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-green-600">
                              ₺{order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                            <span
                              className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full ${
                                order.financial_status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : order.financial_status === "refunded"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {order.financial_status === "paid"
                                ? "✅ Ödendi"
                                : order.financial_status === "refunded"
                                ? "↩️ İade"
                                : "⏳ Bekliyor"}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-gray-300 pt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-3">
                            🛍️ Ürünler ({order.items_count} adet):
                          </p>
                          <div className="space-y-2">
                            {order.line_items.map((item, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-sm text-gray-900">{item.title}</p>
                                    {item.variant_title && (
                                      <p className="text-xs text-gray-600">Varyant: {item.variant_title}</p>
                                    )}
                                    {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-900">{item.quantity}x ₺{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-sm text-green-600 font-bold">
                                      ₺{item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-gray-300 pt-4 mt-4">
                          <p className="text-xs text-gray-500">
                          📅 {new Date(order.created_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                    </div>
                  </div>
                )}

                {/* Products Tab */}
                {activeTab === "products" && (
                  <div className="space-y-6">
                    {(!data?.top_products || data.top_products.length === 0) && (
                      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-center">
                        <p className="text-gray-600 font-bold text-lg">📦 Bu dönemde satılan ürün yok!</p>
                      </div>
                    )}

                    {data?.top_products && data.top_products.length > 0 && (
                      <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
                            <p className="text-sm font-semibold opacity-90">Toplam Ürün Çeşidi</p>
                            <p className="text-4xl font-black mt-2">{data.top_products.length}</p>
                            <p className="text-xs opacity-75 mt-1">Farklı ürün/varyant</p>
                          </div>
                          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
                            <p className="text-sm font-semibold opacity-90">Toplam Satış Adedi</p>
                            <p className="text-4xl font-black mt-2">
                              {data.top_products.reduce((sum, p) => sum + p.total_quantity, 0)}
                            </p>
                            <p className="text-xs opacity-75 mt-1">Adet</p>
                          </div>
                          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
                            <p className="text-sm font-semibold opacity-90">Toplam Ürün Geliri</p>
                            <p className="text-4xl font-black mt-2">
                              ₺{data.top_products.reduce((sum, p) => sum + p.total_revenue, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs opacity-75 mt-1">Toplam gelir</p>
                          </div>
                        </div>

                        {/* Card View */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">📦 Satılan Ürünler Listesi</h3>
                            <button
                              onClick={() => {
                                const tableElement = document.getElementById('products-table');
                                if (tableElement) {
                                  tableElement.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-all text-sm flex items-center gap-2"
                            >
                              📊 Excel Tablosu
                            </button>
                          </div>
                          <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {data.top_products.map((product, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl font-black">#{index + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-900">{product.product_name}</h3>
                                    {product.variant_title && (
                                      <p className="text-sm text-gray-600">Varyant: {product.variant_title}</p>
                                    )}
                                    {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-3xl font-black text-green-600">
                                      ₺{product.total_revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                        {product.total_quantity} adet
                                      </span>
                                      <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                                        {product.order_count} sipariş
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Excel Table View */}
                        <div id="products-table" className="mt-8 bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                              📊 Satılan Ürünler - Excel Tablosu
                            </h3>
                            <p className="text-xs text-green-100 mt-1">
                              Bu tabloyu seçip kopyalayın (Ctrl+C / Cmd+C) ve Excel'e yapıştırın
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100 border-b-2 border-gray-300">
                                <tr>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">#</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">Ürün Adı</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">Varyant</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">SKU</th>
                                  <th className="px-4 py-3 text-right font-bold text-gray-700">Satış Adedi</th>
                                  <th className="px-4 py-3 text-right font-bold text-gray-700">Sipariş Sayısı</th>
                                  <th className="px-4 py-3 text-right font-bold text-gray-700">Birim Fiyat (Ort.)</th>
                                  <th className="px-4 py-3 text-right font-bold text-gray-700">Toplam Gelir</th>
                                  <th className="px-4 py-3 text-right font-bold text-gray-700">Pay %</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {data.top_products.map((product, index) => {
                                  const totalRevenue = data.top_products.reduce((sum, p) => sum + p.total_revenue, 0);
                                  const percentage = (product.total_revenue / totalRevenue) * 100;
                                  const avgPrice = product.total_revenue / product.total_quantity;
                                  
                                  return (
                                    <tr 
                                      key={index} 
                                      className={`hover:bg-green-50 transition-colors ${
                                        index < 3 ? 'bg-yellow-50' : ''
                                      }`}
                                    >
                                      <td className="px-4 py-3 text-center">
                                        <span className={`font-bold ${
                                          index === 0 ? 'text-yellow-600 text-lg' :
                                          index === 1 ? 'text-gray-500 text-lg' :
                                          index === 2 ? 'text-orange-600 text-lg' :
                                          'text-gray-700'
                                        }`}>
                                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-semibold text-gray-900">
                                        {product.product_name}
                                      </td>
                                      <td className="px-4 py-3 text-gray-600 text-xs">
                                        {product.variant_title || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                                        {product.sku || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                                        {product.total_quantity}
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold text-purple-600">
                                        {product.order_count}
                                      </td>
                                      <td className="px-4 py-3 text-right text-gray-700">
                                        ₺{avgPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-green-600">
                                        ₺{product.total_revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div
                                              className="bg-green-500 h-2 rounded-full"
                                              style={{ width: `${percentage}%` }}
                                            ></div>
                                          </div>
                                          <span className="text-xs font-bold text-gray-700">
                                            {percentage.toFixed(1)}%
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                                <tr>
                                  <td colSpan={4} className="px-4 py-4 text-right font-bold text-lg">
                                    📊 TOPLAM:
                                  </td>
                                  <td className="px-4 py-4 text-right font-black text-xl text-blue-300">
                                    {data.top_products.reduce((sum, p) => sum + p.total_quantity, 0)} adet
                                  </td>
                                  <td className="px-4 py-4 text-right font-black text-xl text-purple-300">
                                    {data.top_products.reduce((sum, p) => sum + p.order_count, 0)} sipariş
                                  </td>
                                  <td className="px-4 py-4 text-right font-semibold text-gray-300">
                                    -
                                  </td>
                                  <td className="px-4 py-4 text-right font-black text-xl text-green-300">
                                    ₺{data.top_products.reduce((sum, p) => sum + p.total_revenue, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-4 text-right font-black text-xl">
                                    100%
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Export Instructions */}
                          <div className="bg-gray-50 border-t-2 border-gray-200 p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">💡 Excel'e Aktarma Talimatları:</p>
                            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                              <li>Tablonun herhangi bir yerine tıklayın</li>
                              <li><kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Ctrl+A</kbd> (Mac: <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Cmd+A</kbd>) ile tüm tabloyu seçin</li>
                              <li><kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Ctrl+C</kbd> (Mac: <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Cmd+C</kbd>) ile kopyalayın</li>
                              <li>Excel veya Google Sheets açın ve <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Ctrl+V</kbd> (Mac: <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Cmd+V</kbd>) ile yapıştırın</li>
                            </ol>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Refunds Tab */}
                {activeTab === "refunds" && (
                  <div className="space-y-6">
                    {(!data?.refund_details?.fully_refunded || data.refund_details.fully_refunded.length === 0) && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
                        <p className="text-green-700 font-bold text-lg">✅ Bu dönemde iade yok!</p>
                      </div>
                    )}

                    {data?.refund_details?.fully_refunded && data.refund_details.fully_refunded.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            ↩️ Tam İadeler ({data.refund_details.fully_refunded.length})
                          </h3>
                          <button
                            onClick={() => {
                              // Tablo moduna geç
                              const tableElement = document.getElementById('refunds-table');
                              if (tableElement) {
                                tableElement.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all text-sm flex items-center gap-2"
                          >
                            📋 Tablo Görünümü
                          </button>
                        </div>

                        {/* Card View */}
                        <div className="space-y-4">
                          {data.refund_details.fully_refunded.map((refund) => (
                            <div
                              key={refund.order_id}
                              className="bg-red-50 rounded-xl p-6 border-2 border-red-200"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <p className="text-sm text-red-600 font-semibold">Sipariş #{refund.order_number}</p>
                                  <p className="font-bold text-lg text-gray-900">{refund.customer_name}</p>
                                  <p className="text-sm text-gray-600">{refund.customer_email}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600 line-through">
                                    ₺{refund.original_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-2xl font-black text-red-600">
                                    -₺{refund.refunded_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <span className="inline-block mt-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    TAM İADE
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-red-300 pt-4">
                                <p className="text-sm font-semibold text-gray-700 mb-3">🛍️ İade Edilen Ürünler:</p>
                                <div className="space-y-2">
                                  {refund.line_items.map((item, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-bold text-sm text-gray-900">{item.title}</p>
                                          {item.variant_title && (
                                            <p className="text-xs text-gray-600">Varyant: {item.variant_title}</p>
                                          )}
                                        </div>
                                        <p className="font-bold text-red-600">
                                          {item.quantity}x ₺{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="border-t border-red-300 pt-4 mt-4">
                                <p className="text-xs text-gray-500">
                                  📅 Sipariş: {new Date(refund.created_at).toLocaleString('tr-TR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Table View */}
                        <div id="refunds-table" className="mt-8 bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                          <div className="bg-gray-800 text-white p-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                              📊 İade Detayları - Tablo Görünümü
                            </h3>
                            <p className="text-xs text-gray-300 mt-1">
                              Bu tabloyu kopyalayıp Excel'e aktarabilirsiniz (Ctrl+C / Cmd+C)
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100 border-b-2 border-gray-300">
                                <tr>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">Sipariş No</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">Müşteri Adı</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">Email</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">Telefon</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">Ürün</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">Varyant</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">SKU</th>
                                  <th className="px-4 py-3 text-right font-bold text-gray-700">Orijinal Tutar</th>
                                  <th className="px-4 py-3 text-right font-bold text-gray-700">İade Tutarı</th>
                                  <th className="px-4 py-3 text-left font-bold text-gray-700">Tarih</th>
                                  <th className="px-4 py-3 text-center font-bold text-gray-700">Durum</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {data.refund_details.fully_refunded.map((refund) => 
                                  refund.line_items.map((item, idx) => (
                                    <tr key={`${refund.order_id}-${idx}`} className="hover:bg-red-50 transition-colors">
                                      {idx === 0 && (
                                        <>
                                          <td rowSpan={refund.line_items.length} className="px-4 py-3 font-bold text-gray-900 border-r border-gray-200">
                                            #{refund.order_number}
                                          </td>
                                          <td rowSpan={refund.line_items.length} className="px-4 py-3 text-gray-900 border-r border-gray-200">
                                            {refund.customer_name}
                                          </td>
                                          <td rowSpan={refund.line_items.length} className="px-4 py-3 text-gray-600 text-xs border-r border-gray-200">
                                            {refund.customer_email}
                                          </td>
                                          <td rowSpan={refund.line_items.length} className="px-4 py-3 text-gray-600 text-xs border-r border-gray-200">
                                            {refund.customer_phone || '-'}
                                          </td>
                                        </>
                                      )}
                                      <td className="px-4 py-3 text-gray-900 font-semibold">
                                        {item.title}
                                      </td>
                                      <td className="px-4 py-3 text-gray-600 text-xs">
                                        {item.variant_title || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                                        {item.sku || '-'}
                                      </td>
                                      {idx === 0 && (
                                        <>
                                          <td rowSpan={refund.line_items.length} className="px-4 py-3 text-right font-bold text-gray-900 border-l border-gray-200">
                                            ₺{refund.original_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td rowSpan={refund.line_items.length} className="px-4 py-3 text-right font-bold text-red-600">
                                            -₺{refund.refunded_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td rowSpan={refund.line_items.length} className="px-4 py-3 text-gray-600 text-xs border-l border-gray-200">
                                            {new Date(refund.created_at).toLocaleDateString('tr-TR')}
                                            <br />
                                            {new Date(refund.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                          </td>
                                          <td rowSpan={refund.line_items.length} className="px-4 py-3 text-center">
                                            <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                                              TAM İADE
                                            </span>
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  ))
                                )}
                              </tbody>
                              <tfoot className="bg-gray-800 text-white">
                                <tr>
                                  <td colSpan={7} className="px-4 py-3 text-right font-bold text-lg">
                                    TOPLAM İADE:
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-xl">
                                    ₺{data.refund_details.fully_refunded.reduce((sum, r) => sum + r.original_total, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-xl text-red-300">
                                    -₺{data.refund_details.total_refunded_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {data?.refund_details?.partially_refunded && data.refund_details.partially_refunded.length > 0 && (
                      <div className="mt-8">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                          ⚠️ Kısmi İadeler ({data.refund_details.partially_refunded.length})
                        </h3>
                        <div className="space-y-4">
                          {data.refund_details.partially_refunded.map((refund) => (
                            <div
                              key={refund.order_id}
                              className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <p className="text-sm text-yellow-600 font-semibold">Sipariş #{refund.order_number}</p>
                                  <p className="font-bold text-lg text-gray-900">{refund.customer_name}</p>
                                  <p className="text-sm text-gray-600">{refund.customer_email}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">
                                    Orijinal: ₺{refund.original_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-lg font-black text-red-600">
                                    İade: -₺{refund.refunded_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-sm font-bold text-green-600">
                                    Net: ₺{refund.net_payment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <span className="inline-block mt-2 bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    KISMİ İADE
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total Refunded Summary */}
                    {data?.refund_details?.total_refunded_amount && data.refund_details.total_refunded_amount > 0 && (
                      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl p-6 mt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold opacity-90">Toplam İade Tutarı</p>
                            <p className="text-4xl font-black mt-2">
                              ₺{data.refund_details.total_refunded_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="text-6xl">↩️</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

