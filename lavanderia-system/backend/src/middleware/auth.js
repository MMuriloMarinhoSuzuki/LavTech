import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { userModel } from '../models/index.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Sempre confere se o usuário ainda existe e está ativo. Um token antigo
    // (ex.: após db:reset ou exclusão de usuário) vira 401 limpo, em vez de
    // quebrar em erro de FOREIGN KEY no banco.
    const user = userModel.findById(decoded.id);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // ignore
  }
  next();
};