import { NewsArticle, Language } from '../types';

const FEED_KEY = 'auranews_feed_cache';
const BRIEFING_KEY = 'auranews_briefing_cache';

interface CacheData {
  articles: NewsArticle[];
  language: Language;
  timestamp: number;
}

export const getFeedCache = (): CacheData | null => {
  try {
    const raw = localStorage.getItem(FEED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setFeedCache = (articles: NewsArticle[], language: Language) => {
  try {
    const data: CacheData = {
      articles,
      language,
      timestamp: Date.now()
    };
    localStorage.setItem(FEED_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save feed to cache", e);
  }
};

export const getBriefingCache = (): CacheData | null => {
  try {
    const raw = localStorage.getItem(BRIEFING_KEY);
    if (!raw) return null;
    
    const data = JSON.parse(raw);
    const cacheDate = new Date(data.timestamp).toDateString();
    const today = new Date().toDateString();
    
    // For briefing, we only return if it's from today
    if (cacheDate !== today) return null;
    
    return data;
  } catch (e) {
    return null;
  }
};

export const setBriefingCache = (articles: NewsArticle[], language: Language) => {
  try {
    const data: CacheData = {
      articles,
      language,
      timestamp: Date.now()
    };
    localStorage.setItem(BRIEFING_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save briefing to cache", e);
  }
};