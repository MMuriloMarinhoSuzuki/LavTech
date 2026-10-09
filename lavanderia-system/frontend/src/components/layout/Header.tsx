import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/api';
import { getInitials } from '@/utils/format';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, onMenuClick, actions }: HeaderProps) {
  const { user } = useAuth();
  const [readyCount, setReadyCount] = useState(0);

  // Mostra quantos pedidos estão prontos para retirada (atualiza a cada minuto).
  useEffect(() => {
    let active = true;
    const load = () => {
      orderService
        .list({ status: 'ready', limit: 1 })
        .then((res) => {
          if (active) setReadyCount(res.total);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{title}</h1>
          {subtitle && <p className="truncate text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              to="/pedidos?status=ready"
              className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label={
                readyCount > 0
                  ? `${readyCount} pedidos prontos para retirada`
                  : 'Nenhum pedido pronto para retirada'
              }
              title="Pedidos prontos para retirada"
            >
              <Bell className="h-5 w-5" />
              {readyCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {readyCount > 9 ? '9+' : readyCount}
                </span>
              )}
            </Link>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 text-xs font-bold text-white sm:hidden">
            {user ? getInitials(user.name) : '?'}
          </div>
        </div>
      </div>
    </header>
  );
}
