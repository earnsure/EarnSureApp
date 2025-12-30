
import React, { useState, useEffect, useCallback, memo } from 'react';
import { db } from '../firebase-mock';
import { Transaction, TransactionType, User, WithdrawalRequest } from '../types';
import { 
  Wallet, History, ArrowUpRight, ArrowDownLeft, Landmark, Coins, Clock, 
  Calendar, ReceiptText, X, ChevronRight, AlertCircle, 
  Landmark as BankIcon, Smartphone, Gift, Target, Bomb, Disc, Eraser, 
  Share2, Zap, Server, ShieldCheck, Activity, User as UserIcon, Mail
} from 'lucide-react';
import { MIN_WITHDRAWAL_COINS, COIN_CONVERSION_RATE } from '../constants';

interface WalletPageProps {
  user: User;
}

// Optimized Transaction Item Component
const TransactionItem = memo(({ tx, icon }: { tx: Transaction, icon: React.ReactNode }) => (
  <div className="bg-[#1e293b] p-5 rounded-[1.5rem] border border-white/5 flex flex-col gap-3 shadow-md">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
          tx.type === TransactionType.EARN 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        }`}>
          {icon}
        </div>
        <div>
          <div className="text-[12px] font-black text-white uppercase tracking-tight">{tx.method}</div>
          <div className={`text-[8px] font-black uppercase tracking-widest opacity-60`}>
            {tx.type === TransactionType.EARN ? 'Settlement Received' : 'Vault Withdrawal'}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-xl font-black tabular-nums tracking-tighter ${tx.type === TransactionType.EARN ? 'text-emerald-500' : 'text-rose-500'}`}>
          {tx.type === TransactionType.EARN ? '+' : '-'}{tx.amount.toLocaleString()}
        </div>
        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Coins</div>
      </div>
    </div>
    
    <div className="flex items-center justify-between pt-2 border-t border-white/5">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Calendar size={10} />
        <span className="text-[8px] font-black uppercase tracking-widest">
          {new Date(tx.timestamp).toLocaleDateString()}
        </span>
      </div>
      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  </div>
));

