import axios from 'axios';
import { logger } from '../utils/logger';
import { CourierRate } from './shiprocket.service';

export class ICarryService {
  async getRates(params: {
    pickup_pincode: string;
    delivery_pincode: string;
    weight: number; // in kg
    cod: boolean;
    declared_value: number;
    length?: number;
    width?: number;
    height?: number;
    shipment_mode?: 'road' | 'air';
  }): Promise<CourierRate[]> {
    const apiToken = process.env.ICARRY_TOKEN;

    const pickupPin = Number(params.pickup_pincode);
    const deliveryPin = Number(params.delivery_pincode);
    const weightGrams = Math.round(params.weight * 1000);
    const lengthCm = Math.round(params.length || 10);
    const breadthCm = Math.round(params.width || 10);
    const heightCm = Math.round(params.height || 10);

    // If API credentials are not provided, return highly realistic mock data for iCarry
    if (!apiToken) {
      logger.info('iCarry API token not configured. Returning mock iCarry rates.');
      
      const baseMarutiRate = params.cod ? 65 : 45;
      const mockCouriers = [
        {
          id: 301,
          name: 'Shree Maruti Surface - 1Kg & Above',
          rate: params.cod ? 73.34 : 44.78,
          etd: '1-2 Business Days',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rating: '4.0',
          cod: 1,
          charge_weight: params.weight,
          etd_hours: 36,
          region: 'Surface',
          volumetric_weight: (lengthCm * breadthCm * heightCm) / 5000,
          mode: 'Surface',
          delivery_performance: '80%',
          rto_charge: 44.78,
          freight_charge: 44.78,
          cod_charges: params.cod ? 28.56 : 0,
          avg_forward_days: 2.1,
          avg_rto_days: 7.6
        },
        {
          id: 302,
          name: 'Shree Maruti Surface - 1Kg & Above',
          rate: params.cod ? 72.00 : 43.97,
          etd: '1-2 Business Days',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rating: '4.0',
          cod: 1,
          charge_weight: params.weight,
          etd_hours: 36,
          region: 'Surface',
          volumetric_weight: (lengthCm * breadthCm * heightCm) / 5000,
          mode: 'Surface',
          delivery_performance: '80%',
          rto_charge: 43.97,
          freight_charge: 43.97,
          cod_charges: params.cod ? 28.03 : 0,
          avg_forward_days: 2.1,
          avg_rto_days: 7.6
        },
        {
          id: 303,
          name: 'Shree Maruti Surface - 1Kg & Above',
          rate: params.cod ? 70.67 : 43.15,
          etd: '1-2 Business Days',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rating: '4.0',
          cod: 1,
          charge_weight: params.weight,
          etd_hours: 36,
          region: 'Surface',
          volumetric_weight: (lengthCm * breadthCm * heightCm) / 5000,
          mode: 'Surface',
          delivery_performance: '80%',
          rto_charge: 43.15,
          freight_charge: 43.15,
          cod_charges: params.cod ? 27.52 : 0,
          avg_forward_days: 2.1,
          avg_rto_days: 7.6
        },
        {
          id: 304,
          name: 'Shree Maruti Surface - 1Kg & Above',
          rate: params.cod ? 68.67 : 41.93,
          etd: '1-2 Business Days',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rating: '4.0',
          cod: 1,
          charge_weight: params.weight,
          etd_hours: 36,
          region: 'Surface',
          volumetric_weight: (lengthCm * breadthCm * heightCm) / 5000,
          mode: 'Surface',
          delivery_performance: '80%',
          rto_charge: 41.93,
          freight_charge: 41.93,
          cod_charges: params.cod ? 26.74 : 0,
          avg_forward_days: 2.1,
          avg_rto_days: 7.6
        },
        {
          id: 305,
          name: 'Delhivery Express (via iCarry)',
          rate: params.cod ? 90 : 70,
          etd: '2-3 Days',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rating: '4.4',
          cod: 1,
          charge_weight: params.weight,
          etd_hours: 72,
          region: 'National',
          volumetric_weight: (lengthCm * breadthCm * heightCm) / 5000,
          mode: 'Air',
          delivery_performance: '95%',
          rto_charge: 80,
          freight_charge: 70,
          cod_charges: params.cod ? 20 : 0
        },
        {
          id: 306,
          name: 'BlueDart Air (via iCarry)',
          rate: params.cod ? 140 : 120,
          etd: '1-2 Days',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rating: '4.8',
          cod: params.cod ? 1 : 0,
          charge_weight: params.weight,
          etd_hours: 36,
          region: 'Metro-to-Metro',
          volumetric_weight: (lengthCm * breadthCm * heightCm) / 5000,
          mode: 'Air',
          delivery_performance: '98%',
          rto_charge: 120,
          freight_charge: 120,
          cod_charges: params.cod ? 20 : 0
        }
      ];

      // Soft filter mock list by mode
      let filteredMock = mockCouriers;
      if (params.shipment_mode) {
        const targetMode = params.shipment_mode === 'air' ? 'air' : 'surface';
        const matched = mockCouriers.filter(c => c.mode.toLowerCase() === targetMode);
        if (matched.length > 0) {
          filteredMock = matched;
        }
      }

      return filteredMock.map(c => ({
        courier_company_id: c.id,
        courier_name: c.name,
        rate: c.rate,
        expected_delivery_date: c.date,
        etd: c.etd,
        rating: c.rating,
        cod: c.cod,
        charge_weight: c.charge_weight,
        etd_hours: c.etd_hours,
        delivery_performance: c.delivery_performance,
        rto_charge: c.rto_charge,
        freight_charge: c.freight_charge,
        cod_charges: c.cod_charges,
        avg_forward_days: c.avg_forward_days,
        avg_rto_days: c.avg_rto_days,
        raw_details: c
      })).sort((a, b) => a.rate - b.rate);
    }

    try {
      logger.info(`Fetching real iCarry rates for pickup: ${pickupPin}, delivery: ${deliveryPin}`);
      
      const payload = {
        length: lengthCm,
        breadth: breadthCm,
        height: heightCm,
        weight: weightGrams,
        origin_pincode: pickupPin,
        destination_pincode: deliveryPin,
        origin_country_code: 'IN',
        destination_country_code: 'IN',
        shipment_mode: params.shipment_mode === 'air' ? 'E' : 'S'
      };

      const response = await axios.post(`https://www.icarry.in/api_get_estimate&api_token=${apiToken}`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data && response.data.status === 'success' && response.data.rates) {
        const rates = response.data.rates.map((c: any, index: number) => {
          const rateVal = parseFloat(c.rate || c.estimate_charge || '0');
          const codFee = params.cod ? parseFloat(c.cod_charges || c.cod_fees || c.cod || '20') : 0;
          const freight = parseFloat(c.freight_charge || c.freight || c.amount || String(rateVal - codFee));
          const rto = parseFloat(c.rto_charge || c.rto_fees || c.rto || String(freight));
          const avgForward = c.avg_forward_days || c.avg_forward || c.transit_days;
          const avgRto = c.avg_rto_days || c.avg_rto || c.rto_days;
          return {
            courier_company_id: c.courier_id || (500 + index),
            courier_name: c.courier_name || 'Partner Courier',
            rate: rateVal,
            expected_delivery_date: c.expected_delivery_date || '',
            etd: c.etd || c.transit_time || '3-5 Days',
            rating: c.rating || '4.0',
            cod: params.cod ? 1 : 0,
            charge_weight: c.charge_weight ? parseFloat(c.charge_weight) : params.weight,
            etd_hours: c.etd_hours ? parseInt(c.etd_hours, 10) : undefined,
            delivery_performance: c.delivery_performance || c.delivery_success_rate || c.delivery_rate || '90%',
            rto_charge: rto,
            freight_charge: freight,
            cod_charges: codFee,
            avg_forward_days: avgForward !== undefined ? parseFloat(avgForward) : undefined,
            avg_rto_days: avgRto !== undefined ? parseFloat(avgRto) : undefined,
            raw_details: c
          };
        });
        return rates.sort((a: CourierRate, b: CourierRate) => a.rate - b.rate);
      } else {
        const msg = response.data?.message || 'iCarry rate query did not return estimation details.';
        throw new Error(msg);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      throw new Error(`iCarry API Error: ${errMsg}`);
    }
  }
}
