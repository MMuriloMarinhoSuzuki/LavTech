export type Role = 'admin' | 'manager' | 'attendant';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active?: number;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

export type ServiceCategory = 'washing' | 'dyeing' | 'ironing' | 'special';
export type ServiceUnit = 'kg' | 'piece' | 'unit';

export interface Service {
  id: number;
  name: string;
  description: string | null;
  category: ServiceCategory;
  unit: ServiceUnit;
  price: number;
  estimated_days: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cash' | 'pix' | 'card' | 'other';
export type PaymentStatus = 'pending' | 'paid';

export interface OrderItem {
  id?: number;
  order_id?: number;
  service_id: number;
  service_name?: string;
  category?: ServiceCategory;
  unit?: ServiceUnit;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string | null;
}

export interface Order {
  id: number;
  client_id: number;
  client_name: string;
  client_phone: string | null;
  client_address?: string | null;
  user_id: number;
  user_name: string;
  status: OrderStatus;
  total_amount: number;
  discount: number;
  notes: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  paid_at: string | null;
  client_email?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  readyOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface ApiError {
  error: string;
  details?: Array<{ path: (string | number)[]; message: string }>;
}

// ---------- Notinha / comprovante (DTO vindo do backend) ----------
export interface StoreInfo {
  name: string;
  phone: string | null;
  address: string | null;
  document: string | null;
}

export interface ReceiptItem {
  service_name: string;
  category: ServiceCategory;
  unit: ServiceUnit;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
}

export interface ReceiptBase {
  store: StoreInfo;
  order_number: number;
  created_at: string;
  client_name: string;
  client_phone: string | null;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  estimated_delivery: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
}

/** Comanda enxuta entregue ao cliente. */
export interface CustomerReceipt extends ReceiptBase {
  audience: 'customer';
}

/** Via completa do atendente. */
export interface FullReceipt extends ReceiptBase {
  audience: 'full';
  order_id: number;
  status: OrderStatus;
  updated_at: string;
  delivered_at: string | null;
  paid_at: string | null;
  client_email: string | null;
  client_address: string | null;
  attendant_name: string;
  notes: string | null;
}

export interface ReceiptPayload {
  customer: CustomerReceipt;
  full: FullReceipt;
}

export type ReceiptData = CustomerReceipt | FullReceipt;
