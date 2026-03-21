'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const toggleLang = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
    setIsLangOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6 bg-transparent border-b border-white/5 backdrop-blur-[2px]">
      <nav className="max-w-[1400px] mx-auto flex items-center justify-center gap-8 md:gap-16">
        <Link 
          href="#news" 
          className="group flex items-center gap-2 font-display text-sm uppercase tracking-widest text-foreground hover:text-primary transition-colors"
        >
          {t.landing.nav_news || (language === 'ru' ? 'Новости' : 'News')}
          <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link 
          href="/store" 
          className="group flex items-center gap-2 font-display text-sm uppercase tracking-widest text-foreground hover:text-primary transition-colors"
        >
          {t.landing.nav_store || (language === 'ru' ? 'Магазин' : 'Store')}
          <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link 
          href="/login" 
          className="group flex items-center gap-2 font-display text-sm uppercase tracking-widest text-foreground hover:text-primary transition-colors"
        >
          {t.landing.nav_account || (language === 'ru' ? 'Учетная запись' : 'Account')}
          <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>

        <div className="relative" ref={langMenuRef}>
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={`group flex items-center gap-2 font-display text-sm uppercase tracking-widest transition-colors ${isLangOpen ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {language === 'ru' ? 'Русский' : 'English'}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLangOpen ? 'rotate-180 text-foreground' : 'text-muted-foreground'}`} />
          </button>

          <AnimatePresence>
            {isLangOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/5 py-1 min-w-[140px] z-50 shadow-xl"
              >
                <button 
                  onClick={toggleLang}
                  className="w-full text-left px-4 py-3 font-display text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  {language === 'ru' ? 'English' : 'Русский'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </header>
  );
}
