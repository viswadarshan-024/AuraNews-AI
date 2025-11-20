import React, { useEffect, useRef, useState } from 'react';
import { LiveClient } from '../services/liveClient';
import { Mic, MicOff, X, AlertCircle } from 'lucide-react';
import { UserPreferences } from '../types';

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  userPrefs: UserPreferences;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ isOpen, onClose, userPrefs }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{user: string, model: string}>({ user: '', model: '' });
  const liveClientRef = useRef<LiveClient | null>(null);
  
  const systemInstruction = `
    You are a knowledgeable news anchor and assistant for ${userPrefs.name}.
    Your goal is to discuss news topics: ${userPrefs.categories.join(', ')}.
    You should speak in a friendly, professional tone.
    The user prefers these languages: ${userPrefs.languages.join(', ')}.
    If they ask for news in a specific language, switch to it.
    
    IMPORTANT: You have access to a tool called "search_news".
    If the user asks for news about a specific topic, past events, or asks "what happened on [date]",
    you MUST use the "search_news" tool to find the information before answering.
    
    Keep responses concise and engaging.
  `;

  useEffect(() => {
    // Mount logic
    if (isOpen && !liveClientRef.current) {
      setError(null);
      const client = new LiveClient();
      
      client.onTranscriptionUpdate = (u, m) => {
        setTranscript({ user: u, model: m });
      };

      client.onConnect = () => setIsConnected(true);
      client.onDisconnect = () => setIsConnected(false);
      client.onError = (err) => {
        setIsConnected(false);
        setError("Connection disrupted. Please check your network or API key.");
      };

      liveClientRef.current = client;
      
      client.connect(systemInstruction).catch(err => {
          console.error("Initial connection failed", err);
          setError("Could not connect to Live Service.");
      });
    }

    // Cleanup logic
    return () => {
      if (liveClientRef.current) {
        liveClientRef.current.disconnect();
        liveClientRef.current = null;
        setIsConnected(false);
        setTranscript({ user: '', model: '' });
        setError(null);
      }
    };
  }, [isOpen, systemInstruction]); // Removed onClose from dependency to avoid unnecessary re-runs

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Live News Assistant</h2>
            <p className="text-indigo-100 text-sm">Conversational Mode</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Visualization Area */}
        <div className="h-72 flex flex-col items-center justify-center p-8 bg-slate-50 relative overflow-y-auto">
          {error ? (
             <div className="flex flex-col items-center gap-3 text-rose-500 text-center">
               <AlertCircle className="w-10 h-10" />
               <p className="font-medium">{error}</p>
               <button onClick={onClose} className="text-sm underline">Close</button>
             </div>
          ) : !isConnected ? (
             <div className="flex flex-col items-center gap-3 text-slate-400">
               <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
               <p>Connecting to satellite...</p>
             </div>
          ) : (
            <>
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0 mb-6">
                <span className="absolute inset-0 bg-indigo-500 opacity-20 rounded-full animate-ping" />
                <span className="absolute inset-2 bg-indigo-500 opacity-20 rounded-full animate-pulse delay-75" />
                <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-10">
                   <Mic className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3 w-full">
                 {transcript.user && (
                     <div className="animate-in slide-in-from-bottom-2 fade-in">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">You</p>
                        <p className="text-slate-700 bg-white px-4 py-2 rounded-xl shadow-sm inline-block border border-slate-100">
                            {transcript.user}
                        </p>
                     </div>
                 )}
                 {transcript.model && (
                     <div className="animate-in slide-in-from-bottom-2 fade-in">
                        <p className="text-xs font-bold text-indigo-400 uppercase mb-1">AI Anchor</p>
                        <p className="text-indigo-900 font-medium">
                            {transcript.model}
                        </p>
                     </div>
                 )}
                 {!transcript.user && !transcript.model && (
                     <p className="text-slate-400 animate-pulse text-sm">Listening for your request...</p>
                 )}
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-slate-100 bg-white">
            <div className="flex justify-center">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-full font-medium transition transform active:scale-95"
                >
                    <MicOff className="w-5 h-5" />
                    End Session
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;