import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { clientController } from '../controllers/clientController.js';
import { serviceController } from '../controllers/serviceController.js';
import { orderController } from '../controllers/orderController.js';
import { userController } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.me);
router.put('/auth/password', authenticate, authController.changePassword);

router.get('/users', authenticate, authorize('admin'), userController.getAll);
router.post('/users', authenticate, authorize('admin'), userController.create);
router.put('/users/:id', authenticate, authorize('admin'), userController.update);
router.put('/users/:id/password', authenticate, authorize('admin'), userController.resetPassword);
router.delete('/users/:id', authenticate, authorize('admin'), userController.delete);

router.get('/clients', authenticate, clientController.getAll);
router.get('/clients/:id', authenticate, clientController.getById);
router.post('/clients', authenticate, authorize('admin', 'manager'), clientController.create);
router.put('/clients/:id', authenticate, authorize('admin', 'manager'), clientController.update);
router.delete('/clients/:id', authenticate, authorize('admin'), clientController.delete);

router.get('/services', authenticate, serviceController.getAll);
router.get('/services/categories', authenticate, serviceController.getCategories);
router.get('/services/:id', authenticate, serviceController.getById);
router.post('/services', authenticate, authorize('admin', 'manager'), serviceController.create);
router.put('/services/:id', authenticate, authorize('admin', 'manager'), serviceController.update);
router.delete('/services/:id', authenticate, authorize('admin'), serviceController.delete);

router.get('/orders', authenticate, orderController.getAll);
router.get('/orders/stats', authenticate, orderController.getStats);
router.get('/orders/:id', authenticate, orderController.getById);
router.get('/orders/:id/receipt', authenticate, orderController.getReceipt);
router.post('/orders', authenticate, orderController.create);
router.put('/orders/:id', authenticate, authorize('admin', 'manager'), orderController.update);
router.patch('/orders/:id/status', authenticate, orderController.updateStatus);
router.patch('/orders/:id/payment', authenticate, orderController.updatePayment);
router.delete('/orders/:id', authenticate, authorize('admin'), orderController.delete);

export default router;