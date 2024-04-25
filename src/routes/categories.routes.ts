import { TProductCategory } from "@/schemas/product-category.schema";
import { GenericRoutes } from "./generic.routes";

export class ProductCategoriesRoutes<T extends TProductCategory> extends GenericRoutes<T> {
  path = "/product/categories";

  constructor() {
    super();
  }
}
