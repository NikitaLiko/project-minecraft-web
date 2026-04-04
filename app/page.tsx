import { HeroSection } from '@/components/landing/hero-section';
import { NewsSection } from '@/components/landing/news-section';
import { StatsSection } from '@/components/landing/stats-section';
import { Header } from '@/components/landing/header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project: Minecraft | Massive Session Combat',
  description: 'A massive session combat experience in the world of Project: Minecraft.',
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Header />
      <HeroSection />
      <StatsSection />
      <NewsSection />
    </main>
  );
}
