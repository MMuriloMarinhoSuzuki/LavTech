import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Pencil,
  Trash2,
  Users as UsersIcon,
  KeyRound,
  ShieldCheck,
  Mail,
  UserCog,
  Check,
  X,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { userService, type UserPayload } from '@/services/api';
import { getErrorMessage } from '@/utils/api';
import { cn, formatDate, getInitials, roles } from '@/utils/format';
import type { Role, User } from '@/types';

const roleStyles: Record<Role, string> = {
  admin: 'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  attendant: 'bg-amber-100 text-amber-700',
};

export function Users() {
  const { onMenuClick } = useLayout();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserPayload>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await userService.list());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', email: '', role: 'attendant', password: '' });
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    reset({ name: user.name, email: user.email, role: user.role, password: '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: UserPayload) => {
    setSaving(true);
    try {
      if (editing) {
        await userService.update(editing.id, {
          name: data.name,
          email: data.email,
          role: data.role,
        });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        if (!data.password || data.password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres.');
          setSaving(false);
          return;
        }
        await userService.create({ ...data, password: data.password });
        toast.success('Usuário cadastrado com sucesso!');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('Você não pode desativar a própria conta.');
      return;
    }
    try {
      await userService.update(user.id, { active: !user.active });
      toast.success(user.active ? 'Usuário desativado.' : 'Usuário ativado.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const confirmResetPassword = async () => {
    if (!passwordTarget) return;
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSavingPassword(true);
    try {
      await userService.resetPassword(passwordTarget.id, newPassword);
      toast.success('Senha redefinida com sucesso!');
      setPasswordTarget(null);
      setNewPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userService.remove(deleteTarget.id);
      toast.success('Usuário removido com sucesso!');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Header
        title="Usuários"
        subtitle="Gerencie quem pode acessar o sistema e seus perfis"
        onMenuClick={onMenuClick}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo usuário</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="card">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="skeleton h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-40" />
                    <div className="skeleton h-3 w-28" />
                  </div>
                  <div className="skeleton h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-7 w-7" />}
              title="Nenhum usuário"
              description="Cadastre um usuário para permitir o acesso ao sistema."
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Cadastrar usuário
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const inactive = !user.active;
                return (
                  <li key={user.id} className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                        inactive
                          ? 'bg-slate-300'
                          : 'bg-gradient-to-br from-brand-500 to-aqua-500'
                      )}
                    >
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-slate-800">{user.name}</p>
                        {isSelf && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                            você
                          </span>
                        )}
                        {inactive && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-500">
                            inativo
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1.5 truncate text-xs text-slate-400">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                    </div>
                    <Badge className={roleStyles[user.role]}>
                      <ShieldCheck className="h-3 w-3" />
                      {roles[user.role]}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(user)}
                        disabled={isSelf}
                        className={cn(
                          'rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                          user.active
                            ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-600'
                            : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                        )}
                        title={user.active ? 'Desativar' : 'Ativar'}
                      >
                        {user.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setPasswordTarget(user);
                          setNewPassword('');
                        }}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                        title="Redefinir senha"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        disabled={isSelf}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="w-full text-xs text-slate-400 sm:w-auto">
                      Desde {formatDate(user.created_at)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs text-brand-800">
          <UserCog className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Perfis:</strong> Administrador gerencia tudo (inclusive usuários e exclusões);
            Gerente gerencia clientes, serviços e pedidos; Atendente cria pedidos e atualiza status.
          </p>
        </div>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        description={
          editing ? 'Atualize os dados do usuário.' : 'Defina os dados de acesso do novo usuário.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="user-form" loading={saving}>
              {editing ? 'Salvar alterações' : 'Cadastrar usuário'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nome"
            required
            placeholder="Ex.: João Pereira"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="E-mail"
            type="email"
            required
            placeholder="usuario@lavanderia.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Select label="Perfil de acesso" required error={errors.role?.message} {...register('role')}>
            {(Object.keys(roles) as Role[]).map((r) => (
              <option key={r} value={r}>
                {roles[r]}
              </option>
            ))}
          </Select>
          {!editing && (
            <Input
              label="Senha"
              type="password"
              required
              placeholder="Mínimo de 6 caracteres"
              error={errors.password?.message}
              {...register('password')}
            />
          )}
        </form>
      </Modal>

      <Modal
        open={!!passwordTarget}
        onClose={() => setPasswordTarget(null)}
        title="Redefinir senha"
        description={passwordTarget ? `Nova senha para ${passwordTarget.name}.` : ''}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPasswordTarget(null)}
              disabled={savingPassword}
            >
              Cancelar
            </Button>
            <Button onClick={confirmResetPassword} loading={savingPassword}>
              Salvar senha
            </Button>
          </>
        }
      >
        <Input
          label="Nova senha"
          type="password"
          placeholder="Mínimo de 6 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Excluir usuário"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? O acesso será revogado.`}
        confirmLabel="Sim, excluir"
      />
    </>
  );
}