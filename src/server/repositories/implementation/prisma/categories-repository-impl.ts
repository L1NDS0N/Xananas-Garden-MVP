import Prisma from "@/server/lib/prisma/client";
import { TGenericRepository } from "./generic-repository-impl";
import TProductCategory from "@/server/models/product-category.model";


export class TProductCategoryPrismaRepository extends TGenericRepository<TProductCategory> {
    constructor() {
        super(Prisma.new().productCategory)
    }
}