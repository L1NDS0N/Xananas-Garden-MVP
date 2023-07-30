import React, { forwardRef } from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

const XInput = forwardRef((props: Props, ref: any) => {
  return (
    <input
      className="p-2 border border-zinc-200 rounded h-10"
      ref={ref}
      title={props.placeholder}
      {...props}
    />
  );
});

export default XInput;