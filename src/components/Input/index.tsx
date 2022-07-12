import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

const Input = (props: Props) => {
  return (
    <input
      className="p-2 border border-zinc-200 rounded h-10"
      {...props}
      title={props.placeholder}
    />
  );
};

export default Input;
