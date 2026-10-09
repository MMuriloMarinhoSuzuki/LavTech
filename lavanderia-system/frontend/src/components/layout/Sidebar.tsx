import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ClipboardList,
  LogOut,
  Droplets,
  UserCog,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, getInitials, roles } from '@/utils/format';
import type { Role } from '@/types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/servicos', label: 'Serviços', icon: Sparkles },
  { to: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/usuarios', label: 'Usuários', icon: UserCog, roles: ['admin'] },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout, can } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-aqua-500 text-white shadow-lg shadow-brand-500/30">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-tight text-slate-900">Lavanderia</h1>
              <p className="text-xs font-medium text-slate-400">Sistema de Gestão</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <Link
            to="/pedidos?new=1"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-aqua-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-700 hover:to-aqua-700"
          >
            <Plus className="h-4 w-4" />
            Novo pedido
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.roles && !can(...item.roles)) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-brand-50 to-aqua-50 text-brand-700 shadow-sm ring-1 ring-brand-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 text-xs font-bold text-white">
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">
                {user ? roles[user.role] : ''}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}