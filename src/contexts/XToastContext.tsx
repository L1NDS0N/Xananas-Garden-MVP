import { XToastProps, useXToast } from "@/components/XToast";
import { createContext } from "react";

type XToastContextType = {
  showXToast: (props: XToastProps) => void;
};

type XToastContextProviderProps = {
  children: React.ReactNode;
};

export const XToastContext = createContext({} as XToastContextType);

export function XToastContextProvider(props: XToastContextProviderProps) {
  const { showXToast, XToast } = useXToast();

  return (
    <XToastContext.Provider value={{ showXToast }}>
      <XToast />
      {props.children}
    </XToastContext.Provider>
  );
}
