import axios from 'axios';
import { logger } from '../utils/logger';

export interface CourierRate {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  expected_delivery_date: string;
  etd: string;
  rating: string;
  cod: number;
  charge_weight?: number;
  etd_hours?: number;
  raw_details?: any;
  delivery_performance?: string;
  rto_charge?: number;
  freight_charge?: number;
  cod_charges?: number;
  avg_forward_days?: number;
  avg_rto_days?: number;
}

export class ShiprocketService {
  private token: string | null = null;
  private tokenExpiry: number | null = null; // timestamp in ms

  private async getAuthToken(): Promise<string> {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new Error('Shiprocket API credentials are not configured in backend/.env file.');
    }

    // Check cached token
    const cachedToken = this.token;
    if (cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return cachedToken;
    }

    try {
      logger.info('Authenticating with Shiprocket API...');
      const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
        email,
        password
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      if (response.data && response.data.token) {
        const tokenVal = response.data.token;
        this.token = tokenVal;
        // Shiprocket tokens are valid for 10 days, cache for 23 hours
        this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
        logger.info('Shiprocket authentication successful.');
        return tokenVal;
      } else {
        throw new Error('Authentication response did not contain a token.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      throw new Error(`Shiprocket Login failed: ${errMsg}`);
    }
  }

  async getServiceableCouriers(params: {
    pickup_pincode?: string;
    delivery_pincode: string;
    weight: number; // in kg
    cod: boolean;
    declared_value: number;
    length?: number;
    width?: number;
    height?: number;
    shipment_mode?: 'road' | 'air';
  }): Promise<CourierRate[]> {
    const deliveryPincode = (params.delivery_pincode || '').toString().trim();

    // Validate delivery pincode format
    if (!/^\d{6}$/.test(deliveryPincode)) {
      throw new Error(`Invalid delivery pincode: "${deliveryPincode}". Must be a 6-digit number.`);
    }

    const token = await this.getAuthToken();
    const pickupPincode = params.pickup_pincode || process.env.SHIPROCKET_PICKUP_PINCODE || '360002';

    try {
      logger.info(`Fetching real Shiprocket rates for pickup: ${pickupPincode}, delivery: ${deliveryPincode}`);
      const response = await axios.get('https://apiv2.shiprocket.in/v1/external/courier/serviceability/', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: deliveryPincode,
          weight: params.weight,
          cod: params.cod ? 1 : 0,
          declared_value: params.declared_value,
          is_document: 0,
          length: params.length || 10,
          width: params.width || 10,
          height: params.height || 10
        },
        timeout: 10000
      });

      console.log("response", response.data);

      if (response.data && response.data.status === 200 && response.data.data && response.data.data.available_courier_companies) {
        let companies = response.data.data.available_courier_companies;

        // Filter companies by mode if shipment_mode is provided
        if (params.shipment_mode) {
          const targetMode = params.shipment_mode === 'air' ? 'air' : 'surface';
          const matched = companies.filter((c: any) => {
            const m = String(c.mode || '').toLowerCase();
            return targetMode === 'air'
              ? (m.includes('air') || m.includes('express'))
              : (m.includes('surface') || m.includes('road'));
          });
          if (matched.length > 0) {
            companies = matched;
          }
        }

        const rates = companies.map((c: any) => ({
          courier_company_id: c.courier_company_id,
          courier_name: c.courier_name,
          rate: parseFloat(c.rate),
          expected_delivery_date: c.expected_delivery_date,
          etd: c.etd || '2-4 days',
          rating: c.rating || '4.0',
          cod: c.cod || 0,
          charge_weight: c.charge_weight ? parseFloat(c.charge_weight) : undefined,
          etd_hours: c.etd_hours ? parseInt(c.etd_hours, 10) : undefined,
          delivery_performance: c.delivery_performance !== undefined ? String(c.delivery_performance) : undefined,
          rto_charge: c.rto_charge !== undefined ? parseFloat(c.rto_charge) : undefined,
          freight_charge: c.freight_charge !== undefined ? parseFloat(c.freight_charge) : parseFloat(c.rate),
          cod_charges: c.cod_charges !== undefined ? parseFloat(c.cod_charges) : 0,
          raw_details: c
        }));
        // Sort by rate ascending
        return rates.sort((a: CourierRate, b: CourierRate) => a.rate - b.rate);
      } else {
        const msg = response.data?.message || 'Courier serviceability query did not return any courier options.';
        throw new Error(msg);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      throw new Error(`Shiprocket Serviceability Error: ${errMsg}`);
    }
  }

