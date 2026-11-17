export type Language = 'mr' | 'en';

export type NewsCategory = 'civic' | 'agriculture' | 'transit' | 'education' | 'politics';

export interface Article {
  id: string;
  titleEn: string;
  titleMr: string;
  summaryEn: string;
  summaryMr: string;
  contentEn: string;
  contentMr: string;
  category: NewsCategory;
  authorName: string;
  authorId: string;
  imageUrl: string;
  isFeatured: boolean;
  isTrending: boolean;
  readTimeMinutes: number;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
  isFromCms?: boolean;
}

export interface LiveUpdate {
  id: string;
  textEn: string;
  textMr: string;
  locationEn: string;
  locationMr: string;
  category: NewsCategory;
  authorId: string;
  createdAt: string;
  isFromCms?: boolean;
}

export interface VideoReport {
  id: string;
  titleEn: string;
  titleMr: string;
  summaryEn: string;
  summaryMr: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
  category: NewsCategory;
  reporterEn: string;
  reporterMr: string;
  authorId: string;
  createdAt: string;
  isFromCms?: boolean;
}

export interface AdSlot {
  id: string;
  placement: 'sidebar_top' | 'article_footer';
  sponsorName: string;
  headlineEn: string;
  headlineMr: string;
  ctaUrl: string;
  isActive: boolean;
  updatedAt: string;
}

export interface SubscriberRecord {
  id: string;
  email: string;
  language: Language;
  createdAt: string;
}
