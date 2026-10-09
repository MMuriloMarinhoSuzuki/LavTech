import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Clock,
  Shirt,
  Droplets,
  Palette,
  Package,
  Star,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { serviceService, type ServicePayload } from '@/services/api';
import { getErrorMessage } from '@/utils/api';
import { cn, formatCurrency, serviceCategories, serviceUnits } from '@/utils/format';
import type { Service, ServiceCategory } from '@/types';

const categoryIcons: Record<ServiceCategory, typeof Droplets> = {
  washing: Droplets,
  dyeing: Palette,
  ironing: Shirt,
  special: Package,
};

const categories = Object.keys(serviceCategories) as ServiceCategory[];

export function Services() {
  const { onMenuClick } = useLayout();
  const { can } = useAuth();
  const toast = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServicePayload>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await serviceService.list();
      setServices(data);
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
    reset({
      name: '',
      description: '',
      category: 'washing',
      unit: 'piece',
      price: 0,
      estimated_days: 1,
    });
    setModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    reset({
      name: service.name,
      description: service.description ?? '',
      category: service.category,
      unit: service.unit,
      price: service.price,
      estimated_days: service.estimated_days,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: ServicePayload) => {
    setSaving(true);
    const payload: ServicePayload = {
      ...data,
      price: Number(data.price),
      estimated_days: Number(data.estimated_days),
    };
    try {
      if (editing) {
        await serviceService.update(editing.id, payload);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await serviceService.create(payload);
        toast.success('Serviço cadastrado com sucesso!');
      }
      setModalOpen(false);
      load();
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
      await serviceService.remove(deleteTarget.id);
      toast.success('Serviço removido com sucesso!');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = filter === 'all' ? services : services.filter((s) => s.category === filter);

  const counts = categories.reduce(
    (acc, cat) => ({ ...acc, [cat]: services.filter((s) => s.category === cat).length }),
    {} as Record<ServiceCategory, number>
  );

  return (
    <>
      <Header
        title="Serviços"
        subtitle="Catálogo de lavagem, tingimento, passadoria e itens especiais"
        onMenuClick={onMenuClick}
        actions={
          can('admin', 'manager') ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo serviço</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          ) : undefined
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            icon={Sparkles}
            label="Todos"
            count={services.length}
          />
          {categories.map((cat) => {
            const Icon = categoryIcons[cat];
            return (
              <FilterChip
                key={cat}
                active={filter === cat}
                onClick={() => setFilter(cat)}
                icon={Icon}
                label={serviceCategories[cat].label}
                count={counts[cat] ?? 0}
              />
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-12 w-12 rounded-xl" />
                <div className="mt-4 space-y-2">
                  <div className="skeleton h-4 w-40" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Sparkles className="h-7 w-7" />}
              title="Nenhum serviço encontrado"
              description="Cadastre serviços para começar a montar pedidos."
              action={
                can('admin', 'manager') ? (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Cadastrar serviço
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((service) => {
              const cat = serviceCategories[service.category];
              const Icon = categoryIcons[service.category];
              return (
                <div
                  key={service.id}
                  className="card group relative flex flex-col overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
                        cat.gradient
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {service.category === 'special' && (
                      <span className={cn('badge', cat.bg, cat.color)}>
                        <Star className="h-3 w-3" />
                        Especial
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900">{service.name}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
                    {service.description || 'Sem descrição'}
                  </p>

                  <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        {cat.label} · por {serviceUnits[service.unit]}
                      </p>
                      <p className="text-xl font-extrabold text-slate-900">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {service.estimated_days}d
                    </span>
                  </div>

                  {can('admin', 'manager') && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(service)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      {can('admin') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(service)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar serviço' : 'Novo serviço'}
        description="Defina as informações do serviço oferecido."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="service-form" loading={saving}>
              {editing ? 'Salvar alterações' : 'Cadastrar serviço'}
            </Button>
          </>
        }
      >
        <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nome do serviço"
            required
            placeholder="Ex.: Lavagem de ursinho de pelúcia"
            error={errors.name?.message}
            {...register('name')}
          />
          <Textarea
            label="Descrição"
            placeholder="Descreva o serviço oferecido..."
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select label="Categoria" required error={errors.category?.message} {...register('category')}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {serviceCategories[cat].label}
                </option>
              ))}
            </Select>
            <Select label="Unidade de cobrança" required error={errors.unit?.message} {...register('unit')}>
              <option value="piece">Peça</option>
              <option value="kg">Quilograma (kg)</option>
              <option value="unit">Unidade</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Preço (R$)"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0,00"
              error={errors.price?.message}
              {...register('price', { valueAsNumber: true })}
            />
            <Input
              label="Prazo estimado (dias)"
              type="number"
              min="0"
              required
              placeholder="1"
              error={errors.estimated_days?.message}
              {...register('estimated_days', { valueAsNumber: true })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Excluir serviço"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"?`}
        confirmLabel="Sim, excluir"
      />
    </>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  icon: typeof Droplets;
  label: string;
  count: number;
}

function FilterChip({ active, onClick, icon: Icon, label, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all',
        active
          ? 'border-brand-200 bg-brand-50 text-brand-700 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-xs',
          active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
        )}
      >
        {count}
      </span>
    </button>
  );
}