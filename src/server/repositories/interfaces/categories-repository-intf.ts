import { ProductCategory } from "@/server/models/product-category.model";
import { IGenericRepository } from "./generic-repository-intf";

export interface IProductCategoryRepository extends IGenericRepository<ProductCategory>{}
