import * as Toast from "@radix-ui/react-toast";
import { XCircle } from "lucide-react";
import * as React from "react";
import XIcon, { IXIconProps } from "../XIcon";

export type XToastProps = {
  type?: "info" | "success" | "alert" | "warning";
  title?: string;
  description: string;
  undoAction?: () => void;
};

type ToastStyle = {
  rootStyle: string;
  titleStyle: string;
  descriptionStyle: string;
  actionStyle: string;
  ToastIcon: IXIconProps;
};

export const useXToast = () => {
  const timerRef = React.useRef(0);
  const [open, setOpen] = React.useState(false);
  const [props, setProps] = React.useState<XToastProps>({
    type: "info",
  } as XToastProps);
  let toastByType = {} as ToastStyle;

  switch (props.type) {
    default:
      toastByType = {
        rootStyle: "bg-zinc-50 ",
        titleStyle: "text-zinc-900 ",
        descriptionStyle: "text-zinc-700 ",
        actionStyle:
          "bg-rose-100 text-rose-900 shadow-rose-500 hover:shadow-rose-700 focus:shadow-rose-700",
        ToastIcon: { name: "Info", tailwindColor: "text-zinc-900", size: 20 },
      };
      break;

    case "alert":
      toastByType = {
        rootStyle: "bg-red-100",
        titleStyle: "text-red-900 ",
        descriptionStyle: "text-red-700 ",
        actionStyle:
          "bg-red-100 text-red-900 shadow-red-500 hover:shadow-red-700 focus:shadow-red-700",
        ToastIcon: {
          name: "XOctagon",
          tailwindColor: "text-red-700",
          size: 20,
        },
      };
      break;

    case "success":
      toastByType = {
        rootStyle: "bg-green-100 ",
        titleStyle: "text-green-900 ",
        descriptionStyle: "text-green-700 ",
        actionStyle:
          "bg-green-100 text-green-900 shadow-green-500 hover:shadow-green-700 focus:shadow-green-700",
        ToastIcon: {
          name: "CheckCheck",
          tailwindColor: "text-green-700",
          size: 20,
        },
      };
      break;

    case "warning":
      toastByType = {
        rootStyle: "bg-yellow-100 ",
        titleStyle: "text-orange-900 ",
        descriptionStyle: "text-orange-700 ",
        actionStyle:
          "bg-yellow-100 text-orange-900 shadow-orange-500 hover:shadow-orange-700 focus:shadow-orange-700",
        ToastIcon: {
          name: "AlertTriangle",
          tailwindColor: "text-zinc-700",
          size: 20,
        },
      };
      break;
  }
  React.useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const showXToast = (props: XToastProps) => {
    setOpen(false);
    setProps(props);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setOpen(true);
    }, 0);
  };

  const XToast = () => {
    function undoAction() {
      if (props.undoAction) {
        props.undoAction();
      }
    }
    return (
      <Toast.Provider duration={3000} swipeDirection="right">
        <Toast.Root
          className={
            toastByType.rootStyle +
            " grid grid-cols-[auto_max-content_20px] items-center gap-x-[8px] rounded-md p-[15px]" +
            " shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] " +
            "[grid-template-areas:_'title_action_close'_'description_action_close'] data-[swipe=cancel]:translate-x-0 " +
            "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-hide " +
            " data-[state=open]:animate-slideIn data-[swipe=end]:animate-swipeOut data-[swipe=cancel]:transition-[transform_200ms_ease-out]"
          }
          open={open}
          onOpenChange={setOpen}
        >
          <Toast.Title
            className={
              toastByType.titleStyle +
              "mb-[5px] text-[15px] font-medium [grid-area:_title]"
            }
          >
            <div className="flex flex-row gap-2">
              <XIcon {...toastByType.ToastIcon} />
              <span>{props.title}</span>
            </div>
          </Toast.Title>
          <Toast.Description asChild>
            <div
              className={
                toastByType.descriptionStyle +
                "m-0 text-[13px] leading-[1.3] [grid-area:_description]"
              }
            >
              {props.description}
            </div>
          </Toast.Description>

          {props.undoAction && (
            <Toast.Action
              className="[grid-area:_action]"
              asChild
              altText="Goto schedule to undo"
            >
              <button
                onClick={undoAction}
                className={
                  toastByType.actionStyle +
                  " inline-flex h-[25px] items-center justify-center rounded  px-[10px] " +
                  " text-xs font-medium leading-[25px] shadow-[inset_0_0_0_1px] " +
                  " hover:shadow-[inset_0_0_0_1px]  focus:shadow-[0_0_0_2px] "
                }
              >
                Desfazer
              </button>
            </Toast.Action>
          )}

          <Toast.Close
            asChild
            className="flex flex-1 justify-end align-text-top [grid-area:_close]"
            aria-label="Close"
          >
            <span aria-hidden>
              <XCircle
                size={20}
                className="rounded-full text-red-700 transition-colors hover:bg-red-700 hover:text-zinc-50"
              />
            </span>
          </Toast.Close>
        </Toast.Root>
        <Toast.Viewport
          className={
            "fixed bottom-0 right-0 z-10 m-0 flex w-[390px] max-w-[100vw] " +
            "list-none flex-col gap-[10px] p-[var(--viewport-padding)] outline-none [--viewport-padding:_25px]"
          }
        />
      </Toast.Provider>
    );
  };

  return { showXToast, XToast };
};
