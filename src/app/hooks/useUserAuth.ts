import { UserAuthContext } from "@/contexts/UserAuthContext";
import { useContext } from "react";

export function useUserAuth() {
    return useContext(UserAuthContext);
}