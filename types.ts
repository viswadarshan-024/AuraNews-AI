export enum Language {
  ENGLISH = 'English',
  TAMIL = 'Tamil',
  MALAYALAM = 'Malayalam',
  TELUGU = 'Telugu',
  HINDI = 'Hindi',
  GUJARATI = 'Gujarati',
  KANNADA = 'Kannada',
  MARATHI = 'Marathi'
}

export enum NewsCategory {
  TECHNOLOGY = 'Technology',
  BUSINESS = 'Business',
  POLITICS = 'Politics',
  SPORTS = 'Sports',
  ENTERTAINMENT = 'Entertainment',
  SCIENCE = 'Science',
  HEALTH = 'Health'
}

export interface UserPreferences {
  name: string;
  languages: Language[];
  categories: NewsCategory[];
  hasOnboarded: boolean;
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  url?: string;
  imageUrl?: string;
  originalLanguage: string;
  targetLanguage: Language;
  category: NewsCategory;
  // Engagement Props
  isLiked?: boolean;
  likeCount?: number;
  isSaved?: boolean;
  comments?: Comment[];
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  category: string;
  language: string;
  description: string;
}

export interface AudioChunk {
  data: string; // Base64
  mimeType: string;
}