import {
  STORE_NAME,
  STORE_PHONE,
  STORE_ADDRESS,
  STORE_DOCUMENT,
} from '../config/env.js';

/**
 * Receipt DTO.
 *
 * Converte um pedido cru (linha do banco + itens) em uma representação pronta
 * para exibição/impressão, em duas "audiências":
 *   - `customer`: comanda enxuta entregue ao cliente;
 *   - `full`:     via completa do atendente (dados internos, pagamento, status...).
 *
 * Aqui só existe o "shape" e os cálculos de apresentação — nada de acesso a banco.
 */

const num = (value) => Number(value ?? 0);

const toStore = () => ({
  name: STORE_NAME,
  phone: STORE_PHONE || null,
  address: STORE_ADDRESS || null,
  document: STORE_DOCUMENT || null,
});

const toItems = (items) =>
  (items ?? []).map((item) => ({
    service_name: item.service_name,
    category: item.category,
    unit: item.unit,
    quantity: num(item.quantity),
    unit_price: num(item.unit_price),
    total_price: num(item.total_price),
    notes: item.notes ?? null,
  }));

export const buildReceipt = (order) => {
  if (!order) return null;

  const items = toItems(order.items);
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

  const shared = {
    store: toStore(),
    order_number: order.id,
    created_at: order.created_at,
    client_name: order.client_name,
    client_phone: order.client_phone ?? null,
    items,
    subtotal: Number(subtotal.toFixed(2)),
    discount: num(order.discount),
    total: num(order.total_amount),
    estimated_delivery: order.estimated_delivery ?? null,
    payment_status: order.payment_status || 'pending',
    payment_method: order.payment_method ?? null,
  };

  return {
    customer: {
      ...shared,
      audience: 'customer',
    },
    full: {
      ...shared,
      audience: 'full',
      order_id: order.id,
      status: order.status,
      updated_at: order.updated_at,
      delivered_at: order.delivered_at ?? null,
      paid_at: order.paid_at ?? null,
      client_email: order.client_email ?? null,
      client_address: order.client_address ?? null,
      attendant_name: order.user_name,
      notes: order.notes ?? null,
    },
  };
};
