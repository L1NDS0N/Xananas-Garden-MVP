import { CatalogRoutes } from './catalog.routes';

export function useRoutes() {
  return {
    catalog: new CatalogRoutes()
};
  
}
const { catalog } = useRoutes()
catalog.fazerAlgoDiferente({then: (value: any) => {
    console.log(value)
}, 
})