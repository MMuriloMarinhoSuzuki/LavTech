import type { ReceiptData } from '@/types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  orderStatuses,
  paymentMethods,
  paymentStatuses,
  serviceCategories,
  serviceUnits,
} from '@/utils/format';

function Divider() {
  return <div className="my-2 border-t border-dashed border-black/40" />;
}

function formatQuantity(quantity: number): string {
  if (Number.isInteger(quantity)) return String(quantity);
  return quantity.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

interface ReceiptDocumentProps {
  data: ReceiptData;
}

/**
 * Notinha térmica (80mm). O mesmo componente é usado na pré-visualização e na
 * impressão. A "audiência" (`data.audience`) decide o quanto de informação sai:
 *  - customer: comanda enxuta para o cliente;
 *  - full: via completa do atendente.
 */
export function ReceiptDocument({ data }: ReceiptDocumentProps) {
  const isFull = data.audience === 'full';
  const payment = paymentStatuses[data.payment_status];

  return (
    <div className="receipt-doc bg-white text-black" style={{ width: '80mm' }}>
      <div className="px-3 py-3 font-mono text-[11px] leading-snug">
        {/* Cabeçalho da loja */}
        <div className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-wide">{data.store.name}</p>
          {data.store.document && <p>{data.store.document}</p>}
          {data.store.address && <p>{data.store.address}</p>}
          {data.store.phone && <p>Tel: {data.store.phone}</p>}
        </div>

        <Divider />

        <p className="text-center text-[12px] font-bold uppercase">
          {isFull ? 'Via do atendente' : 'Comanda do cliente'}
        </p>

        <div className="mt-1 flex justify-between gap-2">
          <span className="font-bold">Pedido #{data.order_number}</span>
          <span>{formatDateTime(data.created_at)}</span>
        </div>
        {isFull && (
          <div className="flex justify-between gap-2">
            <span>Status</span>
            <span className="font-bold">{orderStatuses[data.status]?.label ?? data.status}</span>
          </div>
        )}

        <Divider />

        <p className="font-bold">Cliente: {data.client_name}</p>
        {data.client_phone && <p>Tel: {formatPhone(data.client_phone)}</p>}
        {isFull && data.client_email && <p>E-mail: {data.client_email}</p>}
        {isFull && data.client_address && <p>Endereço: {data.client_address}</p>}
        {isFull && <p>Atendente: {data.attendant_name}</p>}

        <Divider />

        <p className="font-bold uppercase">Itens</p>
        <ul className="mt-1 space-y-1.5">
          {data.items.map((item, index) => (
            <li key={`${item.service_name}-${index}`}>
              <p className="font-semibold">{item.service_name}</p>
              <div className="flex justify-between gap-2">
                <span>
                  {formatQuantity(item.quantity)} {serviceUnits[item.unit] ?? item.unit}
                  {isFull && <> × {formatCurrency(item.unit_price)}</>}
                </span>
                <span>{formatCurrency(item.total_price)}</span>
              </div>
              {isFull && (
                <span className="text-[9px] uppercase opacity-70">
                  {serviceCategories[item.category]?.label ?? item.category}
                </span>
              )}
            </li>
          ))}
        </ul>

        <Divider />

        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between">
            <span>Desconto</span>
            <span>- {formatCurrency(data.discount)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between text-[13px] font-bold">
          <span>TOTAL</span>
          <span>{formatCurrency(data.total)}</span>
        </div>

        <Divider />

        <div className="flex justify-between">
          <span>Pagamento</span>
          <span className="font-bold uppercase">
            {payment.short}
            {data.payment_status === 'paid' && data.payment_method
              ? ` - ${paymentMethods[data.payment_method]}`
              : ''}
          </span>
        </div>
        {isFull && data.paid_at && (
          <div className="flex justify-between">
            <span>Pago em</span>
            <span>{formatDateTime(data.paid_at)}</span>
          </div>
        )}

        <Divider />

        <div className="flex justify-between">
          <span>Previsão de entrega</span>
          <span className="font-bold">
            {data.estimated_delivery ? formatDate(data.estimated_delivery) : 'A combinar'}
          </span>
        </div>
        {isFull && data.delivered_at && (
          <div className="flex justify-between">
            <span>Entregue em</span>
            <span>{formatDate(data.delivered_at)}</span>
          </div>
        )}

        {isFull && data.notes && (
          <>
            <Divider />
            <p className="font-bold uppercase">Observações</p>
            <p className="whitespace-pre-wrap">{data.notes}</p>
          </>
        )}

        <Divider />

        {isFull ? (
          <p className="text-center text-[10px] uppercase opacity-70">Documento interno</p>
        ) : (
          <>
            <p className="text-center font-bold">Obrigado pela preferência!</p>
            <p className="mt-1 text-center">Apresente este comprovante na retirada.</p>
          </>
        )}
      </div>
    </div>
  );
}
