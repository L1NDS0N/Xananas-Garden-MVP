import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  title?: string;
};

const Button = (props: Props) => {
  return (
    <button
      className="bg-[#de818dcc] rounded-sm h-10 text-white hover:bg-[#de818d] transition-colors"
      {...props}
      title={props.title}
    >
      {props.title}
    </button>
  );
};

export default Button;
