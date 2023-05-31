import * as icons from "lucide-react";

export interface IXIconProps {
  name: keyof typeof icons;
  tailwindColor: string;
  size: number;
};

const XIcon = ({ name, tailwindColor, size }: IXIconProps) => {
  const LucideIcon = icons[name] as icons.LucideIcon;

  return <LucideIcon className={tailwindColor} size={size} />;
};

export default XIcon;
