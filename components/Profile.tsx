import React, { useState } from 'react';
import { UserPreferences, Language, NewsCategory } from '../types';
import { SUPPORTED_LANGUAGES, CATEGORIES } from '../constants';
import { User, Save, Check, LogOut } from 'lucide-react';

interface ProfileProps {
  prefs: UserPreferences;
  onUpdate: (prefs: UserPreferences) => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ prefs, onUpdate, onLogout }) => {
  const [name, setName] = useState(prefs.name);
  const [languages, setLanguages] = useState<Language[]>(prefs.languages);
  const [categories, setCategories] = useState<NewsCategory[]>(prefs.categories);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdate({ ...prefs, name, languages, categories });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleLang = (lang: Language) => {
    setLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleCat = (cat: NewsCategory) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-white border-b border-slate-100">
            <div className="max-w-2xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500">Manage your preferences</p>
            </div>
        </div>

        <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
            {/* Identity Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <User className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Display Name</label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-lg font-semibold text-slate-900 border-none p-0 focus:ring-0 bg-transparent placeholder-slate-300"
                    />
                </div>
            </div>

            {/* Languages */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">Languages</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => toggleLang(lang.label)}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                                languages.includes(lang.label)
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-inner'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            <span>{lang.native}</span>
                            {languages.includes(lang.label) && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                 </div>
            </div>

            {/* Categories */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">Interests</h3>
                 <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => toggleCat(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                categories.includes(cat)
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                 </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <button 
                    onClick={handleSave}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    {isSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {isSaved ? 'Saved!' : 'Save Changes'}
                </button>
                
                <button 
                    onClick={onLogout}
                    className="px-6 py-4 bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl font-semibold transition-all active:scale-[0.98]"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </main>
    </div>
  );
};

export default Profile;