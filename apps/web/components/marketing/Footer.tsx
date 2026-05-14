'use client';

import { memo } from 'react';
import Aurora from '@/components/marketing/Aurora';
import GradualBlur from '@/components/marketing/GradualBlur';
import TrueFocus from '@/components/ui/TrueFocus';

const COLUMNS = [
  { title: 'TRY VEL ON', links: ['Web', 'iOS', 'Android', 'VEL on X'] },
  { title: 'PRODUCT', links: ['Features', 'Models', 'Pricing', 'DeepSearch'] },
  { title: 'API', links: ['Overview', 'Voice API', 'Image API', 'Pricing', 'Console', 'Docs'] },
  { title: 'COMPANY', links: ['Company', 'Careers', 'Contact', 'News'] },
  { title: 'RESOURCES', links: ['Privacy', 'Privacy Portal', 'Security', 'Safety', 'Legal', 'Status'] },
];

function FooterInner() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 px-6 py-24">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-35">
        <Aurora
          colorStops={['#d7ddd6', '#0b0909', '#edecf1']}
          blend={0.49}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-black/10 to-black/45" />
      <div className="absolute inset-x-0 bottom-[-140px] h-[360px] footer-warm-glow" />
      <GradualBlur
        target="parent"
        position="top"
        height="7rem"
        strength={1.8}
        divCount={6}
        curve="bezier"
        exponential={true}
        opacity={0.95}
        animated="scroll"
        duration="0.5s"
        easing="ease-out"
        zIndex={3}
      />
      <div className="relative z-[2] mx-auto max-w-6xl">
        <div className="mb-12 border-b border-white/10 pb-8">
          <TrueFocus
            sentence="Build Fast Ship Smart Scale Confidently"
            manualMode={false}
            blurAmount={2}
            borderColor="rgba(255,255,255,0.85)"
            glowColor="rgba(255,255,255,0.35)"
            animationDuration={0.55}
            pauseBetweenAnimations={0.65}
          />
        </div>
      </div>
      <div className="relative z-[2] mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-5">
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="mb-4 text-xs tracking-[0.15em] text-white/50">{col.title}</div>
            <div className="space-y-3 text-[15px] text-white/88">
              {col.links.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}

export const Footer = memo(FooterInner);
