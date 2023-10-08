export default class TProductCategory {
    id?: string;
    name!: string;
    createdAt?: Date;
    updatedAt?: Date;
    // products: Product[];

    constructor(obj?: Partial<TProductCategory>){
        Object.assign(this, obj)
    }
}