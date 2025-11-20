import React, { useState } from 'react';
import { CATEGORIES, SUPPORTED_LANGUAGES } from '../constants';
import { Language, NewsCategory, UserPreferences } from '../types';
import { Globe, User, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<Language[]>([]);
  const [selectedCats, setSelectedCats] = useState<NewsCategory[]>([]);

  const toggleLang = (lang: Language) => {
    setSelectedLangs(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleCat = (cat: NewsCategory) => {
    setSelectedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = () => {
    if (name && selectedLangs.length > 0 && selectedCats.length > 0) {
      onComplete({
        name,
        languages: selectedLangs,
        categories: selectedCats,
        hasOnboarded: true
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Welcome to AuraNews</h1>
          <p className="text-slate-500 mt-2">Personalized, multilingual news intelligence.</p>
        </div>

        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">What should we call you?</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Languages</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggleLang(lang.label)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                    selectedLangs.includes(lang.label) 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-200 hover:border-indigo-200 text-slate-600'
                  }`}
                >
                  <span className="font-medium">{lang.native}</span>
                  {selectedLangs.includes(lang.label) && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Topics of Interest</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCats.includes(cat)
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name || selectedLangs.length === 0 || selectedCats.length === 0}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.99]"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Onboarding;