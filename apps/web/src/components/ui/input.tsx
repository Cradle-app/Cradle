import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="text-sm font-medium text-white mb-1.5 block">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-forge-border bg-forge-bg px-3 py-2 text-sm text-white',
            'placeholder:text-forge-muted',
            'focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            error && 'border-accent-coral focus:ring-accent-coral',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-accent-coral mt-1">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

