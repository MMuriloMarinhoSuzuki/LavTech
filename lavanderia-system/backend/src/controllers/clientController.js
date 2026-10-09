import { clientModel } from '../models/index.js';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional().or(z.literal('')),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2, 'Estado deve ter 2 letras').optional().or(z.literal('')),
  zip_code: z.string().optional(),
  notes: z.string().optional()
});

export const clientController = {
  getAll: async (req, res) => {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const result = clientModel.findAll(search || '', Number(page), Number(limit));
      res.json(result);
    } catch (err) {
      console.error('Get clients error:', err);
      res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
  },

  getById: async (req, res) => {
    try {
      const client = clientModel.findById(req.params.id);
      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      res.json(client);
    } catch (err) {
      console.error('Get client error:', err);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  },

  create: async (req, res) => {
    try {
      const data = clientSchema.parse(req.body);
      const client = clientModel.create(data);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Create client error:', err);
      res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  },

  update: async (req, res) => {
    try {
      const data = clientSchema.partial().parse(req.body);
      const client = clientModel.update(req.params.id, data);
      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Update client error:', err);
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  },

  delete: async (req, res) => {
    try {
      const result = clientModel.delete(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      res.json({ message: 'Cliente removido com sucesso' });
    } catch (err) {
      console.error('Delete client error:', err);
      res.status(500).json({ error: 'Erro ao remover cliente' });
    }
  }
};