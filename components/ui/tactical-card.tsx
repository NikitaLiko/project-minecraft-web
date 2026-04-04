import { HTMLAttributes, forwardRef } from 'react';

interface TacticalCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'alert' | 'success';
  title?: string;
  noPadding?: boolean;
}

const TacticalCard = forwardRef<HTMLDivElement, TacticalCardProps>(
  ({ className = '', variant = 'default', title, children, noPadding = false, ...props }, ref) => {
    
    const variants = {
      default: "border-primary/20 bg-card/50",
      alert: "border-destructive/30 bg-destructive/5",
      success: "border-green-500/30 bg-green-500/5",
    };

    const accentColors = {
      default: "border-primary",
      alert: "border-destructive",
      success: "border-green-500",
    };

    return (
      <div 
        ref={ref}
        className={`
          border relative backdrop-blur-sm
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        {/* Corner Decorations */}
        <div className={`absolute -top-px -left-px w-3 h-3 border-l-2 border-t-2 ${accentColors[variant]}`} />
        <div className={`absolute -top-px -right-px w-3 h-3 border-r-2 border-t-2 ${accentColors[variant]}`} />
        <div className={`absolute -bottom-px -left-px w-3 h-3 border-l-2 border-b-2 ${accentColors[variant]}`} />
        <div className={`absolute -bottom-px -right-px w-3 h-3 border-r-2 border-b-2 ${accentColors[variant]}`} />

        {title && (
          <div className={`
            px-4 py-2 border-b text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-between
            ${variant === 'default' ? 'border-primary/10 text-muted-foreground' : ''}
            ${variant === 'alert' ? 'border-destructive/20 text-destructive' : ''}
            ${variant === 'success' ? 'border-green-500/20 text-green-500' : ''}
          `}>
            <span>{title}</span>
            <div className="flex gap-1">
              <div className={`w-1 h-1 rounded-full ${variant === 'default' ? 'bg-primary' : variant === 'alert' ? 'bg-destructive' : 'bg-green-500'} animate-pulse`} />
              <div className={`w-1 h-1 rounded-full ${variant === 'default' ? 'bg-primary' : variant === 'alert' ? 'bg-destructive' : 'bg-green-500'} opacity-50`} />
              <div className={`w-1 h-1 rounded-full ${variant === 'default' ? 'bg-primary' : variant === 'alert' ? 'bg-destructive' : 'bg-green-500'} opacity-25`} />
            </div>
          </div>
        )}

        <div className={noPadding ? '' : 'p-6'}>
          {children}
        </div>
      </div>
    );
  }
);

TacticalCard.displayName = 'TacticalCard';

export { TacticalCard };
