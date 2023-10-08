import Prisma from "@/server/lib/prisma/client";
import { ProductCategory } from "@/server/models/product-category.model";
import { IProductCategoryRepository } from "../../interfaces/categories-repository-intf";

export class TProductCategoryPrismaRepository implements IProductCategoryRepository {
    async index() {
        return await Prisma.new().productCategory.findMany();
    }

    async create({ name }: Partial<ProductCategory>) {
        try {
            await Prisma.new().productCategory.create({ name } as any)
            return true;
        } catch (error) {
            console.error({error})
            return false;
        }
    }

    async findOne(id: string) {
        return await Prisma.new().productCategory.findUnique({ where: { id } });
    }
    async updateOne({ id, name }: ProductCategory): Promise<ProductCategory> {
        return await Prisma.new().productCategory.update({ where: { id }, data: { name } });
    }
    async deleteOne(id: string): Promise<boolean> {
        try {
            await Prisma.new().productCategory.delete({where: {id}});
            return true;
        } catch (error) {
            console.error({error})
            return false;
        }
    }



}