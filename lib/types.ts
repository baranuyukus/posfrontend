// Product Types
export interface Product {
  id: number;
  shopify_id: number;
  shopify_product_id: number;
  title: string;
  sku?: string;
  barcode?: string;
  price: number;
  inventory_quantity: number;
  variant_title?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  status: string;
  total: number;
  skip: number;
  limit: number;
  products: Product[];
}

export interface BarcodeSearchResponse {
  status: string;
  barcode: string;
  count: number;
  products: Product[];
}

// Customer Types
export interface Customer {
  id: number;
  shopify_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip?: string;
}

export interface CreateCustomerRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: CustomerAddress;
}

// Order Types
export interface Order {
  id: number;
  shopify_order_id: number;
  customer_id?: number;
  product_id?: number;
  barcode?: string;
  title: string;
  quantity: number;
  price: number;
  payment_method: "cash" | "pos";
  status: string;
  created_at: string;
}

export interface CartItem {
  barcode?: string;
  quantity: number;
  type?: "custom";
  title?: string;
  size?: string;
  price?: number;
}

export interface CreateOrderRequest {
  items: CartItem[];
  payment_method: "cash" | "pos";
  email?: string;
  new_customer?: CreateCustomerRequest;
  discount?: number;
  discount_reason?: string;
}

export interface CreateOrderResponse {
  status: string;
  message: string;
  shopify_order_id: number;
  shopify_order_number: number;
  original_amount: number;
  final_amount: number;
  items_count: number;
  orders: Order[];
  discount_applied?: number;
  discount_reason?: string;
}

// Stats Types
export interface DailyStats {
  status: string;
  date: string;
  total_orders: number;
  total_sales: number;
  cash_sales: number;
  pos_sales: number;
  payment_breakdown: {
    cash: {
      count: number;
      amount: number;
    };
    pos: {
      count: number;
      amount: number;
    };
  };
}

// API Response Types
export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
  error?: string;
}

