
import React, { useState, useRef } from 'react';
import { ArrowLeft, Zap, Coins, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { db } from '../firebase-mock';
import { TransactionType, User } from '../types';
import { SPIN_PROBABILITIES } from '../constants';

interface SpinPageProps {
  onBack: () => void;
  user: User;
}

const SpinPage: React.FC<SpinPageProps> = ({ onBack, user }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [initialBalance] = useState(user.wallet_coins);
  
  const wheelRef = useRef<HTMLDivElement>(null);
  const segmentAngle = 360 / SPIN_PROBABILITIES.length;

  const sessionPL = user.wallet_coins - initialBalance;

  const startSpinSequence = () => {
    if (isSpinning || isProcessing) return;
    calculateAndSpin();
  };

  const calculateAndSpin = () => {
    const rand = Math.random() * 100;
    let cumulative = 0;
    let winningItem = SPIN_PROBABILITIES[0];
    for (const item of SPIN_PROBABILITIES) {
      cumulative += item.weight;
      if (rand < cumulative) {
        winningItem = item;
        break;
      }
    }

    const winningIdx = SPIN_PROBABILITIES.indexOf(winningItem);
    const extraSpins = 360 * 8; 
    const baseRotation = rotation - (rotation % 360);
    const targetRot = baseRotation + extraSpins + (360 - (winningIdx * segmentAngle)) - (segmentAngle / 2);
    
    setRotation(targetRot);
    setIsSpinning(true);

    setTimeout(() => {
      setIsSpinning(false);
      setLastWin(winningItem.value);
      
      db.addTransaction(user.uid, {
        uid: user.uid,
        amount: winningItem.value,
        type: TransactionType.EARN,
        method: 'Lucky Spin',
        description: `Jackpot Result: ${winningItem.value} Coins`
      });
      
      if (window.navigator.vibrate) window.navigator.vibrate([80, 40, 80]);
    }, 5000);
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", x, y, "L", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) };
  };

  return (
    <div className="h-full bg-[#050810] flex flex-col overflow-hidden relative">
      <div className="p-4 flex items-center justify-between bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 z-50">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-white/5 active:scale-90 transition-all"><ArrowLeft size={18} /></button>
        <div className="text-center">
          <h2 className="text-base font-black text-white italic tracking-tighter uppercase leading-none">Lucky Spin</h2>
          <div className={`mt-1 text-[7px] font-black uppercase tracking-widest flex items-center justify-center gap-1 ${sessionPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {sessionPL >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
            PROFIT: {sessionPL >= 0 ? '+' : ''}{sessionPL.toLocaleString()}
          </div>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1 text-white font-black text-xs tabular-nums">{user.wallet_coins.toLocaleString()} <Coins size={12} className="text-yellow-500" /></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 relative">
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2 z-40">
           <div className={`w-8 h-10 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-b-[1rem] flex flex-col items-center justify-center border-x-2 border-b-2 border-yellow-200/50 transition-transform ${isSpinning ? 'animate-bounce' : ''}`}>
              <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_white]"></div>
           </div>
        </div>
        <div className="relative group p-4 rounded-full bg-slate-900/20 border border-white/5 shadow-[0_0_100px_rgba(37,99,235,0.1)] my-auto scale-90 sm:scale-100">
          <div ref={wheelRef} className="w-[260px] h-[260px] sm:w-[280px] sm:h-[280px] relative transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.1, 1) z-10" style={{ transform: `rotate(${rotation}deg)` }}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              {SPIN_PROBABILITIES.map((item, i) => {
                const start = i * segmentAngle;
                const end = (i + 1) * segmentAngle;
                return (
                  <g key={i}>
                    <path d={describeArc(50, 50, 48, start, end)} fill={item.color} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <g transform={`rotate(${start + segmentAngle / 2} 50 50)`}><text x="50" y="18" fill="white" fontSize="5.5" fontWeight="900" textAnchor="middle" className="uppercase italic tracking-tighter">{item.value}</text></g>
                  </g>
                );
              })}
            </svg>
            <div className="absolute inset-0 m-auto w-12 h-12 bg-slate-950 rounded-full border-[3px] border-[#0a0f1d] flex items-center justify-center z-30"><Coins className="text-yellow-500" size={14} /></div>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-4 sm:space-y-6 pb-6">
          {lastWin !== null && <div className="bg-emerald-600/10 p-4 rounded-[2rem] border border-emerald-500/20 flex flex-col items-center"><div className="text-4xl font-black text-white tracking-tighter">+{lastWin}</div></div>}
          <button 
            onClick={startSpinSequence}
            disabled={isSpinning || isProcessing}
            className={`w-full py-4 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all active:scale-95 flex items-center justify-center gap-2 ${isSpinning || isProcessing ? 'bg-slate-800 text-slate-600' : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl'}`}
          >
            {isSpinning ? 'Spinning...' : isProcessing ? <Loader2 className="animate-spin" size={14} /> : <><Zap size={14} className="fill-current" /> Spin Now</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpinPage;
