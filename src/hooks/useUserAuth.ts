import { UserAuthContext } from "@/contexts/UserAuthContext";
import { useContext } from "react";

export function useAuth() {
    return useContext(UserAuthContext);
}