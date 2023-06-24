import { useRouter } from "./routes.constants";
const {$r} = useRouter();

export class API {
  private static $api: API;
  protected static $route: string;

  public static new(route: keyof typeof $r): API {
    if (!this.$api) {
      this.$api = new API();
    }
    return this.$api;
  }

  get(){}

  post() {
    $r()?.admin.auth.another.teste  
  }

  put() {}

  delete() {}

 
  
}
