'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { AdSlot, Language } from '@/lib/types';
import { UI_COPY } from '@/lib/seed-data';

interface AdSlotCardProps {
  slot: AdSlot | undefined;
  lang: Language;
  variant: 'sidebar' | 'footer';
}

export function AdSlotCard({ slot, lang, variant }: AdSlotCardProps) {
  const t = UI_COPY[lang];
  if (!slot || !slot.isActive) return null;

  const headline = lang === 'mr' ? slot.headlineMr : slot.headlineEn;

  if (variant === 'footer') {
    return (
      <aside
        aria-label={t.advertisement}
        className="mt-10 pt-6 border-t border-stone-200 bg-[#F3EFE8] p-6 rounded-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>{t.advertisement}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-stone-700">{slot.sponsorName}</span>
            </div>
            <p className="font-editorial text-lg font-medium text-stone-900 leading-snug">
              {headline}
            </p>
          </div>
          <a
            href={slot.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-stone-900 bg-white border border-stone-300 hover:border-stone-900 transition-colors whitespace-nowrap shrink-0"
          >
            <span>{lang === 'mr' ? 'अधिक माहिती' : 'Learn More'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label={t.advertisement}
      className="bg-[#F3EFE8] border border-stone-200 p-5 space-y-3"
    >
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>{t.advertisement}</span>
        <span className="font-mono text-[11px]">300×250</span>
      </div>
      <div className="pt-2 border-t border-stone-200/80 space-y-2">
        <p className="text-xs font-semibold text-[#9A3412]">{slot.sponsorName}</p>
        <p className="font-editorial text-base font-medium text-stone-900 leading-snug">
          {headline}
        </p>
        <a
          href={slot.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 pt-2 text-xs font-medium text-stone-900 hover:text-[#9A3412] underline underline-offset-4 transition-colors"
        >
          <span>{lang === 'mr' ? 'तपशील पहा' : 'Visit Sponsor'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
}
