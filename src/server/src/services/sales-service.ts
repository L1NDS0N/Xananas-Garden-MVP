import { ISalesRepository, CreateSaleData, SaleData } from '../repositories/sales-repository';

export class SalesService {
  constructor(private readonly salesRepository: ISalesRepository) {}

  async create(data: CreateSaleData) {
    return await this.salesRepository.create(data);
  }

  async findAll(filters?: { startDate?: string; endDate?: string }) {
    return await this.salesRepository.findAll(filters);
  }

  async findOne(id: string) {
    return await this.salesRepository.findOne(id);
  }

  async getSummary() {
    return await this.salesRepository.getSummary();
  }
}
