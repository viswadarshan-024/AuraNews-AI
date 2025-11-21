import { Language, NewsCategory, Channel } from './types';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: Language.ENGLISH, native: 'English' },
  { code: 'hi', label: Language.HINDI, native: 'हिन्दी' },
  { code: 'ta', label: Language.TAMIL, native: 'தமிழ்' },
  { code: 'ml', label: Language.MALAYALAM, native: 'മലയാളം' },
  { code: 'te', label: Language.TELUGU, native: 'తెలుగు' },
  { code: 'gu', label: Language.GUJARATI, native: 'ગુજરાતી' },
  { code: 'kn', label: Language.KANNADA, native: 'ಕನ್ನಡ' },
  { code: 'mr', label: Language.MARATHI, native: 'मराठी' },
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

export const MOCK_ARTICLES = [];

export const NEWS_CHANNELS: Channel[] = [
  {
    id: 'bbc-news',
    name: 'BBC News',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/1200px-BBC_News_2019.svg.png',
    category: 'Global',
    language: 'English',
    description: 'Global news, analysis, and perspectives.'
  },
  {
    id: 'times-of-india',
    name: 'Times of India',
    logo: 'https://static.toiimg.com/photo/msid-58574024/58574024.jpg',
    category: 'National',
    language: 'English',
    description: 'Top stories from India and around the world.'
  },
  {
    id: 'ndtv',
    name: 'NDTV',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/NDTV_logo.svg/2560px-NDTV_logo.svg.png',
    category: 'National',
    language: 'Hindi/English',
    description: 'Breaking news and comprehensive coverage.'
  },
  {
    id: 'daily-thanthi',
    name: 'Daily Thanthi',
    logo: 'https://play-lh.googleusercontent.com/7sT2_9vQkQeL7vFhX6yX7tCq_Z8oJ0kW5rB9xU4dY1nE3mG8lV6oI2pA0zF4jS3bHw',
    category: 'Regional',
    language: 'Tamil',
    description: 'Leading Tamil daily newspaper.'
  },
  {
    id: 'manorama',
    name: 'Malayala Manorama',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Malayala_Manorama_logo.svg',
    category: 'Regional',
    language: 'Malayalam',
    description: 'Authentic news from Kerala.'
  },
  {
    id: 'eenadu',
    name: 'Eenadu',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Eenadu_logo.jpg',
    category: 'Regional',
    language: 'Telugu',
    description: 'The heart of Telugu news.'
  },
  {
    id: 'gujarat-samachar',
    name: 'Gujarat Samachar',
    logo: 'https://upload.wikimedia.org/wikipedia/en/3/3e/Gujarat_Samachar_logo.png',
    category: 'Regional',
    language: 'Gujarati',
    description: 'Top news source for Gujarat.'
  },
  {
    id: 'prajavani',
    name: 'Prajavani',
    logo: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Prajavani_logo.png',
    category: 'Regional',
    language: 'Kannada',
    description: 'Most trusted Kannada daily.'
  },
  {
    id: 'lokmat',
    name: 'Lokmat',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Lokmat_Logo.jpg',
    category: 'Regional',
    language: 'Marathi',
    description: 'No. 1 Marathi newspaper.'
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/TechCrunch_logo.svg',
    category: 'Technology',
    language: 'English',
    description: 'Latest technology news and startups.'
  },
  {
    id: 'espn',
    name: 'ESPN',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/ESPN_logo.svg/1200px-ESPN_logo.svg.png',
    category: 'Sports',
    language: 'English',
    description: 'Serving sports fans anytime, anywhere.'
  },
];