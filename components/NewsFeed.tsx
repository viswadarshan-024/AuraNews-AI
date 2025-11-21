import React, { useEffect, useState, useCallback } from 'react';
import { NewsArticle, UserPreferences, Language, NewsCategory } from '../types';
import { fetchNewsArticles } from '../services/geminiService';
import { getFeedCache, setFeedCache } from '../services/cacheService';
import NewsCard from './NewsCard';
import { RefreshCcw, Globe, Calendar, Filter, Search, Flame, Tv } from 'lucide-react';
import { CATEGORIES } from '../constants';

interface NewsFeedProps {
  prefs: UserPreferences;
  onOpenLive: () => void;
  onArticleSelect: (article: NewsArticle) => void;
  onNavigateToChannels: () => void;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ prefs, onOpenLive, onArticleSelect, onNavigateToChannels }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLang, setCurrentLang] = useState<Language>(prefs.languages[0]);
  const [streak, setStreak] = useState(1);
  
  // Filter States
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [playingAudio, setPlayingAudio] = useState<AudioBufferSourceNode | null>(null);
  const [audioContext] = useState(() => new (window.AudioContext || (window as any).webkitAudioContext)());

  const performSearch = async () => {
    setLoading(true);
    if (playingAudio) {
      try { playingAudio.stop(); } catch (e) {}
      setPlayingAudio(null);
    }
    
    const catsToFetch = selectedCategory !== 'All' 
        ? [selectedCategory as NewsCategory] 
        : prefs.categories;
        
    const fetched = await fetchNewsArticles(
        catsToFetch, 
        currentLang, 
        selectedDate || undefined,
        selectedCategory !== 'All' ? selectedCategory : undefined
    );
    
    setArticles(fetched);
    setFeedCache(fetched, currentLang);
    setLoading(false);
  };

  // Initial load: Check cache, if empty then fetch
  useEffect(() => {
    const cached = getFeedCache();
    if (cached && cached.articles.length > 0) {
        setArticles(cached.articles);
        setLoading(false);
    } else {
        performSearch();
    }
    
    // Simulate Streak logic (usually would be from local storage/backend)
    const savedStreak = localStorage.getItem('auranews_streak');
    if (savedStreak) setStreak(parseInt(savedStreak));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayAudio = async (buffer: AudioBuffer) => {
    if (playingAudio) {
        try { playingAudio.stop(); } catch (e) {}
    }
    if (audioContext.state === 'suspended') await audioContext.resume();

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    setPlayingAudio(source);
    source.onended = () => setPlayingAudio(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">
                        AuraNews
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Intelligent Briefs</p>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Channels Button (Top Navigation) */}
                    <button 
                        onClick={onNavigateToChannels}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-medium transition hover:bg-indigo-100"
                    >
                        <Tv className="w-4 h-4" />
                        <span className="hidden sm:inline">Channels</span>
                    </button>

                    {/* Streak Badge */}
                    <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                        <Flame className="w-4 h-4 fill-current" />
                        <span className="text-xs font-bold">{streak}</span>
                    </div>

                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition border border-transparent hover:border-slate-200">
                            <Globe className="w-4 h-4 text-indigo-500" />
                            <span className="hidden sm:inline">{currentLang}</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 hidden group-hover:block p-1.5 max-h-64 overflow-y-auto">
                            {prefs.languages.map(l => (
                                <button 
                                key={l} 
                                onClick={() => setCurrentLang(l)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${l === currentLang ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                {l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-transparent hover:border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-100 outline-none text-slate-600 transition-all"
                        placeholder="Select Date"
                    />
                </div>
                
                <div className="relative flex-1">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-transparent hover:border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-100 outline-none appearance-none text-slate-600 transition-all"
                    >
                        <option value="All">All My Topics</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={performSearch} 
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-200 disabled:opacity-70 active:scale-[0.98]"
                >
                    {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span className="hidden sm:inline">Explore</span>
                </button>
            </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 animate-in fade-in slide-in-from-bottom-2">
             <span>Showing:</span>
             <span className="font-semibold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full">
                {selectedCategory === 'All' ? 'For You' : selectedCategory}
             </span>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-50 animate-pulse h-64"></div>
            ))}
          </div>
        ) : articles.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No news found</h3>
                <p className="text-slate-500 mt-1">Try adjusting your filters to see more stories.</p>
            </div>
        ) : (
          <div className="space-y-8">
            {articles.map((article) => (
              <NewsCard 
                key={article.id} 
                article={article} 
                onPlayAudio={handlePlayAudio} 
                userName={prefs.name}
                onClick={() => onArticleSelect(article)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NewsFeed;