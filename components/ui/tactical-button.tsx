'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { soundEngine } from '@/lib/sounds';
import { useLanguage } from '@/lib/i18n';

interface TacticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

const TacticalButton = forwardRef<HTMLButtonElement, TacticalButtonProps>(
  ({ className = '', variant = 'primary', isLoading, children, onClick, onMouseEnter, ...props }, ref) => {
    const { t } = useLanguage();
    
    const variants = {
      primary: "bg-primary/10 border-primary text-primary hover:bg-primary/20",
      secondary: "bg-secondary/20 border-secondary text-secondary-foreground hover:bg-secondary/30",
      danger: "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20",
      ghost: "bg-transparent border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5"
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      soundEngine.playClick();
      onClick?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      soundEngine.playHover();
      onMouseEnter?.(e);
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        className={`
          group relative px-6 py-3 border uppercase tracking-[0.2em] font-bold text-xs transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        {/* Background scan effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
        
        {/* Corner accents */}
        {variant !== 'ghost' && (
          <>
            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-current opacity-50" />
            <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-current opacity-50" />
            <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-current opacity-50" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-current opacity-50" />
          </>
        )}

        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>{t.common.processing}...</span>
            </>
          ) : (
            children
          )}
        </span>
      </button>
    );
  }
);

TacticalButton.displayName = 'TacticalButton';

export { TacticalButton };
