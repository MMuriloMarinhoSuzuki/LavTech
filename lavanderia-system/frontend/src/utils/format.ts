import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  ServiceCategory,
  ServiceUnit,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
} from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d);
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

/** Converte uma data ISO em valor para `<input type="date">` ("YYYY-MM-DD"), no fuso local. */
export function toDateInputValue(date: string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte "YYYY-MM-DD" (input date) em ISO. Usa o meio-dia local como âncora para
 * que o dia escolhido não "pule" ao ser exibido em outros fusos.
 */
export function dateInputToISO(value: string): string | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskZipCode(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export const serviceCategories: Record<ServiceCategory, { label: string; color: string; bg: string; gradient: string }> = {
  washing: {
    label: 'Lavagem',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    gradient: 'from-blue-500 to-blue-600',
  },
  dyeing: {
    label: 'Tingimento',
    color: 'text-fuchsia-700',
    bg: 'bg-fuchsia-100',
    gradient: 'from-fuchsia-500 to-purple-600',
  },
  ironing: {
    label: 'Passadoria',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    gradient: 'from-amber-500 to-orange-500',
  },
  special: {
    label: 'Especial',
    color: 'text-teal-700',
    bg: 'bg-teal-100',
    gradient: 'from-teal-500 to-cyan-600',
  },
};

export const serviceUnits: Record<ServiceUnit, string> = {
  kg: 'kg',
  piece: 'peça',
  unit: 'unidade',
};

export const orderStatuses: Record<OrderStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: 'Pendente', color: 'text-slate-700', bg: 'bg-slate-100', dot: 'bg-slate-400' },
  in_progress: { label: 'Em andamento', color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' },
  ready: { label: 'Pronto', color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  delivered: { label: 'Entregue', color: 'text-violet-700', bg: 'bg-violet-100', dot: 'bg-violet-500' },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
};

export const roles: Record<Role, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  attendant: 'Atendente',
};

export const paymentMethods: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  card: 'Cartão',
  other: 'Outro',
};

export const paymentStatuses: Record<
  PaymentStatus,
  { label: string; short: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: 'Pagamento pendente',
    short: 'Pendente',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    dot: 'bg-amber-500',
  },
  paid: {
    label: 'Pago',
    short: 'Pago',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
};

export function classForCategory(category: ServiceCategory) {
  return serviceCategories[category] ?? serviceCategories.special;
}

export function classForStatus(status: OrderStatus) {
  return orderStatuses[status] ?? orderStatuses.pending;
}

export function debounce<T extends (...args: never[]) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function toNumber(value: unknown): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(num) ? num : 0;
}
