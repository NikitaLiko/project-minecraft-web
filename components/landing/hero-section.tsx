'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { TacticalButton } from '@/components/ui/tactical-button';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Placeholder */}
      <div className="absolute inset-0 z-0 bg-background/80" />
      <div className="absolute inset-0 z-0 bg-[url('https://placehold.co/1920x1080/1a1a1a/444444/png?text=PROJECT:+MINECRAFT')] bg-cover bg-center opacity-30 mix-blend-overlay" />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center mt-20">

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tight text-foreground mb-4 drop-shadow-lg"
        >
          {t.landing.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-muted-foreground text-lg md:text-xl uppercase tracking-widest max-w-2xl mb-12"
        >
          {t.landing.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 w-full max-w-md justify-center"
        >
          <TacticalButton
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto"
          >
            {t.landing.enter}
          </TacticalButton>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50"
        >
          <span className="font-display text-xs tracking-widest uppercase">{t.landing.scroll_down}</span>
          <div className="w-px h-8 bg-gradient-to-b from-primary to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}