import api from '@/utils/api';
import type {
  AuthResponse,
  Client,
  Order,
  OrderStats,
  OrderStatus,
  Paginated,
  PaymentMethod,
  PaymentStatus,
  ReceiptPayload,
  Role,
  Service,
  User,
} from '@/types';

// ---------- Auth ----------
export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },
  me: async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.put('/auth/password', { currentPassword, newPassword });
    return data;
  },
};

// ---------- Clients ----------
export interface ClientPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
}

export const clientService = {
  list: async (params: { search?: string; page?: number; limit?: number } = {}) => {
    const { data } = await api.get<Paginated<Client>>('/clients', { params });
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get<Client>(`/clients/${id}`);
    return data;
  },
  create: async (payload: ClientPayload) => {
    const { data } = await api.post<Client>('/clients', payload);
    return data;
  },
  update: async (id: number, payload: Partial<ClientPayload>) => {
    const { data } = await api.put<Client>(`/clients/${id}`, payload);
    return data;
  },
  remove: async (id: number) => {
    const { data } = await api.delete(`/clients/${id}`);
    return data;
  },
};

// ---------- Services ----------
export interface ServicePayload {
  name: string;
  description?: string;
  category: Service['category'];
  unit: Service['unit'];
  price: number;
  estimated_days: number;
}

export const serviceService = {
  list: async (category?: string) => {
    const { data } = await api.get<Service[]>('/services', {
      params: category ? { category } : {},
    });
    return data;
  },
  categories: async () => {
    const { data } = await api.get<string[]>('/services/categories');
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get<Service>(`/services/${id}`);
    return data;
  },
  create: async (payload: ServicePayload) => {
    const { data } = await api.post<Service>('/services', payload);
    return data;
  },
  update: async (id: number, payload: Partial<ServicePayload>) => {
    const { data } = await api.put<Service>(`/services/${id}`, payload);
    return data;
  },
  remove: async (id: number) => {
    const { data } = await api.delete(`/services/${id}`);
    return data;
  },
};

// ---------- Orders ----------
export interface OrderItemPayload {
  service_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface OrderFilters {
  status?: string;
  clientId?: number;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: PaymentStatus;
  deliveryFrom?: string;
  deliveryTo?: string;
  overdue?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrderPayload {
  client_id: number;
  status?: OrderStatus;
  total_amount: number;
  discount?: number;
  notes?: string;
  estimated_delivery?: string | null;
  payment_method?: PaymentMethod | null;
  payment_status?: PaymentStatus;
  items: OrderItemPayload[];
}

export interface PaymentPayload {
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod | null;
}

export const orderService = {
  list: async (filters: OrderFilters = {}) => {
    const { data } = await api.get<Paginated<Order>>('/orders', { params: filters });
    return data;
  },
  stats: async () => {
    const { data } = await api.get<OrderStats>('/orders/stats');
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },
  receipt: async (id: number) => {
    const { data } = await api.get<ReceiptPayload>(`/orders/${id}/receipt`);
    return data;
  },
  create: async (payload: OrderPayload) => {
    const { data } = await api.post<Order>('/orders', payload);
    return data;
  },
  update: async (id: number, payload: Partial<OrderPayload>) => {
    const { data } = await api.put<Order>(`/orders/${id}`, payload);
    return data;
  },
  updateStatus: async (id: number, status: OrderStatus) => {
    const { data } = await api.patch<Order>(`/orders/${id}/status`, { status });
    return data;
  },
  updatePayment: async (id: number, payload: PaymentPayload) => {
    const { data } = await api.patch<Order>(`/orders/${id}/payment`, payload);
    return data;
  },
  remove: async (id: number) => {
    const { data } = await api.delete(`/orders/${id}`);
    return data;
  },
};

// ---------- Users ----------
export interface UserPayload {
  name: string;
  email: string;
  role: Role;
  password?: string;
}

export const userService = {
  list: async () => {
    const { data } = await api.get<User[]>('/users');
    return data;
  },
  create: async (payload: UserPayload & { password: string }) => {
    const { data } = await api.post<User>('/users', payload);
    return data;
  },
  update: async (id: number, payload: Partial<UserPayload> & { active?: boolean }) => {
    const { data } = await api.put<User>(`/users/${id}`, payload);
    return data;
  },
  resetPassword: async (id: number, password: string) => {
    const { data } = await api.put(`/users/${id}/password`, { password });
    return data;
  },
  remove: async (id: number) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};
