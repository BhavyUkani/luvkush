import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { ProductService } from '../services/product.service';
import { AppError } from '../middleware/error.middleware';

export class AdminController {
  private service = new AdminService();
  private productService = new ProductService();

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.service.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  }

  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const result = await this.service.getCustomers(Number(page), Number(limit), search as string);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async getInventoryAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.getInventoryAlerts();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async updateInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { quantity } = req.body;
      if (quantity === undefined || quantity < 0) throw new AppError('Valid quantity is required', 400);
      await this.service.updateInventory(Number(req.params['productId']), Number(quantity));
      res.json({ success: true, message: 'Inventory updated' });
    } catch (err) { next(err); }
  }

  async getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query['period'] || 'daily') as 'daily' | 'weekly' | 'monthly';
      const data = await this.service.getRevenueReport(period);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, search, status, category } = req.query;
      const result = await this.productService.getAdminAll({
        page: Number(page),
        limit: Math.min(Number(limit), 100),
        search: search as string,
        status: status as string,
        category: category as string
      });
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async patchProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['productId']);
      const { is_featured, is_bestseller, is_new, status, stock_quantity } = req.body;
      await this.productService.patch(id, { is_featured, is_bestseller, is_new, status, stock_quantity });
      res.json({ success: true, message: 'Product updated' });
    } catch (err) { next(err); }
  }

  async calculateShiprocketRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        pickup_pincode,
        delivery_pincode,
        weight,
        cod,
        declared_value,
        length,
        width,
        height,
        shipment_mode,
        parcel_type
      } = req.body;

      if (!delivery_pincode) {
        throw new AppError('Delivery pincode is required', 400);
      }
      if (weight === undefined || weight === null) {
        throw new AppError('Weight is required', 400);
      }

      const { ShiprocketService } = await import('../services/shiprocket.service');
      const { ICarryService } = await import('../services/icarry.service');
      const { logger } = await import('../utils/logger');

      const shiprocket = new ShiprocketService();
      const icarry = new ICarryService();

      const inputWeight = Number(weight);
      const lengthVal = length ? Number(length) : 0;
      const widthVal = width ? Number(width) : 0;
      const heightVal = height ? Number(height) : 0;
      const volumetricWeight = (lengthVal && widthVal && heightVal) ? (lengthVal * widthVal * heightVal) / 5000 : 0;
      const chargeableWeight = Math.max(inputWeight, volumetricWeight);

      let pickupPin = pickup_pincode ? String(pickup_pincode) : undefined;
      let deliveryPin = String(delivery_pincode);

      // Handle reverse shipping by swapping pincodes
      if (parcel_type === 'reverse') {
        const temp = pickupPin;
        pickupPin = deliveryPin;
        deliveryPin = temp || '360002';
      }

      // Determine COD flag based on parcel_type (if provided) or fallback to cod
      let isCod = Boolean(cod);
      if (parcel_type) {
        isCod = parcel_type === 'cod';
      }

      const params = {
        pickup_pincode: pickupPin,
        delivery_pincode: deliveryPin,
        weight: chargeableWeight,
        cod: isCod,
        declared_value: declared_value !== undefined ? Number(declared_value) : 0,
        length: length ? Number(length) : undefined,
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        shipment_mode: shipment_mode as 'road' | 'air' | undefined
      };

      const [shiprocketRes, icarryRes] = await Promise.allSettled([
        shiprocket.getServiceableCouriers(params),
        icarry.getRates({
          pickup_pincode: params.pickup_pincode || '360002',
          delivery_pincode: params.delivery_pincode,
          weight: params.weight,
          cod: params.cod,
          declared_value: params.declared_value,
          length: params.length,
          width: params.width,
          height: params.height,
          shipment_mode: params.shipment_mode
        })
      ]);

      const shiprocketRates = shiprocketRes.status === 'fulfilled' ? shiprocketRes.value : [];
      if (shiprocketRes.status === 'rejected') {
        logger.error(`Shiprocket Rate Calculation Error: ${shiprocketRes.reason?.message || shiprocketRes.reason}`);
      }

      const icarryRates = icarryRes.status === 'fulfilled' ? icarryRes.value : [];
      if (icarryRes.status === 'rejected') {
        logger.error(`iCarry Rate Calculation Error: ${icarryRes.reason?.message || icarryRes.reason}`);
      }

      res.json({
        success: true,
        data: {
          shiprocket: shiprocketRates,
          icarry: icarryRates,
          errors: {
            shiprocket: shiprocketRes.status === 'rejected' ? (shiprocketRes.reason?.message || 'Failed to fetch Shiprocket rates') : null,
            icarry: icarryRes.status === 'rejected' ? (icarryRes.reason?.message || 'Failed to fetch iCarry rates') : null
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
