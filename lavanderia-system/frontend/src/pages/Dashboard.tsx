import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  PackageCheck,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  CalendarClock,
  Plus,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/utils/api';
import {
  classForStatus,
  formatCurrency,
  formatDateTime,
  formatPhone,
  getInitials,
} from '@/utils/format';
import type { Order, OrderStats } from '@/types';

const emptyStats: OrderStats = {
  totalOrders: 0,
  pendingOrders: 0,
  inProgressOrders: 0,
  readyOrders: 0,
  deliveredOrders: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
};

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function Dashboard() {
  const { onMenuClick } = useLayout();
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState<OrderStats>(emptyStats);
  const [recent, setRecent] = useState<Order[]>([]);
  const [readyQueue, setReadyQueue] = useState<Order[]>([]);
  const [dueToday, setDueToday] = useState<Order[]>([]);
  const [deliveringId, setDeliveringId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const today = toISODate(new Date());
        const [s, orders, readyRes, dueRes] = await Promise.all([
          orderService.stats(),
          orderService.list({ limit: 6, page: 1 }),
          orderService.list({ status: 'ready', limit: 4 }),
          orderService.list({ deliveryFrom: today, deliveryTo: today, limit: 4 }),
        ]);
        if (!active) return;
        setStats(s);
        setRecent(orders.data);
        setReadyQueue(readyRes.data);
        setDueToday(dueRes.data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deliver = async (order: Order) => {
    setDeliveringId(order.id);
    try {
      await orderService.updateStatus(order.id, 'delivered');
      toast.success(`Pedido #${order.id} marcado como entregue!`);
      setReadyQueue((prev) => prev.filter((o) => o.id !== order.id));
      setStats(await orderService.stats());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeliveringId(null);
    }
  };

  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <>
      <Header
        title={`Olá, ${firstName}! 👋`}
        subtitle="Aqui está o resumo da sua lavanderia hoje."
        onMenuClick={onMenuClick}
        actions={
          <Link to="/pedidos?new=1" className="hidden sm:block">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Novo pedido
            </Button>
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pedidos totais"
            value={String(stats.totalOrders)}
            hint={`${stats.pendingOrders} pendente(s)`}
            icon={<ClipboardList className="h-5 w-5" />}
            gradient="from-brand-500 to-brand-600 shadow-brand-500/30"
          />
          <StatCard
            label="Em andamento"
            value={String(stats.inProgressOrders)}
            hint={`${stats.readyOrders} pronto(s) para retirada`}
            icon={<Clock className="h-5 w-5" />}
            gradient="from-aqua-500 to-aqua-600 shadow-aqua-500/30"
          />
          <StatCard
            label="Entregues"
            value={String(stats.deliveredOrders)}
            hint="Concluídos com sucesso"
            icon={<PackageCheck className="h-5 w-5" />}
            gradient="from-emerald-500 to-emerald-600 shadow-emerald-500/30"
          />
          <StatCard
            label="Receita do mês"
            value={formatCurrency(stats.monthlyRevenue)}
            hint={`Total: ${formatCurrency(stats.totalRevenue)}`}
            icon={<DollarSign className="h-5 w-5" />}
            gradient="from-violet-500 to-violet-600 shadow-violet-500/30"
          />
        </div>

        <div className="card mt-6">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">Fila de trabalho</h2>
            <p className="text-xs text-slate-500">O que precisa da sua atenção agora</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Prontos para retirada
                  {stats.readyOrders > 0 && (
                    <span className="badge bg-emerald-50 text-emerald-600">
                      {stats.readyOrders}
                    </span>
                  )}
                </h3>
                <Link
                  to="/pedidos?status=ready"
                  className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Ver todos
                </Link>
              </div>

              {loading ? (
                <div className="mt-3 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : readyQueue.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  Nenhum pedido aguardando retirada. 🎉
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {readyQueue.map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-[10px] font-bold text-white">
                        {getInitials(order.client_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {order.client_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          #{order.id} · {formatCurrency(order.total_amount)}
                        </p>
                      </div>
                      <button
                        onClick={() => deliver(order)}
                        disabled={deliveringId === order.id}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                        Entregar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CalendarClock className="h-4 w-4 text-brand-500" />
                  Entregas de hoje
                  {dueToday.length > 0 && (
                    <span className="badge bg-brand-50 text-brand-600">{dueToday.length}</span>
                  )}
                </h3>
                <Link
                  to="/pedidos"
                  className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Ver pedidos
                </Link>
              </div>

              {loading ? (
                <div className="mt-3 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : dueToday.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Nenhuma entrega prevista para hoje.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {dueToday.map((order) => {
                    const st = classForStatus(order.status);
                    return (
                      <li
                        key={order.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-[10px] font-bold text-slate-600">
                          {getInitials(order.client_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {order.client_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            #{order.id} · {formatCurrency(order.total_amount)}
                          </p>
                        </div>
                        <Badge className={`${st.bg} ${st.color}`} dot>
                          {st.label}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pedidos recentes</h2>
                <p className="text-xs text-slate-500">Últimos pedidos registrados</p>
              </div>
              <Link
                to="/pedidos"
                className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3.5 w-40" />
                      <div className="skeleton h-3 w-24" />
                    </div>
                    <div className="skeleton h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">Nenhum pedido ainda</p>
                <p className="text-xs text-slate-400">Crie seu primeiro pedido para começar.</p>
                <Link to="/pedidos" className="mt-4 inline-block">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Criar pedido
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((order) => {
                  const st = classForStatus(order.status);
                  return (
                    <li
                      key={order.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/60"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600">
                        {getInitials(order.client_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {order.client_name}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          #{order.id} · {formatPhone(order.client_phone)} ·{' '}
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {formatCurrency(order.total_amount)}
                        </p>
                        <Badge className={`${st.bg} ${st.color}`} dot>
                          {st.label}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-6">
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-br from-brand-600 to-aqua-600 px-5 py-4 text-white">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <h2 className="text-base font-bold">Resumo financeiro</h2>
                </div>
                <p className="mt-1 text-xs text-white/70">Somente pedidos entregues</p>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Receita do mês</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {formatCurrency(stats.monthlyRevenue)}
                  </span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Receita total</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {formatCurrency(stats.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-base font-bold text-slate-900">Status dos pedidos</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Pendentes', value: stats.pendingOrders, status: 'pending' as const },
                  { label: 'Em andamento', value: stats.inProgressOrders, status: 'in_progress' as const },
                  { label: 'Prontos', value: stats.readyOrders, status: 'ready' as const },
                  { label: 'Entregues', value: stats.deliveredOrders, status: 'delivered' as const },
                ].map((row) => {
                  const st = classForStatus(row.status);
                  return (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
                      <span className="flex-1 text-sm text-slate-600">{row.label}</span>
                      <span className="text-sm font-bold text-slate-900">{row.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card flex items-center gap-3 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
              <CheckCircle2 className="h-9 w-9 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-emerald-900">Tudo em ordem!</p>
                <p className="text-xs text-emerald-700/80">
                  Continue gerenciando seus pedidos com eficiência.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}