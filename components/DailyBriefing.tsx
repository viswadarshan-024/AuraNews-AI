import React, { useEffect, useState, useRef } from 'react';
import { NewsArticle, UserPreferences, Language } from '../types';
import { fetchDailyBriefing, explainArticle, generateSpeech } from '../services/geminiService';
import { getBriefingCache, setBriefingCache } from '../services/cacheService';
import { Play, Pause, SkipForward, Sparkles, Loader2, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';

interface DailyBriefingProps {
  prefs: UserPreferences;
  onArticleSelect: (article: NewsArticle) => void;
}

const DailyBriefing: React.FC<DailyBriefingProps> = ({ prefs, onArticleSelect }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);
  const [isBriefingMode, setIsBriefingMode] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      
      // Check cache first
      const cached = getBriefingCache();
      if (cached && cached.articles.length > 0) {
        setArticles(cached.articles);
        setLoading(false);
        return;
      }

      // If no valid cache, fetch fresh
      const data = await fetchDailyBriefing(prefs.categories, prefs.languages[0]);
      setArticles(data);
      setBriefingCache(data, prefs.languages[0]);
      setLoading(false);
    };
    load();
  }, [prefs]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const stopAudio = () => {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (e) {}
      currentSourceRef.current = null;
    }
    setCurrentPlayingIndex(-1);
    setIsBriefingMode(false);
  };

  const playText = async (text: string, index: number, continueSequence: boolean) => {
    stopAudio(); // Stop anything currently playing
    
    // Set state *after* stop to ensure UI updates correctly for the new item
    setCurrentPlayingIndex(index); 
    if (continueSequence) setIsBriefingMode(true);
    setLoadingAudio(true);

    const buffer = await generateSpeech(text, prefs.languages[0]);
    setLoadingAudio(false);

    if (!buffer) {
        // If failed, skip to next if in sequence
        if (continueSequence) playNext(index);
        return;
    }

    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      if (continueSequence) {
        playNext(index);
      } else {
        setCurrentPlayingIndex(-1);
      }
    };

    currentSourceRef.current = source;
    source.start();
  };

  const playNext = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < articles.length) {
      playText(articles[nextIndex].summary, nextIndex, true);
    } else {
      setIsBriefingMode(false);
      setCurrentPlayingIndex(-1);
    }
  };

  const handlePlayBriefing = () => {
    if (articles.length > 0) {
      playText(articles[0].summary, 0, true);
    }
  };

  const handleExplain = async (article: NewsArticle) => {
    if (explanations[article.id]) {
      setExpandedId(expandedId === article.id ? null : article.id);
      return;
    }

    setExpandedId(article.id);
    setLoadingExplanation(article.id);
    const text = await explainArticle(article, prefs.languages[0]);
    setExplanations(prev => ({ ...prev, [article.id]: text }));
    setLoadingExplanation(null);
  };

  const handlePlayItem = (article: NewsArticle, index: number) => {
    const isExpanded = expandedId === article.id;
    const textToRead = isExpanded && explanations[article.id] ? explanations[article.id] : article.summary;
    
    // If currently playing this item, stop it
    if (currentPlayingIndex === index && !loadingAudio) {
        stopAudio();
    } else {
        playText(textToRead, index, false); // False = don't auto-advance
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-slate-900 text-white pb-12 pt-8 px-4 rounded-b-3xl shadow-xl">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            Daily Briefing
          </h2>
          <p className="text-slate-400 text-sm">Your 2-minute AI curated update for today.</p>
          
          {!loading && articles.length > 0 && (
             <button
               onClick={isBriefingMode ? stopAudio : handlePlayBriefing}
               className="mt-6 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold flex items-center justify-center gap-3 mx-auto transition-all transform hover:scale-105 shadow-lg shadow-indigo-900/50"
             >
               {isBriefingMode ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
               {isBriefingMode ? 'Pause Briefing' : 'Listen to Briefing'}
             </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
        {loading ? (
           <div className="space-y-4">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="bg-white h-24 rounded-2xl shadow-sm animate-pulse" />
             ))}
           </div>
        ) : (
          articles.map((article, index) => {
            const isPlaying = currentPlayingIndex === index;
            const isExpanded = expandedId === article.id;
            const hasExplanation = !!explanations[article.id];

            return (
              <div 
                key={article.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 cursor-pointer ${
                  isPlaying ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-indigo-100' : 'border-slate-100 hover:border-indigo-200'
                }`}
                onClick={() => onArticleSelect(article)}
              >
                <div className="flex justify-between items-start gap-4">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-xs font-bold text-indigo-600 uppercase">{article.category}</span>
                         <span className="text-slate-400 text-xs">• {article.source}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 leading-snug mb-2">{article.title}</h3>
                      <p className="text-slate-600 text-sm line-clamp-2">{article.summary}</p>
                   </div>
                   
                   <button
                     onClick={(e) => { e.stopPropagation(); handlePlayItem(article, index); }}
                     disabled={loadingAudio && !isPlaying}
                     className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition ${
                        isPlaying 
                        ? 'bg-indigo-100 text-indigo-600' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                     }`}
                   >
                      {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 ml-0.5" />}
                   </button>
                </div>

                {/* Expanded Explanation Area */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                        {loadingExplanation === article.id ? (
                            <div className="flex items-center gap-2 text-indigo-600 text-sm py-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating detailed explanation...
                            </div>
                        ) : (
                            <div className="bg-indigo-50/50 rounded-xl p-4 text-sm text-indigo-900 leading-relaxed">
                                <div className="flex items-center gap-2 mb-2 font-semibold text-indigo-700">
                                    <Sparkles className="w-4 h-4" />
                                    AI Deep Dive
                                </div>
                                {explanations[article.id]}
                            </div>
                        )}
                    </div>
                )}

                {/* Action Footer */}
                <div className="mt-3 flex items-center gap-2">
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleExplain(article); }}
                     className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition"
                   >
                      {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Hide Explanation
                          </>
                      ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            {hasExplanation ? 'Show Explanation' : 'Get Detailed Explanation'}
                          </>
                      )}
                   </button>
                </div>
              </div>
            );
          })
        )}
        
        {!loading && articles.length === 0 && (
            <div className="text-center py-10 text-slate-500">
                No briefing available for today.
            </div>
        )}
      </div>
    </div>
  );
};

export default DailyBriefing;