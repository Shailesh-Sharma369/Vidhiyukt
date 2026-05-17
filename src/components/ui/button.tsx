import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  children: ReactNode;
};

const variantStyles = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  outline: 'border border-white/12 bg-transparent hover:bg-white/5',
  ghost: 'bg-transparent hover:bg-white/8',
  destructive: 'bg-red-500 text-white hover:bg-red-500/90'
};

const sizeStyles = {
  default: 'h-11 px-4 py-2 rounded-xl',
  sm: 'h-9 px-3 rounded-lg text-sm',
  lg: 'h-12 px-6 rounded-2xl text-base',
  icon: 'size-11 p-0 rounded-xl'
};

export function Button({ className, variant = 'default', size = 'default', loading, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
      {children}
    </button>
  );
}