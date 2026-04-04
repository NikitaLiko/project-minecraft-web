'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { TacticalCard } from '@/components/ui/tactical-card';

export function NewsSection() {
  const { t } = useLanguage();

  return (
    <section id="news" className="relative py-24 px-4 md:px-8 border-t border-border/30 bg-background z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex items-end justify-between"
        >
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-foreground uppercase tracking-widest font-bold">
              {t.landing.latest_news}
            </h2>
            <div className="h-px w-32 bg-primary mt-4" />
          </div>
        </motion.div>

        <div className="flex items-center justify-center py-20 border border-dashed border-border/50 bg-black/20">
          <p className="font-display text-xl text-muted-foreground uppercase tracking-widest">
            В разработке
          </p>
        </div>
      </div>
    </section>
  );
}
