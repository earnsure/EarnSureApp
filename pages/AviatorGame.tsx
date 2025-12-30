
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Menu, Minus, Plus, History, TrendingUp, TrendingDown, Coins, Plane } from 'lucide-react';
import { db } from '../firebase-mock';
import { TransactionType, User } from '../types';

interface AviatorGameProps {
  onBack: () => void;
  user: User;
}

const AviatorGame: React.FC<AviatorGameProps> = ({ onBack, user }) => {
  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'idle' | 'flying' | 'crashed'>('idle');
  const [history, setHistory] = useState<number[]>([2.11, 1.46, 5.94, 1.11, 1.54, 6.94, 1.43, 2.41]);
  const [isCashOut, setIsCashOut] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [initialBalance] = useState(user.wallet_coins);
  
  const flightInterval = useRef<any>(null);
  const startTime = useRef<number>(0);
  const crashPoint = useRef<number>(0);
  const isCashOutRef = useRef(false);

  const sessionPL = user.wallet_coins - initialBalance;

  const startFlight = async () => {
    if (user.wallet_coins < bet) {
      return alert("Insufficient balance!");
    }

    await db.addTransaction(user.uid, {
      uid: user.uid,
      amount: bet,
      type: TransactionType.DEDUCT,
      method: 'Aviator Trade',
      description: 'Investment'
    });

    setGameState('flying');
    setMultiplier(1.00);
    setIsCashOut(false);
    isCashOutRef.current = false;
    startTime.current = Date.now();
    
    const isWinRound = Math.random() < 0.4;
    if (isWinRound) {
      crashPoint.current = 2.0 + (Math.random() * 5.0);
    } else {
      crashPoint.current = 1.0 + (Math.random() * 0.99);
    }
    
    if (crashPoint.current > 7.0) crashPoint.current = 7.0;
    if (crashPoint.current < 1.0) crashPoint.current = 1.0;

    flightInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const nextMult = 1.0 + Math.pow(elapsed * 0.5, 1.5);
      
      if (nextMult >= crashPoint.current) {
        setMultiplier(crashPoint.current);
        setGameState('crashed');
        setHistory(prev => [parseFloat(crashPoint.current.toFixed(2)), ...prev].slice(0, 10));
        clearInterval(flightInterval.current);
        if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
      } else {
        setMultiplier(nextMult);
      }
    }, 32);
  };

  const handleCashOut = async (currentMult?: number) => {
    if (gameState !== 'flying' || isCashOutRef.current) return;
    
    const finalMult = currentMult || multiplier;
    isCashOutRef.current = true;
    setIsCashOut(true);
    
    const winAmount = Math.floor(bet * finalMult);
    await db.addTransaction(user.uid, {
      uid: user.uid,
      amount: winAmount,
      type: TransactionType.EARN,
      method: 'Aviator Profit',
      description: `Multiplier ${finalMult.toFixed(2)}x`
    });

    if (window.navigator.vibrate) window.navigator.vibrate(200);
  };

  useEffect(() => {
    return () => clearInterval(flightInterval.current);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#000000] text-white font-sans overflow-hidden">
      <div className="p-3 flex items-center justify-between bg-[#1b1c1d] border-b border-white/5">
        <button onClick={onBack} className="text-slate-400 flex items-center gap-1 text-[11px] font-black uppercase tracking-widest">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1.5">
              <span className="text-[#28a745] font-black text-sm tabular-nums">{user.wallet_coins.toLocaleString()}</span>
              <Coins size={12} className="text-yellow-500" />
           </div>
           <div className={`text-[8px] font-black flex items-center gap-1 ${sessionPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {sessionPL >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
              SESSION: {sessionPL >= 0 ? '+' : ''}{sessionPL.toLocaleString()}
           </div>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between bg-[#141516] border-b border-white/5">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-[#e51b23] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(229,27,35,0.4)]">
              <Plane size={18} className="text-white fill-current -rotate-12" />
           </div>
           <span className="text-[#e51b23] italic font-black text-xl tracking-tighter uppercase">Aviator</span>
        </div>
        <Menu size={20} className="text-slate-600" />
      </div>

      <div className="px-3 py-2 bg-[#141516] flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
        {history.map((h, i) => (
          <div key={i} className={`px-3 py-1 rounded-full text-[10px] font-black border shrink-0 ${h >= 2 ? 'bg-[#913ef820] border-[#913ef850] text-[#913ef8]' : 'bg-[#34b4f520] border-[#34b4f550] text-[#34b4f5]'}`}>
            {h.toFixed(2)}x
          </div>
        ))}
        <button className="ml-auto bg-[#2c2d2e] p-1.5 rounded-full text-slate-500"><History size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ 
          backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="px-3 py-3 relative z-10">
          <div className="relative aspect-[16/10] bg-[#000000] rounded-[2rem] overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#2d0a0a_0%,_#000000_70%)] opacity-80"></div>
            
            <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 transition-all duration-300 ${gameState === 'crashed' ? 'scale-110' : ''}`}>
              <div className={`text-7xl font-black tabular-nums tracking-tighter drop-shadow-2xl transition-colors ${gameState === 'crashed' ? 'text-[#e51b23]' : 'text-white'}`}>
                {multiplier.toFixed(2)}x
              </div>
              {gameState === 'crashed' && (
                <div className="text-[#e51b23] font-black uppercase text-xs mt-4 tracking-[0.5em] animate-pulse">FLEW AWAY!</div>
              )}
            </div>

            {gameState === 'flying' && (
              <div 
                className="absolute z-30 transition-all duration-[32ms] ease-linear"
                style={{ 
                  bottom: `${15 + (multiplier - 1) * 10}%`, 
                  left: `${10 + (multiplier - 1) * 11}%`,
                }}
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#e51b23] blur-2xl opacity-40 animate-pulse"></div>
                  <img src="https://img.icons8.com/ios-filled/100/e51b23/fighter-jet.png" className="w-20 h-20 -rotate-12" alt="plane" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-3">
          <BetPanel 
            bet={bet} 
            setBet={setBet} 
            onBet={startFlight} 
            onCashOut={() => handleCashOut()} 
            gameState={gameState}
            isCashOut={isCashOut}
            multiplier={multiplier}
          />
        </div>

        <div className="mt-8 px-3 pb-32">
           <div className="bg-[#1b1c1d] rounded-t-3xl flex text-center text-[10px] font-black uppercase tracking-widest text-slate-500 border-x border-t border-white/5 overflow-hidden">
              <button onClick={() => setActiveTab('all')} className={`flex-1 py-4 transition-all ${activeTab === 'all' ? 'bg-[#2c2d2e] text-white' : ''}`}>Global Feed</button>
              <button onClick={() => setActiveTab('my')} className={`flex-1 py-4 transition-all ${activeTab === 'my' ? 'bg-[#2c2d2e] text-white' : ''}`}>My Record</button>
           </div>
           <div className="bg-[#141516]/80 backdrop-blur-md border-x border-b border-white/5 rounded-b-3xl min-h-[300px] p-2 space-y-1.5">
              <PlayerRow name="User_912" bet="100" mult="1.54x" win="154" />
              <PlayerRow name="Aman_X" bet="250" mult="2.10x" win="525" />
           </div>
        </div>
      </div>
    </div>
  );
};

const BetPanel = ({ bet, setBet, onBet, onCashOut, gameState, isCashOut, multiplier }: any) => {
  return (
    <div className={`bg-[#1b1c1d] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6`}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 bg-black/40 rounded-2xl flex items-center justify-between p-1.5 border border-white/5">
             <button onClick={() => setBet(Math.max(1, bet-10))} className="w-11 h-11 rounded-xl bg-[#1b1c1d] flex items-center justify-center text-slate-400 active:scale-90"><Minus size={18} /></button>
             <span className="font-black text-base tabular-nums text-white">{bet.toFixed(0)}</span>
             <button onClick={() => setBet(bet+10)} className="w-11 h-11 rounded-xl bg-[#1b1c1d] flex items-center justify-center text-slate-400 active:scale-90"><Plus size={18} /></button>
          </div>
        </div>

        {gameState === 'flying' ? (
           <button 
             onClick={() => onCashOut()}
             disabled={isCashOut}
             className={`w-full py-6 rounded-3xl flex flex-col items-center justify-center shadow-2xl transition-all active:scale-[0.98] border-b-4 ${isCashOut ? 'bg-slate-800 border-slate-950 text-slate-600' : 'bg-gradient-to-br from-[#d17d00] to-[#915600] border-[#704200] text-white'}`}
           >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-70">CASH OUT</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black tracking-tighter tabular-nums">{(bet * multiplier).toFixed(1)}</span>
              </div>
           </button>
        ) : (
           <button 
             onClick={onBet}
             className="w-full border-b-4 py-7 rounded-3xl flex flex-col items-center justify-center transition-all active:scale-95 text-white bg-gradient-to-br from-[#28a745] to-[#1e7e34] border-[#165a25]"
           >
              <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 opacity-70">PLACE BET</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black tracking-tighter tabular-nums">{bet.toFixed(0)}</span>
              </div>
           </button>
        )}
      </div>
    </div>
  );
};

const PlayerRow = ({ name, bet, mult, win }: any) => (
  <div className="flex items-center justify-between text-[10px] font-black py-3 px-4 bg-[#1b1c1d]/50 rounded-2xl border border-white/[0.03]">
     <div className="flex items-center gap-3 flex-1">
        <span className="text-slate-400 uppercase tracking-tight">{name}</span>
     </div>
     <div className="flex-1 text-center text-slate-500 tabular-nums">{bet}</div>
     <div className={`flex-1 text-center italic ${mult !== '-' ? 'text-[#913ef8]' : 'text-slate-700'}`}>{mult}</div>
     <div className={`flex-1 text-right font-black ${win !== '-' ? 'text-emerald-500' : 'text-slate-800'}`}>{win}</div>
  </div>
);

export default AviatorGame;
