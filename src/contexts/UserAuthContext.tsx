
import handleKnownError from "@/helpers/handleKnownError";
import { useXToast } from "@/hooks/useXToast";
import { apiV1 } from "@/lib/axios";
import { TLoginUserAdmin } from "@/schemas/admin-user-login.schema";
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
  isLoading: boolean;
  handleLogin: (data: TLoginUserAdmin) => void;
  signOut: () => void;
};

export const UserAuthContext = createContext({} as AuthContextData);

export function UserAuthProvider(props: TAuthProvider) {
  const [user, setUser] = useState<AuthResponse | null>({} as AuthResponse);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showXToast } = useXToast();

  async function handleLogin(data: TLoginUserAdmin) {
    setIsLoading(true);
    const { username, password } = data;
    await apiV1
      .post<any>("/admin/auth", {
        email: username,
        password,
      })
      .then((res) => {
        sessionStorage.setItem("@xg:user", JSON.stringify(res.data));
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        handleKnownError(err, (e: string) => {
          showXToast({
            description: e,
            title: "Erro durante login",
          });
        });
      });
  }

  function signOut() {
    setUser(null);
    sessionStorage.removeItem("@xg:user");
  }

  return (
    <UserAuthContext.Provider value={{ isLoading, user, signOut, handleLogin }}>
      {props.children}
    </UserAuthContext.Provider>
  );
}
