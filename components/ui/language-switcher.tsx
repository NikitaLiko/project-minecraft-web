'use client';

import { useLanguage } from '@/lib/i18n';
import { soundEngine } from '@/lib/sounds';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    soundEngine.playClick();
    setLanguage(language === 'en' ? 'ru' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      onMouseEnter={() => soundEngine.playHover()}
      className={`
        relative px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-widest
        border transition-all duration-200 group
        ${className}
        border-primary/30 text-primary hover:bg-primary/10 hover:border-primary
      `}
    >
      <span className={language === 'en' ? 'text-primary' : 'text-primary/40'}>EN</span>
      <span className="mx-1 text-primary/30">/</span>
      <span className={language === 'ru' ? 'text-primary' : 'text-primary/40'}>RU</span>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-primary/50" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-primary/50" />
    </button>
  );
}
