
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Eraser, Sparkles, Coins, TrendingUp, TrendingDown, ShieldCheck, Zap, RotateCcw, Loader2, Gift, CheckCircle2 } from 'lucide-react';
import { db } from '../firebase-mock';
import { TransactionType, User } from '../types';
import { SPIN_PROBABILITIES, SCRATCH_DAILY_LIMIT } from '../constants';

interface ScratchPageProps {
  onBack: () => void;
  user: User;
}

const ScratchPage: React.FC<ScratchPageProps> = ({ onBack, user }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialBalance] = useState(user.wallet_coins);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const today = new Date().toDateString();
  const currentScratchCount = user.last_scratch_date === today ? (user.scratch_count || 0) : 0;
  const sessionPL = user.wallet_coins - initialBalance;

  useEffect(() => {
    initNewCard();
  }, []);

  const initNewCard = () => {
    setIsRevealed(false);
    setIsClaimed(false);
    
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
    setReward(winningItem.value);
    
    setTimeout(setupCanvas, 100);
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.5, '#475569');
    grad.addColorStop(1, '#0f172a');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for(let i=0; i<canvas.width; i+=25) {
      for(let j=0; j<canvas.height; j+=25) {
        ctx.beginPath();
        ctx.arc(i, j, 1.2, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.font = '900 16px Inter';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH HERE', canvas.width/2, canvas.height/2);
    ctx.font = '8px Inter';
    ctx.fillText('VERIFIED EARNSURE TICKET', canvas.width/2, canvas.height/2 + 25);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isRevealed || currentScratchCount >= SCRATCH_DAILY_LIMIT) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) {
        transparentPixels++;
      }
    }

    const percentage = (transparentPixels / (canvas.width * canvas.height)) * 100;
    if (percentage > 40) {
      setIsRevealed(true);
      if (window.navigator.vibrate) window.navigator.vibrate(80);
    }
  };

  const handleClaim = async () => {
    if (!isRevealed || isClaimed || !reward || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const todayDate = new Date().toDateString();
      const newCount = currentScratchCount + 1;

      await db.updateUser(user.uid, {
        last_scratch_date: todayDate,
        scratch_count: newCount
      });

      await db.addTransaction(user.uid, {
        uid: user.uid,
        amount: reward,
        type: TransactionType.EARN,
        method: 'Lucky Scratch',
        description: `Jackpot Reward: ${reward} Coins`
      });

      setIsClaimed(true);
      if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
    } catch (error) {
      console.error("Scratch reward error", error);
      alert("Terminal Sync Error. Please retry claim.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full bg-[#020617] flex flex-col font-sans overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_#1e293b_0%,_transparent_60%)] opacity-20 pointer-events-none"></div>

      <div className="p-4 flex items-center justify-between bg-slate-900/60 backdrop-blur-xl border-b border-white/5 z-50">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white border border-white/5 active:scale-90 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-black uppercase tracking-tighter italic leading-none text-white">LUCKY SCRATCH</h2>
          <div className={`mt-1 text-[7px] font-black uppercase tracking-widest flex items-center justify-center gap-1 ${sessionPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {sessionPL >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
            SESSION: {sessionPL >= 0 ? '+' : ''}{sessionPL.toLocaleString()}
          </div>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1.5 text-white font-black text-xs tabular-nums">
             {user.wallet_coins.toLocaleString()} <Coins size={12} className="text-yellow-500" />
           </div>
           <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{SCRATCH_DAILY_LIMIT - currentScratchCount} LEFT</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-10 relative">
        <div className="relative group w-full max-w-[300px] aspect-[4/5]">
          <div className="absolute inset-0 bg-[#0f172a] rounded-[3rem] border border-white/10 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
             
             <div className={`text-center space-y-4 transition-all duration-700 ${isRevealed ? 'scale-110 opacity-100' : 'scale-75 opacity-20'}`}>
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-2 border shadow-inner transition-all duration-500 ${isClaimed ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-blue-600/10 border-blue-500/20'}`}>
                   {isClaimed ? (
                     <CheckCircle2 className="text-emerald-500 animate-in zoom-in" size={48} />
                   ) : (
                     <Sparkles className="text-blue-500 animate-pulse" size={48} />
                   )}
                </div>
                <div>
                   <div className={`text-8xl font-black tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500 ${isClaimed ? 'text-emerald-500' : 'text-white'}`}>
                     {reward}
                   </div>
                   <div className={`text-[12px] font-black uppercase tracking-[0.4em] mt-2 ${isClaimed ? 'text-emerald-500/60' : 'text-blue-500'}`}>
                     {isClaimed ? 'CLAIMED SUCCESS' : 'READY TO COLLECT'}
                   </div>
                </div>
             </div>
             
             <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white/10 rounded-tl-lg"></div>
             <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white/10 rounded-tr-lg"></div>
             <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white/10 rounded-bl-lg"></div>
             <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white/10 rounded-br-lg"></div>
          </div>

          {!isClaimed && (
            <canvas
              ref={canvasRef}
              width={300}
              height={375}
              className={`absolute inset-0 z-20 rounded-[3rem] cursor-crosshair touch-none shadow-2xl transition-opacity duration-700 ${isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${currentScratchCount >= SCRATCH_DAILY_LIMIT ? 'grayscale opacity-50' : ''}`}
              onMouseDown={() => setIsDrawing(true)}
              onMouseUp={() => setIsDrawing(false)}
              onMouseMove={scratch}
              onTouchStart={() => setIsDrawing(true)}
              onTouchEnd={() => setIsDrawing(false)}
              onTouchMove={scratch}
            />
          )}

          {isClaimed && (
             <div className="absolute inset-0 z-30 flex items-center justify-center animate-in fade-in zoom-in-95 pointer-events-none bg-emerald-600/10 rounded-[3rem]">
                <div className="bg-emerald-600 p-5 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                   <ShieldCheck size={56} className="text-white" />
                </div>
             </div>
          )}
        </div>

        <div className="w-full max-w-xs text-center min-h-[140px] flex flex-col items-center justify-center">
          {isProcessing ? (
             <div className="flex flex-col items-center gap-4 animate-in fade-in">
               <Loader2 className="animate-spin text-blue-500" size={32} />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TRANSACTION SYNCING...</p>
             </div>
          ) : isClaimed ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-6 duration-500 w-full">
              <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-500/10 py-2 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">VERIFIED SETTLEMENT</span>
              </div>
              <button 
                onClick={initNewCard}
                disabled={currentScratchCount >= SCRATCH_DAILY_LIMIT}
                className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 ${
                  currentScratchCount >= SCRATCH_DAILY_LIMIT 
                  ? 'bg-slate-800 text-slate-600 border border-white/5' 
                  : 'bg-slate-900 text-white shadow-xl border border-white/10 hover:bg-slate-800'
                }`}
              >
                <RotateCcw size={18} /> {currentScratchCount >= SCRATCH_DAILY_LIMIT ? 'LIMIT EXHAUSTED' : 'NEXT CARD'}
              </button>
            </div>
          ) : isRevealed ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-500 w-full">
              <button 
                onClick={handleClaim}
                className="w-full py-6 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-[0.3em] shadow-[0_15px_35px_rgba(16,185,129,0.4)] border-b-4 border-emerald-800 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Gift size={20} /> CLAIM {reward} COINS NOW
              </button>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest animate-pulse">REWARD REVEALED • TAP TO CREDIT WALLET</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 animate-pulse">
               <Eraser className="text-slate-700" size={32} />
               <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">SCRATCH OVERLAY TO REVEAL</p>
               {currentScratchCount >= SCRATCH_DAILY_LIMIT && (
                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 bg-rose-500/10 px-4 py-1 rounded-full border border-rose-500/20">DAILY LIMIT REACHED</p>
               )}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-slate-900/40 border-t border-white/5 flex flex-col items-center gap-2">
         <div className="flex items-center gap-2">
           <Zap className="text-blue-500" size={12} />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">SECURE PAYOUT ENGINE v2.7 ENABLED</span>
         </div>
      </div>
    </div>
  );
};

export default ScratchPage;
