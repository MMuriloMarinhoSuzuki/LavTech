import { serviceModel } from '../models/index.js';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  category: z.enum(['washing', 'dyeing', 'ironing', 'special']),
  unit: z.enum(['kg', 'piece', 'unit']),
  price: z.number().positive('Preço deve ser positivo'),
  estimated_days: z.number().int().min(0, 'Dias estimados deve ser >= 0').default(1),
  icon: z.string().trim().max(40).optional().nullable()
});

export const serviceController = {
  getAll: async (req, res) => {
    try {
      const { category } = req.query;
      const services = serviceModel.findAll(category || '');
      res.json(services);
    } catch (err) {
      console.error('Get services error:', err);
      res.status(500).json({ error: 'Erro ao buscar serviços' });
    }
  },

  getCategories: async (req, res) => {
    try {
      const categories = serviceModel.getCategories();
      res.json(categories);
    } catch (err) {
      console.error('Get categories error:', err);
      res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  },

  getById: async (req, res) => {
    try {
      const service = serviceModel.findById(req.params.id);
      if (!service) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }
      res.json(service);
    } catch (err) {
      console.error('Get service error:', err);
      res.status(500).json({ error: 'Erro ao buscar serviço' });
    }
  },

  create: async (req, res) => {
    try {
      const data = serviceSchema.parse(req.body);
      const service = serviceModel.create(data);
      res.status(201).json(service);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Create service error:', err);
      res.status(500).json({ error: 'Erro ao criar serviço' });
    }
  },

  update: async (req, res) => {
    try {
      const data = serviceSchema.partial().parse(req.body);
      const service = serviceModel.update(req.params.id, data);
      if (!service) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }
      res.json(service);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Update service error:', err);
      res.status(500).json({ error: 'Erro ao atualizar serviço' });
    }
  },

  delete: async (req, res) => {
    try {
      const result = serviceModel.delete(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }
      res.json({ message: 'Serviço removido com sucesso' });
    } catch (err) {
      console.error('Delete service error:', err);
      res.status(500).json({ error: 'Erro ao remover serviço' });
    }
  }
};