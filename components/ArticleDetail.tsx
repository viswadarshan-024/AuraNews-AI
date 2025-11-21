import React, { useState, useEffect } from 'react';
import { NewsArticle, Comment } from '../types';
import { ChevronLeft, ExternalLink, Share2, Bookmark, Heart, MessageCircle, Play, Loader2, Sparkles, Send } from 'lucide-react';
import { toggleLike, toggleSave, addComment, getInteractionState } from '../services/interactionService';
import { explainArticle, generateSpeech } from '../services/geminiService';

interface ArticleDetailProps {
  article: NewsArticle;
  onBack: () => void;
  userName: string;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack, userName }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    
    const state = getInteractionState(article);
    setIsLiked(state.isLiked);
    setIsSaved(state.isSaved);
    setComments(state.comments);
  }, [article]);

  const handleLike = () => {
    setIsLiked(toggleLike(article));
  };

  const handleSave = () => {
    setIsSaved(toggleSave(article));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: article.url || window.location.href,
        });
      } catch (err) { /* ignore */ }
    }
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    setComments(addComment(article, newComment, userName));
    setNewComment('');
  };

  const handleExplain = async () => {
    if (explanation) return;
    setIsExplaining(true);
    const text = await explainArticle(article, article.targetLanguage);
    setExplanation(text);
    setIsExplaining(false);
  };

  const handlePlayAudio = async () => {
    setIsGeneratingAudio(true);
    const textToRead = explanation || article.summary;
    const buffer = await generateSpeech(textToRead, article.targetLanguage);
    if (buffer) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
    }
    setIsGeneratingAudio(false);
  };

  return (
    <div className="min-h-screen bg-white pb-20 animate-in slide-in-from-right duration-300">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition text-slate-700"
        >
            <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
            <button onClick={handleSave} className="p-2 hover:bg-slate-100 rounded-full transition">
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-amber-500 text-amber-500' : 'text-slate-500'}`} />
            </button>
            <button onClick={handleShare} className="p-2 hover:bg-slate-100 rounded-full transition">
                <Share2 className="w-5 h-5 text-slate-500" />
            </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="w-full h-64 sm:h-80 bg-slate-200 relative">
        <img 
            src={article.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(article.title)}?nologo=true`} 
            alt={article.title}
            className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-16">
             <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-bold uppercase rounded-full shadow-sm mb-2">
                {article.category}
             </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 max-w-3xl mx-auto">
         <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <span className="font-semibold text-slate-800">{article.source}</span>
            <span>•</span>
            <span>{article.date}</span>
         </div>

         <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-6">
            {article.title}
         </h1>

         <div className="prose prose-slate prose-lg mb-8">
            <p className="text-slate-700 leading-relaxed">
                {article.summary}
            </p>
         </div>

         {/* Explanation Section */}
         {explanation && (
            <div className="mb-8 bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center gap-2 mb-3 text-indigo-700 font-bold">
                    <Sparkles className="w-5 h-5" />
                    <h3>AI Simplified Explanation</h3>
                </div>
                <p className="text-slate-700 leading-relaxed">{explanation}</p>
            </div>
         )}

         {/* Action Buttons */}
         <div className="flex flex-wrap gap-3 mb-8">
            <button 
                onClick={handlePlayAudio}
                disabled={isGeneratingAudio}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-medium shadow-lg shadow-slate-200 active:scale-[0.98] transition"
            >
                {isGeneratingAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                Listen
            </button>
            
            <button 
                onClick={handleExplain}
                disabled={isExplaining || !!explanation}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-medium active:scale-[0.98] transition"
            >
                {isExplaining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Explain
            </button>

            {article.url && (
                <a 
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium active:scale-[0.98] transition hover:bg-slate-50"
                >
                    <ExternalLink className="w-5 h-5" />
                    Full Story
                </a>
            )}
         </div>

         {/* Interaction Stats */}
         <div className="flex items-center justify-between py-4 border-y border-slate-100 mb-6">
             <button 
                onClick={handleLike}
                className={`flex items-center gap-2 ${isLiked ? 'text-rose-500' : 'text-slate-500'}`}
             >
                 <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                 <span className="font-medium text-sm">{(article.likeCount || 0) + (isLiked ? 1 : 0)} Likes</span>
             </button>
             <div className="flex items-center gap-2 text-slate-500">
                 <MessageCircle className="w-6 h-6" />
                 <span className="font-medium text-sm">{comments.length} Comments</span>
             </div>
         </div>

         {/* Comments */}
         <div className="space-y-6">
            <h3 className="font-bold text-lg text-slate-900">Discussion</h3>
            
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <p className="text-slate-400 text-center italic">No comments yet.</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="bg-slate-50 p-4 rounded-xl">
                             <div className="flex justify-between items-baseline mb-1">
                                 <span className="font-bold text-slate-700 text-sm">{c.user}</span>
                                 <span className="text-xs text-slate-400">{c.timestamp}</span>
                             </div>
                             <p className="text-slate-600">{c.text}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="relative">
               <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
               />
               <button 
                 onClick={handleSubmitComment}
                 disabled={!newComment.trim()}
                 className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition"
               >
                   <Send className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ArticleDetail;