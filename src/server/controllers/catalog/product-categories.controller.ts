import { NextApiRouter } from "@/server/core/NextApiRouter";
import TProductCategory from "@/server/models/product-category.model";
import { TProductCategoryPrismaRepository } from "@/server/repositories/implementation/prisma/categories-repository-impl";
import TGenericController from "../generic-controller/generic-controller";

export class TProductCategoriesController extends TGenericController<TProductCategory> {
    constructor(router: NextApiRouter) {
        super(router, new TProductCategoryPrismaRepository(), { subjectSingular: 'Categoria', genre: 'fem', subjectPlural: 'Categorias' })
    }
}