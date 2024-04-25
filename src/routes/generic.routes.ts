import { api } from "@/lib/axios";
import { AxiosResponse } from "axios";

export interface IRequest<T> {
  id?: string | number;
  data?: Partial<T>;
  then?: (value?: AxiosResponse<T>) => void;
  catch?: (e: any) => void;
  finally?: () => void;
}

export class GenericRoutes<T> {
  path = "";

  get({ then: $t, catch: $c, finally: $f }: IRequest<T[]>) {
    api
      .get<T[]>(this.path)
      .then((v) => {
        if ($t) $t(v);
      })
      .catch((e) => {
        if ($c) $c(e);
      })
      .finally(() => {
        if ($f) $f();
      });
  }

  getOne({ then: $t, catch: $c, finally: $f, id }: IRequest<T>) {
    api
      .get<T>(this.path + '/' + id)
      .then((v) => {
        if ($t) $t(v);
      })
      .catch((e) => {
        if ($c) $c(e);
      })
      .finally(() => {
        if ($f) $f();
      });
  }

  post({ then: $t, catch: $c, finally: $f, data }: IRequest<T>) {
    api
      .post<T>(this.path, data)
      .then((v) => {
        if ($t) $t(v);
      })
      .catch((e) => {
        if ($c) $c(e);
      })
      .finally(() => {
        if ($f) $f();
      });
  }

  put({ then: $t, catch: $c, finally: $f, id, data }: IRequest<T>) {
    api
      .put<T>(this.path + "/" + id, data)
      .then((v) => {
        if ($t) $t(v);
      })
      .catch((e) => {
        if ($c) $c(e);
      })
      .finally(() => {
        if ($f) $f();
      });
  }

  delete({ then: $t, catch: $c, finally: $f, id }: IRequest<void>) {
    api
      .delete<void>(this.path + "/" + id)
      .then((v) => {
        if ($t) $t(v);
      })
      .catch((e) => {
        if ($c) $c(e);
      })
      .finally(() => {
        if ($f) $f();
      });
  }
}
