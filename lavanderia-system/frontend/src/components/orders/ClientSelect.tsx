import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus, Search, UserPlus } from 'lucide-react';
import { FieldWrapper } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { clientService } from '@/services/api';
import { getErrorMessage } from '@/utils/api';
import { cn, formatPhone, getInitials } from '@/utils/format';
import { useToast } from '@/context/ToastContext';
import type { Client } from '@/types';

interface ClientSelectProps {
  value: number | '';
  onChange: (id: number | '') => void;
  allowCreate?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  autoFocus?: boolean;
}

/**
 * Seletor de cliente com busca no servidor (nome/telefone) e cadastro rápido.
 * Pensado para quem lança muitos pedidos: digita algumas letras e clica.
 */
export function ClientSelect({
  value,
  onChange,
  allowCreate = false,
  required,
  error,
  label = 'Cliente',
  autoFocus,
}: ClientSelectProps) {
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [options, setOptions] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Carrega o cliente selecionado (ex.: ao editar um pedido).
  useEffect(() => {
    let active = true;
    if (!value) return;
    clientService
      .get(value)
      .then((client) => {
        if (!active) return;
        setSelected(client);
        setTerm(client.name);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value]);

  // Busca com debounce.
  useEffect(() => {
    if (!open || creating) return;
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      clientService
        .list({ search: term.trim() || undefined, limit: 8 })
        .then((res) => {
          if (!active) return;
          setOptions(res.data);
          setHighlighted(0);
        })
        .catch((err) => {
          if (active) toast.error(getErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, term, creating, toast]);

  // Fecha ao clicar fora.
  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setCreating(false);
        setTerm(selected?.name ?? '');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [selected]);

  const selectClient = (client: Client) => {
    setSelected(client);
    setTerm(client.name);
    onChange(client.id);
    setOpen(false);
    setCreating(false);
  };

  const startCreate = () => {
    const digits = term.replace(/\D/g, '');
    const looksPhone = digits.length >= 8 && /^[\d\s()+-]+$/.test(term.trim());
    setNewName(looksPhone ? '' : term.trim());
    setNewPhone(looksPhone ? term.trim() : '');
    setCreating(true);
  };

  const submitCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Informe o nome do cliente.');
      return;
    }
    setSaving(true);
    try {
      const created = await clientService.create({
        name,
        phone: newPhone.trim() || undefined,
      });
      toast.success('Cliente cadastrado!');
      selectClient(created);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (creating) {
        event.stopPropagation();
        setCreating(false);
      } else if (open) {
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (creating) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && options[highlighted]) {
        event.preventDefault();
        selectClient(options[highlighted]);
      }
    }
  };

  return (
    <FieldWrapper label={label} required={required} error={error}>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            autoFocus={autoFocus}
            value={term}
            placeholder="Buscar cliente por nome ou telefone..."
            className={cn('input pl-10', error && 'border-red-400 focus:border-red-500')}
            onChange={(e) => {
              setTerm(e.target.value);
              setOpen(true);
              setCreating(false);
              if (value) {
                onChange('');
                setSelected(null);
              }
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-300" />
          )}
        </div>

        {open && (
          <div className="absolute z-50 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {creating ? (
              <div className="space-y-2 p-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-brand-600">
                  <UserPlus className="h-3.5 w-3.5" />
                  Novo cliente
                </p>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="input py-2 text-sm"
                />
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Telefone (opcional)"
                  className="input py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitCreate();
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitCreate} loading={saving} className="flex-1">
                    Criar e selecionar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setCreating(false)}
                    disabled={saving}
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {options.map((client, index) => (
                  <button
                    key={client.id}
                    type="button"
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => selectClient(client)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                      index === highlighted ? 'bg-brand-50' : 'hover:bg-slate-50'
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 text-[10px] font-bold text-white">
                      {getInitials(client.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {client.name}
                      </span>
                      {client.phone && (
                        <span className="block truncate text-xs text-slate-400">
                          {formatPhone(client.phone)}
                        </span>
                      )}
                    </span>
                  </button>
                ))}

                {!loading && options.length === 0 && (
                  <p className="px-3 py-3 text-center text-xs text-slate-400">
                    Nenhum cliente encontrado{term ? ` para “${term}”` : ''}.
                  </p>
                )}

                {allowCreate && (
                  <button
                    type="button"
                    onClick={startCreate}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-brand-200 px-3 py-2 text-left text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                  >
                    <Plus className="h-4 w-4" />
                    {term.trim() ? `Cadastrar “${term.trim()}”` : 'Cadastrar novo cliente'}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}
