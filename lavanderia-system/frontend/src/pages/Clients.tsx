import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { clientService, type ClientPayload } from '@/services/api';
import { getErrorMessage } from '@/utils/api';
import {
  formatDate,
  formatPhone,
  getInitials,
  maskPhone,
  maskZipCode,
} from '@/utils/format';
import type { Client } from '@/types';

export function Clients() {
  const { onMenuClick } = useLayout();
  const { can } = useAuth();
  const toast = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 8 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientPayload>();

  const phoneValue = watch('phone');
  const zipValue = watch('zip_code');

  const load = useCallback(
    async (searchTerm: string, pageNumber: number) => {
      setLoading(true);
      try {
        const result = await clientService.list({
          search: searchTerm,
          page: pageNumber,
          limit: meta.limit,
        });
        setClients(result.data);
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
      load(search, 1);
    }, 300);
    return () => clearTimeout(t);
  }, [search, load]);

  useEffect(() => {
    load(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', email: '', phone: '', address: '', neighborhood: '', city: '', state: '', zip_code: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    reset({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      neighborhood: client.neighborhood ?? '',
      city: client.city ?? '',
      state: client.state ?? '',
      zip_code: client.zip_code ?? '',
      notes: client.notes ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: ClientPayload) => {
    setSaving(true);
    try {
      if (editing) {
        await clientService.update(editing.id, data);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await clientService.create(data);
        toast.success('Cliente cadastrado com sucesso!');
      }
      setModalOpen(false);
      load(search, page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await clientService.remove(deleteTarget.id);
      toast.success('Cliente removido com sucesso!');
      setDeleteTarget(null);
      load(search, page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Header
        title="Clientes"
        subtitle="Gerencie a base de clientes da lavanderia"
        onMenuClick={onMenuClick}
        actions={
          can('admin', 'manager') ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo cliente</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="card">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, telefone ou e-mail..."
                className="input pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="skeleton h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-48" />
                    <div className="skeleton h-3 w-32" />
                  </div>
                  <div className="skeleton hidden h-8 w-20 sm:block" />
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              description={
                search
                  ? 'Tente ajustar sua busca por outro termo.'
                  : 'Comece cadastrando seu primeiro cliente.'
              }
              action={
                !search && can('admin', 'manager') ? (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Cadastrar cliente
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="px-5 py-3 font-semibold">Contato</th>
                      <th className="hidden px-5 py-3 font-semibold lg:table-cell">Cidade</th>
                      <th className="hidden px-5 py-3 font-semibold xl:table-cell">Cadastro</th>
                      {can('admin', 'manager') && (
                        <th className="px-5 py-3 text-right font-semibold">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.map((client) => (
                      <tr key={client.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 text-xs font-bold text-white">
                              {getInitials(client.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">{client.name}</p>
                              {client.neighborhood && (
                                <p className="truncate text-xs text-slate-400">
                                  {client.neighborhood}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5 text-xs text-slate-500">
                            {client.phone && (
                              <p className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3" />
                                {formatPhone(client.phone)}
                              </p>
                            )}
                            {client.email && (
                              <p className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </p>
                            )}
                            {!client.phone && !client.email && <span>—</span>}
                          </div>
                        </td>
                        <td className="hidden px-5 py-3.5 text-slate-600 lg:table-cell">
                          {client.city ? `${client.city}${client.state ? `/${client.state}` : ''}` : '—'}
                        </td>
                        <td className="hidden px-5 py-3.5 text-slate-500 xl:table-cell">
                          {formatDate(client.created_at)}
                        </td>
                        {can('admin', 'manager') && (
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEdit(client)}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {can('admin') && (
                                <button
                                  onClick={() => setDeleteTarget(client)}
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {clients.map((client) => (
                  <li key={client.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 text-xs font-bold text-white">
                        {getInitials(client.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-800">{client.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {client.phone ? formatPhone(client.phone) : client.email ?? '—'}
                        </p>
                      </div>
                      {can('admin', 'manager') && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(client)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {can('admin') && (
                            <button
                              onClick={() => setDeleteTarget(client)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {(client.city || client.address) && (
                      <p className="mt-2 flex items-center gap-1.5 pl-14 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {[client.address, client.neighborhood, client.city]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {!loading && clients.length > 0 && (
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        description={
          editing ? 'Atualize os dados do cliente abaixo.' : 'Preencha os dados do novo cliente.'
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="client-form" loading={saving}>
              {editing ? 'Salvar alterações' : 'Cadastrar cliente'}
            </Button>
          </>
        }
      >
        <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nome completo"
            required
            placeholder="Ex.: Maria da Silva"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Telefone"
              placeholder="(00) 00000-0000"
              inputMode="tel"
              value={phoneValue ?? ''}
              error={errors.phone?.message}
              onChange={(e) => setValue('phone', maskPhone(e.target.value))}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="cliente@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          <Input
            label="Endereço"
            placeholder="Rua, número e complemento"
            error={errors.address?.message}
            {...register('address')}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Input
              label="Bairro"
              placeholder="Centro"
              error={errors.neighborhood?.message}
              {...register('neighborhood')}
            />
            <Input
              label="Cidade"
              placeholder="São Paulo"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="Estado"
              placeholder="SP"
              maxLength={2}
              error={errors.state?.message}
              {...register('state')}
            />
          </div>
          <Input
            label="CEP"
            placeholder="00000-000"
            inputMode="numeric"
            value={zipValue ?? ''}
            error={errors.zip_code?.message}
            onChange={(e) => setValue('zip_code', maskZipCode(e.target.value))}
          />
          <Textarea
            label="Observações"
            placeholder="Informações adicionais sobre o cliente..."
            error={errors.notes?.message}
            {...register('notes')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
      />
    </>
  );
}