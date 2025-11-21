import React, { useEffect, useState } from 'react';
import { NewsArticle } from '../types';
import { getSavedArticles } from '../services/interactionService';
import NewsCard from './NewsCard';
import { Bookmark, LayoutGrid } from 'lucide-react';

interface SavedNewsProps {
  userName: string;
  onArticleSelect: (article: NewsArticle) => void;
}

const SavedNews: React.FC<SavedNewsProps> = ({ userName, onArticleSelect }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [audioContext] = useState(() => new (window.AudioContext || (window as any).webkitAudioContext)());
  const [playingAudio, setPlayingAudio] = useState<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Load saved articles on mount
    setArticles(getSavedArticles());
  }, []);

  const handlePlayAudio = async (buffer: AudioBuffer) => {
    if (playingAudio) playingAudio.stop();
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
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                    <Bookmark className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Saved Stories</h1>
                    <p className="text-slate-500 text-sm">Your personal reading list</p>
                </div>
            </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <LayoutGrid className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-semibold text-slate-800">No saved articles yet</h3>
             <p className="text-slate-500 max-w-xs mt-2">Tap the bookmark icon on any news card to add it to your collection.</p>
          </div>
        ) : (
          <div className="space-y-6">
             {articles.map(article => (
                <NewsCard 
                   key={article.id} 
                   article={article} 
                   onPlayAudio={handlePlayAudio}
                   userName={userName}
                   onClick={() => onArticleSelect(article)}
                />
             ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedNews;