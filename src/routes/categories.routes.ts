import { TProductCategory } from "@/schemas/product-category.schema";
import { GenericRoutes } from "./generic.routes";

export class ProductCategoriesRoutes<T extends TProductCategory> extends GenericRoutes<T> {
  private static path = "/categories";

  constructor() {
    super(ProductCategoriesRoutes.path);
  }
}
