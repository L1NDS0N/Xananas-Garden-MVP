import { useGenericMethods } from "./generic.methods";
import { GenericRoutes, IRequest } from "./generic.routes";

interface ICatalog {
    id: number;
    name: string;
}

export class CatalogRoutes<T extends ICatalog> extends GenericRoutes<T> {
    private static path = '/catalog';


    constructor(){
        super(CatalogRoutes.path);
    }
}