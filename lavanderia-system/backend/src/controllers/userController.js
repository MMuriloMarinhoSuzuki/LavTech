import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userModel } from '../models/index.js';

const createSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'manager', 'attendant'], {
    errorMap: () => ({ message: 'Perfil inválido' }),
  }),
});

const updateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
  role: z.enum(['admin', 'manager', 'attendant']).optional(),
  active: z.boolean().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const userController = {
  getAll: async (req, res) => {
    try {
      res.json(userModel.findAll());
    } catch (err) {
      console.error('Get users error:', err);
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  },

  create: async (req, res) => {
    try {
      const data = createSchema.parse(req.body);
      if (userModel.findByEmail(data.email)) {
        return res.status(409).json({ error: 'Já existe um usuário com este e-mail' });
      }
      const hashed = bcrypt.hashSync(data.password, 10);
      const created = userModel.create({ ...data, password: hashed });
      res.status(201).json(userModel.findById(created.id));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Create user error:', err);
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  },

  update: async (req, res) => {
    try {
      const data = updateSchema.parse(req.body);
      const target = userModel.findById(req.params.id);
      if (!target) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      if (data.email && data.email !== target.email) {
        const existing = userModel.findByEmail(data.email);
        if (existing && existing.id !== target.id) {
          return res.status(409).json({ error: 'Já existe um usuário com este e-mail' });
        }
      }
      if (req.user.id === target.id && data.active === false) {
        return res.status(400).json({ error: 'Você não pode desativar a própria conta' });
      }
      const updated = userModel.update(target.id, data);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Update user error:', err);
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { password } = passwordSchema.parse(req.body);
      const target = userModel.findById(req.params.id);
      if (!target) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      userModel.updatePassword(target.id, bcrypt.hashSync(password, 10));
      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
      }
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  },

  delete: async (req, res) => {
    try {
      if (Number(req.params.id) === req.user.id) {
        return res.status(400).json({ error: 'Você não pode excluir a própria conta' });
      }
      const result = userModel.delete(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json({ message: 'Usuário removido com sucesso' });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: 'Erro ao remover usuário' });
    }
  },
};