'use client';

import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import {
  Plus,
  Trash2,
  LogOut,
  Globe,
  Radio,
  Video,
  Newspaper,
  Megaphone,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  ADMIN_EMAIL,
  handleFirestoreError,
  OperationType,
} from '@/lib/firebase';
import {
  Article,
  LiveUpdate,
  VideoReport,
  AdSlot,
  SubscriberRecord,
  Language,
  NewsCategory,
} from '@/lib/types';
import { CATEGORY_LABELS, UI_COPY } from '@/lib/seed-data';

interface CmsDashboardProps {
  user: User | null;
  lang: Language;
  articles: Article[];
  liveUpdates: LiveUpdate[];
  videoReports: VideoReport[];
  adSlots: AdSlot[];
  onClose: () => void;
}

type CmsTab = 'articles' | 'live' | 'videos' | 'ads' | 'domain';

const PRESET_IMAGES = [
  { label: 'Civic & Assembly', url: '/images/hero_civic_assembly.jpg' },
  { label: 'Agriculture Mandi', url: '/images/news_agriculture_market.jpg' },
  { label: 'Metro & Transit', url: '/images/news_metro_transit.jpg' },
  { label: 'Field Video Desk', url: '/images/video_field_report.jpg' },
  { label: 'Education Campus', url: '/images/news_education_campus.jpg' },
];

