
import { IGenericRepository } from "../../interfaces/generic-repository-intf";

export class TGenericRepository<T extends { id: string }> implements IGenericRepository<T> {
    private $repository: any;

    constructor(repository: any) {
        this.$repository = repository;
    }

    async index() {
        return await this.$repository.findMany();
    }

    async create(data: T) {
        try {
            await this.$repository.create({ data })
            return true;
        } catch (error) {
            console.error({ error })
            return false;
        }
    }

    async findOne(id: string) {
        return await this.$repository.findUnique({ where: { id } });
    }

    async updateOne(data: T): Promise<T> {
        const { id } = data;
        return await this.$repository.update({ where: { id }, data });
    }

    async deleteOne(id: string): Promise<boolean> {
        try {
            await this.$repository.delete({ where: { id } });
            return true;
        } catch (error) {
            console.error({ error })
            return false;
        }
    }
}