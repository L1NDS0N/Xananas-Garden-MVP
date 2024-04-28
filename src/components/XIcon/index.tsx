import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import dynamic from 'next/dynamic';

export interface XIconProps extends LucideProps {
  name: keyof typeof dynamicIconImports;
}

const XIcon = ({ name, ...props }: XIconProps) => {
  const LucideIcon = dynamic(dynamicIconImports[name])

  return <LucideIcon {...props} />;
};

export default XIcon;