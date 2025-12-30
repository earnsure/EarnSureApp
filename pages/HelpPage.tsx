
import React, { useState } from 'react';
// Fix: Added ChevronRight to imports
import { ArrowLeft, Mail, Send, Instagram, ChevronDown, ChevronUp, MessageCircle, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';

interface HelpPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onBack, onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How can I earn coins in EarnSure?",
      a: "You can earn coins by completing tasks in the 'Jobs' section, watching video ads, playing games like Aviator or Mines, and claiming your daily loyalty streak. Inviting friends also gives you a massive bonus!"
    },
    {
      q: "What is the minimum withdrawal amount?",
      a: "The minimum withdrawal is 5,000 coins, which is valued at ₹50. You can request a transfer to your UPI, Wallet, or as Gift Cards once you reach this threshold."
    },
    {
      q: "How long does it take to get my money?",
      a: "All withdrawal requests are manually verified by our team for security. Typically, settlements reach your account within 24 to 48 hours."
    },
    {
      q: "Why was my task proof rejected?",
      a: "Proofs are rejected if the screenshot is blurry, incomplete, or doesn't match the task requirements. Make sure you follow the instructions exactly before submitting."
    },
    {
      q: "Is my data secure on EarnSure?",
      a: "Yes! We use end-to-end encryption for all transactions and security protocols to ensure your data remains private and your earnings are safe."
    }
  ];

  return (
    <div className="h-full bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white border border-white/5 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">Support Hub</h2>
          <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Response Line</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 no-scrollbar pb-24">
        {/* Support Cards */}
        <div className="space-y-4">
           <div className="px-1 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Direct Channels</div>
           <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => onNavigate('chat')}
                className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 flex items-center justify-between group active:scale-[0.98] transition-all text-left"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                       <MessageCircle size={24} />
                    </div>
                    <div>
                       <div className="text-sm font-black text-white uppercase tracking-tight">Live Chat</div>
                       <div className="text-[10px] font-bold text-slate-500 italic">Chat with experts in real-time</div>
                    </div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-all">
                    <ChevronRight size={18} />
                 </div>
              </button>

              <a href="mailto:earnsurehelp@gmail.com" className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 flex items-center justify-between group active:scale-[0.98] transition-all">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                       <Mail size={24} />
                    </div>
                    <div>
                       <div className="text-sm font-black text-white uppercase tracking-tight">Email Support</div>
                       <div className="text-[10px] font-bold text-slate-500">earnsurehelp@gmail.com</div>
                    </div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-all">
                    <MessageCircle size={18} />
                 </div>
              </a>

              <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 flex items-center justify-between opacity-60">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-600/10 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-500/20">
                       <Send size={24} />
                    </div>
                    <div>
                       <div className="text-sm font-black text-white uppercase tracking-tight">Telegram Group</div>
                       <div className="text-[10px] font-bold text-slate-500">COMING SOON</div>
                    </div>
                 </div>
                 <div className="px-3 py-1 bg-slate-950 rounded-full text-[8px] font-black text-slate-600 uppercase tracking-widest">Wait</div>
              </div>
           </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4">
           <div className="px-1 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Common Knowledge</div>
           <div className="space-y-3">
              {faqs.map((faq, idx) => (
                 <div 
                   key={idx} 
                   className={`bg-slate-900/40 border rounded-[2rem] overflow-hidden transition-all duration-300 ${openFaq === idx ? 'border-blue-500/30' : 'border-white/5'}`}
                 >
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full p-6 flex items-center justify-between text-left"
                    >
                       <span className={`text-[11px] font-black uppercase tracking-tight transition-colors ${openFaq === idx ? 'text-blue-500' : 'text-slate-300'}`}>{faq.q}</span>
                       {openFaq === idx ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-slate-600" />}
                    </button>
                    <div className={`px-6 transition-all duration-300 overflow-hidden ${openFaq === idx ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                       <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">{faq.a}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Trust Footer */}
        <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-[2.5rem] flex flex-col items-center text-center space-y-3">
           <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
              <ShieldCheck size={28} />
           </div>
           <div className="space-y-1">
              <div className="text-xs font-black text-white uppercase tracking-widest">Verified Protection</div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Response within 24 hours guaranteed</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
