export interface POSProduct {
  id: string;
  name: string;
  code: string;
  line: string;
  subline: string;
  unit: string;
  stock: number; // Now supports decimal values
  prices: {
    price1: number;
    price2: number;
    price3: number;
    price4: number;
    price5: number;
  };
  status: 'active' | 'disabled';
  has_tara?: boolean;
  tara_options?: TaraOption[];
}

export interface TaraOption {
  id: string;
  name: string;
  factor: number; // Factor de conversión (ej: 1 caja = 12 piezas)
  price_adjustment?: number; // Ajuste de precio si aplica
}

export interface POSOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number; // Now supports decimal values
  price_level: 1 | 2 | 3 | 4 | 5;
  unit_price: number;
  total: number;
  tara_option?: TaraOption;
  discount_percentage?: number;
  discount_amount?: number;
}

export interface POSOrder {
  id: string;
  client_id?: string;
  client_name: string;
  date: string;
  items: POSOrderItem[];
  subtotal: number;
  discount_total: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'saved';
  payment_method?: 'cash' | 'card' | 'transfer' | 'credit' | 'mixed';
  is_credit: boolean;
  is_invoice: boolean;
  is_quote: boolean;
  is_external: boolean;
  observations: string;
  driver: string;
  route: string;
  created_by: string;
  created_at: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'credit';
  reference: string;
  date: string;
  created_at: string;
}

export interface CashRegister {
  id: string;
  user_id: string;
  opening_amount: number;
  closing_amount?: number;
  total_sales: number;
  total_cash: number;
  total_card: number;
  total_transfer: number;
  opened_at: string;
  closed_at?: string;
  status: 'open' | 'closed';
}

export interface PaymentBreakdown {
  cash: number;
  card: number;
  transfer: number;
  credit: number;
}

export interface POSClient {
  id: string;
  name: string;
  rfc: string;
  credit_limit: number;
  balance: number;
  default_price_level: 1 | 2 | 3 | 4 | 5;
  zone: string;
}