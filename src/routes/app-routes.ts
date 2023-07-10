import { CatalogRoutes } from './catalog.routes';

export function useRoutes() {
  return {
    catalog: new CatalogRoutes()
};
  
}
