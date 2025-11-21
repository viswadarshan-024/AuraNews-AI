import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import NewsFeed from './components/NewsFeed';
import DailyBriefing from './components/DailyBriefing';
import LiveAssistant from './components/LiveAssistant';
import SavedNews from './components/SavedNews';
import Profile from './components/Profile';
import ArticleDetail from './components/ArticleDetail';
import Channels from './components/Channels';
import { UserPreferences, NewsArticle } from './types';
import { Newspaper, Radio, Mic, User, Bookmark } from 'lucide-react';

const PREFS_KEY = 'auranews_prefs';

type ViewType = 'feed' | 'briefing' | 'channels' | 'saved' | 'profile';

const App: React.FC = () => {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('feed');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) {
      setPrefs(JSON.parse(saved));
    }
  }, []);

  const handleOnboardingComplete = (newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  };

  const handleUpdatePrefs = (newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  };

  const handleLogout = () => {
    localStorage.removeItem(PREFS_KEY);
    setPrefs(null);
    setCurrentView('feed');
  };

  const handleArticleSelect = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  if (!prefs) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (selectedArticle) {
      return (
        <ArticleDetail 
            article={selectedArticle} 
            onBack={() => setSelectedArticle(null)}
            userName={prefs.name}
        />
      );
  }

  const renderView = () => {
    switch (currentView) {
      case 'feed':
        return <NewsFeed 
          prefs={prefs} 
          onOpenLive={() => setIsLiveOpen(true)} 
          onArticleSelect={handleArticleSelect}
          onNavigateToChannels={() => setCurrentView('channels')}
        />;
      case 'briefing':
        return <DailyBriefing prefs={prefs} onArticleSelect={handleArticleSelect} />;
      case 'channels':
        return <Channels />;
      case 'saved':
        return <SavedNews userName={prefs.name} onArticleSelect={handleArticleSelect} />;
      case 'profile':
        return <Profile prefs={prefs} onUpdate={handleUpdatePrefs} onLogout={handleLogout} />;
      default:
        return <NewsFeed 
          prefs={prefs} 
          onOpenLive={() => setIsLiveOpen(true)} 
          onArticleSelect={handleArticleSelect} 
          onNavigateToChannels={() => setCurrentView('channels')}
        />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* View Rendering */}
      <div className="pb-24 animate-in fade-in duration-300">
        {renderView()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-2 py-2 z-40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-end max-w-md mx-auto relative">
            
            <NavButton 
               active={currentView === 'feed'} 
               onClick={() => setCurrentView('feed')} 
               icon={<Newspaper className="w-6 h-6" />} 
               label="Feed" 
            />

            <NavButton 
               active={currentView === 'briefing'} 
               onClick={() => setCurrentView('briefing')} 
               icon={<Radio className="w-6 h-6" />} 
               label="Briefing" 
            />

            {/* Floating Action Button for Live */}
            <div className="relative -top-6 mx-1">
                <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-30 rounded-full"></div>
                <button
                    onClick={() => setIsLiveOpen(true)}
                    className="relative bg-gradient-to-br from-indigo-600 to-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transform transition hover:scale-105 active:scale-95"
                >
                    <Mic className="w-6 h-6" />
                </button>
            </div>

            <NavButton 
               active={currentView === 'saved'} 
               onClick={() => setCurrentView('saved')} 
               icon={<Bookmark className="w-6 h-6" />} 
               label="Saved" 
            />

            <NavButton 
               active={currentView === 'profile'} 
               onClick={() => setCurrentView('profile')} 
               icon={<User className="w-6 h-6" />} 
               label="Profile" 
            />
        </div>
      </div>

      <LiveAssistant 
        isOpen={isLiveOpen} 
        onClose={() => setIsLiveOpen(false)}
        userPrefs={prefs}
      />
    </div>
  );
};

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex flex-col items-center gap-1 pb-2 pt-3 transition-all duration-300 ${active ? 'text-indigo-600 -translate-y-1' : 'text-slate-400 hover:text-slate-600'}`}
    >
        <div className={`transition-all duration-300 ${active ? 'scale-110 drop-shadow-md' : 'scale-100'}`}>
            {icon}
        </div>
        <span className={`text-[10px] font-bold transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
        {active && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-indigo-600" />}
    </button>
);

export default App;