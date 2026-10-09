import db from '../database/init.js';

export const userModel = {
  findAll: () => db.prepare('SELECT id, name, email, role, active, created_at FROM users WHERE active = 1 ORDER BY name').all(),
  findById: (id) => db.prepare('SELECT id, name, email, role, active, created_at FROM users WHERE id = ?').get(id),
  findByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
  create: (data) => {
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(data.name, data.email, data.password, data.role);
    return { id: result.lastInsertRowid, ...data };
  },
  update: (id, data) => {
    const fields = [];
    const values = [];
    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    if (data.role) { fields.push('role = ?'); values.push(data.role); }
    if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active ? 1 : 0); }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return userModel.findById(id);
  },
  delete: (id) => {
    const stmt = db.prepare('UPDATE users SET active = 0 WHERE id = ?');
    return stmt.run(id);
  },
  updatePassword: (id, password) => {
    const stmt = db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(password, id);
  }
};

export const clientModel = {
  findAll: (search = '', page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    let where = 'WHERE active = 1';
    const params = [];
    if (search) {
      where += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    params.push(limit, offset);
    const rows = db.prepare(`SELECT * FROM clients ${where} ORDER BY name LIMIT ? OFFSET ?`).all(...params);
    const total = db.prepare(`SELECT COUNT(*) as count FROM clients ${where}`).get(...params.slice(0, -2));
    return { data: rows, total: total.count, page, limit, totalPages: Math.ceil(total.count / limit) };
  },
  findById: (id) => db.prepare('SELECT * FROM clients WHERE id = ? AND active = 1').get(id),
  create: (data) => {
    const stmt = db.prepare(`INSERT INTO clients (name, email, phone, address, neighborhood, city, state, zip_code, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const result = stmt.run(
      data.name,
      data.email ?? null,
      data.phone ?? null,
      data.address ?? null,
      data.neighborhood ?? null,
      data.city ?? null,
      data.state ?? null,
      data.zip_code ?? null,
      data.notes ?? null
    );
    return { id: result.lastInsertRowid, ...data };
  },
  update: (id, data) => {
    const fields = [];
    const values = [];
    const allowed = ['name', 'email', 'phone', 'address', 'neighborhood', 'city', 'state', 'zip_code', 'notes', 'active'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'active' ? (data[key] ? 1 : 0) : data[key]);
      }
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const stmt = db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return clientModel.findById(id);
  },
  delete: (id) => {
    const stmt = db.prepare('UPDATE clients SET active = 0 WHERE id = ?');
    return stmt.run(id);
  }
};

export const serviceModel = {
  findAll: (category = '', activeOnly = true) => {
    let where = activeOnly ? 'WHERE active = 1' : '';
    const params = [];
    if (category) {
      where += (where ? ' AND' : ' WHERE') + ' category = ?';
      params.push(category);
    }
    return db.prepare(`SELECT * FROM services ${where} ORDER BY category, name`).all(...params);
  },
  findById: (id) => db.prepare('SELECT * FROM services WHERE id = ?').get(id),
  create: (data) => {
    const stmt = db.prepare(`INSERT INTO services (name, description, category, unit, price, estimated_days, icon) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const result = stmt.run(data.name, data.description ?? null, data.category, data.unit, data.price, data.estimated_days ?? 1, data.icon ?? null);
    return { id: result.lastInsertRowid, ...data };
  },
  update: (id, data) => {
    const fields = [];
    const values = [];
    const allowed = ['name', 'description', 'category', 'unit', 'price', 'estimated_days', 'icon', 'active'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'active' ? (data[key] ? 1 : 0) : data[key]);
      }
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const stmt = db.prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return serviceModel.findById(id);
  },
  delete: (id) => {
    const stmt = db.prepare('UPDATE services SET active = 0 WHERE id = ?');
    return stmt.run(id);
  },
  getCategories: () => db.prepare("SELECT DISTINCT category FROM services WHERE active = 1").all().map(r => r.category)
};

export const orderModel = {
  findAll: (filters = {}, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (filters.status) { where += ' AND o.status = ?'; params.push(filters.status); }
    if (filters.clientId) { where += ' AND o.client_id = ?'; params.push(filters.clientId); }
    if (filters.userId) { where += ' AND o.user_id = ?'; params.push(filters.userId); }
    if (filters.dateFrom) { where += ' AND date(o.created_at) >= date(?)'; params.push(filters.dateFrom); }
    if (filters.dateTo) { where += ' AND date(o.created_at) <= date(?)'; params.push(filters.dateTo); }
    if (filters.paymentStatus) { where += ' AND o.payment_status = ?'; params.push(filters.paymentStatus); }
    if (filters.deliveryFrom) { where += ' AND date(o.estimated_delivery) >= date(?)'; params.push(filters.deliveryFrom); }
    if (filters.deliveryTo) { where += ' AND date(o.estimated_delivery) <= date(?)'; params.push(filters.deliveryTo); }
    if (filters.overdue) {
      where += " AND o.estimated_delivery IS NOT NULL AND date(o.estimated_delivery) < date('now') AND o.status NOT IN ('delivered', 'cancelled')";
    }
    if (filters.search) {
      where += ' AND (c.name LIKE ? OR c.phone LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term);
    }
    params.push(limit, offset);
    const rows = db.prepare(`
      SELECT o.*, c.name as client_name, c.phone as client_phone, u.name as user_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN users u ON o.user_id = u.id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);
    const total = db.prepare(`
      SELECT COUNT(*) as count FROM orders o
      JOIN clients c ON o.client_id = c.id
      ${where}
    `).get(...params.slice(0, -2));
    return { data: rows, total: total.count, page, limit, totalPages: Math.ceil(total.count / limit) };
  },
  findById: (id) => {
    const order = db.prepare(`
      SELECT o.*, c.name as client_name, c.phone as client_phone, c.address as client_address,
             c.email as client_email, u.name as user_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(id);
    if (order) {
      order.items = db.prepare(`
        SELECT oi.*, s.name as service_name, s.category, s.unit
        FROM order_items oi
        JOIN services s ON oi.service_id = s.id
        WHERE oi.order_id = ?
      `).all(id);
    }
    return order;
  },
  create: (data, items) => {
    const insertOrder = db.prepare(`INSERT INTO orders (client_id, user_id, status, total_amount, discount, notes, estimated_delivery, payment_method, payment_status, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertItem = db.prepare(`INSERT INTO order_items (order_id, service_id, quantity, unit_price, total_price, notes) VALUES (?, ?, ?, ?, ?, ?)`);
    const transaction = db.transaction((orderData, orderItems) => {
      const paymentStatus = orderData.payment_status || 'pending';
      const result = insertOrder.run(
        orderData.client_id,
        orderData.user_id,
        orderData.status || 'pending',
        orderData.total_amount ?? 0,
        orderData.discount ?? 0,
        orderData.notes ?? null,
        orderData.estimated_delivery ?? null,
        orderData.payment_method ?? null,
        paymentStatus,
        paymentStatus === 'paid' ? new Date().toISOString() : null
      );
      const orderId = result.lastInsertRowid;
      for (const item of orderItems) {
        insertItem.run(orderId, item.service_id, item.quantity, item.unit_price, item.total_price, item.notes ?? null);
      }
      return orderId;
    });
    const orderId = transaction(data, items);
    return orderModel.findById(orderId);
  },
  update: (id, data) => {
    const fields = [];
    const values = [];
    const allowed = ['status', 'total_amount', 'discount', 'notes', 'estimated_delivery', 'delivered_at', 'payment_method', 'payment_status', 'paid_at'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const stmt = db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return orderModel.findById(id);
  },
  updateItems: (orderId, items) => {
    const deleteItems = db.prepare('DELETE FROM order_items WHERE order_id = ?');
    const insertItem = db.prepare(`INSERT INTO order_items (order_id, service_id, quantity, unit_price, total_price, notes) VALUES (?, ?, ?, ?, ?, ?)`);
    const transaction = db.transaction((id, orderItems) => {
      deleteItems.run(id);
      for (const item of orderItems) {
        insertItem.run(id, item.service_id, item.quantity, item.unit_price, item.total_price, item.notes ?? null);
      }
    });
    transaction(orderId, items);
    return orderModel.findById(orderId);
  },
  delete: (id) => {
    const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
    return stmt.run(id);
  },
  getStats: () => {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;
    const inProgressOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'in_progress'").get().count;
    const readyOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'ready'").get().count;
    const deliveredOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'").get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered'").get().total;
    const monthlyRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered' AND strftime('%Y-%m', delivered_at) = strftime('%Y-%m', 'now')").get().total;
    return { totalOrders, pendingOrders, inProgressOrders, readyOrders, deliveredOrders, totalRevenue, monthlyRevenue };
  }
};