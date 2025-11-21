import React, { useState, useEffect } from 'react';
import { NewsArticle, Comment, NewsCategory } from '../types';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { toggleLike, toggleSave, getInteractionState } from '../services/interactionService';

interface NewsCardProps {
  article: NewsArticle;
  onPlayAudio: (buffer: AudioBuffer) => void;
  userName: string;
  onClick: () => void;
}

// High quality stock images mapping based on category (Unsplash Source)
const CATEGORY_IMAGES: Record<NewsCategory, string> = {
    [NewsCategory.TECHNOLOGY]: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    [NewsCategory.BUSINESS]: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    [NewsCategory.POLITICS]: 'https://images.unsplash.com/photo-1529101091760-6149d4c46b7d?w=800&q=80',
    [NewsCategory.SPORTS]: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
    [NewsCategory.ENTERTAINMENT]: 'https://images.unsplash.com/photo-1499364660878-4a307951accd?w=800&q=80',
    [NewsCategory.SCIENCE]: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
    [NewsCategory.HEALTH]: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80'
};

const NewsCard: React.FC<NewsCardProps> = ({ article, onPlayAudio, userName, onClick }) => {
  // State for Interactions
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  // Determine the image to show
  const getImageSrc = () => {
    if (article.imageUrl && article.imageUrl.startsWith('http')) {
        return article.imageUrl;
    }
    // Fallback to a high quality relevant category image
    return CATEGORY_IMAGES[article.category] || CATEGORY_IMAGES[NewsCategory.TECHNOLOGY];
  };

  // Load initial state
  useEffect(() => {
    const state = getInteractionState(article);
    setIsLiked(state.isLiked);
    setIsSaved(state.isSaved);
    setComments(state.comments);
  }, [article]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleLike(article);
    setIsLiked(newState);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleSave(article);
    setIsSaved(newState);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: article.url || window.location.href,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:translate-y-[-2px] transition-all duration-300"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
         <img 
            src={getImageSrc()}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
                // Ultimate fallback
                (e.target as HTMLImageElement).src = CATEGORY_IMAGES[article.category];
            }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
         
         {/* Category Tag */}
         <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
            {article.category}
            </span>
         </div>
      </div>

      <div className="p-5">
        {/* Header Info */}
        <div className="flex justify-between items-center mb-3 text-xs font-medium text-slate-400">
           <span className="flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
             {article.source}
           </span>
           <span>{article.date}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-800 mb-3 leading-tight group-hover:text-indigo-700 transition-colors line-clamp-2">
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-slate-600 leading-relaxed mb-6 text-sm line-clamp-3">
          {article.summary}
        </p>

        {/* Actions Bar */}
        <div className="flex items-center justify-between border-t border-slate-50 pt-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition-all active:scale-90 ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{isLiked ? (article.likeCount || 0) + 1 : (article.likeCount || 0)}</span>
            </button>
            
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
              <MessageCircle className="w-5 h-5" />
              <span>{comments.length}</span>
            </div>

            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-sky-500 transition-all active:scale-90"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <button 
             onClick={handleSave}
             className={`transition-all active:scale-90 ${isSaved ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;