
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase-mock';
import { User } from '../types';
import { Trophy, Medal, Crown, Users, Coins, ChevronRight, Share2, Zap } from 'lucide-react';

const LeaderboardPage: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'coins' | 'referrals'>('coins');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const users = await db.getAllUsers();
        setAllUsers(users);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate Coin Ranking
  const coinRankings = useMemo(() => {
    return [...allUsers].sort((a, b) => b.wallet_coins - a.wallet_coins).slice(0, 20);
  }, [allUsers]);

  // Calculate Referral Ranking
  const referralRankings = useMemo(() => {
    const counts: Record<string, number> = {};
    allUsers.forEach(u => {
      if (u.referred_by) {
        counts[u.referred_by] = (counts[u.referred_by] || 0) + 1;
      }
    });

    return allUsers
      .map(u => ({
        ...u,
        referral_count: counts[u.referral_code] || 0
      }))
      .filter(u => u.referral_count > 0 || coinRankings.some(cr => cr.uid === u.uid)) // Keep some visibility
      .sort((a, b) => b.referral_count - a.referral_count)
      .slice(0, 20);
  }, [allUsers, coinRankings]);

  const currentList = activeTab === 'coins' ? coinRankings : referralRankings;

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Ranking Nodes...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Hall of Fame</h2>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">Verified Network Performance</p>
      </div>

      {/* Segmented Control */}
      <div className="bg-slate-900/60 p-1.5 rounded-[2rem] border border-white/5 flex shadow-2xl">
        <button 
          onClick={() => setActiveTab('coins')}
          className={`flex-1 py-3.5 rounded-[1.5rem] flex items-center justify-center gap-2 transition-all ${activeTab === 'coins' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Coins size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Top Earners</span>
        </button>
        <button 
          onClick={() => setActiveTab('referrals')}
          className={`flex-1 py-3.5 rounded-[1.5rem] flex items-center justify-center gap-2 transition-all ${activeTab === 'referrals' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Users size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Top Referrers</span>
        </button>
      </div>

      {/* Podium Section */}
      <div className="flex items-end justify-center gap-3 pt-10 pb-4 relative">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-600/5 to-transparent blur-3xl rounded-full"></div>
        
        {/* Rank 2 */}
        <PodiumSpot 
          user={currentList[1]} 
          rank={2} 
          activeTab={activeTab} 
          color="border-slate-400" 
          height="h-28" 
          bg="bg-slate-400" 
        />

        {/* Rank 1 */}
        <div className="flex flex-col items-center space-y-3 z-10 -translate-y-4">
           <Crown className="text-yellow-500 animate-bounce" size={28} />
           <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] bg-slate-800 border-4 border-yellow-500 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(234,179,8,0.25)]">
                {currentList[0] && <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentList[0].name}`} className="scale-110" alt="rank1" />}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 w-8 h-8 rounded-full border-4 border-slate-950 flex items-center justify-center text-slate-950 font-black text-xs">1</div>
           </div>
           <div className="text-center">
              <div className="text-sm font-black text-white uppercase truncate w-24">{currentList[0]?.name || '---'}</div>
              <div className="text-[10px] font-black text-yellow-500">
                {activeTab === 'coins' ? (currentList[0]?.wallet_coins.toLocaleString() + ' C') : ((currentList[0] as any)?.referral_count + ' Ref')}
              </div>
           </div>
           <div className="bg-yellow-500 px-6 py-2 rounded-t-3xl font-black text-slate-950 text-xl h-32 flex items-center justify-center min-w-[90px] shadow-2xl shadow-yellow-500/10">1</div>
        </div>

        {/* Rank 3 */}
        <PodiumSpot 
          user={currentList[2]} 
          rank={3} 
          activeTab={activeTab} 
          color="border-amber-700" 
          height="h-24" 
          bg="bg-amber-700" 
        />
      </div>

      {/* List Section */}
      <div className="space-y-3 px-1">
        {currentList.slice(3).map((user, i) => (
          <div key={user.uid} className="bg-slate-900/40 p-5 rounded-[2rem] border border-white/5 flex items-center gap-4 group hover:bg-slate-900/60 transition-all shadow-xl">
             <div className="w-8 font-black text-slate-600 text-xs italic">#{(i + 4).toString().padStart(2, '0')}</div>
             <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 group-hover:scale-105 transition-transform">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
             </div>
             <div className="flex-1">
                <div className="font-black text-slate-200 text-[11px] uppercase tracking-tight">{user.name}</div>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Verified Node</div>
             </div>
             <div className={`font-black text-xs tabular-nums flex items-center gap-1.5 ${activeTab === 'coins' ? 'text-blue-500' : 'text-emerald-500'}`}>
                {activeTab === 'coins' ? (
                  <>
                    <Coins size={12} className="text-yellow-500" />
                    {user.wallet_coins.toLocaleString()}
                  </>
                ) : (
                  <>
                    <Users size={12} className="text-emerald-500" />
                    {(user as any).referral_count || 0}
                  </>
                )}
             </div>
          </div>
        ))}

        {currentList.length < 4 && (
          <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
             <Zap size={48} />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting more network data</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PodiumSpot = ({ user, rank, activeTab, color, height, bg }: any) => (
  <div className="flex flex-col items-center space-y-2">
     <div className="relative">
        <div className={`w-16 h-16 rounded-[1.75rem] bg-slate-800 border-2 ${color} flex items-center justify-center overflow-hidden`}>
          {user && <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={`rank${rank}`} />}
        </div>
        <div className={`absolute -bottom-1 -right-1 ${bg} w-6 h-6 rounded-full border-2 border-slate-950 flex items-center justify-center text-slate-950 font-black text-[10px]`}>{rank}</div>
     </div>
     <div className="text-center">
        <div className="text-[10px] font-black text-slate-300 uppercase truncate w-16">{user?.name || '---'}</div>
        <div className={`text-[8px] font-black ${rank === 2 ? 'text-slate-400' : 'text-amber-600'}`}>
          {user ? (activeTab === 'coins' ? user.wallet_coins.toLocaleString() + ' C' : (user.referral_count + ' Ref')) : '---'}
        </div>
     </div>
     <div className={`${bg} px-4 py-1 rounded-t-2xl font-black text-slate-950 text-sm ${height} flex items-center justify-center min-w-[70px] shadow-2xl`}>{rank}</div>
  </div>
);

export default LeaderboardPage;
