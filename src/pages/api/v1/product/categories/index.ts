import { TProductCategoriesController } from '@/server/controllers/catalog/product-categories.controller';
import { TResourcesRunner } from '@/server/core/resources-runner';

export default new TResourcesRunner(TProductCategoriesController, 'index').handler();
