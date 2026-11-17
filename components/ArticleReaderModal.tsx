'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Article, AdSlot, Language } from '@/lib/types';
import { CATEGORY_LABELS, UI_COPY } from '@/lib/seed-data';
import { ShareBar } from './ShareBar';
import { AdSlotCard } from './AdSlotCard';

interface ArticleReaderModalProps {
  article: Article | null;
  lang: Language;
  onLangChange: (lang: Language) => void;
  onClose: () => void;
  footerAd: AdSlot | undefined;
}

export function ArticleReaderModal({
  article,
  lang,
  onLangChange,
  onClose,
  footerAd,
}: ArticleReaderModalProps) {
  const t = UI_COPY[lang];

  useEffect(() => {
    if (!article) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [article, onClose]);

  if (!article) return null;

  const title = lang === 'mr' ? article.titleMr : article.titleEn;
  const summary = lang === 'mr' ? article.summaryMr : article.summaryEn;
  const content = lang === 'mr' ? article.contentMr : article.contentEn;
  const categoryLabel = CATEGORY_LABELS[article.category]?.[lang] ?? article.category;
  const paragraphs = content.split('\n\n').filter(Boolean);

  const formattedDate = new Date(article.createdAt).toLocaleDateString(
    lang === 'mr' ? 'mr-IN' : 'en-IN',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-[2px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="min-h-screen sm:py-10 sm:px-4 flex justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <article className="w-full max-w-3xl bg-[#FBF9F5] border border-stone-200 shadow-2xl">
          {/* Reader Top Utility */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-[#FBF9F5]/95 backdrop-blur border-b border-stone-200">
            <div className="flex items-center gap-2 text-xs text-stone-500 truncate">
              <span className="font-medium text-[#9A3412]">{categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center p-0.5 bg-stone-200/70 rounded">
                <button
                  type="button"
                  onClick={() => onLangChange('mr')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    lang === 'mr' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  मराठी
                </button>
                <button
                  type="button"
                  onClick={() => onLangChange('en')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    lang === 'en' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  English
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded transition-colors"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Article Content */}
          <div className="px-6 sm:px-12 py-8 sm:py-10">
            <header className="space-y-4 pb-6 border-b border-stone-200">
              <h1 className="font-editorial text-2xl sm:text-4xl font-semibold text-stone-900 leading-tight">
                {title}
              </h1>
              <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
                {summary}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-stone-500">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-800">{article.authorName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {article.readTimeMinutes} {t.minRead}
                  </span>
                </div>
                <ShareBar title={title} articleId={article.id} lang={lang} />
              </div>
            </header>

            {article.imageUrl && (
              <figure className="my-8">
                <div className="aspect-[16/9] w-full overflow-hidden bg-stone-200">
                  <img
                    src={article.imageUrl}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="mt-2 text-xs text-stone-500 italic">
                  Bulandsena.in Field Archive · {categoryLabel}
                </figcaption>
              </figure>
            )}

            <div className="max-w-2xl mx-auto space-y-5 text-[16px] sm:text-[17px] text-stone-800 leading-[1.85]">
              {paragraphs.map((para, idx) => (
                <p key={idx} className={idx === 0 && lang === 'en' ? 'drop-cap' : ''}>
                  {para}
                </p>
              ))}
            </div>

            {/* Bottom Share */}
            <div className="mt-10 pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <ShareBar title={title} articleId={article.id} lang={lang} />
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium text-stone-600 hover:text-stone-900 underline underline-offset-4"
              >
                {t.close}
              </button>
            </div>

            {/* Article Footer Monetization Ad Space */}
            <AdSlotCard slot={footerAd} lang={lang} variant="footer" />
          </div>
        </article>
      </div>
    </div>
  );
}
