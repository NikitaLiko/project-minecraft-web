'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHOP_URL } from '@/lib/public-urls';

const navText =
  'inline-flex items-center gap-1.5 font-sans text-sm font-medium uppercase tracking-[0.12em] text-[#d1d1d1] hover:text-[#f0f0f0] transition-colors duration-200 bg-transparent border-0 p-0 cursor-pointer';

const navIcon = 'w-[13px] h-[13px] shrink-0 text-[#d1d1d1] opacity-90';

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/[0.06]">
      <nav
        className="w-full flex justify-center items-center py-5 px-6"
        aria-label="Main"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 sm:gap-x-14 md:gap-x-16">
          <Link href="#news" className={navText}>
            <span>{t.landing.nav_news}</span>
            <ArrowUpRight className={navIcon} strokeWidth={1.75} aria-hidden />
          </Link>

          <a
            href={`${SHOP_URL}/`}
            target="_blank"
            rel="noopener noreferrer"
            className={navText}
          >
            <span>{t.landing.nav_store}</span>
            <ArrowUpRight className={navIcon} strokeWidth={1.75} aria-hidden />
          </a>

          <Link href="/login" className={navText}>
            <span>{t.landing.nav_account}</span>
            <ArrowUpRight className={navIcon} strokeWidth={1.75} aria-hidden />
          </Link>

          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className={`${navText} ${isLangOpen ? 'text-[#f0f0f0]' : ''}`}
              aria-expanded={isLangOpen}
              aria-haspopup="true"
            >
              <span>{language === 'ru' ? 'РУССКИЙ' : 'ENGLISH'}</span>
              <ChevronDown
                className={`${navIcon} transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-[#0a0a0a] py-1 min-w-[160px] z-50 shadow-lg border border-white/[0.08]"
                >
                  <button
                    type="button"
                    onClick={toggleLang}
                    className="w-full text-left px-4 py-3 font-sans text-sm font-medium uppercase tracking-[0.12em] text-[#d1d1d1] hover:text-[#f0f0f0] hover:bg-white/[0.04] transition-colors"
                  >
                    {language === 'ru' ? 'ENGLISH' : 'РУССКИЙ'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
}