export function CmsDashboard({
  user,
  lang,
  articles,
  liveUpdates,
  videoReports,
  adSlots,
  onClose,
}: CmsDashboardProps) {
  const t = UI_COPY[lang];
  const [activeTab, setActiveTab] = useState<CmsTab>('articles');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Article Form State
  const [titleMr, setTitleMr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [summaryMr, setSummaryMr] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [contentMr, setContentMr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [category, setCategory] = useState<NewsCategory>('civic');
  const [authorName, setAuthorName] = useState('संपादकीय कक्ष · Editorial Desk');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(true);

  // Live Update Form State
  const [liveTextMr, setLiveTextMr] = useState('');
  const [liveTextEn, setLiveTextEn] = useState('');
  const [liveLocMr, setLiveLocMr] = useState('जिल्हा कक्ष');
  const [liveLocEn, setLiveLocEn] = useState('District Desk');
  const [liveCategory, setLiveCategory] = useState<NewsCategory>('civic');

  // Video Report Form State
  const [vidTitleMr, setVidTitleMr] = useState('');
  const [vidTitleEn, setVidTitleEn] = useState('');
  const [vidSummaryMr, setVidSummaryMr] = useState('');
  const [vidSummaryEn, setVidSummaryEn] = useState('');
  const [vidDuration, setVidDuration] = useState('04:30');
  const [vidUrl, setVidUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [vidThumb, setVidThumb] = useState('/images/video_field_report.jpg');
  const [vidReporterMr, setVidReporterMr] = useState('बुलंदसेना प्रतिनिधी');
  const [vidReporterEn, setVidReporterEn] = useState('Bulandsena Correspondent');

  // Ad Slot Form State
  const [adPlacement, setAdPlacement] = useState<'sidebar_top' | 'article_footer'>('sidebar_top');
  const [adSponsor, setAdSponsor] = useState('');
  const [adHeadlineMr, setAdHeadlineMr] = useState('');
  const [adHeadlineEn, setAdHeadlineEn] = useState('');
  const [adCtaUrl, setAdCtaUrl] = useState('https://bulandsena.in');

  // Subscribers (Admin-only)
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);

  const isAdmin =
    Boolean(user?.emailVerified) && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!isAdmin || activeTab !== 'domain') return;
    const loadSubscribers = async () => {
      try {
        const q = query(collection(db, 'subscribers'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setSubscribers(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              email: data.email || '',
              language: data.language || 'mr',
              createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            };
          })
        );
      } catch (err) {
        console.error('Failed to load subscribers:', err);
      }
    };
    loadSubscribers();
  }, [isAdmin, activeTab]);

  const showNotice = (msg: string) => {
    setErrorMessage(null);
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSignIn = async () => {
    try {
      setErrorMessage(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        titleMr: titleMr.trim().slice(0, 240),
        titleEn: titleEn.trim().slice(0, 200),
        summaryMr: summaryMr.trim().slice(0, 600),
        summaryEn: summaryEn.trim().slice(0, 500),
        contentMr: contentMr.trim().slice(0, 18000),
        contentEn: contentEn.trim().slice(0, 15000),
        category,
        authorName: authorName.trim().slice(0, 100),
        authorId: user.uid,
        imageUrl: imageUrl.trim().slice(0, 500),
        isFeatured,
        isTrending,
        readTimeMinutes: Math.max(1, Math.min(30, Math.ceil(contentEn.trim().split(/\s+/).length / 180) + 1)),
        status: 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'articles'), payload);
      setTitleMr('');
      setTitleEn('');
      setSummaryMr('');
      setSummaryEn('');
      setContentMr('');
      setContentEn('');
      showNotice(lang === 'mr' ? 'बातमी यशस्वीरित्या प्रकाशित झाली.' : 'Article published to Bulandsena.in.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'articles');
      } catch (wrapped) {
        setErrorMessage(wrapped instanceof Error ? wrapped.message : 'Failed to publish article.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'articles', id));
      showNotice(lang === 'mr' ? 'बातमी काढून टाकली.' : 'Article removed.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `articles/${id}`);
      } catch (wrapped) {
        setErrorMessage(wrapped instanceof Error ? wrapped.message : 'Delete failed.');
      }
    }
  };

  const handleCreateLiveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await addDoc(collection(db, 'liveUpdates'), {
        textMr: liveTextMr.trim().slice(0, 360),
        textEn: liveTextEn.trim().slice(0, 300),
        locationMr: liveLocMr.trim().slice(0, 100),
        locationEn: liveLocEn.trim().slice(0, 80),
        category: liveCategory,
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      setLiveTextMr('');
      setLiveTextEn('');
      showNotice(lang === 'mr' ? 'थेट अपडेट प्रकाशित झाले.' : 'Live dispatch pushed.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'liveUpdates');
      } catch (wrapped) {
        setErrorMessage(wrapped instanceof Error ? wrapped.message : 'Failed to post update.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLiveUpdate = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'liveUpdates', id));
      showNotice(lang === 'mr' ? 'अपडेट काढून टाकले.' : 'Live update removed.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await addDoc(collection(db, 'videoReports'), {
        titleMr: vidTitleMr.trim().slice(0, 220),
        titleEn: vidTitleEn.trim().slice(0, 180),
        summaryMr: vidSummaryMr.trim().slice(0, 480),
        summaryEn: vidSummaryEn.trim().slice(0, 400),
        duration: vidDuration.trim().slice(0, 20),
        thumbnailUrl: vidThumb.trim().slice(0, 500),
        videoUrl: vidUrl.trim().slice(0, 500),
        category: 'civic',
        reporterMr: vidReporterMr.trim().slice(0, 120),
        reporterEn: vidReporterEn.trim().slice(0, 100),
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      setVidTitleMr('');
      setVidTitleEn('');
      setVidSummaryMr('');
      setVidSummaryEn('');
      showNotice(lang === 'mr' ? 'व्हिडिओ रिपोर्ट जोडला गेला.' : 'Video report published.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'videoReports');
      } catch (wrapped) {
        setErrorMessage(wrapped instanceof Error ? wrapped.message : 'Failed to publish video.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAdSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const slotId = adPlacement === 'sidebar_top' ? 'ad-sidebar-top' : 'ad-article-footer';
      await setDoc(doc(db, 'adSlots', slotId), {
        placement: adPlacement,
        sponsorName: adSponsor.trim().slice(0, 100),
        headlineMr: adHeadlineMr.trim().slice(0, 200),
        headlineEn: adHeadlineEn.trim().slice(0, 160),
        ctaUrl: adCtaUrl.trim().slice(0, 500),
        isActive: true,
        updatedAt: serverTimestamp(),
      });
      showNotice(lang === 'mr' ? 'जाहिरात स्लॉट अद्यतनित झाला.' : 'Ad slot updated live.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'adSlots');
      } catch (wrapped) {
        setErrorMessage(wrapped instanceof Error ? wrapped.message : 'Failed to save ad slot.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cmsArticles = articles.filter((a) => a.isFromCms);
  const cmsLiveUpdates = liveUpdates.filter((u) => u.isFromCms);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* CMS Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-300">
        <div>
          <p className="text-xs font-medium text-[#9A3412] tracking-wide">
            Bulandsena.in · Editorial CMS
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-stone-900 mt-1">
            {t.cmsTitle}
          </h1>
          <p className="text-sm text-stone-600 mt-1">{t.cmsSubtitle}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 border border-stone-300 hover:border-stone-900 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'बाहेर पडा' : 'Sign Out'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors whitespace-nowrap"
          >
            {lang === 'mr' ? 'मुख्यपृष्ठावर परत जा' : 'Return to Front Page'}
          </button>
        </div>
      </div>

      {/* Auth Gate */}
      {!user ? (
        <div className="max-w-lg mx-auto my-12 p-8 bg-white border border-stone-200 text-center space-y-4">
          <ShieldCheck className="w-8 h-8 text-[#9A3412] mx-auto" />
          <h2 className="font-editorial text-2xl font-semibold text-stone-900">
            {lang === 'mr' ? 'संपादक लॉगिन आवश्यक' : 'Editor Authentication Required'}
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            {lang === 'mr'
              ? `बातम्या, थेट अपडेट्स आणि जाहिराती व्यवस्थापित करण्यासाठी तुमच्या अधिकृत संपादक Google खात्याने (${ADMIN_EMAIL}) साइन इन करा.`
              : `Sign in with your authorized editorial Google account (${ADMIN_EMAIL}) to publish dispatches, push live updates, and manage ad placements.`}
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] transition-colors"
          >
            {lang === 'mr' ? 'Google ने साइन इन करा' : 'Sign in with Google'}
          </button>
          {errorMessage && <p className="text-xs text-red-700">{errorMessage}</p>}
        </div>
      ) : !isAdmin ? (
        <div className="max-w-lg mx-auto my-12 p-8 bg-white border border-stone-200 text-center space-y-3">
          <h2 className="font-editorial text-xl font-semibold text-stone-900">
            {lang === 'mr' ? 'प्रवेश मर्यादित आहे' : 'Editorial Access Restricted'}
          </h2>
          <p className="text-sm text-stone-600">
            {lang === 'mr'
              ? `तुम्ही ${user.email} म्हणून लॉगिन आहात. संपादकीय CMS केवळ ${ADMIN_EMAIL} साठी अधिकृत आहे.`
              : `Signed in as ${user.email}. Publishing permissions are restricted to ${ADMIN_EMAIL}.`}
          </p>
        </div>
      ) : (
        <>
          {/* CMS Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-200/70 rounded-md w-fit">
            {(
              [
                { id: 'articles', icon: Newspaper, label: lang === 'mr' ? 'बातम्या' : 'Articles' },
                { id: 'live', icon: Radio, label: lang === 'mr' ? 'थेट अपडेट्स' : 'Live Desk' },
                { id: 'videos', icon: Video, label: lang === 'mr' ? 'व्हिडिओ' : 'Videos' },
                { id: 'ads', icon: Megaphone, label: lang === 'mr' ? 'जाहिराती' : 'Ad Spaces' },
                { id: 'domain', icon: Globe, label: lang === 'mr' ? 'डोमेन व सदस्य' : 'Domain & Subscribers' },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {statusMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs">
              {errorMessage}
            </div>
          )}

          {/* TAB 1: ARTICLES */}
          {activeTab === 'articles' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={handleCreateArticle}
                className="lg:col-span-7 bg-white border border-stone-200 p-6 space-y-4"
              >
                <h2 className="font-editorial text-xl font-semibold text-stone-900">
                  {lang === 'mr' ? 'नवीन बातमी जोडा (मराठी + English)' : 'Publish New Bilingual Dispatch'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      शीर्षक (मराठी) *
                    </label>
                    <input
                      required
                      minLength={3}
                      maxLength={240}
                      value={titleMr}
                      onChange={(e) => setTitleMr(e.target.value)}
                      placeholder="मराठी बातमीचे शीर्षक..."
                      className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5] focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Headline (English) *
                    </label>
                    <input
                      required
                      minLength={3}
                      maxLength={200}
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      placeholder="English headline..."
                      className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5] focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      सारांश (मराठी) *
                    </label>
                    <textarea
                      required
                      minLength={10}
                      maxLength={600}
                      rows={2}
                      value={summaryMr}
                      onChange={(e) => setSummaryMr(e.target.value)}
                      placeholder="संक्षिप्त गोषवारा..."
                      className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5] focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Deck / Summary (English) *
                    </label>
                    <textarea
                      required
                      minLength={10}
                      maxLength={500}
                      rows={2}
                      value={summaryEn}
                      onChange={(e) => setSummaryEn(e.target.value)}
                      placeholder="Concise summary..."
                      className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5] focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      संपूर्ण बातमी (मराठी) *
                    </label>
                    <textarea
                      required
                      minLength={20}
                      rows={5}
                      value={contentMr}
                      onChange={(e) => setContentMr(e.target.value)}
                      placeholder="सविस्तर बातमी येथे लिहा..."
                      className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5] focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Full Article Body (English) *
                    </label>
                    <textarea
                      required
                      minLength={20}
                      rows={5}
                      value={contentEn}
                      onChange={(e) => setContentEn(e.target.value)}
                      placeholder="Write full dispatch..."
                      className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5] focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as NewsCategory)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                    >
                      {(['civic', 'agriculture', 'transit', 'education', 'politics'] as NewsCategory[]).map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat][lang]}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Author / Reporter
                    </label>
                    <input
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Editorial Photo
                    </label>
                    <select
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                    >
                      {PRESET_IMAGES.map((img) => (
                        <option key={img.url} value={img.url}>
                          {img.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="inline-flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="accent-[#9A3412]"
                    />
                    <span>{lang === 'mr' ? 'मुख्य बातमी (Lead Story)' : 'Set as Lead Story'}</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTrending}
                      onChange={(e) => setIsTrending(e.target.checked)}
                      className="accent-[#9A3412]"
                    />
                    <span>{lang === 'mr' ? 'ट्रेंडिंग विभागात दाखवा' : 'Include in Trending'}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? 'Publishing...' : lang === 'mr' ? 'बातमी प्रकाशित करा' : 'Publish Dispatch'}</span>
                </button>
              </form>

              {/* Published CMS Articles List */}
              <div className="lg:col-span-5 bg-white border border-stone-200 p-6 space-y-4">
                <h2 className="font-editorial text-xl font-semibold text-stone-900">
                  {lang === 'mr' ? `प्रकाशित CMS बातम्या (${cmsArticles.length})` : `Published CMS Stories (${cmsArticles.length})`}
                </h2>
                {cmsArticles.length === 0 ? (
                  <p className="text-xs text-stone-500">
                    {lang === 'mr'
                      ? 'अद्याप कोणतीही नवीन CMS बातमी जोडलेली नाही. डावीकडील फॉर्ममधून पहिली बातमी प्रकाशित करा.'
                      : 'No custom CMS stories yet. Publish your first dispatch using the editor form.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-stone-200">
                    {cmsArticles.map((art) => (
                      <li key={art.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-900 line-clamp-2">
                            {lang === 'mr' ? art.titleMr : art.titleEn}
                          </p>
                          <p className="text-xs text-stone-500 mt-1">
                            {CATEGORY_LABELS[art.category]?.[lang]} · {art.authorName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art.id)}
                          className="p-1.5 text-stone-400 hover:text-red-700 transition-colors shrink-0"
                          aria-label="Delete article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE UPDATES */}
          {activeTab === 'live' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={handleCreateLiveUpdate}
                className="lg:col-span-7 bg-white border border-stone-200 p-6 space-y-4"
              >
                <h2 className="font-editorial text-xl font-semibold text-stone-900">
                  {lang === 'mr' ? 'थेट ब्रेकिंग अपडेट पाठवा' : 'Push Real-Time Local Update'}
                </h2>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    अपडेट (मराठी) *
                  </label>
                  <textarea
                    required
                    minLength={5}
                    maxLength={360}
                    rows={2}
                    value={liveTextMr}
                    onChange={(e) => setLiveTextMr(e.target.value)}
                    placeholder="ताजी स्थानिक घडामोड मराठीत..."
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Dispatch Text (English) *
                  </label>
                  <textarea
                    required
                    minLength={5}
                    maxLength={300}
                    rows={2}
                    value={liveTextEn}
                    onChange={(e) => setLiveTextEn(e.target.value)}
                    placeholder="Breaking local update in English..."
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    required
                    value={liveLocMr}
                    onChange={(e) => setLiveLocMr(e.target.value)}
                    placeholder="ठिकाण (मराठी)"
                    className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                  />
                  <input
                    required
                    value={liveLocEn}
                    onChange={(e) => setLiveLocEn(e.target.value)}
                    placeholder="Location (English)"
                    className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                  />
                  <select
                    value={liveCategory}
                    onChange={(e) => setLiveCategory(e.target.value as NewsCategory)}
                    className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                  >
                    {(['civic', 'agriculture', 'transit', 'education', 'politics'] as NewsCategory[]).map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat][lang]}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50"
                >
                  {lang === 'mr' ? 'थेट अपडेट प्रकाशित करा' : 'Push to Live Desk'}
                </button>
              </form>

              <div className="lg:col-span-5 bg-white border border-stone-200 p-6 space-y-4">
                <h2 className="font-editorial text-xl font-semibold text-stone-900">
                  {lang === 'mr' ? `सक्रिय CMS अपडेट्स (${cmsLiveUpdates.length})` : `Active CMS Dispatches (${cmsLiveUpdates.length})`}
                </h2>
                <ul className="divide-y divide-stone-200">
                  {cmsLiveUpdates.map((u) => (
                    <li key={u.id} className="py-3 flex items-start justify-between gap-3">
                      <p className="text-xs text-stone-800 leading-relaxed">
                        {lang === 'mr' ? u.textMr : u.textEn}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDeleteLiveUpdate(u.id)}
                        className="p-1 text-stone-400 hover:text-red-700 shrink-0"
                        aria-label="Delete update"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                  {cmsLiveUpdates.length === 0 && (
                    <li className="text-xs text-stone-500">
                      {lang === 'mr' ? 'कोणतेही कस्टम अपडेट अद्याप नाही.' : 'No custom live dispatches yet.'}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO REPORTS */}
          {activeTab === 'videos' && (
            <form
              onSubmit={handleCreateVideo}
              className="max-w-2xl bg-white border border-stone-200 p-6 space-y-4"
            >
              <h2 className="font-editorial text-xl font-semibold text-stone-900">
                {lang === 'mr' ? 'नवीन व्हिडिओ रिपोर्ट जोडा' : 'Add Field Video Report'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  value={vidTitleMr}
                  onChange={(e) => setVidTitleMr(e.target.value)}
                  placeholder="व्हिडिओ शीर्षक (मराठी) *"
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                />
                <input
                  required
                  value={vidTitleEn}
                  onChange={(e) => setVidTitleEn(e.target.value)}
                  placeholder="Video Title (English) *"
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <textarea
                  required
                  rows={2}
                  value={vidSummaryMr}
                  onChange={(e) => setVidSummaryMr(e.target.value)}
                  placeholder="थोडक्यात माहिती (मराठी) *"
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                />
                <textarea
                  required
                  rows={2}
                  value={vidSummaryEn}
                  onChange={(e) => setVidSummaryEn(e.target.value)}
                  placeholder="Short Summary (English) *"
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  required
                  value={vidUrl}
                  onChange={(e) => setVidUrl(e.target.value)}
                  placeholder="YouTube Embed URL"
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                />
                <input
                  required
                  value={vidDuration}
                  onChange={(e) => setVidDuration(e.target.value)}
                  placeholder="Duration (e.g. 05:12)"
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                />
                <select
                  value={vidThumb}
                  onChange={(e) => setVidThumb(e.target.value)}
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                >
                  {PRESET_IMAGES.map((img) => (
                    <option key={img.url} value={img.url}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  value={vidReporterMr}
                  onChange={(e) => setVidReporterMr(e.target.value)}
                  placeholder="प्रतिनिधी नाव (मराठी)"
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                />
                <input
                  required
                  value={vidReporterEn}
                  onChange={(e) => setVidReporterEn(e.target.value)}
                  placeholder="Reporter Name (English)"
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12]"
              >
                {lang === 'mr' ? 'व्हिडिओ प्रकाशित करा' : 'Publish Video Report'}
              </button>
              <p className="text-xs text-stone-500">
                {lang === 'mr'
                  ? `एकूण व्हिडिओ रिपोर्ट्स: ${videoReports.length}`
                  : `Total active video reports: ${videoReports.length}`}
              </p>
            </form>
          )}

          {/* TAB 4: AD SPACES */}
          {activeTab === 'ads' && (
            <form
              onSubmit={handleSaveAdSlot}
              className="max-w-2xl bg-white border border-stone-200 p-6 space-y-4"
            >
              <h2 className="font-editorial text-xl font-semibold text-stone-900">
                {lang === 'mr' ? 'जाहिरात स्लॉट व्यवस्थापन (Monetization)' : 'Third-Party Ad Slot Configuration'}
              </h2>
              <p className="text-xs text-stone-600">
                {lang === 'mr'
                  ? 'साइडबार आणि लेखाच्या तळाशी दिसणाऱ्या प्रायोजित जाहिराती येथे अद्यतनित करा.'
                  : 'Update active sponsor placements rendered in the right sidebar and article footers.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={adPlacement}
                  onChange={(e) =>
                    setAdPlacement(e.target.value as 'sidebar_top' | 'article_footer')
                  }
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                >
                  <option value="sidebar_top">Sidebar Slot (300×250)</option>
                  <option value="article_footer">Article Footer Banner</option>
                </select>
                <input
                  required
                  value={adSponsor}
                  onChange={(e) => setAdSponsor(e.target.value)}
                  placeholder="Sponsor / Advertiser Name *"
                  className="px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
                />
              </div>
              <input
                required
                value={adHeadlineMr}
                onChange={(e) => setAdHeadlineMr(e.target.value)}
                placeholder="जाहिरात मजकूर (मराठी) *"
                className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
              />
              <input
                required
                value={adHeadlineEn}
                onChange={(e) => setAdHeadlineEn(e.target.value)}
                placeholder="Ad Copy (English) *"
                className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
              />
              <input
                required
                type="url"
                value={adCtaUrl}
                onChange={(e) => setAdCtaUrl(e.target.value)}
                placeholder="Destination URL (https://...)"
                className="w-full px-3 py-2 text-sm border border-stone-300 bg-[#FBF9F5]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12]"
              >
                {lang === 'mr' ? 'जाहिरात जतन करा' : 'Save Ad Placement'}
              </button>
              <div className="pt-4 border-t border-stone-200 text-xs text-stone-500">
                Active slots configured: {adSlots.length}
              </div>
            </form>
          )}

          {/* TAB 5: CUSTOM DOMAIN & SUBSCRIBERS */}
          {activeTab === 'domain' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-stone-200 p-6 space-y-4">
                <h2 className="font-editorial text-xl font-semibold text-stone-900">
                  Custom Domain Integration: bulandsena.in
                </h2>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Point your domain registrar DNS records to your deployed Cloud Run / hosting endpoint to serve Bulandsena.in over HTTPS:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-stone-200 font-mono">
                    <thead className="bg-stone-100 text-stone-700">
                      <tr>
                        <th className="p-2.5 border-b border-stone-200">Type</th>
                        <th className="p-2.5 border-b border-stone-200">Host</th>
                        <th className="p-2.5 border-b border-stone-200">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-stone-800">
                      <tr>
                        <td className="p-2.5">A</td>
                        <td className="p-2.5">@</td>
                        <td className="p-2.5">216.239.32.21</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">CNAME</td>
                        <td className="p-2.5">www</td>
                        <td className="p-2.5">ghs.googlehosted.com.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-6 space-y-4">
                <h2 className="font-editorial text-xl font-semibold text-stone-900">
                  {lang === 'mr'
                    ? `वृत्तपत्रिका सदस्य (${subscribers.length})`
                    : `Newsletter Subscribers (${subscribers.length})`}
                </h2>
                {subscribers.length === 0 ? (
                  <p className="text-xs text-stone-500">
                    {lang === 'mr'
                      ? 'अद्याप कोणतेही सदस्य नोंदवलेले नाहीत.'
                      : 'No newsletter subscribers recorded yet.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-stone-200 text-xs">
                    {subscribers.map((sub) => (
                      <li key={sub.id} className="py-2.5 flex items-center justify-between gap-2">
                        <span className="font-medium text-stone-800">{sub.email}</span>
                        <span className="text-stone-500 uppercase">{sub.language}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
