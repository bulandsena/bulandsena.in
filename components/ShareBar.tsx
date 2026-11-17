'use client';

import React, { useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { Language } from '@/lib/types';
import { UI_COPY } from '@/lib/seed-data';

interface ShareBarProps {
  title: string;
  articleId: string;
  lang: Language;
  compact?: boolean;
}

export function ShareBar({ title, articleId, lang, compact = false }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const t = UI_COPY[lang];

  const getShareUrl = () => {
    if (typeof window === 'undefined') return `https://bulandsena.in/?article=${articleId}`;
    const url = new URL(window.location.href);
    url.searchParams.set('article', articleId);
    return url.toString();
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const shareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = encodeURIComponent(`${title} — ${getShareUrl()}`);
    window.location.href = `https://wa.me/?text=${url}`;
  };

  const shareX = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = encodeURIComponent(title);
    const url = encodeURIComponent(getShareUrl());
    window.location.href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  };

  const shareFacebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = encodeURIComponent(getShareUrl());
    window.location.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  };

  return (
    <div className="flex items-center gap-3 text-xs text-stone-600">
      {!compact && (
        <span className="inline-flex items-center gap-1.5 font-medium text-stone-500 whitespace-nowrap shrink-0">
          <Share2 className="w-3.5 h-3.5" />
          {t.shareLabel}
        </span>
      )}
      <button
        type="button"
        onClick={shareWhatsApp}
        className="hover:text-[#9A3412] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 py-1"
        aria-label="Share on WhatsApp"
      >
        WhatsApp
      </button>
      <span aria-hidden="true" className="text-stone-300">/</span>
      <button
        type="button"
        onClick={shareX}
        className="hover:text-[#9A3412] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 py-1"
        aria-label="Share on X"
      >
        X
      </button>
      <span aria-hidden="true" className="text-stone-300">/</span>
      <button
        type="button"
        onClick={shareFacebook}
        className="hover:text-[#9A3412] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 py-1"
        aria-label="Share on Facebook"
      >
        Facebook
      </button>
      <span aria-hidden="true" className="text-stone-300">/</span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0 py-1"
        aria-label="Copy link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-emerald-700 font-medium">{t.copied}</span>
          </>
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5" />
            <span>{lang === 'mr' ? 'लिंक' : 'Copy'}</span>
          </>
        )}
      </button>
    </div>
  );
}
