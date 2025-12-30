
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, CheckCircle2, Zap, Coins, 
  Loader2, MonitorPlay, Lock, Unlock, AlertCircle
} from 'lucide-react';
import { db } from '../firebase-mock';
import { TransactionType, User } from '../types';

interface WatchAdsPageProps {
  onBack: () => void;
  user: User;
}

const WatchAdsPage: React.FC<WatchAdsPageProps> = ({ onBack, user }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'watching' | 'claimable' | 'success'>('idle');
  const [timer, setTimer] = useState(30);
  const countdownRef = useRef<any>(null);

  const startAdTask = () => {
    setStatus('loading');
    
    setTimeout(() => {
      // Load Adsterra script
      const adScript = document.createElement("script");
      adScript.src = "https://passivealexis.com/7c/7d/38/7c7d38479bc1f51cfc2b7301fab3bfca.js";
      document.body.appendChild(adScript);
      
      setStatus('watching');
      setTimer(30);
      
      countdownRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setStatus('claimable');
            if (window.navigator.vibrate) window.navigator.vibrate(200);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1500);
  };

  const handleClaimCoins = async () => {
    if (status !== 'claimable') return;
    setStatus('loading');
    try {
      await db.addTransaction(user.uid, {
        uid: user.uid,
        amount: 15,
        type: TransactionType.EARN,
        method: 'Rewarded Ad',
        description: '30s Ad View Verified'
      });
      setStatus('success');
      setTimeout(() => onBack(), 2000);
    } catch (e) {
      alert("Verification Failed.");
      setStatus('claimable');
    }
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_transparent_70%)] opacity-30"></div>
      <div className="p-4 flex items-center justify-between bg-slate-900/60 backdrop-blur-xl border-b border-white/5 z-50">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl text-slate-400 border border-white/5 active:scale-90 transition-all"><ArrowLeft size={20} /></button>
        <div className="text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Ad Protocol v3.0</h2>
          <div className="text-sm font-black text-white italic tracking-tighter uppercase leading-none">Rewarded Node</div>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
           <span className="text-white font-black text-xs tabular-nums">{user.wallet_coins.toLocaleString()}</span>
           <Coins size={14} className="text-yellow-500" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-10 z-10">
        {status === 'idle' && (
           <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
              <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center border border-blue-500/20 shadow-2xl"><MonitorPlay size={48} className="text-blue-500" /></div>
              <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Watch & Earn</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest max-w-[200px] leading-relaxed mx-auto">Watch for 30s to claim 15 Coins.</p>
              </div>
           </div>
        )}
        {status === 'loading' && (
           <div className="flex flex-col items-center gap-6">
              <div className="relative"><div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div><Zap className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={24} /></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Connecting Ad Node...</p>
           </div>
        )}
        {status === 'watching' && (
           <div className="flex flex-col items-center gap-8">
              <div className="relative flex items-center justify-center">
                 <div className="w-40 h-40 rounded-full border-4 border-white/5 flex items-center justify-center"><div className="text-5xl font-black text-white tabular-nums">{timer}</div></div>
                 <svg className="absolute inset-0 w-40 h-40 -rotate-90">
                    <circle cx="80" cy="80" r="76" fill="none" stroke="currentColor" strokeWidth="4" className="text-blue-500/10" />
                    <circle cx="80" cy="80" r="76" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="477" strokeDashoffset={477 - (477 * timer / 30)} className="text-blue-500 transition-all duration-1000" />
                 </svg>
              </div>
              <div className="text-center space-y-2">
                 <div className="flex items-center justify-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-1 rounded-full border border-yellow-500/20"><Lock size={12} /><span className="text-[10px] font-black uppercase tracking-widest">Verifying Connection</span></div>
              </div>
           </div>
        )}
        {status === 'claimable' && (
           <div className="flex flex-col items-center gap-8 animate-in zoom-in">
              <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl"><Unlock size={48} className="text-white" /></div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">View Verified</h3>
           </div>
        )}
        {status === 'success' && (
           <div className="flex flex-col items-center gap-6"><div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl"><CheckCircle2 size={48} className="text-white" /></div><h3 className="text-xl font-black text-white uppercase italic tracking-widest">Coins Added</h3></div>
        )}

        <div className="w-full max-w-sm px-4">
           {status === 'idle' && <button onClick={startAdTask} className="w-full py-6 rounded-[2.5rem] bg-blue-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all border-b-4 border-blue-800 flex items-center justify-center gap-3"><MonitorPlay size={18} /> Watch Ad</button>}
           {status === 'claimable' && <button onClick={handleClaimCoins} className="w-full py-6 rounded-[2.5rem] bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all border-b-4 border-emerald-800 flex items-center justify-center gap-3">Claim 15 Coins</button>}
        </div>
      </div>
    </div>
  );
};

export default WatchAdsPage;
