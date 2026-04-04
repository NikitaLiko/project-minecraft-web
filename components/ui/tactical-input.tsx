import { InputHTMLAttributes, forwardRef } from 'react';
import { soundEngine } from '@/lib/sounds';

interface TacticalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const TacticalInput = forwardRef<HTMLInputElement, TacticalInputProps>(
  ({ className = '', label, error, onFocus, ...props }, ref) => {
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      soundEngine.playHover();
      onFocus?.(e);
    };

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            onFocus={handleFocus}
            className={`
              w-full bg-black/40 border px-4 py-3 text-sm font-mono transition-colors
              focus:outline-none placeholder:text-muted-foreground/30
              ${error 
                ? 'border-destructive text-destructive focus:border-destructive' 
                : 'border-primary/30 text-primary focus:border-primary'
              }
              ${className}
            `}
            {...props}
          />
          
          {/* Active indicator line */}
          <div className={`
            absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-focus-within:w-full
            ${error ? 'bg-destructive' : 'bg-primary'}
          `} />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-white/10 group-focus-within:border-primary/50 transition-colors" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-white/10 group-focus-within:border-primary/50 transition-colors" />
        </div>
        
        {error && (
          <p className="text-[10px] text-destructive uppercase tracking-wide font-mono pl-1 animate-pulse">
            ⚠ {error}
          </p>
        )}
      </div>
    );
  }
);

TacticalInput.displayName = 'TacticalInput';

export { TacticalInput };
