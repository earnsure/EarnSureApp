
import React, { useState, useEffect } from 'react';
import { Play, Disc, Grid3X3, Calendar, ShieldCheck, Pickaxe, Rocket, Map, Plane, Coins, Loader2 } from 'lucide-react';
import { DAILY_CHECKIN_REWARDS, COIN_CONVERSION_RATE } from '../constants';
import { db } from '../firebase-mock';
import { TransactionType, User } from '../types';

interface HomePageProps {
  onNavigate: (page: string) => void;
  user: User;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, user }) => {
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState('24:00:00');
  const [isProcessing, setIsProcessing] = useState(false);

  const MS_IN_24H = 24 * 60 * 60 * 1000;

  useEffect(() => {
    const updateTimer = () => {
      const lastCheckIn = user.last_checkin || 0;
      const now = Date.now();
      const diff = now - lastCheckIn;

      if (diff >= MS_IN_24H) {
        setCanCheckIn(true);
        setTimeLeft('Available Now');
      } else {
        setCanCheckIn(false);
        const remaining = MS_IN_24H - diff;
        const h = Math.floor(remaining / (1000 * 60 * 60));
        const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
      }
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(timer);
  }, [user.last_checkin]);

  const handleCheckIn = () => {
    if (!canCheckIn || isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => finalizeCheckIn(), 1200);
  };

  const finalizeCheckIn = async () => {
    const now = Date.now();
    const currentStreak = user.checkin_streak || 0;
    const newStreak = (currentStreak % 30) + 1;
    const reward = DAILY_CHECKIN_REWARDS[(newStreak - 1) % 30];

    try {
      await db.updateUser(user.uid, { last_checkin: now, checkin_streak: newStreak });
      await db.addTransaction(user.uid, {
        uid: user.uid,
        amount: reward,
        type: TransactionType.EARN,
        method: 'Daily Reward',
        description: `Day ${newStreak} Verified Claim`
      });
      db.sendNotification(user.uid, { title: 'Daily Reward Secured', body: `Successfully claimed ${reward} coins.`, type: 'success' });
    } catch (error) {
      console.error("Check-in error:", error);
    } finally {
      setIsProcessing(false);
      setCanCheckIn(false);
    }
  };

  const currentStreak = user.checkin_streak || 0;

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-600 rounded-[2.5rem] blur-3xl opacity-20 pointer-events-none"></div>
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/[0.05]">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 flex items-center gap-2 mb-4">
               <div className="bg-white rounded-lg p-0.5 flex items-center justify-center">
                 <img src="https://i.ibb.co/wZptWH5p/logo.png" alt="logo" className="w-4 h-auto object-contain mix-blend-multiply" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-400">EarnSure Account</span>
            </div>
            <div className="text-7xl font-black text-white flex items-center gap-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] tracking-tighter">
              {user.wallet_coins.toLocaleString()}
            </div>
            <div className="mt-4 text-xs font-bold text-slate-500 flex items-center gap-2">
              <span>≈</span>
              <span className="text-slate-300">₹{(user.wallet_coins / COIN_CONVERSION_RATE).toFixed(2)}</span>
            </div>
            <div className="flex gap-3 w-full mt-10">
              <button 
                onClick={() => onNavigate('wallet')}
                className="w-full bg-white text-slate-950 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Withdraw Coins
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-2xl p-6 rounded-[2.5rem] space-y-5 border border-white/[0.03] shadow-inner relative overflow-hidden">
        <div className="flex justify-between items-center px-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0a0f1d] flex items-center justify-center border border-white/5 shadow-lg">
              <Calendar className="text-blue-500" size={24} />
            </div>
            <div>
              <h3 className="font-black text-white text-[11px] tracking-tight uppercase">Daily Reward</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Day {currentStreak % 30 || 30} Streak</p>
            </div>
          </div>
          {!canCheckIn && (
            <div className="flex flex-col items-end">
              <div className="text-[9px] font-black text-blue-500 tabular-nums uppercase tracking-widest">Available In</div>
              <div className="text-[10px] font-bold text-slate-300 mt-0.5 tabular-nums">{timeLeft}</div>
            </div>
          )}
        </div>
        <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar py-2 relative z-10">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayNum = i + 1;
            const cycleDay = (currentStreak % 7) || (currentStreak > 0 ? 7 : 0);
            const isCompleted = dayNum < cycleDay || (dayNum === cycleDay && !canCheckIn);
            const isToday = dayNum === (canCheckIn ? (currentStreak % 7) + 1 : -1);
            return (
              <div key={i} className={`flex flex-col items-center justify-center min-w-[44px] h-16 rounded-2xl border transition-all duration-1000 ${isCompleted ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/20' : isToday ? 'bg-slate-900 border-blue-500 text-blue-500 animate-pulse' : 'bg-slate-950/50 border-white/5 text-slate-700'}`}>
                <span className="text-[8px] font-black uppercase mb-1">D{dayNum}</span>
                <span className="font-black text-[11px]">{DAILY_CHECKIN_REWARDS[i]}</span>
              </div>
            );
          })}
        </div>
        <button 
          onClick={handleCheckIn}
          disabled={!canCheckIn || isProcessing}
          className={`w-full py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${canCheckIn && !isProcessing ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/20 text-white active:scale-95' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5'}`}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={16} /> : canCheckIn ? <><ShieldCheck size={16} /> Claim Daily Reward</> : `Locked (${timeLeft})`}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BentoItem icon={<Plane size={24} className="text-red-500" />} title="Aviator" desc="High Multiplier" accent="border-red-500/20 bg-red-900/10" onClick={() => onNavigate('aviator')} />
        <BentoItem icon={<Pickaxe size={24} className="text-blue-500" />} title="Mining Hub" desc="100 Coins / Hour" accent="border-blue-500/30 bg-blue-900/20" onClick={() => onNavigate('mining')} />
        <BentoItem icon={<Rocket size={24} className="text-indigo-400" />} title="Limbo" desc="Predict Moon Reach" accent="border-indigo-500/20" onClick={() => onNavigate('limbo')} />
        <BentoItem icon={<Map size={24} className="text-emerald-500" />} title="Chicken Road" desc="Cross the Multi" accent="border-emerald-500/20" onClick={() => onNavigate('chicken-road')} />
        <BentoItem icon={<Disc size={24} className="text-yellow-500" />} title="Spin & Win" desc="Jackpot: 150" accent="border-yellow-500/10" onClick={() => onNavigate('spin')} />
        <BentoItem icon={<Grid3X3 size={24} className="text-indigo-500" />} title="Mines 1X" desc="Risk Control" accent="border-indigo-500/10" onClick={() => onNavigate('mines')} />
      </div>
    </div>
  );
};

const BentoItem: React.FC<{ icon: React.ReactNode, title: string, desc: string, accent: string, onClick: () => void }> = ({ icon, title, desc, accent, onClick }) => (
  <button onClick={onClick} className={`bg-slate-900/40 p-5 rounded-[2.5rem] text-left space-y-4 hover:bg-slate-900/60 transition-all border border-white/[0.04] active:scale-95 shadow-2xl group relative overflow-hidden ${accent}`}>
    <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/5 shadow-inner transition-transform group-hover:scale-110">{icon}</div>
    <div className="relative z-10">
      <div className="font-black text-white text-[11px] tracking-widest uppercase">{title}</div>
      <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-0.5 group-hover:text-slate-500">{desc}</div>
    </div>
  </button>
);

export default HomePage;