  async bookShipment(order: any, params: {
    courier_company_id: number;
    courier_name: string;
    rate: number;
  }): Promise<{ success: boolean; awb_code: string; label_url: string }> {
    const token = await this.getAuthToken();

    // Parse shipping address
    let address: any = {};
    try {
      address = typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;
    } catch (err) {
      throw new Error('Failed to parse order shipping address.');
    }

    // Format date as YYYY-MM-DD HH:MM
    const formatShiprocketDate = (dStr: any) => {
      const d = new Date(dStr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    };

    // Prepare order items
    const orderItems = (order.items || []).map((item: any) => ({
      name: item.product_name,
      sku: item.sku || `SKU-${item.product_id}`,
      units: item.quantity,
      selling_price: Number(item.unit_price)
    }));

    if (orderItems.length === 0) {
      orderItems.push({
        name: 'Luv Kush Natural Product',
        sku: 'LKN-GENERIC',
        units: 1,
        selling_price: Number(order.total_amount)
      });
    }

    // Step 1: Create custom adhoc order in Shiprocket
    let shipmentId: any = null;
    try {
      logger.info(`Creating Shiprocket adhoc order for Luv Kush Order #${order.order_number}`);

      const payload = {
        order_id: order.order_number,
        order_date: formatShiprocketDate(order.created_at),
        pickup_location: "Primary", // Must match registered pickup location name
        billing_customer_name: order.first_name,
        billing_last_name: order.last_name || "",
        billing_address: address.address_line1,
        billing_address_2: address.address_line2 || "",
        billing_city: address.city,
        billing_pincode: address.pincode,
        billing_state: address.state,
        billing_country: address.country || "India",
        billing_email: order.email,
        billing_phone: address.phone || order.phone || order.user_phone || "9999999999",
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: order.payment_method === 'cod' ? "COD" : "Prepaid",
        sub_total: Number(order.subtotal),
        length: 10,
        width: 10,
        height: 10,
        weight: 0.5
      };

      const response = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 12000
      });

      if (response.data && response.data.shipment_id) {
        shipmentId = response.data.shipment_id;
        logger.info(`Shiprocket order created. Shipment ID: ${shipmentId}`);
      } else {
        const msg = response.data?.message || 'Failed to create order in Shiprocket.';
        throw new Error(msg);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      throw new Error(`Shiprocket Order Creation Error: ${errMsg}`);
    }

    // Step 2: Assign AWB to shipment
    try {
      logger.info(`Assigning AWB for Shipment ID ${shipmentId} with Courier ID ${params.courier_company_id}`);

      const response = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
        shipment_id: shipmentId,
        courier_id: params.courier_company_id
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 12000
      });

      const responseData = response.data;
      const awbResponse = responseData?.response?.data || responseData?.data || {};

      if (awbResponse && awbResponse.awb_code) {
        const awbCode = awbResponse.awb_code;
        const labelUrl = awbResponse.label_url || `https://shiprocket.co/tracking/${awbCode}`;
        logger.info(`AWB successfully assigned. AWB Code: ${awbCode}`);
        return {
          success: true,
          awb_code: awbCode,
          label_url: labelUrl
        };
      } else {
        const msg = responseData?.response?.message || responseData?.message || 'AWB assignment failed or did not return an AWB code.';
        throw new Error(msg);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      throw new Error(`Shiprocket AWB Assignment Error: ${errMsg}`);
    }
  }

  async getTrackingStatus(awb: string): Promise<any> {
    const token = await this.getAuthToken();
    try {
      const response = await axios.get(
        `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
        { headers: { 'Authorization': `Bearer ${token}` }, timeout: 10000 }
      );
      return response.data;
    } catch (err: any) {
      throw new Error(`Shiprocket Tracking Error: ${err.response?.data?.message || err.message}`);
    }
  }
}
