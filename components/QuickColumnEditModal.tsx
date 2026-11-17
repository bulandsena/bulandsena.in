'use client';

import React, { useState, useEffect } from 'react';
import {
  addDoc,
  updateDoc,
  doc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { signInWithPopup, User } from 'firebase/auth';
import { X, ShieldCheck, Check, Newspaper, Radio, Video, TrendingUp, Save } from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  ADMIN_EMAIL,
  handleFirestoreError,
  OperationType,
} from '@/lib/firebase';
import { Article, Language, NewsCategory } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/seed-data';

interface QuickColumnEditModalProps {
  isOpen: boolean;
  columnNumber: string;
  targetArticle: Article | null;
  initialMode?: 'news' | 'live' | 'video' | 'market';
  user: User | null;
  lang: Language;
  onClose: () => void;
}

const PRESET_IMAGES = [
  { label: 'Civic & Assembly', url: '/images/hero_civic_assembly.jpg' },
  { label: 'Agriculture Mandi', url: '/images/news_agriculture_market.jpg' },
  { label: 'Metro & Transit', url: '/images/news_metro_transit.jpg' },
  { label: 'Field Video Desk', url: '/images/video_field_report.jpg' },
  { label: 'Education Campus', url: '/images/news_education_campus.jpg' },
];

