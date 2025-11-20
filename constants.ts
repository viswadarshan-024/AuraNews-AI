import { Language, NewsCategory } from './types';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: Language.ENGLISH, native: 'English' },
  { code: 'ta', label: Language.TAMIL, native: 'தமிழ்' },
  { code: 'ml', label: Language.MALAYALAM, native: 'മലയാളം' },
  { code: 'te', label: Language.TELUGU, native: 'తెలుగు' },
  { code: 'hi', label: Language.HINDI, native: 'हिन्दी' },
];

export const CATEGORIES = [
  NewsCategory.TECHNOLOGY,
  NewsCategory.BUSINESS,
  NewsCategory.POLITICS,
  NewsCategory.SPORTS,
  NewsCategory.ENTERTAINMENT,
  NewsCategory.SCIENCE,
  NewsCategory.HEALTH
];

// Placeholder data for initial render or fallback
export const MOCK_ARTICLES = []; 