const WalletPage: React.FC<WalletPageProps> = ({ user }) => {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState<'UPI' | 'RedeemCode'>('UPI');
  
  // Input fields
  const [upiId, setUpiId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Ensuring the loading state is clear
    setLoading(true);
    const unsubscribe = db.listenToTransactions(user.uid, (data) => {
      setTxs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const getMethodIcon = useCallback((method: string | undefined, type: TransactionType) => {
    const m = (method || '').toLowerCase();
    if (m.includes('unity')) return <Server size={18} />;
    if (m.includes('aviator')) return <Target size={18} />;
    if (m.includes('mines')) return <Bomb size={18} />;
    if (m.includes('spin')) return <Disc size={18} />;
    if (m.includes('scratch')) return <Eraser size={18} />;
    if (m.includes('refer')) return <Share2 size={18} />;
    if (m.includes('daily')) return <Zap size={18} />;
    return type === TransactionType.EARN ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />;
  }, []);

  const handleWithdrawSubmit = async () => {
    if (user.wallet_coins < MIN_WITHDRAWAL_COINS) {
      alert(`Min withdrawal required: 5000 coins (₹50)`);
      return;
    }

    if (withdrawalMethod === 'UPI') {
      if (!upiId.trim() || !fullName.trim()) return alert("Please fill all details");
    } else {
      if (!email.trim() || mobile.length < 10) return alert("Please fill all details");
    }

    setIsProcessing(true);
    const requestId = Math.random().toString(36).substr(2, 9);
    const coinsToRedeem = user.wallet_coins;
    
    const details = withdrawalMethod === 'UPI' 
      ? `UPI ID: ${upiId} | Name: ${fullName}`
      : `Email: ${email} | Mobile: ${mobile}`;

    try {
      await db.createWithdrawalRequest({
        id: requestId,
        uid: user.uid,
        amount: coinsToRedeem / COIN_CONVERSION_RATE,
        coins: coinsToRedeem,
        method: withdrawalMethod === 'UPI' ? 'UPI' : 'GiftCard', 
        details: details,
        status: 'pending',
        timestamp: Date.now()
      });

      await db.addTransaction(user.uid, {
        uid: user.uid,
        amount: coinsToRedeem,
        type: TransactionType.DEDUCT,
        method: 'Withdrawal',
        description: `Payout Authorized: ₹${(coinsToRedeem / COIN_CONVERSION_RATE).toFixed(2)} via ${withdrawalMethod}`
      });

      alert("Payout request sent! Settlement in 24-48 hours.");
      setShowWithdrawModal(false);
      setUpiId(''); setFullName(''); setEmail(''); setMobile('');
    } catch (err) {
      alert("Network Error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-full bg-[#0f172a] p-4 space-y-6 pb-24">
      {/* Balance Card */}
      <div className="bg-[#1e293b] rounded-[2rem] p-8 border border-white/5 shadow-xl text-center space-y-6">
        <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <ShieldCheck size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Current Balance</h3>
            </div>
            <div className="text-6xl font-black text-white tracking-tighter tabular-nums">
              {user.wallet_coins.toLocaleString()}
            </div>
            <div className="text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full inline-block">
              ₹{(user.wallet_coins / COIN_CONVERSION_RATE).toFixed(2)} Real Cash
            </div>
        </div>

        <button 
          onClick={() => setShowWithdrawModal(true)}
          className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg transition-colors active:scale-95"
        >
          Initialize Payout
        </button>
      </div>

      {/* Transactions */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
           <History className="text-blue-500" size={20} />
           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Transaction History</h2>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center bg-slate-900/40 rounded-[2rem] border border-white/5">
               <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syncing Hub Records...</span>
            </div>
          ) : (
            <>
              {txs.length === 0 ? (
                <div className="py-20 text-center bg-slate-900/40 rounded-[2rem] border border-white/5">
                   <Activity className="mx-auto text-slate-700 mb-2" size={32} />
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No activity found yet</p>
                </div>
              ) : (
                txs.map(tx => (
                  <TransactionItem key={tx.id} tx={tx} icon={getMethodIcon(tx.method, tx.type)} />
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Payout Hub Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#1e293b] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col relative">
            <button 
              onClick={() => setShowWithdrawModal(false)} 
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X size={24} />
            </button>

            <div className="p-8 pb-4 text-center">
               <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Payout Hub</h3>
               <div className="inline-block mt-1 bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                 Minimum: 5000 Coins (₹50)
               </div>
            </div>

            <div className="px-6 pb-8 space-y-6">
               <div className="flex gap-2">
                  <button 
                    onClick={() => setWithdrawalMethod('UPI')}
                    className={`flex-1 py-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${withdrawalMethod === 'UPI' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-white/5 text-slate-500'}`}
                  >
                    UPI Transfer
                  </button>
                  <button 
                    onClick={() => setWithdrawalMethod('RedeemCode')}
                    className={`flex-1 py-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${withdrawalMethod === 'RedeemCode' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-white/5 text-slate-500'}`}
                  >
                    Redeem Code
                  </button>
               </div>

               <div className="space-y-4">
                  {withdrawalMethod === 'UPI' ? (
                    <>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">UPI ID</label>
                         <input 
                           type="text" placeholder="example@upi"
                           className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500"
                           value={upiId} onChange={(e) => setUpiId(e.target.value)}
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Account Name</label>
                         <input 
                           type="text" placeholder="Full Name"
                           className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500"
                           value={fullName} onChange={(e) => setFullName(e.target.value)}
                         />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Email</label>
                         <input 
                           type="email" placeholder="code@email.com"
                           className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500"
                           value={email} onChange={(e) => setEmail(e.target.value)}
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Mobile Number</label>
                         <input 
                           type="tel" placeholder="10 Digits"
                           className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500"
                           value={mobile} onChange={(e) => setMobile(e.target.value)}
                         />
                      </div>
                    </>
                  )}
               </div>

               <button 
                 onClick={handleWithdrawSubmit}
                 disabled={isProcessing || user.wallet_coins < MIN_WITHDRAWAL_COINS}
                 className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 ${
                   user.wallet_coins < MIN_WITHDRAWAL_COINS 
                     ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                     : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                 }`}
               >
                 {isProcessing ? 'Authorizing Payout...' : `Settle ₹${(user.wallet_coins / COIN_CONVERSION_RATE).toFixed(2)}`}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
