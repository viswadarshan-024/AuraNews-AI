import { NewsArticle, Comment } from '../types';

const STORAGE_KEY = 'auranews_interactions';

interface InteractionData {
  [articleId: string]: {
    isLiked: boolean;
    isSaved: boolean;
    comments: Comment[];
    articleData?: NewsArticle; // Cache the article data for the "Saved" page
  };
}

const getData = (): InteractionData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to parse interaction data", e);
    return {};
  }
};

const saveData = (data: InteractionData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Helper to generate a consistent ID based on title (handling Unicode)
export const getStableId = (article: NewsArticle) => {
  try {
    // Encode Unicode strings to UTF-8 before base64 encoding
    const str = article.title + article.source;
    const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (match, p1) => String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(utf8Bytes).slice(0, 32); // Limit length
  } catch (e) {
    // Fallback if encoding fails
    return article.id;
  }
};

export const toggleLike = (article: NewsArticle): boolean => {
  const id = getStableId(article);
  const data = getData();
  
  if (!data[id]) data[id] = { isLiked: false, isSaved: false, comments: [] };
  
  data[id].isLiked = !data[id].isLiked;
  data[id].articleData = article; // Update cache
  saveData(data);
  return data[id].isLiked;
};

export const toggleSave = (article: NewsArticle): boolean => {
  const id = getStableId(article);
  const data = getData();
  
  if (!data[id]) data[id] = { isLiked: false, isSaved: false, comments: [] };
  
  data[id].isSaved = !data[id].isSaved;
  data[id].articleData = article; // Update cache
  saveData(data);
  return data[id].isSaved;
};

export const addComment = (article: NewsArticle, text: string, userName: string): Comment[] => {
  const id = getStableId(article);
  const data = getData();
  
  if (!data[id]) data[id] = { isLiked: false, isSaved: false, comments: [] };
  
  const newComment: Comment = {
    id: Date.now().toString(),
    user: userName,
    text,
    timestamp: new Date().toLocaleDateString()
  };
  
  data[id].comments = [newComment, ...data[id].comments];
  data[id].articleData = article;
  saveData(data);
  return data[id].comments;
};

export const getInteractionState = (article: NewsArticle) => {
  const id = getStableId(article);
  const data = getData();
  return data[id] || { isLiked: false, isSaved: false, comments: [] };
};

export const getSavedArticles = (): NewsArticle[] => {
  const data = getData();
  return Object.values(data)
    .filter(item => item.isSaved && item.articleData)
    .map(item => {
      const article = item.articleData!;
      return {
        ...article,
        isLiked: item.isLiked,
        isSaved: item.isSaved,
        comments: item.comments
      };
    });
};