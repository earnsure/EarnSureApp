
import React, { useState, useRef } from 'react';
import { ArrowLeft, ShieldCheck, Coins, Car, Truck, Siren, Bird, X, Zap, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { db } from '../firebase-mock';
import { TransactionType, User } from '../types';

interface ChickenRoadGameProps {
  onBack: () => void;
  user: User;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Hardcore';

const MULTIPLIERS: Record<Difficulty, number[]> = {
  Easy: [1.02, 1.08, 1.14, 1.21, 1.29, 1.37, 1.46, 1.56, 1.67, 1.80, 1.94, 2.10, 2.28, 2.47, 2.69, 2.93, 3.20],
  Medium: [1.10, 1.25, 1.45, 1.70, 2.05, 2.50, 3.10, 3.90, 5.00, 6.50, 8.50, 11.50, 16.00, 23.00, 35.00, 55.00, 90.00],
  Hard: [1.50, 2.50, 4.20, 7.50, 15.00, 32.00, 75.00, 180.00, 450.00, 1200.00, 3500.00, 10000.00, 30000.00, 90000.00],
  Hardcore: [2.00, 5.50, 18.00, 65.00, 250.00, 1000.00, 5000.00, 25000.00, 150000.00, 800000.00, 5000000.00]
};

const SAFE_CHANCE: Record<Difficulty, number> = {
  Easy: 0.95,
  Medium: 0.85,
  Hard: 0.60,
  Hardcore: 0.45
};

const ChickenRoadGame: React.FC<ChickenRoadGameProps> = ({ onBack, user }) => {
  const [bet, setBet] = useState(10);
  const [difficulty] = useState<Difficulty>('Easy');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed' | 'won'>('idle');
  const [currentStep, setCurrentStep] = useState(-1);
  const [betId, setBetId] = useState('');
  const [initialBalance] = useState(user.wallet_coins);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionPL = user.wallet_coins - initialBalance;

  const startRound = async () => {
    if (user.wallet_coins < bet) return alert("Insufficient Coins!");

    await db.addTransaction(user.uid, {
      uid: user.uid,
      amount: bet,
      type: TransactionType.DEDUCT,
      method: 'Chicken Road Bet',
      description: `Bet ID: ${Math.random().toString(36).slice(2, 9).toUpperCase()}`
    });

    setGameState('playing');
    setCurrentStep(0);
    setBetId(Math.random().toString(36).slice(2, 10).toUpperCase());
  };

  const handleStep = (stepIdx: number) => {
    if (gameState !== 'playing' || stepIdx !== currentStep) return;

    const isSafe = Math.random() < SAFE_CHANCE[difficulty];

    if (isSafe) {
      setCurrentStep(currentStep + 1);
    } else {
      setGameState('crashed');
    }
  };

  const handleCashout = async () => {
    if (gameState !== 'playing' || currentStep <= 0) return;
    
    const mult = MULTIPLIERS[difficulty][currentStep - 1];
    const winAmount = Math.floor(bet * mult);

    await db.addTransaction(user.uid, {
      uid: user.uid,
      amount: winAmount,
      type: TransactionType.EARN,
      method: 'Chicken Road Win',
      description: `Cashout at ${mult}x`
    });

    setGameState('won');
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden font-sans">
      <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
             <h1 className="text-sm font-black italic tracking-tighter text-white uppercase flex items-center gap-1.5 leading-none">
               Chicken Road <Zap size={12} className="text-yellow-500 fill-current" />
             </h1>
             <div className={`mt-1 text-[7px] font-black uppercase tracking-widest flex items-center gap-1 ${sessionPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {sessionPL >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                P/L: {sessionPL >= 0 ? '+' : ''}{sessionPL.toLocaleString()}
             </div>
          </div>
        </div>
        <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-2 shadow-inner">
           <span className="text-yellow-500 font-black text-xs tabular-nums">{user.wallet_coins.toLocaleString()}</span>
           <Coins size={12} className="text-yellow-500" />
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col-reverse bg-[#1a1a1a]"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      >
        <div className="w-full pb-40 pt-10">
          {MULTIPLIERS[difficulty].map((mult, idx) => (
            <div key={idx} className="h-24 w-full relative flex items-center justify-center">
               <div className="absolute inset-0 bg-[#111] mx-4 border-x border-white/5 shadow-inner"></div>

               <button
                 onClick={() => handleStep(idx)}
                 disabled={gameState !== 'playing' || idx !== currentStep}
                 className={`w-20 h-20 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all duration-500 relative z-20 shadow-2xl overflow-hidden ${
                   idx < currentStep ? 'bg-emerald-600/20 border-emerald-500/40 scale-90' : 
                   idx === currentStep ? 'bg-blue-600/20 border-blue-500/60 animate-pulse scale-105 shadow-blue-500/20' : 
                   'bg-slate-900/40 border-white/5 opacity-40'
                 }`}
               >
                  <span className={`text-[10px] font-black ${idx <= currentStep ? 'text-white' : 'text-slate-600'}`}>{mult}x</span>
                  {currentStep === idx && gameState === 'playing' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="animate-bounce-custom">
                          <Bird size={28} className="text-yellow-400 fill-current drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                       </div>
                    </div>
                  )}
                  {gameState === 'crashed' && currentStep === idx && (
                    <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center animate-in zoom-in">
                       <X className="text-white" size={32} />
                    </div>
                  )}
                  {idx < currentStep && (
                     <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <ShieldCheck className="text-emerald-500" size={32} />
                     </div>
                  )}
               </button>
            </div>
          ))}
        </div>

        <div className="bg-[#111] h-24 w-full flex flex-col items-center justify-center border-t border-emerald-500/20 relative">
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
           <div className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/60 animate-pulse">Safepoint Node</div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] p-5 border-t border-white/10 space-y-5 pb-10">
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Terminal:</span>
              <span className="text-[9px] font-black text-white uppercase tabular-nums">{betId || 'READY'}</span>
           </div>
        </div>

        <div className="flex gap-2">
           <div className="flex-1 bg-slate-950 rounded-2xl border border-white/5 flex items-center px-4 py-1 shadow-inner">
              <input 
                type="number"
                value={bet}
                onChange={(e) => setBet(Math.max(1, Number(e.target.value)))}
                disabled={gameState === 'playing'}
                className="bg-transparent w-full text-sm font-black text-white focus:outline-none tabular-nums"
              />
              <span className="text-[9px] font-black text-slate-600 ml-2">COINS</span>
           </div>
        </div>

        {gameState === 'playing' ? (
          <button 
            onClick={handleCashout}
            className="w-full py-6 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] text-lg shadow-[0_15px_40px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all flex flex-col items-center justify-center leading-none gap-1"
          >
             <div className="flex items-center gap-2">
                <Trophy size={18} /> CASHOUT
             </div>
             <span className="text-[10px] font-black opacity-80 italic">
               {(bet * (MULTIPLIERS[difficulty][currentStep - 1] || 1)).toFixed(0)} COINS
             </span>
          </button>
        ) : (
          <button 
            onClick={startRound}
            className="w-full py-7 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 text-white font-black uppercase tracking-[0.4em] text-sm shadow-[0_15px_40px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <ShieldCheck size={20} /> Deploy Chicken
          </button>
        )}
      </div>

      <style>{`
        @keyframes bounceCustom {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }
        .animate-bounce-custom {
          animation: bounceCustom 0.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ChickenRoadGame;
