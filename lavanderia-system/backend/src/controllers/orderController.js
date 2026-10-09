import { orderModel, clientModel, serviceModel } from '../models/index.js';
import { buildReceipt } from '../dto/receiptDto.js';
import { z } from 'zod';

const orderItemSchema = z.object({
  service_id: z.number().int().positive(),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unit_price: z.number().nonnegative(),
  total_price: z.number().nonnegative(),
  notes: z.string().optional()
});

const orderSchema = z.object({
  client_id: z.number().int().positive('Cliente é obrigatório'),
  status: z.enum(['pending', 'in_progress', 'ready', 'delivered', 'cancelled']).default('pending'),
  total_amount: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  estimated_delivery: z.string().datetime().optional().nullable(),
  payment_method: z.enum(['cash', 'pix', 'card', 'other']).optional().nullable(),
  payment_status: z.enum(['pending', 'paid']).optional(),
  items: z.array(orderItemSchema).min(1, 'Pelo menos um item é obrigatório')
});

export const orderController = {
  getAll: async (req, res) => {
    try {
      const { status, clientId, userId, dateFrom, dateTo, search, paymentStatus, deliveryFrom, deliveryTo, overdue, page = 1, limit = 20 } = req.query;
      const filters = {
        status,
        clientId: clientId ? Number(clientId) : undefined,
        userId: userId ? Number(userId) : undefined,
        dateFrom,
        dateTo,
        paymentStatus,
        deliveryFrom,
        deliveryTo,
        overdue: overdue === 'true' || overdue === true,
        search
      };
      const result = orderModel.findAll(filters, Number(page), Number(limit));
      res.json(result);
    } catch (err) {
      console.error('Get orders error:', err);
      res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
  },

  getStats: async (req, res) => {
    try {
      const stats = orderModel.getStats();
      res.json(stats);
    } catch (err) {
      console.error('Get stats error:', err);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  },

  getById: async (req, res) => {
    try {
      const order = orderModel.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
      res.json(order);
    } catch (err) {
      console.error('Get order error:', err);
      res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
  },

  getReceipt: async (req, res) => {
    try {
      const order = orderModel.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
      res.json(buildReceipt(order));
    } catch (err) {
      console.error('Get receipt error:', err);
      res.status(500).json({ error: 'Erro ao gerar a notinha' });
    }
  },

  create: async (req, res) => {
    try {
      const data = orderSchema.parse(req.body);
      const client = clientModel.findById(data.client_id);
      if (!client) {
        return res.status(400).json({ error: 'Cliente não encontrado' });
      }
      for (const item of data.items) {
        const service = serviceModel.findById(item.service_id);
        if (!service) {
          return res.status(400).json({ error: `Serviço ${item.service_id} não encontrado` });
        }
      }
      const order = orderModel.create(
        { ...data, user_id: req.user.id },
        data.items
      );
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Create order error:', err);
      res.status(500).json({ error: 'Erro ao criar pedido' });
    }
  },

  update: async (req, res) => {
    try {
      const updateSchema = orderSchema.partial().extend({
        items: z.array(orderItemSchema).optional()
      });
      const data = updateSchema.parse(req.body);
      const { items, ...orderData } = data;
      let order = orderModel.update(req.params.id, orderData);
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
      if (items) {
        for (const item of items) {
          const service = serviceModel.findById(item.service_id);
          if (!service) {
            return res.status(400).json({ error: `Serviço ${item.service_id} não encontrado` });
          }
        }
        order = orderModel.updateItems(req.params.id, items);
      }
      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Update order error:', err);
      res.status(500).json({ error: 'Erro ao atualizar pedido' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'in_progress', 'ready', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }
      const updateData = { status };
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
      const order = orderModel.update(req.params.id, updateData);
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
      res.json(order);
    } catch (err) {
      console.error('Update status error:', err);
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  },

  updatePayment: async (req, res) => {
    try {
      const schema = z.object({
        payment_status: z.enum(['pending', 'paid']),
        payment_method: z.enum(['cash', 'pix', 'card', 'other']).optional().nullable(),
      });
      const data = schema.parse(req.body);
      const updateData = {
        payment_status: data.payment_status,
        paid_at: data.payment_status === 'paid' ? new Date().toISOString() : null,
      };
      if (data.payment_method !== undefined) {
        updateData.payment_method = data.payment_method;
      }
      const order = orderModel.update(req.params.id, updateData);
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Update payment error:', err);
      res.status(500).json({ error: 'Erro ao atualizar pagamento' });
    }
  },

  delete: async (req, res) => {
    try {
      const result = orderModel.delete(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
      res.json({ message: 'Pedido removido com sucesso' });
    } catch (err) {
      console.error('Delete order error:', err);
      res.status(500).json({ error: 'Erro ao remover pedido' });
    }
  }
};