
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Pickaxe, Zap, Coins, ShieldCheck, Loader2, Play, Database, TrendingUp } from 'lucide-react';
import { db } from '../firebase-mock';
import { TransactionType, User } from '../types';

interface MiningPageProps {
  onBack: () => void;
  user: User;
}

const MINING_RATE_PH = 100;
const MINING_RATE_PS = MINING_RATE_PH / 3600;

const MiningPage: React.FC<MiningPageProps> = ({ onBack, user }) => {
  const [isMining, setIsMining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [minedCoins, setMinedCoins] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (isMining && !isPaused) {
      intervalRef.current = setInterval(() => {
        setMinedCoins(prev => prev + MINING_RATE_PS);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMining, isPaused]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setIsPaused(true);
      else setIsPaused(false);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (user.uid) {
        db.updateUser(user.uid, { is_mining: false, mining_start_time: null });
      }
    };
  }, [user.uid]);

  const toggleMining = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await db.updateUser(user.uid, { is_mining: true, mining_start_time: null });
      setIsMining(true);
      setIsPaused(false);
    } catch (e) {
      alert("Terminal connection error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCollect = async () => {
    if (!isMining || minedCoins < 1 || isProcessing) return;
    setIsProcessing(true);
    try {
      const amount = Math.floor(minedCoins);
      await db.updateUser(user.uid, { is_mining: false, mining_start_time: null });
      await db.addTransaction(user.uid, {
        uid: user.uid,
        amount: amount,
        type: TransactionType.EARN,
        method: 'Mining Settlement',
        description: `Successfully mined ${amount} coins`
      });
      setIsMining(false);
      setMinedCoins(0);
    } catch (e) {
      alert("Settlement verification failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full bg-[#020617] flex flex-col relative overflow-hidden font-sans">
      <div className="p-4 flex items-center justify-between bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 z-50">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white border border-white/5 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Live Session Node</h2>
          <div className="text-sm font-black text-white italic tracking-tighter uppercase flex items-center justify-center gap-1.5 leading-none">
            Mining Hub
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center">
          <Database size={18} className={isMining && !isPaused ? "text-blue-500 animate-pulse" : "text-slate-700"} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 relative z-10 overflow-hidden">
        <div className="relative">
          <div className={`w-56 h-56 rounded-full border-4 border-white/5 flex items-center justify-center transition-all duration-1000 ${isMining && !isPaused ? 'border-blue-500/20 rotate-180 scale-105' : 'scale-100'}`}>
             <div className={`w-40 h-40 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center ${isMining && !isPaused ? 'animate-spin-slow border-blue-500/30' : ''}`}>
                <div className={`w-28 h-28 rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center border shadow-2xl transition-all duration-500 ${isMining && !isPaused ? 'border-blue-500 shadow-blue-500/20 scale-110 rotate-12' : 'border-white/5'}`}>
                   {isPaused ? <div className="text-yellow-500">PAUSED</div> : <Pickaxe size={40} className={`transition-all duration-1000 ${isMining ? 'text-blue-500 animate-bounce' : 'text-slate-700'}`} />}
                </div>
             </div>
          </div>
        </div>

        <div className="text-center space-y-2">
           <div className="flex items-center justify-center gap-2">
              <TrendingUp size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Session Accumulation</span>
           </div>
           <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl">{minedCoins.toFixed(3)}</span>
              <div className="bg-yellow-500 rounded-full p-1.5 shadow-lg"><Coins className="text-slate-950" size={16} /></div>
           </div>
           <div className="bg-blue-500/5 px-4 py-2 rounded-2xl border border-blue-500/10 inline-flex flex-col items-center gap-1">
              <div className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em]">Rate: {MINING_RATE_PH} Coins / Hr</div>
           </div>
        </div>
      </div>

      <div className="p-6 bg-slate-900/80 backdrop-blur-3xl border-t border-white/5 space-y-4 z-50">
        {!isMining ? (
           <button 
             onClick={toggleMining}
             disabled={isProcessing}
             className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <><Play size={20} className="fill-current" /> Start Session</>}
           </button>
        ) : (
           <button 
             onClick={handleCollect}
             disabled={isProcessing || minedCoins < 1}
             className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95 flex items-center justify-center gap-3 ${minedCoins >= 1 && !isProcessing ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
           >
             {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Collect {Math.floor(minedCoins)} Coins</>}
           </button>
        )}
      </div>
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  );
};

export default MiningPage;
