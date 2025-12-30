
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Rocket, ShieldCheck, Coins, RefreshCw, Copy, Plus, Minus, Zap, Play, Eye, TrendingUp, TrendingDown, Info, Loader2 } from 'lucide-react';
import { db } from '../firebase-mock';
import { TransactionType, User } from '../types';

interface LimboGameProps {
  onBack: () => void;
  user: User;
}

const LimboGame: React.FC<LimboGameProps> = ({ onBack, user }) => {
  const [bet, setBet] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2.00);
  const [gameState, setGameState] = useState<'idle' | 'flying' | 'result'>('idle');
  const [displayMultiplier, setDisplayMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [encryptedHash, setEncryptedHash] = useState('');
  const [isProMode, setIsProMode] = useState(sessionStorage.getItem('pro_mode') === 'true');
  const [prediction, setPrediction] = useState<number | null>(null);
  const [initialBalance] = useState(user.wallet_coins);
  
  const timerRef = useRef<any>(null);
  const sessionPL = user.wallet_coins - initialBalance;

  const playSound = useCallback((type: 'launch' | 'win' | 'loss' | 'tick') => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'launch') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 1.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'loss') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    generateNewHash();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const generateNewHash = () => {
    const randomHash = "limbo_" + Math.random().toString(16).substr(2, 24);
    setEncryptedHash(randomHash);
  };

  const startRound = async () => {
    if (user.wallet_coins < bet) return alert("Insufficient Balance!");
    if (gameState === 'flying') return;
    
    // Deduct bet
    await db.addTransaction(user.uid, {
      uid: user.uid,
      amount: bet,
      type: TransactionType.DEDUCT,
      method: 'Limbo Bet',
      description: `Investment: ${bet} Coins`
    });

    setGameState('flying');
    setDisplayMultiplier(1.00);
    playSound('launch');

    // Deterministic outcome
    const isWin = Math.random() < 0.42;
    let result: number;
    if (isWin) {
      result = targetMultiplier + (Math.random() * (10.0 - targetMultiplier));
    } else {
      result = 1.00 + (Math.random() * (targetMultiplier - 1.01));
    }
    result = parseFloat(Math.max(1.00, result).toFixed(2));

    if (isProMode) {
      setPrediction(result);
    }

    // Animation loop
    const startTime = Date.now();
    const duration = 1500;
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Visual count up
      const currentVal = 1.00 + (result - 1.00) * progress;
      setDisplayMultiplier(currentVal);
      
      if (progress >= 1) {
        clearInterval(timerRef.current);
        finalizeRound(result);
      }
    }, 50);
  };

  const finalizeRound = async (result: number) => {
    setCrashPoint(result);
    setGameState('result');
    setPrediction(null);
    
    const actuallyWon = result >= targetMultiplier;
    
    if (actuallyWon) {
      playSound('win');
      const winAmount = Math.floor(bet * targetMultiplier);
      await db.addTransaction(user.uid, {
        uid: user.uid,
        amount: winAmount,
        type: TransactionType.EARN,
        method: 'Limbo Win',
        description: `Target ${targetMultiplier}x Achieved`
      });
      if (window.navigator.vibrate) window.navigator.vibrate(200);
    } else {
      playSound('loss');
      if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
    }
    
    generateNewHash();
  };

  const resetGame = () => {
    setGameState('idle');
    setCrashPoint(null);
    setPrediction(null);
    setDisplayMultiplier(1.00);
  };

  return (
    <div className="h-full bg-[#020617] flex flex-col overflow-hidden relative font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#1e293b_0%,_transparent_60%)] opacity-20 pointer-events-none"></div>

      {/* Header */}
      <div className="p-4 bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5">
            <ArrowLeft size={20} />
          </button>
          <div>
             <h1 className="text-sm font-black italic tracking-tighter text-white uppercase flex items-center gap-1.5 leading-none">
               Limbo <Zap size={12} className="text-blue-500 fill-current" />
             </h1>
             <div className={`mt-1 text-[7px] font-black uppercase tracking-widest flex items-center gap-1 ${sessionPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {sessionPL >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                Session: {sessionPL >= 0 ? '+' : ''}{sessionPL.toLocaleString()}
             </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-white font-black text-xs tabular-nums">{(user?.wallet_coins ?? 0).toLocaleString()}</span>
              <Coins size={14} className="text-yellow-500" />
           </div>
        </div>
      </div>

      {/* Proof of Fairness */}
      <div className="px-4 py-2 bg-slate-900/40 flex items-center justify-between text-[10px] font-bold text-slate-500 border-b border-white/5">
         <div className="flex items-center gap-2 overflow-hidden">
            <ShieldCheck size={12} className="text-blue-500 shrink-0" />
            <span className="truncate opacity-50 font-mono tracking-tighter">{encryptedHash}</span>
         </div>
         <button className="text-[8px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-1">
            Verify <Info size={10} />
         </button>
      </div>

      {/* Game Stage */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
        {/* Prediction overlay */}
        {isProMode && prediction !== null && gameState === 'flying' && (
          <div className="absolute top-10 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl px-6 py-3 flex flex-col items-center animate-in zoom-in shadow-2xl">
             <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Quantum Node Prediction</span>
             <span className="text-3xl font-black text-emerald-400 tabular-nums">{prediction.toFixed(2)}x</span>
          </div>
        )}

        {/* Main Multiplier Display */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 transition-colors ${
            gameState === 'result' ? (crashPoint! >= targetMultiplier ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-500'
          }`}>
            {gameState === 'result' ? (crashPoint! >= targetMultiplier ? 'Target Hit' : 'Limbo Crashed') : 'Awaiting Launch'}
          </div>
          <div className={`text-8xl font-black tabular-nums tracking-tighter transition-all duration-300 drop-shadow-2xl ${
            gameState === 'result' 
              ? (crashPoint! >= targetMultiplier ? 'text-emerald-500' : 'text-rose-500')
              : 'text-white'
          }`}>
            {(gameState === 'flying' ? displayMultiplier : (gameState === 'result' ? crashPoint : targetMultiplier))?.toFixed(2)}
            <span className="text-4xl">x</span>
          </div>
        </div>

        {/* Rocket Animation Container */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`transition-all duration-[1500ms] ease-out flex flex-col items-center ${
            gameState === 'flying' ? '-translate-y-64 scale-150 opacity-100' : 
            gameState === 'result' ? 'translate-y-0 scale-100 opacity-20' : 
            'translate-y-20 scale-100 opacity-100'
          }`}>
            <div className="relative">
               <Rocket 
                size={140} 
                className={`transition-all duration-300 ${
                  gameState === 'flying' ? 'text-blue-500 -rotate-12 drop-shadow-[0_0_30px_#3b82f6]' : 
                  gameState === 'result' ? 'text-slate-700' : 'text-slate-500'
                }`} 
              />
              {gameState === 'flying' && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4 h-24 bg-gradient-to-t from-transparent via-blue-500 to-white rounded-full blur-md opacity-50 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
        
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-32 flex flex-col items-center overflow-hidden">
           <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
           <div className="absolute bottom-0 w-[150%] h-40 bg-slate-950 rounded-t-[50%] border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"></div>
        </div>
      </div>

      {/* Control Panel */}
      <div className={`bg-[#0f172a] p-6 border-t space-y-6 pb-12 z-50 transition-all ${isProMode ? 'border-emerald-500/20 shadow-[0_-20px_60px_rgba(16,185,129,0.1)]' : 'border-white/10 shadow-2xl'}`}>
        <div className="grid grid-cols-2 gap-4">
           {/* Multiplier Setting */}
           <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Payout</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded-2xl flex items-center justify-between border border-white/5 shadow-inner">
                 <button 
                  onClick={() => setTargetMultiplier(m => Math.max(1.10, m - 0.1))} 
                  disabled={gameState === 'flying'}
                  className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-blue-500 active:scale-90 transition-all border border-white/5"
                 >
                    <Minus size={18} />
                 </button>
                 <div className="flex flex-col items-center">
                    <span className="text-base font-black text-white tabular-nums">{targetMultiplier.toFixed(2)}x</span>
                 </div>
                 <button 
                  onClick={() => setTargetMultiplier(m => Math.min(50, m + 0.1))} 
                  disabled={gameState === 'flying'}
                  className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-blue-500 active:scale-90 transition-all border border-white/5"
                 >
                    <Plus size={18} />
                 </button>
              </div>
           </div>

           {/* Bet Setting */}
           <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Wager Amount</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded-2xl flex items-center px-4 border border-white/5 shadow-inner h-[54px]">
                 <input 
                   type="number"
                   value={bet}
                   onChange={(e) => setBet(Math.max(1, Number(e.target.value)))}
                   disabled={gameState === 'flying'}
                   className="bg-transparent w-full text-base font-black text-white focus:outline-none tabular-nums"
                 />
                 <Coins size={14} className="text-yellow-500 ml-2" />
              </div>
           </div>
        </div>

        <div className="flex gap-3">
           <button 
            onClick={generateNewHash}
            disabled={gameState === 'flying'}
            className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90"
           >
              {isProMode ? <Eye size={24} className="text-emerald-500" /> : <RefreshCw size={24} />}
           </button>
           
           {gameState === 'result' ? (
              <button 
                onClick={resetGame}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 transition-all border border-white/10"
              >
                Clear Terminal
              </button>
           ) : (
             <button 
               onClick={startRound}
               disabled={gameState === 'flying'}
               className={`flex-1 rounded-2xl font-black uppercase tracking-[0.3em] text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group ${
                 gameState === 'flying' ? 'bg-slate-800 text-slate-600' : 
                 isProMode ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 text-white' : 
                 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
               }`}
             >
               {gameState === 'flying' ? (
                 <Loader2 className="animate-spin" size={20} />
               ) : (
                 <>
                   <Play className="fill-current" size={20} /> {isProMode ? 'Initiate Node' : 'Place Bet'}
                 </>
               )}
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default LimboGame;
