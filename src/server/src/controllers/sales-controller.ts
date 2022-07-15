import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaSalesRepository } from '../repositories/prisma/prisma-sales-repository';
import { SalesService } from '../services/sales-service';
import { CreateSaleData } from '../repositories/sales-repository';

export class SalesController {
  async postSale(request: NextApiRequest, response: NextApiResponse) {
    const repo = new PrismaSalesRepository();
    const service = new SalesService(repo);
    const { body: data } = request as { body: CreateSaleData };

    if (!data.items || data.items.length === 0) {
      return response.status(400).json({ error: 'Sale must have at least one item' });
    }

    try {
      const saleId = await service.create(data);
      return response.status(201).json({ message: 'Sale created', id: saleId });
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getSales(request: NextApiRequest, response: NextApiResponse) {
    const repo = new PrismaSalesRepository();
    const service = new SalesService(repo);

    try {
      const { startDate, endDate } = request.query;
      const sales = await service.findAll({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      return response.status(200).json(sales);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getSale(request: NextApiRequest, response: NextApiResponse) {
    const repo = new PrismaSalesRepository();
    const service = new SalesService(repo);
    const id = request.query.id as string;

    try {
      const sale = await service.findOne(id);
      if (!sale) return response.status(404).json({ error: 'Sale not found' });
      return response.status(200).json(sale);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getSummary(request: NextApiRequest, response: NextApiResponse) {
    const repo = new PrismaSalesRepository();
    const service = new SalesService(repo);

    try {
      const summary = await service.getSummary();
      return response.status(200).json(summary);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
