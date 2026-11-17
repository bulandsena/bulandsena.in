'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Play, X, Menu, ArrowRight, Check, Plus } from 'lucide-react';
import {
  auth,
  db,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType,
} from '@/lib/firebase';
import {
  Article,
  LiveUpdate,
  VideoReport,
  AdSlot,
  Language,
  NewsCategory,
} from '@/lib/types';
import {
  CATEGORY_LABELS,
  UI_COPY,
  SEED_ARTICLES,
  SEED_LIVE_UPDATES,
  SEED_VIDEO_REPORTS,
  SEED_AD_SLOTS,
} from '@/lib/seed-data';
import { ShareBar } from '@/components/ShareBar';
import { AdSlotCard } from '@/components/AdSlotCard';
import { ArticleReaderModal } from '@/components/ArticleReaderModal';
import { CmsDashboard } from '@/components/CmsDashboard';
import { QuickColumnEditModal } from '@/components/QuickColumnEditModal';
import { StaticPagesModal, StaticPageId } from '@/components/StaticPagesModal';
import { ShareMarketDesk, MarketPick, SEED_MARKET_PICKS } from '@/components/ShareMarketDesk';

export default function BulandsenaHomePage() {
  const [lang, setLang] = useState<Language>('mr');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [showCms, setShowCms] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Live Firestore collections (merged with seed data)
  const [cmsArticles, setCmsArticles] = useState<Article[]>([]);
  const [cmsLiveUpdates, setCmsLiveUpdates] = useState<LiveUpdate[]>([]);
  const [cmsVideos, setCmsVideos] = useState<VideoReport[]>([]);
  const [cmsAds, setCmsAds] = useState<AdSlot[]>([]);
  const [cmsMarketPicks, setCmsMarketPicks] = useState<MarketPick[]>([]);

  // Active modals
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoReport | null>(null);
  const [quickEditState, setQuickEditState] = useState<{
    open: boolean;
    colNum: string;
    article: Article | null;
    initialMode?: 'news' | 'live' | 'video' | 'market';
  }>({ open: false, colNum: '01', article: null, initialMode: 'news' });
  const [activeStaticPage, setActiveStaticPage] = useState<StaticPageId | null>(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  const t = UI_COPY[lang];

  // Boot: test Firestore connection & subscribe to Auth + public collections
  useEffect(() => {
    testFirestoreConnection();

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const articlesQuery = query(
      collection(db, 'articles'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );
    const unsubArticles = onSnapshot(
      articlesQuery,
      (snap) => {
        const docs: Article[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            titleEn: data.titleEn || '',
            titleMr: data.titleMr || '',
            summaryEn: data.summaryEn || '',
            summaryMr: data.summaryMr || '',
            contentEn: data.contentEn || '',
            contentMr: data.contentMr || '',
            category: (data.category as NewsCategory) || 'civic',
            authorName: data.authorName || 'Editorial Desk',
            authorId: data.authorId || '',
            imageUrl: data.imageUrl || '/images/hero_civic_assembly.jpg',
            isFeatured: Boolean(data.isFeatured),
            isTrending: Boolean(data.isTrending),
            readTimeMinutes: Number(data.readTimeMinutes) || 3,
            status: 'published',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            isFromCms: true,
          };
        });
        setCmsArticles(docs);
      },
      (err) => {
        console.warn('Articles listener warning:', err.message);
      }
    );

    const liveQuery = query(collection(db, 'liveUpdates'), orderBy('createdAt', 'desc'));
    const unsubLive = onSnapshot(
      liveQuery,
      (snap) => {
        const docs: LiveUpdate[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            textEn: data.textEn || '',
            textMr: data.textMr || '',
            locationEn: data.locationEn || '',
            locationMr: data.locationMr || '',
            category: (data.category as NewsCategory) || 'civic',
            authorId: data.authorId || '',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            isFromCms: true,
          };
        });
        setCmsLiveUpdates(docs);
      },
      (err) => {
        console.warn('Live updates listener warning:', err.message);
      }
    );

    const videoQuery = query(collection(db, 'videoReports'), orderBy('createdAt', 'desc'));
    const unsubVideos = onSnapshot(
      videoQuery,
      (snap) => {
        const docs: VideoReport[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            titleEn: data.titleEn || '',
            titleMr: data.titleMr || '',
            summaryEn: data.summaryEn || '',
            summaryMr: data.summaryMr || '',
            duration: data.duration || '04:00',
            thumbnailUrl: data.thumbnailUrl || '/images/video_field_report.jpg',
            videoUrl: data.videoUrl || '',
            category: (data.category as NewsCategory) || 'civic',
            reporterEn: data.reporterEn || '',
            reporterMr: data.reporterMr || '',
            authorId: data.authorId || '',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            isFromCms: true,
          };
        });
        setCmsVideos(docs);
      },
      (err) => {
        console.warn('Video reports listener warning:', err.message);
      }
    );

    const unsubAds = onSnapshot(
      collection(db, 'adSlots'),
      (snap) => {
        const docs: AdSlot[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            placement: data.placement || 'sidebar_top',
            sponsorName: data.sponsorName || '',
            headlineEn: data.headlineEn || '',
            headlineMr: data.headlineMr || '',
            ctaUrl: data.ctaUrl || 'https://bulandsena.in',
            isActive: Boolean(data.isActive),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          };
        });
        setCmsAds(docs);
      },
      (err) => {
        console.warn('Ad slots listener warning:', err.message);
      }
    );

    const marketQuery = query(collection(db, 'marketPicks'), orderBy('createdAt', 'desc'));
    const unsubMarket = onSnapshot(
      marketQuery,
      (snap) => {
        const docs: MarketPick[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            symbol: data.symbol || '',
            segment: data.segment || 'equity',
            action: data.action || 'BUY',
            strikePrice: data.strikePrice || '',
            entryPrice: data.entryPrice || '',
            targetPrice: data.targetPrice || '',
            stopLoss: data.stopLoss || '',
            noteMr: data.noteMr || '',
            noteEn: data.noteEn || '',
            authorId: data.authorId || '',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            isFromCms: true,
          };
        });
        setCmsMarketPicks(docs);
      },
      (err) => {
        console.warn('Market picks listener warning:', err.message);
      }
    );

    return () => {
      unsubAuth();
      unsubArticles();
      unsubLive();
      unsubVideos();
      unsubAds();
      unsubMarket();
    };
  }, []);

  const allArticles = useMemo(() => [...cmsArticles, ...SEED_ARTICLES], [cmsArticles]);
  const allLiveUpdates = useMemo(() => [...cmsLiveUpdates, ...SEED_LIVE_UPDATES], [cmsLiveUpdates]);
  const allVideos = useMemo(() => [...cmsVideos, ...SEED_VIDEO_REPORTS], [cmsVideos]);
  const allMarketPicks = useMemo(() => [...cmsMarketPicks, ...SEED_MARKET_PICKS], [cmsMarketPicks]);
  const allAds = useMemo(() => {
    const map = new Map<string, AdSlot>();
    SEED_AD_SLOTS.forEach((a) => map.set(a.placement, a));
    cmsAds.forEach((a) => map.set(a.placement, a));
    return Array.from(map.values());
  }, [cmsAds]);

  const sidebarAd = allAds.find((a) => a.placement === 'sidebar_top');
  const footerAd = allAds.find((a) => a.placement === 'article_footer');

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'all') return allArticles;
    return allArticles.filter((a) => a.category === selectedCategory);
  }, [allArticles, selectedCategory]);

  const leadArticle = useMemo(() => {
    return filteredArticles.find((a) => a.isFeatured) || filteredArticles[0] || null;
  }, [filteredArticles]);

  const secondaryArticles = useMemo(() => {
    if (!leadArticle) return [];
    return filteredArticles.filter((a) => a.id !== leadArticle.id);
  }, [filteredArticles, leadArticle]);

  const trendingArticles = useMemo(() => {
    return allArticles.filter((a) => a.isTrending).slice(0, 4);
  }, [allArticles]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newsletterEmail.trim().toLowerCase();
    if (!cleaned || !cleaned.includes('@')) return;
    setNewsletterSubmitting(true);
    setNewsletterError(null);
    try {
      await addDoc(collection(db, 'subscribers'), {
        email: cleaned.slice(0, 160),
        language: lang,
        createdAt: serverTimestamp(),
      });
      setNewsletterSuccess(true);
      setNewsletterEmail('');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'subscribers');
      } catch {
        setNewsletterError(
          lang === 'mr'
            ? 'नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
            : 'Unable to complete subscription right now. Please try again.'
        );
      }
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    setShowCms(false);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const todayFormatted = new Date().toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark in Dark Red */}
          <button
            type="button"
            onClick={() => {
              setShowCms(false);
              setSelectedCategory('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#8B0000] whitespace-nowrap shrink-0 cursor-pointer"
          >
            दैनिक बुलंदसेना वृत्तपत्रिका
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600"
          >
            <button
              type="button"
              onClick={() => scrollToSection('front-page')}
              className={`hover:text-stone-900 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 ${
                !showCms ? 'text-stone-900' : ''
              }`}
            >
              {t.navHome}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('live-desk')}
              className="hover:text-stone-900 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              {t.navLive}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('video-reports')}
              className="hover:text-stone-900 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              {t.navVideos}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('trending-desk')}
              className="hover:text-stone-900 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              {t.navTrending}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCms(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-[#9A3412] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 ${
                showCms ? 'text-[#9A3412] font-semibold' : ''
              }`}
            >
              {t.navCms}
            </button>
          </nav>

          {/* Zone 3: 1 primary action + mobile menu button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection('newsletter-box')}
              className="px-4 py-2 text-xs font-medium text-white bg-[#8B0000] hover:bg-[#6B0000] transition-colors whitespace-nowrap shrink-0"
            >
              {t.subscribeCta}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 text-stone-700 hover:text-stone-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-[#FBF9F5] px-4 py-4 space-y-2">
            {[
              { label: t.navHome, action: () => scrollToSection('front-page') },
              { label: t.navLive, action: () => scrollToSection('live-desk') },
              { label: t.navVideos, action: () => scrollToSection('video-reports') },
              { label: t.navTrending, action: () => scrollToSection('trending-desk') },
              {
                label: t.navCms,
                action: () => {
                  setShowCms(true);
                  setMobileMenuOpen(false);
                },
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="block w-full text-left py-2.5 px-2 text-sm font-medium text-stone-800 hover:bg-stone-200/50"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content or Editorial CMS */}
      <main className="flex-1">
        {showCms ? (
          <CmsDashboard
            user={user}
            lang={lang}
            articles={allArticles}
            liveUpdates={allLiveUpdates}
            videoReports={allVideos}
            adSlots={allAds}
            onClose={() => setShowCms(false)}
          />
        ) : (
          <div id="front-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Editorial Utility Ribbon: Date, Edition, Language Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-300 text-xs text-stone-600">
              <div className="flex flex-wrap items-center gap-2">
                <span suppressHydrationWarning className="font-medium text-stone-900">
                  {todayFormatted}
                </span>
                <span aria-hidden="true">·</span>
                <span>{t.editionLine}</span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-stone-500">{lang === 'mr' ? 'भाषा:' : 'Language:'}</span>
                <div className="inline-flex items-center p-0.5 bg-stone-200/80 rounded">
                  <button
                    type="button"
                    onClick={() => setLang('mr')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      lang === 'mr'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    मराठी
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      lang === 'en'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto py-3.5 border-b border-stone-200 no-scrollbar">
              {(['all', 'civic', 'agriculture', 'transit', 'education', 'politics'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                  >
                    {CATEGORY_LABELS[cat][lang]}
                  </button>
                )
              )}
            </div>

            {/* Live Local Dispatches Strip */}
            <section id="live-desk" className="py-5 border-b border-stone-200">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h2 className="text-xs font-semibold tracking-wider uppercase text-[#9A3412]">
                  {t.liveBadge} · {t.liveHeading}
                </h2>
                <span className="font-mono text-[11px] text-stone-500 tabular-nums">
                  {allLiveUpdates.length} {lang === 'mr' ? 'अपडेट्स' : 'dispatches'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {allLiveUpdates.slice(0, 3).map((item) => {
                  const timeStr = new Date(item.createdAt).toLocaleTimeString(
                    lang === 'mr' ? 'mr-IN' : 'en-IN',
                    { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }
                  );
                  return (
                    <div
                      key={item.id}
                      className="pt-3 border-t border-stone-200/90 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span
                          suppressHydrationWarning
                          className="font-mono tabular-nums text-[#9A3412] font-medium"
                        >
                          {timeStr}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">
                          {lang === 'mr' ? item.locationMr : item.locationEn}
                        </span>
                      </div>
                      <p className="text-sm text-stone-800 leading-snug">
                        {lang === 'mr' ? item.textMr : item.textEn}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Editorial Multi-Column Broadsheet Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8">
              {/* Main Multi-Column Editorial Canvas (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                {/* TIER 1: Lead Story (Column 01) */}
                {leadArticle ? (
                  <article
                    onClick={() => setActiveArticle(leadArticle)}
                    className="relative group cursor-pointer space-y-4 pb-8 border-b-2 border-stone-300"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-stone-200">
                      <img
                        src={leadArticle.imageUrl}
                        alt={lang === 'mr' ? leadArticle.titleMr : leadArticle.titleEn}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-300"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-[#8B0000]">
                        {CATEGORY_LABELS[leadArticle.category]?.[lang]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{leadArticle.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {leadArticle.readTimeMinutes} {t.minRead}
                      </span>
                    </div>
                    <h1 className="font-editorial text-2xl sm:text-4xl font-semibold text-stone-900 leading-tight group-hover:text-[#8B0000] transition-colors">
                      {lang === 'mr' ? leadArticle.titleMr : leadArticle.titleEn}
                    </h1>
                    <p className="text-base text-stone-600 leading-relaxed max-w-2xl">
                      {lang === 'mr' ? leadArticle.summaryMr : leadArticle.summaryEn}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 pr-8">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-900 group-hover:text-[#8B0000] transition-colors">
                        <span>{t.readFull}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <ShareBar
                        title={lang === 'mr' ? leadArticle.titleMr : leadArticle.titleEn}
                        articleId={leadArticle.id}
                        lang={lang}
                        compact
                      />
                    </div>
                    {/* Discreet light-transparent column number (Editor Quick-Edit trigger) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickEditState({ open: true, colNum: '01', article: leadArticle });
                      }}
                      title="01"
                      aria-label="Column 01"
                      className="absolute bottom-2 right-1 font-mono text-[11px] tabular-nums text-stone-400/40 hover:text-[#8B0000]/80 transition-colors px-1.5 py-0.5 select-none cursor-pointer"
                    >
                      01
                    </button>
                  </article>
                ) : (
                  <div className="py-16 text-center text-sm text-stone-500 border border-stone-200">
                    {t.noArticles}
                  </div>
                )}

                {/* TIER 2: Multi-Column Newspaper Grid (Columns 02, 03, 04...) */}
                {secondaryArticles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:divide-x md:divide-stone-200">
                    {secondaryArticles.map((art, idx) => {
                      const colCode = String(idx + 2).padStart(2, '0');
                      return (
                        <article
                          key={art.id}
                          onClick={() => setActiveArticle(art)}
                          className={`relative group cursor-pointer flex flex-col justify-between space-y-3 pb-7 border-b border-stone-200 ${
                            idx % 3 !== 0 ? 'md:pl-6' : ''
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="aspect-[4/3] w-full overflow-hidden bg-stone-200">
                              <img
                                src={art.imageUrl}
                                alt={lang === 'mr' ? art.titleMr : art.titleEn}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                              />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                              <span className="font-medium text-[#8B0000]">
                                {CATEGORY_LABELS[art.category]?.[lang]}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                {art.readTimeMinutes} {t.minRead}
                              </span>
                            </div>
                            <h2 className="font-editorial text-lg font-semibold text-stone-900 leading-snug group-hover:text-[#8B0000] transition-colors">
                              {lang === 'mr' ? art.titleMr : art.titleEn}
                            </h2>
                            <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                              {lang === 'mr' ? art.summaryMr : art.summaryEn}
                            </p>
                          </div>
                          <div className="pt-2 pr-7 flex items-center justify-between gap-2 text-[11px] text-stone-500">
                            <span className="truncate">{art.authorName}</span>
                          </div>
                          {/* Discreet light-transparent column number (Editor Quick-Edit trigger) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickEditState({ open: true, colNum: colCode, article: art });
                            }}
                            title={colCode}
                            aria-label={`Column ${colCode}`}
                            className="absolute bottom-1.5 right-0 font-mono text-[11px] tabular-nums text-stone-400/40 hover:text-[#8B0000]/80 transition-colors px-1.5 py-0.5 select-none cursor-pointer"
                          >
                            {colCode}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Sidebar: Trending, Ad Space, Newsletter */}
              <aside className="lg:col-span-4 space-y-8 lg:border-l lg:border-stone-200 lg:pl-8">
                {/* Trending Now */}
                <section id="trending-desk" className="space-y-4">
                  <h2 className="font-editorial text-xl font-semibold text-stone-900 pb-2 border-b border-stone-900">
                    {t.trendingHeading}
                  </h2>
                  <ol className="divide-y divide-stone-200">
                    {trendingArticles.map((art, index) => (
                      <li key={art.id} className="py-3.5">
                        <button
                          type="button"
                          onClick={() => setActiveArticle(art)}
                          className="group text-left w-full flex items-start gap-3"
                        >
                          <span className="font-editorial text-2xl font-semibold text-stone-300 group-hover:text-[#9A3412] tabular-nums leading-none pt-0.5 transition-colors">
                            0{index + 1}
                          </span>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-stone-900 leading-snug group-hover:text-[#9A3412] transition-colors">
                              {lang === 'mr' ? art.titleMr : art.titleEn}
                            </p>
                            <p className="text-xs text-stone-500">
                              {CATEGORY_LABELS[art.category]?.[lang]} · {art.readTimeMinutes}{' '}
                              {t.minRead}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Third-Party Sidebar Ad Space */}
                <AdSlotCard slot={sidebarAd} lang={lang} variant="sidebar" />

                {/* Newsletter Subscription */}
                <section
                  id="newsletter-box"
                  className="bg-stone-900 text-[#FBF9F5] p-6 space-y-4"
                >
                  <h2 className="font-editorial text-xl font-semibold leading-snug">
                    {t.newsletterTitle}
                  </h2>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {t.newsletterDesc}
                  </p>
                  {newsletterSuccess ? (
                    <div className="flex items-start gap-2 p-3 bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 text-xs leading-relaxed">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{t.newsletterSuccess}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
                      <input
                        type="email"
                        required
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder={t.newsletterPlaceholder}
                        className="w-full px-3.5 py-2.5 text-xs bg-stone-800 border border-stone-700 text-white placeholder:text-stone-400 focus:outline-none focus:border-[#FBF9F5]"
                      />
                      <button
                        type="submit"
                        disabled={newsletterSubmitting}
                        className="w-full py-2.5 px-4 text-xs font-medium bg-[#9A3412] hover:bg-[#B45309] text-white transition-colors disabled:opacity-50"
                      >
                        {newsletterSubmitting ? '...' : t.newsletterButton}
                      </button>
                      {newsletterError && (
                        <p className="text-xs text-red-300">{newsletterError}</p>
                      )}
                    </form>
                  )}
                </section>
              </aside>
            </div>

            {/* TIER 3: Field Video Reports */}
            <section
              id="video-reports"
              className="py-10 border-t border-stone-300 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900">
                    {t.videosHeading}
                  </h2>
                  <p className="text-sm text-stone-600 mt-1">{t.videosSubheading}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {allVideos.map((vid) => (
                  <article
                    key={vid.id}
                    onClick={() => setActiveVideo(vid)}
                    className="group cursor-pointer space-y-3"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-900">
                      <img
                        src={vid.thumbnailUrl}
                        alt={lang === 'mr' ? vid.titleMr : vid.titleEn}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end justify-between p-4">
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-white">
                          <span className="w-9 h-9 rounded-full bg-[#9A3412] flex items-center justify-center group-hover:bg-[#7C2D12] transition-colors">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </span>
                          <span>{t.watchReport}</span>
                        </span>
                        <span className="font-mono text-xs text-white/90 tabular-nums bg-black/60 px-2 py-0.5">
                          {vid.duration}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span className="font-medium text-[#9A3412]">
                          {CATEGORY_LABELS[vid.category]?.[lang]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{lang === 'mr' ? vid.reporterMr : vid.reporterEn}</span>
                      </div>
                      <h3 className="font-editorial text-xl font-semibold text-stone-900 leading-snug group-hover:text-[#9A3412] transition-colors">
                        {lang === 'mr' ? vid.titleMr : vid.titleEn}
                      </h3>
                      <p className="text-sm text-stone-600 leading-relaxed">
                        {lang === 'mr' ? vid.summaryMr : vid.summaryEn}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Daily Share Market & Option Trading Desk */}
            <ShareMarketDesk
              picks={allMarketPicks}
              lang={lang}
              onQuickAddMarket={() =>
                setQuickEditState({
                  open: true,
                  colNum: 'MKT',
                  article: null,
                  initialMode: 'market',
                })
              }
            />

            {/* Bottom Article/Page Footer Monetization Ad Space */}
            <AdSlotCard slot={footerAd} lang={lang} variant="footer" />
          </div>
        )}
      </main>

      {/* Editorial Footer with Legal & Institutional Pages */}
      <footer className="mt-16 border-t-2 border-stone-300 bg-[#F3EFE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-stone-300/80">
            <div className="space-y-2 max-w-md">
              <p className="font-editorial text-2xl font-bold text-[#8B0000]">
                दैनिक बुलंदसेना वृत्तपत्रिका
              </p>
              <p className="text-xs text-stone-600 leading-relaxed">{t.footerAbout}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-stone-700">
              <button
                type="button"
                onClick={() => setActiveStaticPage('about')}
                className="hover:text-[#8B0000] underline-offset-4 hover:underline"
              >
                {lang === 'mr' ? 'आमच्याबद्दल (About)' : 'About Us'}
              </button>
              <button
                type="button"
                onClick={() => setActiveStaticPage('contact')}
                className="hover:text-[#8B0000] underline-offset-4 hover:underline"
              >
                {lang === 'mr' ? 'संपर्क (Contact)' : 'Contact Us'}
              </button>
              <button
                type="button"
                onClick={() => setActiveStaticPage('privacy')}
                className="hover:text-[#8B0000] underline-offset-4 hover:underline"
              >
                {lang === 'mr' ? 'गोपनीयता धोरण (Privacy)' : 'Privacy Policy'}
              </button>
              <button
                type="button"
                onClick={() => setActiveStaticPage('terms')}
                className="hover:text-[#8B0000] underline-offset-4 hover:underline"
              >
                {lang === 'mr' ? 'अटी व शर्ती (Terms)' : 'Terms & Conditions'}
              </button>
              <button
                type="button"
                onClick={() => setActiveStaticPage('editorial')}
                className="hover:text-[#8B0000] underline-offset-4 hover:underline"
              >
                {lang === 'mr' ? 'संपादकीय धोरण व जाहिरात' : 'Editorial Policy & Advertise'}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-500">
            <span suppressHydrationWarning>
              © {new Date().getFullYear()} दैनिक बुलंदसेना वृत्तपत्रिका (bulandsena.in) · {t.footerRights}
            </span>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
                className="hover:text-stone-900 underline-offset-4 hover:underline"
              >
                {lang === 'mr' ? 'Switch to English' : 'मराठी आवृत्ती'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCms(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-stone-400/60 hover:text-[#8B0000] transition-colors"
              >
                {t.navCms}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Article Reader Modal */}
      <ArticleReaderModal
        article={activeArticle}
        lang={lang}
        onLangChange={setLang}
        onClose={() => setActiveArticle(null)}
        footerAd={footerAd}
      />

      {/* Small Round Green Floating Upload / Add News Button */}
      <button
        type="button"
        onClick={() =>
          setQuickEditState({
            open: true,
            colNum: 'NEW',
            article: null,
            initialMode: 'news',
          })
        }
        title={lang === 'mr' ? 'नवीन बातमी / फोटो / शेअर बाजार अपलोड करा' : 'Add News / Upload Page'}
        aria-label={lang === 'mr' ? 'नवीन बातमी जोडा' : 'Add New News'}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Quick Column Edit Modal (triggered by light-transparent column numbers or round green button) */}
      <QuickColumnEditModal
        isOpen={quickEditState.open}
        columnNumber={quickEditState.colNum}
        targetArticle={quickEditState.article}
        initialMode={quickEditState.initialMode}
        user={user}
        lang={lang}
        onClose={() => setQuickEditState((prev) => ({ ...prev, open: false }))}
      />

      {/* Institutional & Legal Pages Modal */}
      <StaticPagesModal
        pageId={activeStaticPage}
        lang={lang}
        onClose={() => setActiveStaticPage(null)}
      />

      {/* Video Player Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-3xl bg-stone-950 border border-stone-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-stone-800">
              <p className="font-editorial text-base font-medium text-white truncate">
                {lang === 'mr' ? activeVideo.titleMr : activeVideo.titleEn}
              </p>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="p-1.5 text-stone-400 hover:text-white"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-[16/9] w-full bg-black">
              <iframe
                src={activeVideo.videoUrl}
                title={lang === 'mr' ? activeVideo.titleMr : activeVideo.titleEn}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-5 text-xs text-stone-300 flex items-center justify-between gap-4">
              <span>{lang === 'mr' ? activeVideo.reporterMr : activeVideo.reporterEn}</span>
              <span className="font-mono tabular-nums text-stone-400">{activeVideo.duration}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
