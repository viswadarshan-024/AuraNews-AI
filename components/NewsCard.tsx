import React, { useState, useEffect } from 'react';
import { NewsArticle, Comment } from '../types';
import { Play, ExternalLink, Sparkles, Loader2, Heart, MessageCircle, Share2, Bookmark, Send } from 'lucide-react';
import { explainArticle, generateSpeech } from '../services/geminiService';
import { toggleLike, toggleSave, addComment, getInteractionState } from '../services/interactionService';

interface NewsCardProps {
  article: NewsArticle;
  onPlayAudio: (buffer: AudioBuffer) => void;
  userName: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onPlayAudio, userName }) => {
  // State for Interactions
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  // State for AI Features
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Load initial state
  useEffect(() => {
    const state = getInteractionState(article);
    setIsLiked(state.isLiked);
    setIsSaved(state.isSaved);
    setComments(state.comments);
  }, [article]);

  const handleLike = () => {
    const newState = toggleLike(article);
    setIsLiked(newState);
  };

  const handleSave = () => {
    const newState = toggleSave(article);
    setIsSaved(newState);
  };

  const handleShare = async () => {
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
    } else {
      alert('Link copied to clipboard!');
    }
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    const updatedComments = addComment(article, newComment, userName);
    setComments(updatedComments);
    setNewComment('');
  };

  const handleExplain = async () => {
    if (explanation) return;
    setIsExplaining(true);
    const text = await explainArticle(article, article.targetLanguage);
    setExplanation(text);
    setIsExplaining(false);
  };

  const handleTTS = async () => {
    setIsGeneratingAudio(true);
    const textToRead = explanation || article.summary;
    const buffer = await generateSpeech(textToRead, article.targetLanguage);
    if (buffer) onPlayAudio(buffer);
    setIsGeneratingAudio(false);
  };

  return (
    <div className="group relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
      
      {/* Category Tag & Date */}
      <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
        <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm border border-indigo-50">
          {article.category}
        </span>
      </div>

      <div className="p-6 pt-14">
        {/* Header Info */}
        <div className="flex justify-between items-center mb-3 text-xs font-medium text-slate-400">
           <span className="flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
             {article.source}
           </span>
           <span>{article.date}</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-800 mb-3 leading-tight group-hover:text-indigo-700 transition-colors">
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-slate-600 leading-relaxed mb-6 text-sm">
          {article.summary}
        </p>

        {/* Actions Bar */}
        <div className="flex items-center justify-between border-t border-slate-50 pt-4 mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition-all active:scale-90 ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{isLiked ? (article.likeCount || 0) + 1 : (article.likeCount || 0)}</span>
            </button>
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-indigo-500 transition-all active:scale-90"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{comments.length}</span>
            </button>

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

        {/* AI Tools */}
        <div className="flex gap-2">
           <button
            onClick={handleTTS}
            disabled={isGeneratingAudio}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
          >
            {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Listen
          </button>
          <button
            onClick={handleExplain}
            disabled={isExplaining || !!explanation}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
          >
             {isExplaining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
             {explanation ? 'Explained' : 'Explain'}
          </button>
        </div>

        {/* Expanded Explanation */}
        {explanation && (
          <div className="mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 animate-in slide-in-from-top-2 fade-in">
            <div className="flex items-center gap-2 mb-2 text-indigo-800 font-semibold text-xs uppercase tracking-wide">
              <Sparkles className="w-3 h-3" />
              AI Breakdown
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">{explanation}</p>
          </div>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Comments</h4>
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
               {comments.length === 0 && (
                   <p className="text-center text-slate-400 text-xs italic py-2">No comments yet. Be the first!</p>
               )}
               {comments.map(c => (
                   <div key={c.id} className="bg-slate-50 p-2.5 rounded-lg text-sm">
                       <div className="flex justify-between items-baseline mb-1">
                           <span className="font-semibold text-slate-700 text-xs">{c.user}</span>
                           <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                       </div>
                       <p className="text-slate-600">{c.text}</p>
                   </div>
               ))}
            </div>
            <div className="relative">
               <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
               />
               <button 
                 onClick={handleSubmitComment}
                 disabled={!newComment.trim()}
                 className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition"
               >
                   <Send className="w-3 h-3" />
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default NewsCard;