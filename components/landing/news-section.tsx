'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { TacticalCard } from '@/components/ui/tactical-card';

const newsItems = [
  {
    id: 1,
    title: "Update 1.0.5 Deployment",
    date: "03.17.2026",
    category: "System Update",
    image: "https://placehold.co/600x400/1a1a1a/444444/png?text=NEWS"
  },
  {
    id: 2,
    title: "Ranked Operations Now Live",
    date: "03.18.2026",
    category: "Operations",
    image: "https://placehold.co/600x400/1a1a1a/444444/png?text=NEWS"
  },
  {
    id: 3,
    title: "Welcome to Cryo Archive",
    date: "03.19.2026",
    category: "Intel",
    image: "https://placehold.co/600x400/1a1a1a/444444/png?text=NEWS"
  }
];

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
          
          <button className="hidden md:block font-display text-primary uppercase tracking-widest text-sm hover:text-primary/80 transition-colors">
            {t.landing.all_entries}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`h-full group cursor-pointer hover:border-primary/50 transition-colors`}
            >
              <TacticalCard noPadding>
                <div className="relative h-48 w-full overflow-hidden border-b border-border/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm border border-border px-2 py-1">
                    <span className="font-display text-[10px] text-primary uppercase tracking-widest">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="font-display text-xs text-muted-foreground tracking-widest mb-2">
                    [ SYS.NET // {item.date} ]
                  </div>
                  <h3 className="font-display text-lg text-foreground uppercase tracking-wide group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
              </TacticalCard>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <button className="font-display text-primary uppercase tracking-widest text-sm hover:text-primary/80 transition-colors">
            {t.landing.all_entries}
          </button>
        </div>
      </div>
    </section>
  );
}
