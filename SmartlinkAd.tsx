
import React from 'react';
import { ExternalLink, Sparkles, Zap, Gift } from 'lucide-react';

const SmartlinkAd: React.FC = () => {
  const smartlinkUrl = "https://passivealexis.com/e0s86tqc?key=b98eba5dbe502563d9e35c9d1c81ce05";

  const handleOpen = () => {
    window.open(smartlinkUrl, '_blank');
  };

  return (
    <div className="w-full px-4 py-4 mt-4">
      <button 
        onClick={handleOpen}
        className="w-full relative group overflow-hidden rounded-[2rem] p-5 transition-all active:scale-95 shadow-2xl border border-yellow-500/20"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-orange-600/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(234,179,8,0.15)_0%,_transparent_70%)] animate-pulse"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(234,179,8,0.4)] group-hover:scale-110 transition-transform">
              <Sparkles size={24} className="fill-current" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
                Bonus Reward Available <Zap size={12} className="text-yellow-500 fill-current" />
              </div>
              <div className="text-[9px] font-black text-yellow-500/80 uppercase tracking-widest mt-0.5">
                Complete 1 Task • Get +500 Coins
              </div>
            </div>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-yellow-500 group-hover:text-slate-950 transition-all">
            <ExternalLink size={18} />
          </div>
        </div>

        {/* Gloss Effect */}
        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000"></div>
      </button>
      
      <div className="flex items-center justify-center gap-2 mt-3 opacity-30">
        <div className="h-[1px] w-8 bg-slate-700"></div>
        <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.3em]">Verified Reward Node</span>
        <div className="h-[1px] w-8 bg-slate-700"></div>
      </div>
    </div>
  );
};

export default SmartlinkAd;
