import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ClipboardList,
  X,
  Minus,
  ShoppingCart,
  Calendar,
  User as UserIcon,
  Printer,
  CreditCard,
  Truck,
  ChevronRight,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { ReceiptModal } from '@/components/receipt/ReceiptModal';
import { ClientSelect } from '@/components/orders/ClientSelect';
import { ServicePicker } from '@/components/orders/ServicePicker';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { orderService, serviceService, type OrderFilters, type OrderPayload } from '@/services/api';
import { getErrorMessage } from '@/utils/api';
import {
  cn,
  dateInputToISO,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  getInitials,
  orderStatuses,
  paymentMethods,
  paymentStatuses,
  serviceCategories,
  serviceUnits,
  toDateInputValue,
} from '@/utils/format';
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Service,
} from '@/types';

interface DraftItem {
  service_id: number;
  service_name: string;
  category: Service['category'];
  unit: Service['unit'];
  quantity: number;
  unit_price: number;
}

const statusOptions: OrderStatus[] = ['pending', 'in_progress', 'ready', 'delivered', 'cancelled'];

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'in_progress',
  in_progress: 'ready',
  ready: 'delivered',
};

type QuickFilter = 'all' | 'today' | 'week' | 'overdue';

const quickFilters: Array<{ id: QuickFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Últimos 7 dias' },
  { id: 'overdue', label: 'Atrasados' },
];

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function Orders() {
  const { onMenuClick } = useLayout();
  const { can } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<'' | PaymentStatus>('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 8 });
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const [services, setServices] = useState<Service[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  const [draftClient, setDraftClient] = useState<number | ''>('');
  const [draftStatus, setDraftStatus] = useState<OrderStatus>('pending');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftDiscount, setDraftDiscount] = useState(0);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [draftPaymentMethod, setDraftPaymentMethod] = useState<PaymentMethod>('cash');
  const [draftPaid, setDraftPaid] = useState(false);
  const [draftEstimatedDelivery, setDraftEstimatedDelivery] = useState('');

  const [receiptOrderId, setReceiptOrderId] = useState<number | null>(null);

  const [detail, setDetail] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Order | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payStatus, setPayStatus] = useState<PaymentStatus>('paid');
  const [savingPayment, setSavingPayment] = useState(false);

  const filters = useMemo<OrderFilters>(() => {
    const f: OrderFilters = {};
    if (search.trim()) f.search = search.trim();
    if (statusFilter) f.status = statusFilter;
    if (paymentFilter) f.paymentStatus = paymentFilter;
    if (quickFilter === 'today') {
      const today = toISODate(new Date());
      f.dateFrom = today;
      f.dateTo = today;
    } else if (quickFilter === 'week') {
      const today = new Date();
      const from = new Date();
      from.setDate(today.getDate() - 6);
      f.dateFrom = toISODate(from);
      f.dateTo = toISODate(today);
    } else if (quickFilter === 'overdue') {
      f.overdue = true;
    }
    return f;
  }, [search, statusFilter, paymentFilter, quickFilter]);

  const hasActiveFilters =
    !!search.trim() || !!statusFilter || quickFilter !== 'all' || !!paymentFilter;

  const loadOrders = useCallback(
    async (params: OrderFilters, pageNumber: number) => {
      setLoading(true);
      try {
        const result = await orderService.list({ ...params, page: pageNumber, limit: meta.limit });
        setOrders(result.data);
        setMeta({ total: result.total, totalPages: result.totalPages || 1, limit: result.limit });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadOrders(filters, 1);
    }, 300);
    return () => clearTimeout(t);
  }, [filters, loadOrders]);

  useEffect(() => {
    loadOrders(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Permite abrir a lista já filtrada por status (ex.: link do sino no cabeçalho)
  // ou abrir direto o formulário de novo pedido (ex.: atalho "Novo pedido").
  useEffect(() => {
    const status = searchParams.get('status');
    if (status && statusOptions.includes(status as OrderStatus)) {
      setStatusFilter(status);
    }
    if (searchParams.get('new') === '1') {
      openCreate();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadDependencies = useCallback(async () => {
    try {
      const s = await serviceService.list();
      setServices(s);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [toast]);

  const openCreate = () => {
    setEditing(null);
    setDraftClient('');
    setDraftStatus('pending');
    setDraftNotes('');
    setDraftDiscount(0);
    setDraftItems([]);
    setDraftPaymentMethod('cash');
    setDraftPaid(false);
    setDraftEstimatedDelivery('');
    loadDependencies();
    setModalOpen(true);
  };

  // Atalhos de teclado: "N" novo pedido, "/" foca a busca.
  useEffect(() => {
    const overlayOpen =
      modalOpen || detail !== null || receiptOrderId !== null || deleteTarget !== null || paymentTarget !== null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (overlayOpen) return;
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        openCreate();
      } else if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, detail, receiptOrderId, deleteTarget, paymentTarget]);

  const openEdit = async (order: Order) => {
    try {
      const full = await orderService.get(order.id);
      setEditing(full);
      setDraftClient(full.client_id);
      setDraftStatus(full.status);
      setDraftNotes(full.notes ?? '');
      setDraftDiscount(full.discount);
      setDraftPaymentMethod(full.payment_method ?? 'cash');
      setDraftPaid(full.payment_status === 'paid');
      setDraftEstimatedDelivery(toDateInputValue(full.estimated_delivery));
      setDraftItems(
        (full.items ?? []).map((item) => ({
          service_id: item.service_id,
          service_name: item.service_name ?? '',
          category: item.category ?? 'special',
          unit: item.unit ?? 'piece',
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      );
      await loadDependencies();
      setModalOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const addService = (service: Service) => {
    setDraftItems((prev) => {
      const existing = prev.find((item) => item.service_id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.service_id === service.id
            ? { ...item, quantity: Number((item.quantity + 1).toFixed(2)) }
            : item
        );
      }
      return [
        ...prev,
        {
          service_id: service.id,
          service_name: service.name,
          category: service.category,
          unit: service.unit,
          quantity: 1,
          unit_price: service.price,
        },
      ];
    });
  };

  const updateItemQty = (serviceId: number, delta: number) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.service_id === serviceId
          ? { ...item, quantity: Math.max(0.5, Number((item.quantity + delta).toFixed(2))) }
          : item
      )
    );
  };

  const setItemQty = (serviceId: number, value: number) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.service_id === serviceId ? { ...item, quantity: Math.max(0, value) } : item
      )
    );
  };

  const removeItem = (serviceId: number) => {
    setDraftItems((prev) => prev.filter((item) => item.service_id !== serviceId));
  };

  const subtotal = useMemo(
    () => draftItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [draftItems]
  );
  const total = Math.max(0, subtotal - (Number(draftDiscount) || 0));

  const saveOrder = async () => {
    if (!draftClient) {
      toast.error('Selecione um cliente.');
      return;
    }
    if (draftItems.length === 0) {
      toast.error('Adicione pelo menos um serviço ao pedido.');
      return;
    }
    setSaving(true);
    const payload: OrderPayload = {
      client_id: Number(draftClient),
      status: draftStatus,
      total_amount: Number(total.toFixed(2)),
      discount: Number(draftDiscount) || 0,
      notes: draftNotes || undefined,
      estimated_delivery: dateInputToISO(draftEstimatedDelivery),
      payment_method: draftPaymentMethod,
      payment_status: draftPaid ? 'paid' : 'pending',
      items: draftItems.map((item) => ({
        service_id: item.service_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: Number((item.quantity * item.unit_price).toFixed(2)),
      })),
    };
    try {
      if (editing) {
        await orderService.update(editing.id, payload);
        toast.success('Pedido atualizado com sucesso!');
      } else {
        const created = await orderService.create(payload);
        toast.success('Pedido criado com sucesso!');
        setReceiptOrderId(created.id);
      }
      setModalOpen(false);
      loadOrders(filters, page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (order: Order, status: OrderStatus) => {
    try {
      const updated = await orderService.updateStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      if (detail?.id === order.id) setDetail({ ...detail, ...updated });
      toast.success(`Status atualizado para "${orderStatuses[status].label}".`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const advanceStatus = (order: Order) => {
    const next = nextStatus[order.status];
    if (next) changeStatus(order, next);
  };

  const openDetail = async (order: Order) => {
    setDetailLoading(true);
    setDetail(order);
    try {
      const full = await orderService.get(order.id);
      setDetail(full);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await orderService.remove(deleteTarget.id);
      toast.success('Pedido removido com sucesso!');
      setDeleteTarget(null);
      loadOrders(filters, page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const openPayment = (order: Order) => {
    setPaymentTarget(order);
    setPayMethod(order.payment_method ?? 'cash');
    setPayStatus(order.payment_status ?? 'paid');
  };

  const savePayment = async () => {
    if (!paymentTarget) return;
    setSavingPayment(true);
    try {
      const updated = await orderService.updatePayment(paymentTarget.id, {
        payment_status: payStatus,
        payment_method: payMethod,
      });
      setOrders((prev) => prev.map((o) => (o.id === paymentTarget.id ? { ...o, ...updated } : o)));
      if (detail?.id === paymentTarget.id) setDetail({ ...detail, ...updated });
      toast.success(
        payStatus === 'paid' ? 'Pagamento registrado com sucesso!' : 'Pagamento marcado como pendente.'
      );
      const id = paymentTarget.id;
      setPaymentTarget(null);
      if (payStatus === 'paid') setReceiptOrderId(id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <>
      <Header
        title="Pedidos"
        subtitle="Acompanhe e gerencie todos os pedidos"
        onMenuClick={onMenuClick}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo pedido</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="card">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por cliente ou telefone...  (atalho: /)"
                  className="input pl-10"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input cursor-pointer"
                >
                  <option value="">Todos os status</option>
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>
                      {orderStatuses[st].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:w-40">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as '' | PaymentStatus)}
                  className="input cursor-pointer"
                >
                  <option value="">Pagamento</option>
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickFilters.map((qf) => (
                <button
                  key={qf.id}
                  type="button"
                  onClick={() => setQuickFilter(qf.id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    quickFilter === qf.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {qf.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="skeleton h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-40" />
                    <div className="skeleton h-3 w-56" />
                  </div>
                  <div className="skeleton hidden h-6 w-24 rounded-full sm:block" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-7 w-7" />}
              title={hasActiveFilters ? 'Nenhum pedido encontrado' : 'Nenhum pedido registrado'}
              description={
                hasActiveFilters
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Crie seu primeiro pedido para começar.'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Criar pedido
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-semibold">Pedido</th>
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="hidden px-5 py-3 font-semibold xl:table-cell">Responsável</th>
                      <th className="hidden px-5 py-3 font-semibold xl:table-cell">Data</th>
                      <th className="px-5 py-3 font-semibold">Valor</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => {
                      const st = orderStatuses[order.status];
                      return (
                        <tr key={order.id} className="transition-colors hover:bg-slate-50/60">
                          <td className="px-5 py-3.5 font-bold text-slate-800">#{order.id}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 text-[10px] font-bold text-white">
                                {getInitials(order.client_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800">
                                  {order.client_name}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                  {formatPhone(order.client_phone)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-5 py-3.5 text-slate-600 xl:table-cell">
                            {order.user_name}
                          </td>
                          <td className="hidden px-5 py-3.5 text-slate-500 xl:table-cell">
                            {formatDateTime(order.created_at)}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-800">
                              {formatCurrency(order.total_amount)}
                            </p>
                            <button
                              type="button"
                              onClick={() => openPayment(order)}
                              className={cn(
                                'badge mt-1',
                                paymentStatuses[order.payment_status].bg,
                                paymentStatuses[order.payment_status].color
                              )}
                              title="Registrar pagamento"
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  paymentStatuses[order.payment_status].dot
                                )}
                              />
                              {paymentStatuses[order.payment_status].short}
                            </button>
                          </td>
                          <td className="px-5 py-3.5">
                            <select
                              value={order.status}
                              onChange={(e) => changeStatus(order, e.target.value as OrderStatus)}
                              className={cn(
                                'cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30',
                                st.bg,
                                st.color
                              )}
                            >
                              {statusOptions.map((s) => (
                                <option key={s} value={s} className="bg-white text-slate-800">
                                  {orderStatuses[s].label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-1">
                              {nextStatus[order.status] && (
                                <button
                                  onClick={() => advanceStatus(order)}
                                  className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100"
                                  title={`Avançar para "${orderStatuses[nextStatus[order.status]!].label}"`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setReceiptOrderId(order.id)}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                                title="Imprimir notinha"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDetail(order)}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {can('admin', 'manager') && (
                                <button
                                  onClick={() => openEdit(order)}
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {can('admin') && (
                                <button
                                  onClick={() => setDeleteTarget(order)}
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-slate-100 lg:hidden">
                {orders.map((order) => {
                  const st = orderStatuses[order.status];
                  return (
                    <li key={order.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 text-xs font-bold text-white">
                            {getInitials(order.client_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {order.client_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              #{order.id} · {formatDateTime(order.created_at)}
                            </p>
                          </div>
                        </div>
                        <Badge className={cn(st.bg, st.color)} dot>
                          {st.label}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between pl-14">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-base font-extrabold text-slate-900">
                            {formatCurrency(order.total_amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openPayment(order)}
                            className={cn(
                              'badge',
                              paymentStatuses[order.payment_status].bg,
                              paymentStatuses[order.payment_status].color
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                paymentStatuses[order.payment_status].dot
                              )}
                            />
                            {paymentStatuses[order.payment_status].short}
                          </button>
                        </div>
                        <div className="flex gap-1">
                          {nextStatus[order.status] && (
                            <button
                              onClick={() => advanceStatus(order)}
                              className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
                              aria-label={`Avançar para "${orderStatuses[nextStatus[order.status]!].label}"`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setReceiptOrderId(order.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                            aria-label="Imprimir notinha"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDetail(order)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                            aria-label="Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {can('admin', 'manager') && (
                            <button
                              onClick={() => openEdit(order)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {can('admin') && (
                            <button
                              onClick={() => setDeleteTarget(order)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {!loading && orders.length > 0 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
            />
          )}
        </div>
      </main>

      {/* Modal criar/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar pedido #${editing.id}` : 'Novo pedido'}
        description="Selecione o cliente e adicione os serviços desejados."
        size="xl"
        footer={
          <>
            <div className="mr-auto flex items-center gap-2 text-sm">
              <span className="text-slate-500">Total:</span>
              <span className="text-base font-extrabold text-brand-700">{formatCurrency(total)}</span>
            </div>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={saveOrder} loading={saving}>
              {editing ? 'Salvar alterações' : 'Criar pedido'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ClientSelect
              value={draftClient}
              onChange={setDraftClient}
              allowCreate={can('admin', 'manager')}
              required
              autoFocus
            />
            <Select
              label="Status"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value as OrderStatus)}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {orderStatuses[s].label}
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <ShoppingCart className="h-4 w-4" />
                Itens do pedido
              </div>
              {draftItems.length > 0 && (
                <span className="text-xs font-semibold text-slate-500">
                  {draftItems.length} item(ns) · {formatCurrency(subtotal)}
                </span>
              )}
            </div>
            <ServicePicker
              services={services}
              addedIds={draftItems.map((item) => item.service_id)}
              onAdd={addService}
            />

            {draftItems.length > 0 && (
              <ul className="mt-4 space-y-2">
                {draftItems.map((item) => {
                  const cat = serviceCategories[item.category];
                  return (
                    <li
                      key={item.service_id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.service_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          <span className={cn('font-medium', cat.color)}>{cat.label}</span> ·{' '}
                          {formatCurrency(item.unit_price)} / {serviceUnits[item.unit]}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.service_id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
                          aria-label="Diminuir"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) =>
                            setItemQty(item.service_id, Math.max(0, Number(e.target.value)))
                          }
                          className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-center text-sm focus:border-brand-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.service_id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
                          aria-label="Aumentar"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="w-24 text-right text-sm font-bold text-slate-800">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.service_id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label="Remover item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Desconto (R$)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={draftDiscount}
              onChange={(e) => setDraftDiscount(Number(e.target.value))}
            />
            <Textarea
              label="Observações"
              placeholder="Ex.: cliente pediu para não usar amaciante..."
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-3">
            <Input
              label="Previsão de entrega"
              type="date"
              value={draftEstimatedDelivery}
              onChange={(e) => setDraftEstimatedDelivery(e.target.value)}
              hint="Data em que o pedido deve ficar pronto"
            />
            <Select
              label="Forma de pagamento"
              value={draftPaymentMethod}
              onChange={(e) => setDraftPaymentMethod(e.target.value as PaymentMethod)}
            >
              {(Object.keys(paymentMethods) as PaymentMethod[]).map((method) => (
                <option key={method} value={method}>
                  {paymentMethods[method]}
                </option>
              ))}
            </Select>
            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={draftPaid}
                  onChange={(e) => setDraftPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-slate-700">Pagamento recebido</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 rounded-2xl bg-gradient-to-br from-brand-50 to-aqua-50 p-4">
            <div className="flex w-full max-w-xs justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex w-full max-w-xs justify-between text-sm text-slate-500">
              <span>Desconto</span>
              <span className="font-semibold text-red-500">
                - {formatCurrency(Number(draftDiscount) || 0)}
              </span>
            </div>
            <div className="mt-1 flex w-full max-w-xs items-center justify-between border-t border-brand-200/60 pt-2">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-xl font-extrabold text-brand-700">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal detalhes */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Pedido #${detail.id}` : ''}
        description={detail ? `Criado em ${formatDateTime(detail.created_at)}` : ''}
        size="lg"
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn(orderStatuses[detail.status].bg, orderStatuses[detail.status].color)} dot>
                {orderStatuses[detail.status].label}
              </Badge>
              {can('admin', 'manager', 'attendant') && (
                <select
                  value={detail.status}
                  onChange={(e) => changeStatus(detail, e.target.value as OrderStatus)}
                  className="input w-auto py-1.5 text-xs"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {orderStatuses[s].label}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => setReceiptOrderId(detail.id)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir notinha
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoBlock icon={<UserIcon className="h-4 w-4" />} label="Cliente">
                <p className="font-semibold text-slate-800">{detail.client_name}</p>
                <p className="text-xs text-slate-500">{formatPhone(detail.client_phone)}</p>
                {detail.client_address && (
                  <p className="text-xs text-slate-500">{detail.client_address}</p>
                )}
              </InfoBlock>
              <InfoBlock icon={<Calendar className="h-4 w-4" />} label="Responsável">
                <p className="font-semibold text-slate-800">{detail.user_name}</p>
                <p className="text-xs text-slate-500">Atualizado em {formatDateTime(detail.updated_at)}</p>
              </InfoBlock>
              <InfoBlock icon={<Truck className="h-4 w-4" />} label="Previsão de entrega">
                <p className="font-semibold text-slate-800">
                  {detail.estimated_delivery ? formatDate(detail.estimated_delivery) : 'A combinar'}
                </p>
                {detail.delivered_at && (
                  <p className="text-xs text-slate-500">
                    Entregue em {formatDate(detail.delivered_at)}
                  </p>
                )}
              </InfoBlock>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Pagamento</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {paymentStatuses[detail.payment_status].label}
                    {detail.payment_status === 'paid' && detail.payment_method
                      ? ` · ${paymentMethods[detail.payment_method]}`
                      : ''}
                  </p>
                  {detail.paid_at && (
                    <p className="text-xs text-slate-400">Pago em {formatDateTime(detail.paid_at)}</p>
                  )}
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => openPayment(detail)}>
                <CreditCard className="h-4 w-4" />
                {detail.payment_status === 'paid' ? 'Alterar pagamento' : 'Registrar pagamento'}
              </Button>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-700">Itens</h3>
              {detailLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="skeleton h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {(detail.items ?? []).map((item: OrderItem) => {
                    const cat = item.category ? serviceCategories[item.category] : null;
                    return (
                      <li key={item.id} className="flex items-center gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.service_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {cat?.label} · {item.quantity} × {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-800">
                          {formatCurrency(item.total_price)}
                        </span>
                      </li>
                    );
                  })}
                  {(detail.items ?? []).length === 0 && (
                    <li className="p-3 text-sm text-slate-400">Nenhum item.</li>
                  )}
                </ul>
              )}
            </div>

            {detail.notes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">Observações</p>
                <p className="mt-1 text-sm text-slate-700">{detail.notes}</p>
              </div>
            )}

            <div className="flex flex-col items-end gap-1 rounded-2xl bg-gradient-to-br from-brand-50 to-aqua-50 p-4">
              <div className="flex w-full max-w-xs justify-between text-sm text-slate-500">
                <span>Desconto</span>
                <span className="font-semibold text-red-500">- {formatCurrency(detail.discount)}</span>
              </div>
              <div className="flex w-full max-w-xs items-center justify-between border-t border-brand-200/60 pt-2">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <span className="text-xl font-extrabold text-brand-700">
                  {formatCurrency(detail.total_amount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal pagamento */}
      <Modal
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        title={paymentTarget ? `Pagamento do pedido #${paymentTarget.id}` : 'Pagamento'}
        description="Registre a forma e a situação do pagamento."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPaymentTarget(null)}
              disabled={savingPayment}
            >
              Cancelar
            </Button>
            <Button onClick={savePayment} loading={savingPayment}>
              Salvar
            </Button>
          </>
        }
      >
        {paymentTarget && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente</span>
                <span className="font-semibold text-slate-800">{paymentTarget.client_name}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(paymentTarget.total_amount)}
                </span>
              </div>
            </div>
            <Select
              label="Situação"
              value={payStatus}
              onChange={(e) => setPayStatus(e.target.value as PaymentStatus)}
            >
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
            </Select>
            <Select
              label="Forma de pagamento"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
            >
              {(Object.keys(paymentMethods) as PaymentMethod[]).map((method) => (
                <option key={method} value={method}>
                  {paymentMethods[method]}
                </option>
              ))}
            </Select>
          </div>
        )}
      </Modal>

      <ReceiptModal
        open={receiptOrderId !== null}
        orderId={receiptOrderId}
        onClose={() => setReceiptOrderId(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Excluir pedido"
        message={`Tem certeza que deseja excluir o pedido #${deleteTarget?.id}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
      />
    </>
  );
}

function InfoBlock({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}