export function QuickColumnEditModal({
  isOpen,
  columnNumber,
  targetArticle,
  initialMode = 'news',
  user,
  lang,
  onClose,
}: QuickColumnEditModalProps) {
  const [mode, setMode] = useState<'news' | 'live' | 'video' | 'market'>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // News fields
  const [titleMr, setTitleMr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [summaryMr, setSummaryMr] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [contentMr, setContentMr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [category, setCategory] = useState<NewsCategory>('civic');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [isFeatured, setIsFeatured] = useState(false);

  // Live update fields
  const [liveMr, setLiveMr] = useState('');
  const [liveEn, setLiveEn] = useState('');
  const [liveLocMr, setLiveLocMr] = useState('जिल्हा कक्ष');
  const [liveLocEn, setLiveLocEn] = useState('District Desk');

  // Video fields
  const [vidTitleMr, setVidTitleMr] = useState('');
  const [vidTitleEn, setVidTitleEn] = useState('');
  const [vidSummaryMr, setVidSummaryMr] = useState('');
  const [vidSummaryEn, setVidSummaryEn] = useState('');
  const [vidUrl, setVidUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [vidThumb, setVidThumb] = useState('/images/video_field_report.jpg');
  const [vidDuration, setVidDuration] = useState('04:15');

  // Share Market / F&O fields
  const [mktSymbol, setMktSymbol] = useState('');
  const [mktSegment, setMktSegment] = useState<'equity' | 'options' | 'futures'>('options');
  const [mktAction, setMktAction] = useState<'BUY' | 'SELL'>('BUY');
  const [mktStrike, setMktStrike] = useState('');
  const [mktEntry, setMktEntry] = useState('');
  const [mktTarget, setMktTarget] = useState('');
  const [mktStopLoss, setMktStopLoss] = useState('');
  const [mktNoteMr, setMktNoteMr] = useState('');
  const [mktNoteEn, setMktNoteEn] = useState('');

  const isAdmin =
    Boolean(user?.emailVerified) &&
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!isOpen) return;
    setNotice(null);
    setError(null);
    if (targetArticle) {
      setTitleMr(targetArticle.titleMr);
      setTitleEn(targetArticle.titleEn);
      setSummaryMr(targetArticle.summaryMr);
      setSummaryEn(targetArticle.summaryEn);
      setContentMr(targetArticle.contentMr);
      setContentEn(targetArticle.contentEn);
      setCategory(targetArticle.category);
      setImageUrl(targetArticle.imageUrl || PRESET_IMAGES[0].url);
      setIsFeatured(targetArticle.isFeatured || columnNumber === '01');
    } else {
      setTitleMr('');
      setTitleEn('');
      setSummaryMr('');
      setSummaryEn('');
      setContentMr('');
      setContentEn('');
      setCategory('civic');
      setImageUrl(PRESET_IMAGES[0].url);
      setIsFeatured(columnNumber === '01');
    }
  }, [isOpen, targetArticle, columnNumber]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSubmitting(true);
    setError(null);
    try {
      const safeTitleMr = titleMr.trim().slice(0, 240);
      const safeTitleEn = (titleEn.trim() || safeTitleMr).slice(0, 200);
      const safeSummaryMr = summaryMr.trim().slice(0, 600);
      const safeSummaryEn = (summaryEn.trim() || safeSummaryMr).slice(0, 500);
      const safeContentMr = contentMr.trim().slice(0, 18000);
      const safeContentEn = (contentEn.trim() || safeContentMr).slice(0, 15000);

      if (targetArticle && targetArticle.isFromCms) {
        await updateDoc(doc(db, 'articles', targetArticle.id), {
          titleMr: safeTitleMr,
          titleEn: safeTitleEn,
          summaryMr: safeSummaryMr,
          summaryEn: safeSummaryEn,
          contentMr: safeContentMr,
          contentEn: safeContentEn,
          category,
          authorName: targetArticle.authorName,
          authorId: targetArticle.authorId,
          imageUrl: imageUrl.trim().slice(0, 500),
          isFeatured,
          isTrending: targetArticle.isTrending,
          readTimeMinutes: Math.max(1, Math.min(30, Math.ceil(safeContentMr.split(/\s+/).length / 150) + 1)),
          status: 'published',
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'articles'), {
          titleMr: safeTitleMr,
          titleEn: safeTitleEn,
          summaryMr: safeSummaryMr,
          summaryEn: safeSummaryEn,
          contentMr: safeContentMr,
          contentEn: safeContentEn,
          category,
          authorName: 'दैनिक बुलंदसेना संपादकीय कक्ष',
          authorId: user.uid,
          imageUrl: imageUrl.trim().slice(0, 500),
          isFeatured,
          isTrending: true,
          readTimeMinutes: Math.max(1, Math.min(30, Math.ceil(safeContentMr.split(/\s+/).length / 150) + 1)),
          status: 'published',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setNotice(
        lang === 'mr'
          ? 'बातमी त्वरित अद्यतनित झाली आणि वृत्तपत्रावर प्रकाशित झाली.'
          : 'Column updated and published live immediately.'
      );
      setTimeout(() => onClose(), 900);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'articles');
      } catch (wrapped) {
        setError(wrapped instanceof Error ? wrapped.message : 'Save failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, 'liveUpdates'), {
        textMr: liveMr.trim().slice(0, 360),
        textEn: (liveEn.trim() || liveMr.trim()).slice(0, 300),
        locationMr: liveLocMr.trim().slice(0, 100),
        locationEn: liveLocEn.trim().slice(0, 80),
        category,
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      setLiveMr('');
      setLiveEn('');
      setNotice(lang === 'mr' ? 'थेट बातमी त्वरित प्रसारित झाली.' : 'Live dispatch pushed.');
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push live update.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, 'videoReports'), {
        titleMr: vidTitleMr.trim().slice(0, 220),
        titleEn: (vidTitleEn.trim() || vidTitleMr.trim()).slice(0, 180),
        summaryMr: vidSummaryMr.trim().slice(0, 480),
        summaryEn: (vidSummaryEn.trim() || vidSummaryMr.trim()).slice(0, 400),
        duration: vidDuration.trim().slice(0, 20),
        thumbnailUrl: vidThumb.trim().slice(0, 500),
        videoUrl: vidUrl.trim().slice(0, 500),
        category,
        reporterMr: 'बुलंदसेना प्रतिनिधी',
        reporterEn: 'Bulandsena Correspondent',
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNotice(lang === 'mr' ? 'व्हिडिओ रिपोर्ट त्वरित जोडला गेला.' : 'Video report published.');
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish video.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, 'marketPicks'), {
        symbol: mktSymbol.trim().toUpperCase().slice(0, 80),
        segment: mktSegment,
        action: mktAction,
        strikePrice: (mktStrike.trim() || 'Cash / Delivery').slice(0, 60),
        entryPrice: mktEntry.trim().slice(0, 40),
        targetPrice: mktTarget.trim().slice(0, 40),
        stopLoss: mktStopLoss.trim().slice(0, 40),
        noteMr: mktNoteMr.trim().slice(0, 300),
        noteEn: (mktNoteEn.trim() || mktNoteMr.trim()).slice(0, 300),
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      setMktSymbol('');
      setMktStrike('');
      setMktEntry('');
      setMktTarget('');
      setMktStopLoss('');
      setMktNoteMr('');
      setMktNoteEn('');
      setNotice(lang === 'mr' ? 'शेअर बाजार कॉल त्वरित प्रकाशित झाला.' : 'Market pick saved and published live.');
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save market pick.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-[2px] overflow-y-auto flex items-start justify-center p-4 sm:py-10"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FBF9F5] border border-stone-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <div>
            <p className="text-[11px] font-mono text-[#8B0000] uppercase">
              Column {columnNumber} · Editor Quick-Upload
            </p>
            <h2 className="font-editorial text-xl font-semibold text-stone-900">
              {lang === 'mr'
                ? `स्तंभ ${columnNumber} — त्वरित संपादन व अपलोड`
                : `Column ${columnNumber} — Instant Edit & Upload`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-900"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!user ? (
            <div className="py-8 text-center space-y-4">
              <ShieldCheck className="w-8 h-8 text-[#8B0000] mx-auto" />
              <p className="text-sm text-stone-700">
                {lang === 'mr'
                  ? `स्तंभ ${columnNumber} संपादित करण्यासाठी संपादक खात्याने (${ADMIN_EMAIL}) लॉगिन करा.`
                  : `Sign in with the editor account (${ADMIN_EMAIL}) to edit Column ${columnNumber}.`}
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                className="px-5 py-2.5 text-xs font-medium text-white bg-[#8B0000] hover:bg-[#6B0000] transition-colors"
              >
                {lang === 'mr' ? 'संपादक Google लॉगिन' : 'Editor Sign In with Google'}
              </button>
              {error && <p className="text-xs text-red-700">{error}</p>}
            </div>
          ) : !isAdmin ? (
            <div className="py-6 text-center text-sm text-stone-600">
              {lang === 'mr'
                ? `संपादन अधिकार केवळ ${ADMIN_EMAIL} साठी राखीव आहेत.`
                : `Editing is restricted to ${ADMIN_EMAIL}.`}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded w-fit">
                <button
                  type="button"
                  onClick={() => setMode('news')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded ${
                    mode === 'news' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? 'बातमी / फोटो' : 'News & Image'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('live')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded ${
                    mode === 'live' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? 'थेट अपडेट' : 'Live News'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('video')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded ${
                    mode === 'video' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? 'व्हिडिओ' : 'Video'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('market')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded ${
                    mode === 'market' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? 'शेअर बाजार' : 'Market F&O'}</span>
                </button>
              </div>

              {notice && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{notice}</span>
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs">
                  {error}
                </div>
              )}

              {mode === 'news' && (
                <form onSubmit={handleSaveNews} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      required
                      minLength={3}
                      value={titleMr}
                      onChange={(e) => setTitleMr(e.target.value)}
                      placeholder="मराठी शीर्षक *"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                    <input
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      placeholder="English Headline (optional)"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <textarea
                      required
                      minLength={10}
                      rows={2}
                      value={summaryMr}
                      onChange={(e) => setSummaryMr(e.target.value)}
                      placeholder="संक्षिप्त सारांश (मराठी) *"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                    <textarea
                      rows={2}
                      value={summaryEn}
                      onChange={(e) => setSummaryEn(e.target.value)}
                      placeholder="Summary (English, optional)"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                  </div>
                  <textarea
                    required
                    minLength={20}
                    rows={4}
                    value={contentMr}
                    onChange={(e) => setContentMr(e.target.value)}
                    placeholder="संपूर्ण बातमीचा मजकूर (मराठी) *"
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as NewsCategory)}
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    >
                      {(['civic', 'agriculture', 'transit', 'education', 'politics'] as NewsCategory[]).map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat][lang]}
                          </option>
                        )
                      )}
                    </select>
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Image URL or /images/..."
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-stone-500">Quick photos:</span>
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setImageUrl(img.url)}
                        className={`px-2 py-1 border text-[11px] ${
                          imageUrl === img.url
                            ? 'border-[#8B0000] text-[#8B0000] bg-white'
                            : 'border-stone-300 text-stone-600'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-medium text-white bg-[#8B0000] hover:bg-[#6B0000] disabled:opacity-50"
                  >
                    {submitting
                      ? '...'
                      : lang === 'mr'
                      ? 'त्वरित प्रकाशित करा'
                      : 'Publish Immediately'}
                  </button>
                </form>
              )}

              {mode === 'live' && (
                <form onSubmit={handleSaveLive} className="space-y-3.5">
                  <textarea
                    required
                    minLength={5}
                    rows={3}
                    value={liveMr}
                    onChange={(e) => setLiveMr(e.target.value)}
                    placeholder="ताजी ब्रेकिंग बातमी (मराठी) *"
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-white"
                  />
                  <input
                    value={liveEn}
                    onChange={(e) => setLiveEn(e.target.value)}
                    placeholder="Breaking Dispatch (English, optional)"
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-white"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      value={liveLocMr}
                      onChange={(e) => setLiveLocMr(e.target.value)}
                      placeholder="ठिकाण (मराठी)"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                    <input
                      required
                      value={liveLocEn}
                      onChange={(e) => setLiveLocEn(e.target.value)}
                      placeholder="Location (English)"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-medium text-white bg-[#8B0000] hover:bg-[#6B0000]"
                  >
                    {lang === 'mr' ? 'थेट प्रसारित करा' : 'Push Live Now'}
                  </button>
                </form>
              )}

              {mode === 'video' && (
                <form onSubmit={handleSaveVideo} className="space-y-3.5">
                  <input
                    required
                    value={vidTitleMr}
                    onChange={(e) => setVidTitleMr(e.target.value)}
                    placeholder="व्हिडिओ शीर्षक (मराठी) *"
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-white"
                  />
                  <input
                    value={vidTitleEn}
                    onChange={(e) => setVidTitleEn(e.target.value)}
                    placeholder="Video Title (English, optional)"
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-white"
                  />
                  <textarea
                    required
                    rows={2}
                    value={vidSummaryMr}
                    onChange={(e) => setVidSummaryMr(e.target.value)}
                    placeholder="व्हिडिओ माहिती (मराठी) *"
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      required
                      value={vidUrl}
                      onChange={(e) => setVidUrl(e.target.value)}
                      placeholder="YouTube Embed URL *"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                    <input
                      required
                      value={vidDuration}
                      onChange={(e) => setVidDuration(e.target.value)}
                      placeholder="Duration (04:15)"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'जतन व प्रकाशित करा' : 'Save & Publish Video'}</span>
                  </button>
                </form>
              )}

              {mode === 'market' && (
                <form onSubmit={handleSaveMarket} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      required
                      value={mktSymbol}
                      onChange={(e) => setMktSymbol(e.target.value)}
                      placeholder="Symbol (e.g. NIFTY / RELIANCE) *"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                    <select
                      value={mktSegment}
                      onChange={(e) => setMktSegment(e.target.value as 'equity' | 'options' | 'futures')}
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    >
                      <option value="equity">Share / Equity</option>
                      <option value="options">Option Trading (CE/PE)</option>
                      <option value="futures">Futures</option>
                    </select>
                    <select
                      value={mktAction}
                      onChange={(e) => setMktAction(e.target.value as 'BUY' | 'SELL')}
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    >
                      <option value="BUY">BUY (खरेदी)</option>
                      <option value="SELL">SELL (विक्री)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      value={mktStrike}
                      onChange={(e) => setMktStrike(e.target.value)}
                      placeholder="Strike (24500 CE)"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                    <input
                      required
                      value={mktEntry}
                      onChange={(e) => setMktEntry(e.target.value)}
                      placeholder="Entry (₹145) *"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                    <input
                      required
                      value={mktTarget}
                      onChange={(e) => setMktTarget(e.target.value)}
                      placeholder="Target (₹210) *"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                    <input
                      required
                      value={mktStopLoss}
                      onChange={(e) => setMktStopLoss(e.target.value)}
                      placeholder="SL (₹115) *"
                      className="px-3 py-2 text-sm border border-stone-300 bg-white"
                    />
                  </div>
                  <input
                    required
                    value={mktNoteMr}
                    onChange={(e) => setMktNoteMr(e.target.value)}
                    placeholder="विश्लेषण / कारण (मराठी) *"
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-white"
                  />
                  <input
                    value={mktNoteEn}
                    onChange={(e) => setMktNoteEn(e.target.value)}
                    placeholder="Rationale (English, optional)"
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'जतन व प्रकाशित करा' : 'Save & Publish Call'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
