import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  glow?: boolean;
}

export function Card({ glass, glow, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`card ${glass ? 'glass' : ''} ${glow ? 'card-glow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
