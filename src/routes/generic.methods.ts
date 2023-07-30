import { api } from '@/lib/axios';
import { IRequest } from './generic.routes';

export function useGenericMethods<T>(path: string){

    function get({then: $t, catch: $c, finally: $f}: IRequest<T>){
        api.get<T[]>(path)
            .then((v) => {if ($t) $t(v as T)})
            .catch((e) => {if ($c) $c(e)})
            .finally(() => {if ($f) $f()});
    }

    function post({then: $t, catch: $c, finally: $f, id, data}: IRequest<T>){
        api.post<T>(path, {params: id, data})
        .then((v) => {if ($t) $t(v as T)})
        .catch((e) => {if ($c) $c(e)})
        .finally(() => {if ($f) $f()});
    }

    function put({then: $t, catch: $c, finally: $f, id, data}: IRequest<T>){        
        api.put<T>(path,  data, {params: id, data})
        .then((v) => {if ($t) $t(v as T)})
        .catch((e) => {if ($c) $c(e)})
        .finally(() => {if ($f) $f()});
    }

    function deleteOne({then: $t, catch: $c, finally: $f, id}: IRequest<T>){        
    api.delete<T>(path, {params: id})
    .then((v) => {if ($t) $t(v as T)})
    .catch((e) => {if ($c) $c(e)})
    .finally(() => {if ($f) $f()});
    }

    return {
        get,
        post,
        put,
        delete: deleteOne
    }

  
}