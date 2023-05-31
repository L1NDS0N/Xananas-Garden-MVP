import { XToastContext } from "@/contexts/XToastContext";
import { useContext } from "react";

export function useXToast() {
  return useContext(XToastContext);
}
