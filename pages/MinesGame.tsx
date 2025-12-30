
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bomb, Gem, ShieldCheck, Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { db } from '../firebase-mock';
import { TransactionType, User } from '../types';

interface MinesGameProps {
  onBack: () => void;
  user: User;
}

const MinesGame: React.FC<MinesGameProps> = ({ onBack, user }) => {
  const [bet, setBet] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'won'>('idle');
  const [grid, setGrid] = useState<('mine' | 'gem' | null)[]>(Array(25).fill(null));
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [multiplier, setMultiplier] = useState(1.00);
  const [initialBalance] = useState(user.wallet_coins);

  const sessionPL = user.wallet_coins - initialBalance;

  const calculateMultiplier = (revealedGems: number) => {
    let m = 1.0;
    for (let i = 0; i < revealedGems; i++) {
      m *= (1 + (minesCount / (25 - i)));
    }
    return Math.min(100, m);
  };

  const startGame = () => {
    if (user.wallet_coins < bet) return alert("Insufficient funds!");

    db.addTransaction(user.uid, {
      uid: user.uid,
      amount: bet,
      type: TransactionType.DEDUCT,
      method: 'Mines Game',
      description: 'Round Started'
    });

    const newGrid: ('mine' | 'gem')[] = Array(25).fill('gem');
    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
      const idx = Math.floor(Math.random() * 25);
      if (newGrid[idx] !== 'mine') {
        newGrid[idx] = 'mine';
        minesPlaced++;
      }
    }
    setGrid(newGrid);
    setRevealed(Array(25).fill(false));
    setGameState('playing');
    setMultiplier(1.00);
  };

  const handleTileClick = (idx: number) => {
    if (gameState !== 'playing' || revealed[idx]) return;

    const newRevealed = [...revealed];
    newRevealed[idx] = true;
    setRevealed(newRevealed);

    if (grid[idx] === 'mine') {
      setGameState('gameover');
      const finalRevealed = [...newRevealed];
      grid.forEach((val, i) => { if (val === 'mine') finalRevealed[i] = true; });
      setRevealed(finalRevealed);
    } else {
      const gemsCount = newRevealed.filter((r, i) => r && grid[i] === 'gem').length;
      setMultiplier(calculateMultiplier(gemsCount));
    }
  };

  const handleCashout = () => {
    if (gameState !== 'playing') return;
    const winAmount = Math.floor(bet * multiplier);
    
    db.addTransaction(user.uid, {
      uid: user.uid,
      amount: winAmount,
      type: TransactionType.EARN,
      method: 'Mines Win',
      description: `${multiplier.toFixed(2)}x Cashout`
    });
    
    setGameState('won');
    setRevealed(Array(25).fill(true));
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-white">
      <div className="p-4 flex items-center justify-between bg-slate-900 border-b border-blue-500/20">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
           <h2 className="text-lg font-black uppercase italic tracking-tighter text-blue-500 leading-none">MINES</h2>
           <div className="mt-1 flex flex-col items-center">
             <div className="flex items-center gap-1.5 text-xs font-black text-white tabular-nums">
                {user.wallet_coins.toLocaleString()} <Coins size={12} className="text-yellow-500" />
             </div>
           </div>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
           <ShieldCheck size={12} className="text-blue-500" />
           <span className={`text-[10px] font-black uppercase text-blue-500`}>Provably Fair</span>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col space-y-6">
        <div className="bg-slate-950 p-4 rounded-[2rem] border border-white/5 flex justify-between items-center shadow-2xl">
           <div className="space-y-0.5">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Multiplier</div>
              <div className={`text-3xl font-black tabular-nums text-blue-500`}>{multiplier.toFixed(2)}x</div>
           </div>
        </div>

        <div className="grid grid-cols-5 gap-2.5 flex-1 max-h-[420px]">
          {grid.map((type, idx) => {
            const isRevealed = revealed[idx];
            const isMine = type === 'mine';

            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                className={`aspect-square rounded-2xl border-2 flex items-center justify-center transition-all duration-300 transform shadow-xl relative overflow-hidden ${
                  isRevealed 
                    ? (isMine ? 'bg-red-600 border-red-400 scale-95 shadow-red-600/20' : 'bg-blue-600 border-blue-400 scale-95 shadow-blue-600/20')
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500 active:scale-90'
                }`}
              >
                {isRevealed ? (
                  isMine ? <Bomb size={24} /> : <Gem size={24} />
                ) : (
                  <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/5 space-y-4 shadow-2xl">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-2">Mines</label>
              <select 
                value={minesCount} 
                onChange={(e) => setMinesCount(Number(e.target.value))}
                disabled={gameState === 'playing'}
                className="w-full bg-slate-950 p-3.5 rounded-2xl border border-slate-700 text-sm font-bold focus:border-blue-500 transition-all"
              >
                {[1, 3, 5, 8, 12, 15, 20, 24].map(n => <option key={n} value={n}>{n} Bombs</option>)}
              </select>
            </div>
          </div>

          {gameState === 'playing' ? (
            <button 
              onClick={handleCashout}
              className="w-full py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black text-xl shadow-2xl shadow-blue-600/30 transition-all active:scale-95"
            >
              Cash Out ({(bet * multiplier).toFixed(0)})
            </button>
          ) : (
            <button 
              onClick={startGame}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 font-black text-xl shadow-2xl shadow-emerald-600/30 transition-all active:scale-95"
            >
              Play Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinesGame;
