import { TextField } from "@radix-ui/themes";
import { RootProps } from "@radix-ui/themes/dist/cjs/components/text-field";

import { forwardRef } from "react";
import XIcon, { XIconProps } from "../XIcon";

type Props = RootProps & {
  icon?: XIconProps;
};

const XInput = forwardRef((props: Props, ref: any) => {
  return (
    <TextField.Root ref={ref} title={props.placeholder} size="3" {...props}>
      {props?.icon && (
        <TextField.Slot>
          <XIcon {...props.icon} />
        </TextField.Slot>
      )}
    </TextField.Root>
  );
});

export default XInput;
