'use client';

import { Nav } from '@/components/marketing/Nav';
import { Hero } from '@/components/marketing/Hero';
import { CapabilityShowcase } from '@/components/marketing/capability-showcase';
import { FeatureGrid } from '@/components/marketing/FeatureGrid';
import { TerminalShowcase } from '@/components/marketing/TerminalShowcase';
import { ModelGrid } from '@/components/marketing/ModelGrid';
import { PricingCards } from '@/components/marketing/PricingCards';
import { FinalCta } from '@/components/marketing/FinalCta';
import { Footer } from '@/components/marketing/Footer';
import SplashCursor from '@/components/ui/SplashCursor';

export default function LandingPage() {
  return (
    <div className="min-h-screen grok-page-bg text-white overflow-hidden">
      <SplashCursor RAINBOW_MODE={false} COLOR="#FFFFFF" />
      <Nav />
      <Hero />
      <CapabilityShowcase />
      <FeatureGrid />
      <TerminalShowcase />
      <ModelGrid />
      <PricingCards />
      <FinalCta />
      <Footer />
    </div>
  );
}
