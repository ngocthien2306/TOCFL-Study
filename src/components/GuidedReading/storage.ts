import type { Word } from '../../types';
import { buildDefaultGuidedArticles } from './defaultArticles';
import type { GuidedProgressMap, GuidedReadingArticle } from './types';

const LEGACY_ARTICLES_KEY = 'tocfl_guided_readings_v1';
const ARTICLES_KEY = 'tocfl_guided_readings_v2';
const PROGRESS_KEY = 'tocfl_guided_reading_progress_v1';

function articlesKey(userId?: number | null): string {
  return `${ARTICLES_KEY}:${userId == null ? 'anonymous' : `user:${userId}`}`;
}

function loadStoredArticles(key: string): GuidedReadingArticle[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]') as GuidedReadingArticle[];
    return Array.isArray(parsed) ? parsed.filter(item => item?.id && item?.segments?.length) : [];
  } catch {
    return [];
  }
}

export function isCustomGuidedArticle(article: GuidedReadingArticle): boolean {
  return !article.id.startsWith('guided-default-');
}

export function mergeGuidedArticles(
  vocabulary: Word[],
  ...collections: GuidedReadingArticle[][]
): GuidedReadingArticle[] {
  const merged = new Map(buildDefaultGuidedArticles(vocabulary).map(article => [article.id, article]));
  collections.flat().filter(isCustomGuidedArticle).forEach(article => merged.set(article.id, article));
  return [...merged.values()];
}

export function loadGuidedArticles(vocabulary: Word[], userId?: number | null): GuidedReadingArticle[] {
  const owned = loadStoredArticles(articlesKey(userId));
  if (userId != null) return mergeGuidedArticles(vocabulary, owned);
  return mergeGuidedArticles(
    vocabulary,
    loadStoredArticles(LEGACY_ARTICLES_KEY),
    owned,
  );
}

export function loadUnassignedGuidedArticles(): GuidedReadingArticle[] {
  const merged = new Map<string, GuidedReadingArticle>();
  [
    ...loadStoredArticles(LEGACY_ARTICLES_KEY),
    ...loadStoredArticles(articlesKey(null)),
  ].filter(isCustomGuidedArticle).forEach(article => merged.set(article.id, article));
  return [...merged.values()];
}

export function clearUnassignedGuidedArticles(): void {
  localStorage.removeItem(LEGACY_ARTICLES_KEY);
  localStorage.removeItem(articlesKey(null));
}

export function saveGuidedArticles(articles: GuidedReadingArticle[], userId?: number | null): void {
  try {
    localStorage.setItem(articlesKey(userId), JSON.stringify(articles.filter(isCustomGuidedArticle)));
  } catch {
    throw new Error('Không đủ dung lượng trình duyệt để lưu bài đọc.');
  }
}

export function loadGuidedProgress(): GuidedProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as GuidedProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveGuidedProgress(progress: GuidedProgressMap): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Progress is helpful but should never interrupt reading when storage is full.
  }
}
