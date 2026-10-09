import { userModel } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';

export const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }
      const user = userModel.findByEmail(email);
      if (!user || !user.active) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  me: async (req, res) => {
    try {
      const user = userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json(user);
    } catch (err) {
      console.error('Me error:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      }
      const user = userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      const valid = bcrypt.compareSync(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }
      const hashed = bcrypt.hashSync(newPassword, 10);
      userModel.updatePassword(req.user.id, hashed);
      res.json({ message: 'Senha alterada com sucesso' });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};