import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { ProductController } from '../controllers/product.controller';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();
const ctrl = new AdminController();
const productCtrl = new ProductController();
const categoryCtrl = new CategoryController();

router.use(authenticate, authorize('super_admin', 'admin'));

// Dashboard & stats
router.get('/dashboard', ctrl.getDashboard.bind(ctrl));

// Shiprocket Rate Calculator
router.post('/shiprocket/calculate-rates', ctrl.calculateShiprocketRates.bind(ctrl));

// Customers
router.get('/customers', ctrl.getCustomers.bind(ctrl));

// Inventory
router.get('/inventory/alerts', ctrl.getInventoryAlerts.bind(ctrl));
router.patch('/inventory/:productId', ctrl.updateInventory.bind(ctrl));

// Reports
router.get('/reports/revenue', ctrl.getRevenueReport.bind(ctrl));

// Products — admin full access (all statuses)
router.get('/products', ctrl.getProducts.bind(ctrl));
router.post('/products', uploadMiddleware('images', 5), productCtrl.create.bind(productCtrl));
router.put('/products/:id', uploadMiddleware('images', 5), productCtrl.update.bind(productCtrl));
router.patch('/products/:productId', ctrl.patchProduct.bind(ctrl));
router.delete('/products/:id', productCtrl.delete.bind(productCtrl));

// Categories — admin full access (includes inactive)
router.get('/categories', categoryCtrl.getAll.bind(categoryCtrl));
router.post('/categories', categoryCtrl.create.bind(categoryCtrl));
router.put('/categories/:id', categoryCtrl.update.bind(categoryCtrl));
router.delete('/categories/:id', categoryCtrl.delete.bind(categoryCtrl));

export default router;
