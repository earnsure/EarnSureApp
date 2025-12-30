
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, User, Zap, ShieldCheck } from 'lucide-react';
import { db } from '../firebase-mock';
import { User as UserType, ChatMessage } from '../types';

interface ChatPageProps {
  user: UserType;
  onBack: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ user, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = db.listenToChat(user.uid, (msgs) => {
      setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
    });
    return () => unsub();
  }, [user.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msgText = inputText;
    setInputText('');
    
    await db.sendMessage(user.uid, {
      senderId: user.uid,
      text: msgText,
      isAdmin: false
    });
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-white/5 transition-all">
             <ArrowLeft size={18} />
           </button>
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                <ShieldCheck size={20} />
             </div>
             <div>
                <h2 className="text-xs font-black text-white uppercase tracking-widest">Support Agent</h2>
                <div className="flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">End-to-End Secure</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-10"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 space-y-4 px-10 text-center">
             <Zap size={48} />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">Session Initialized. Send a message to start.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[80%] p-4 rounded-3xl ${
              msg.isAdmin 
                ? 'bg-slate-900 border border-white/5 text-slate-200 rounded-bl-none' 
                : 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-600/10'
            }`}>
              <p className="text-[11px] font-medium leading-relaxed">{msg.text}</p>
              <div className={`text-[7px] font-black uppercase tracking-widest mt-1.5 opacity-40 text-right`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-white/5 pb-10">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write a message..."
            className="w-full bg-slate-950 border border-white/10 rounded-[2rem] py-4 pl-6 pr-14 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:grayscale transition-all shadow-lg active:scale-90"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
