export interface IGenericRepository<T> {
    index: () => Promise<T[] | null>;
    create: (data: T) => Promise<boolean>;
    findOne: (id: string) => Promise<T | null>;
    updateOne: (data: T) => Promise<T | null>;
    deleteOne: (id: string) => Promise<boolean | null>;
}
