import React, { useState, useEffect } from 'react';
import { NEWS_CHANNELS } from '../constants';
import { getFollowedChannels, toggleFollowChannel } from '../services/interactionService';
import { Plus, Check, Search, Globe } from 'lucide-react';

const Channels: React.FC = () => {
  const [followed, setFollowed] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFollowed(getFollowedChannels());
  }, []);

  const handleToggle = (id: string) => {
    const newState = toggleFollowChannel(id);
    if (newState) {
      setFollowed([...followed, id]);
    } else {
      setFollowed(followed.filter(fid => fid !== id));
    }
  };

  const filteredChannels = NEWS_CHANNELS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Discover Channels</h1>
              <p className="text-slate-500 text-sm">Follow trusted sources from around the world</p>
            </div>
            <div className="bg-indigo-50 p-2 rounded-full">
               <Globe className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search channels by name or language..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition"
            />
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredChannels.map(channel => {
            const isFollowing = followed.includes(channel.id);
            return (
              <div key={channel.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
                 <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                    <img 
                      src={channel.logo} 
                      alt={channel.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=random`}
                    />
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{channel.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                       <span className="bg-slate-100 px-2 py-0.5 rounded-md">{channel.language}</span>
                       <span className="truncate">• {channel.category}</span>
                    </div>
                 </div>

                 <button
                   onClick={() => handleToggle(channel.id)}
                   className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                     isFollowing 
                     ? 'bg-indigo-100 text-indigo-600' 
                     : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'
                   }`}
                 >
                    {isFollowing ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                 </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Channels;