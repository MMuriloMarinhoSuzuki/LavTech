import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { cn, formatCurrency, serviceCategories, serviceUnits } from '@/utils/format';
import type { Service } from '@/types';

interface ServicePickerProps {
  services: Service[];
  addedIds: number[];
  onAdd: (service: Service) => void;
}

/**
 * Lista de serviços clicável, com busca. Um clique adiciona o serviço ao pedido —
 * bem mais rápido do que escolher em um menu suspenso e apertar "Adicionar".
 */
export function ServicePicker({ services, addedIds, onAdd }: ServicePickerProps) {
  const [term, setTerm] = useState('');

  const filtered = useMemo(() => {
    const query = term.trim().toLowerCase();
    if (!query) return services;
    return services.filter((service) => {
      const category = serviceCategories[service.category]?.label.toLowerCase() ?? '';
      return (
        service.name.toLowerCase().includes(query) ||
        (service.description ?? '').toLowerCase().includes(query) ||
        category.includes(query)
      );
    });
  }, [services, term]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered.length > 0) {
              e.preventDefault();
              onAdd(filtered[0]);
              setTerm('');
            }
          }}
          placeholder="Buscar serviço... (Enter adiciona o primeiro)"
          className="input pl-10"
        />
      </div>

      <div className="mt-2 grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {filtered.map((service) => {
          const cat = serviceCategories[service.category];
          const added = addedIds.includes(service.id);
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onAdd(service)}
              className={cn(
                'flex items-center justify-between gap-2 rounded-xl border p-2.5 text-left transition-all active:scale-[0.98]',
                added
                  ? 'border-brand-300 bg-brand-50'
                  : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40'
              )}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  {added && <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" />}
                  <span className="truncate text-sm font-semibold text-slate-800">
                    {service.name}
                  </span>
                </span>
                <span className={cn('text-xs font-medium', cat?.color)}>{cat?.label}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold text-slate-800">
                  {formatCurrency(service.price)}
                </span>
                <span className="block text-[10px] text-slate-400">
                  /{serviceUnits[service.unit]}
                </span>
              </span>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-slate-400">
            Nenhum serviço encontrado{term ? ` para “${term}”` : ''}.
          </p>
        )}
      </div>
    </div>
  );
}
