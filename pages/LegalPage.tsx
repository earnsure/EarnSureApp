
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Scale, FileText } from 'lucide-react';
import { rtdb } from '../firebase-mock';
import { onValue, ref } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

interface LegalPageProps {
  onBack: () => void;
  type: 'terms' | 'privacy';
}

const LegalPage: React.FC<LegalPageProps> = ({ onBack, type }) => {
  const [content, setContent] = useState<string>('Syncing with legal servers...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onValue(ref(rtdb, 'settings/legal'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setContent(type === 'terms' ? data.terms : data.privacy);
      } else {
        setContent(type === 'terms' 
          ? "No Terms and Conditions have been published yet." 
          : "No Privacy Policy has been published yet.");
      }
      setLoading(false);
    });

    return () => unsub();
  }, [type]);

  const title = type === 'terms' ? "Terms & Conditions" : "Privacy Policy";
  const Icon = type === 'terms' ? Scale : ShieldCheck;

  return (
    <div className="h-full bg-slate-950 flex flex-col text-white animate-in slide-in-from-right duration-300">
       <div className="p-4 flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white border border-white/5 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">{title}</h2>
            <div className="flex items-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">EarnSure Protocol Document</span>
            </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-12">
          <div className="max-w-prose mx-auto space-y-8">
             <div className="flex flex-col items-center py-8 opacity-20">
                <Icon size={64} className="text-blue-500" />
             </div>

             {loading ? (
                <div className="flex flex-col items-center gap-4 py-20">
                   <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Fetching Document...</p>
                </div>
             ) : (
                <div className="space-y-6">
                   <div className="prose prose-invert max-w-none">
                      <p className="text-[12px] font-medium leading-[1.8] text-slate-300 whitespace-pre-wrap font-sans">
                         {content || "Nothing published in this section."}
                      </p>
                   </div>

                   <div className="pt-10 border-t border-white/5 flex flex-col items-center gap-4">
                      <div className="bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-500/10">
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Verified Document Node</span>
                      </div>
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">This document is subject to change without prior notice.</p>
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default LegalPage;
