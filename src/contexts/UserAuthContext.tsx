import { useXToast } from "@/app/hooks/useXToast";
import { apiV1 } from "@/app/lib/axios";
import { TLoginUserAdmin } from "@/schemas/admin-user-login.schema";
import { AxiosError } from "axios";
import { createContext, ReactNode, useState } from "react";

type TAuthProvider = {
  children: ReactNode;
};

type ErrorResponse = {
  type: string;
  message: string;
  error: string;
};

type AuthResponse = {
  any: any;
};

type AuthContextData = {
  user: AuthResponse | null;
  handleLogin: (data: TLoginUserAdmin) => void;
  signOut: () => void;
};

export const UserAuthContext = createContext({} as AuthContextData);

export function UserAuthProvider(props: TAuthProvider) {
  const [user, setUser] = useState<AuthResponse | null>({} as AuthResponse);
  const { showXToast } = useXToast();

  async function handleLogin(data: TLoginUserAdmin) {
    await apiV1
      .post<any>("/admin/auth", {
        email: data.username,
        password: data.password,
      })
      .then((res) => {
        sessionStorage.setItem("@xg:user", JSON.stringify(res.data));
      })
      .catch((err) => {
        if (err instanceof AxiosError) {
          showXToast({
            description: err.response?.data.error,
            title: "Erro durante login",
          });
        } else {
          console.log(err);
          showXToast({
            description: "erro desconhecido",
            title: "Erro durante login",
          });
        }
      });
  }

  function signOut() {
    setUser(null);
    sessionStorage.removeItem("@xg:user");
  }

  return (
    <UserAuthContext.Provider value={{ user, signOut, handleLogin }}>
      {props.children}
    </UserAuthContext.Provider>
  );
}
