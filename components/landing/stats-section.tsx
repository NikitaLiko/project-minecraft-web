'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { useEffect, useState } from 'react';

export function StatsSection() {
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/minecraft/leaderboard?sort=kills&limit=4')
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(err => console.error("Failed to fetch leaderboard", err));
  }, []);

  return (
    <section className="relative py-24 px-4 md:px-8 bg-background overflow-hidden z-10">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-block px-3 py-1 border border-primary/30 bg-primary/10 mb-4">
              <span className="font-display text-primary text-xs uppercase tracking-widest">
                {t.admin.system_telemetry}
              </span>
            </div>
            
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground uppercase tracking-tighter font-bold leading-tight">
              {t.landing.stats_title_1} <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">
                {t.landing.stats_title_2}
              </span>
            </h2>
            
            <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
              {t.landing.stats_desc}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative h-[400px] border border-border/50 bg-black/50 p-1 flex flex-col"
          >
            {/* Terminal Top Bar */}
            <div className="border-b border-border/50 p-2 flex justify-between items-center bg-black/80">
              <span className="font-display text-[10px] text-primary uppercase tracking-[0.2em]">
                TERM-LINK // v2.4.1
              </span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary/50" />
                <div className="w-2 h-2 bg-primary/50" />
                <div className="w-2 h-2 bg-primary" />
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 font-display text-sm text-primary/80 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-scanline pointer-events-none" />
              
              <div className="space-y-2">
                <p>{'>'} {t.landing.terminal_seq_1}</p>
                <p>{'>'} {t.landing.terminal_seq_2}</p>
                <p className="text-foreground">{'>'} {t.landing.terminal_seq_3}</p>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <br />
                  <div className="border border-primary/20 p-3 bg-primary/5">
                    <div className="flex justify-between text-muted-foreground mb-2 text-xs">
                      <span>OPERATIVE</span>
                      <span>SCORE</span>
                    </div>
                    <div className="space-y-1">
                      {leaderboard.length > 0 ? leaderboard.map((player) => (
                        <div key={player.uuid} className={`flex justify-between ${player.rank === 1 ? 'text-primary' : ''}`}>
                          <span>{player.rank}. {player.username.toUpperCase()}</span>
                          <span>{player.kills.toLocaleString()}</span>
                        </div>
                      )) : (
                        <>
                          <div className="flex justify-between text-primary">
                            <span>1. GHOST_RECON</span>
                            <span>94,230</span>
                          </div>
                          <div className="flex justify-between">
                            <span>2. VOID_WALKER</span>
                            <span>88,105</span>
                          </div>
                          <div className="flex justify-between">
                            <span>3. SHADOW_ACTUAL</span>
                            <span>82,440</span>
                          </div>
                          <div className="flex justify-between">
                            <span>4. NOMAD_7</span>
                            <span>79,900</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
                <br />
                <p className="animate-pulse">{'>'} _</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
