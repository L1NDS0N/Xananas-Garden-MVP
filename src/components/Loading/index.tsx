import React from 'react';
import AnimatedLogo from '../AnimatedLogo';

interface LoadingProps {
  size?: number;
  className?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ size = 40, className = '', fullScreen }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <AnimatedLogo size={size} fullScreen={fullScreen} />
    </div>
  );
};

export default Loading;
