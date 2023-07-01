import { api } from "@/lib/axios";

export interface IRequest<T> {
    id?: number;
    data?: Partial<T>;
    then?: (value?: T) => void;
    catch?: (e: any) => void;
    finally?: () => void;
}

export class GenericRoutes<T> {
    path: string;
    
    constructor(path: string){
        this.path = path;
    }

    get({then: $t, catch: $c, finally: $f, id}: IRequest<T>){
        api.get<T[]>(this.path)
            .then((v) => {if ($t) $t(v as T)})
            .catch((e) => {if ($c) $c(e)})
            .finally(() => {if ($f) $f()});
    }

    getOne({then: $t, catch: $c, finally: $f, id}: IRequest<T>){
        api.get<T>(this.path, {params: id})
            .then((v) => {if ($t) $t(v as T)})
            .catch((e) => {if ($c) $c(e)})
            .finally(() => {if ($f) $f()});
    }

    post({then: $t, catch: $c, finally: $f, id, data}: IRequest<T>){
        api.post<T>(this.path, {params: id, data})
        .then((v) => {if ($t) $t(v as T)})
        .catch((e) => {if ($c) $c(e)})
        .finally(() => {if ($f) $f()});
    }

    put({then: $t, catch: $c, finally: $f, id, data}: IRequest<T>){        
        api.put<T>(this.path, {params: id, data})
        .then((v) => {if ($t) $t(v as T)})
        .catch((e) => {if ($c) $c(e)})
        .finally(() => {if ($f) $f()});
    }

    delete({then: $t, catch: $c, finally: $f, id}: IRequest<T>){        
        api.delete<T>(this.path, {params: id})
        .then((v) => {if ($t) $t(v as T)})
        .catch((e) => {if ($c) $c(e)})
        .finally(() => {if ($f) $f()});
    }
}