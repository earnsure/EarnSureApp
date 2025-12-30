
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Users, Wallet, Settings, Search, 
  X, Banknote, 
  Ban, UserCheck, 
  LayoutDashboard, MessageCircle, Send,
  Speaker, Coins, Loader2, CheckCircle2,
  User as UserIcon, Mail, Smartphone, KeyRound, Share2,
  FileText, ShieldCheck as ShieldIcon, Scale,
  ArrowDownRight, History, AlertCircle,
  Landmark as BankIcon
} from 'lucide-react';
import { db, rtdb } from '../firebase-mock';
import { User, WithdrawalRequest, ChatMessage } from '../types';
import { onValue, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'withdrawals' | 'support' | 'announce' | 'legal'>('withdrawals');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activeChatUids, setActiveChatUids] = useState<string[]>([]);
  const [selectedChatUid, setSelectedChatUid] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [isActioning, setIsActioning] = useState<string | null>(null);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });

  const [legalContent, setLegalContent] = useState({
    terms: '',
    privacy: '',
    lastUpdated: Date.now()
  });

  useEffect(() => {
    const unsubUsers = onValue(ref(rtdb, 'users'), (snapshot) => {
      if (snapshot.exists()) setUsers(Object.values(snapshot.val()));
    });
    const unsubWithdrawals = db.listenToWithdrawals((allWithdrawals) => setWithdrawals(allWithdrawals));
    const unsubChats = db.listenToActiveChats((uids) => setActiveChatUids(uids));
    
    onValue(ref(rtdb, 'settings/legal'), (snapshot) => {
      if (snapshot.exists()) setLegalContent(snapshot.val());
    });

    return () => { unsubUsers(); unsubWithdrawals(); unsubChats(); };
  }, []);

  useEffect(() => {
    if (selectedChatUid) {
      const unsub = db.listenToChat(selectedChatUid, (msgs) => setChatMessages(msgs.sort((a,b) => a.timestamp - b.timestamp)));
      return () => unsub();
    }
  }, [selectedChatUid]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals
      .filter(w => w.status === withdrawalFilter)
      .filter(w => {
        if (!bankSearch) return true;
        const user = users.find(u => u.uid === w.uid);
        const searchStr = bankSearch.toLowerCase();
        return (
          user?.name.toLowerCase().includes(searchStr) ||
          user?.email.toLowerCase().includes(searchStr) ||
          w.id.toLowerCase().includes(searchStr) ||
          w.method.toLowerCase().includes(searchStr)
        );
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [withdrawals, withdrawalFilter, bankSearch, users]);

  const bankStats = useMemo(() => {
    const pending = withdrawals.filter(w => w.status === 'pending');
    return {
      pendingCount: pending.length,
      pendingTotal: pending.reduce((acc, curr) => acc + curr.amount, 0)
    };
  }, [withdrawals]);

  const handleUserUpdate = async (uid: string, data: Partial<User>) => {
    try {
      await db.updateUser(uid, data);
      setEditingUser(null);
    } catch (e: any) {
      alert("Failed to update user: " + e.message);
    }
  };

  const handleWithdrawAction = async (req: WithdrawalRequest, status: 'approved' | 'rejected') => {
    if (isActioning) return;
    setIsActioning(req.id);
    try {
      await db.updateWithdrawalStatus(req.id, status);
      await db.sendNotification(req.uid, {
        title: status === 'approved' ? 'Withdrawal Success' : 'Withdrawal Rejected',
        body: status === 'approved' ? `Your payout of ₹${req.amount} has been settled.` : `Your request for ₹${req.amount} was declined.`,
        type: status === 'approved' ? 'success' : 'alert'
      });
      setTimeout(() => setIsActioning(null), 500);
    } catch (e: any) {
      alert("Operation Failed.");
      setIsActioning(null);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcement.title || !announcement.message) return;
    try {
      await db.postAnnouncement(announcement);
      setAnnouncement({ title: '', message: '' });
      alert("Announcement Broadcasted!");
    } catch (e: any) {
      alert("Failed to post.");
    }
  };

  const handleSendReply = async () => {
    if (!selectedChatUid || !replyText.trim()) return;
    try {
      await db.sendMessage(selectedChatUid, { senderId: 'admin_root', text: replyText, isAdmin: true });
      setReplyText('');
    } catch (e: any) {
      alert("Message failed.");
    }
  };

  const handleSaveLegal = async () => {
    try {
      await set(ref(rtdb, 'settings/legal'), { ...legalContent, lastUpdated: Date.now() });
      alert("Legal Content Synced.");
    } catch (e: any) {
      alert("Sync Failed.");
    }
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col text-white font-sans overflow-hidden">
       <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"><ArrowLeft size={20} /></button>
            <h1 className="text-lg font-black uppercase italic tracking-tighter">Command Center</h1>
          </div>
          <div className="px-3 py-1 bg-red-600/10 text-red-500 border border-red-500/20 text-[9px] font-black uppercase rounded-lg">Root Privileges</div>
       </div>

       <div className="flex bg-slate-900/50 border-b border-white/5 overflow-x-auto no-scrollbar">
          <AdminTab active={activeTab === 'stats'} icon={<LayoutDashboard size={16} />} onClick={() => setActiveTab('stats')}>Hub</AdminTab>
          <AdminTab active={activeTab === 'users'} icon={<Users size={16} />} onClick={() => setActiveTab('users')}>Users</AdminTab>
          <AdminTab active={activeTab === 'withdrawals'} icon={<Banknote size={16} />} onClick={() => setActiveTab('withdrawals')}>Bank</AdminTab>
          <AdminTab active={activeTab === 'support'} icon={<MessageCircle size={16} />} onClick={() => setActiveTab('support')}>Support</AdminTab>
          <AdminTab active={activeTab === 'announce'} icon={<Speaker size={16} />} onClick={() => setActiveTab('announce')}>Broadcast</AdminTab>
          <AdminTab active={activeTab === 'legal'} icon={<Scale size={16} />} onClick={() => setActiveTab('legal')}>Legal</AdminTab>
       </div>

       <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar pb-32">
          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Total Nodes" value={users.length} icon={<Users className="text-blue-500" />} />
              <StatCard label="Bank Queue" value={bankStats.pendingCount} icon={<Wallet className="text-emerald-500" />} />
              <StatCard label="Total Circulation" value={users.reduce((acc, curr) => acc + (curr.wallet_coins || 0), 0).toLocaleString()} icon={<Coins className="text-yellow-500" />} />
              <StatCard label="Support Tickets" value={activeChatUids.length} icon={<MessageCircle className="text-indigo-500" />} />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" placeholder="Search Node ID, Email or Name..." 
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold focus:border-blue-500 outline-none transition-all"
                  value={search} onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                {users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).map(u => (
                  <div key={u.uid} className="bg-slate-900/40 p-4 rounded-[1.5rem] border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt="" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-black text-white uppercase">{u.name} {u.is_admin && <span className="text-[8px] text-red-500 ml-1">ADMIN</span>}</div>
                        <div className="text-[9px] font-bold text-slate-500 tracking-tight">{u.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-blue-500">{u.wallet_coins.toLocaleString()} C</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setEditingUser(u)} className="p-3 bg-slate-800 rounded-xl text-slate-400 group-hover:text-blue-500 transition-all border border-white/5"><Settings size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-600/10 border border-emerald-500/20 p-5 rounded-[2rem] space-y-1">
                     <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><Wallet size={12} /> Pending Payables</div>
                     <div className="text-2xl font-black text-white italic">₹{bankStats.pendingTotal.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-[2rem] space-y-1">
                     <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><History size={12} /> In Queue</div>
                     <div className="text-2xl font-black text-white italic">{bankStats.pendingCount} Nodes</div>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="text" placeholder="Search..." className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3.5 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest outline-none" value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
                  </div>
               </div>
               <div className="space-y-4">
                  {filteredWithdrawals.map(w => {
                    const user = users.find(u => u.uid === w.uid);
                    return (
                      <div key={w.id} className="bg-slate-900/40 p-5 rounded-[2.5rem] border border-white/5 space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="" />
                               </div>
                               <div><div className="text-[11px] font-black text-white uppercase">{user?.name}</div><div className="text-[8px] font-bold text-slate-500">{user?.phone}</div></div>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                               <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Redeem Amount</div>
                               <div className="text-xl font-black text-emerald-500">₹{w.amount}</div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                               <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Method</div>
                               <div className="text-[12px] font-black text-white uppercase"><BankIcon size={14} className="inline mr-1 text-blue-500" /> {w.method}</div>
                            </div>
                         </div>
                         <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-[10px] font-mono break-all">{w.details}</div>
                         {w.status === 'pending' && (
                           <div className="flex gap-2">
                              <button onClick={() => handleWithdrawAction(w, 'approved')} disabled={isActioning === w.id} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase">Approve</button>
                              <button onClick={() => handleWithdrawAction(w, 'rejected')} disabled={isActioning === w.id} className="flex-1 py-4 bg-red-600/10 text-red-500 rounded-2xl text-[10px] font-black uppercase">Decline</button>
                           </div>
                         )}
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="h-full flex flex-col space-y-4">
               {selectedChatUid ? (
                 <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 flex flex-col h-[500px] overflow-hidden">
                    <div className="p-4 bg-slate-800/50 flex items-center justify-between"><button onClick={() => setSelectedChatUid(null)} className="text-xs font-black text-slate-400">Back</button></div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                       {chatMessages.map(m => (
                         <div key={m.id} className={`flex ${m.isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-3xl text-[11px] font-medium ${m.isAdmin ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{m.text}</div>
                         </div>
                       ))}
                    </div>
                    <div className="p-4 bg-slate-950 flex gap-2">
                       <input type="text" placeholder="Reply..." className="flex-1 bg-slate-900 p-3 text-xs rounded-xl outline-none" value={replyText} onChange={e => setReplyText(e.target.value)} />
                       <button onClick={handleSendReply} className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Send size={18} /></button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {activeChatUids.map(uid => (
                      <button key={uid} onClick={() => setSelectedChatUid(uid)} className="w-full bg-slate-900/40 p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group">
                         <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${users.find(u => u.uid === uid)?.name}`} alt="" /></div><div className="text-left font-black text-white text-xs">{users.find(u => u.uid === uid)?.name}</div></div>
                         <MessageCircle size={18} />
                      </button>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'announce' && (
            <div className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Broadcast</h3>
              <input type="text" placeholder="Title" className="w-full bg-slate-950 p-4 rounded-2xl text-xs font-bold" value={announcement.title} onChange={e => setAnnouncement({...announcement, title: e.target.value})} />
              <textarea placeholder="Message" rows={4} className="w-full bg-slate-950 p-4 rounded-2xl text-xs font-bold" value={announcement.message} onChange={e => setAnnouncement({...announcement, message: e.target.value})}></textarea>
              <button onClick={handlePostAnnouncement} className="w-full py-5 bg-pink-600 rounded-[2rem] font-black text-xs uppercase"><Send size={18} className="inline mr-2" /> Transmit</button>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Legal Content</h3>
              <textarea value={legalContent.terms} onChange={e => setLegalContent({...legalContent, terms: e.target.value})} className="w-full bg-slate-950 p-4 text-[11px] rounded-2xl h-40" placeholder="Terms..." />
              <textarea value={legalContent.privacy} onChange={e => setLegalContent({...legalContent, privacy: e.target.value})} className="w-full bg-slate-950 p-4 text-[11px] rounded-2xl h-40" placeholder="Privacy..." />
              <button onClick={handleSaveLegal} className="w-full py-5 bg-blue-600 rounded-3xl font-black text-xs">Sync Legal Records</button>
            </div>
          )}
       </div>

       {editingUser && (
         <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 rounded-[3rem] border border-white/10 p-8 space-y-5">
               <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 text-slate-500"><X size={24} /></button>
               <h3 className="text-xl font-black text-white uppercase italic">Edit User</h3>
               <div className="space-y-4">
                 <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-black p-4 rounded-xl text-xs" placeholder="Name" />
                 <input type="number" value={editingUser.wallet_coins} onChange={e => setEditingUser({...editingUser, wallet_coins: Number(e.target.value)})} className="w-full bg-black p-4 rounded-xl text-xs" placeholder="Coins" />
                 <button onClick={() => handleUserUpdate(editingUser.uid, { name: editingUser.name, wallet_coins: editingUser.wallet_coins, is_banned: editingUser.is_banned })} className="w-full py-4 bg-blue-600 rounded-xl font-black text-xs uppercase">Save Changes</button>
                 <button onClick={() => handleUserUpdate(editingUser.uid, { is_banned: !editingUser.is_banned })} className={`w-full py-4 rounded-xl font-black text-[10px] uppercase border ${editingUser.is_banned ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
                    {editingUser.is_banned ? 'Unban User' : 'Ban User'}
                 </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

const AdminTab: React.FC<{ active: boolean, icon: React.ReactNode, onClick: () => void, children: React.ReactNode }> = ({ active, icon, onClick, children }) => (
  <button onClick={onClick} className={`flex-1 min-w-[80px] py-5 flex flex-col items-center gap-1 border-b-2 transition-all ${active ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-transparent text-slate-600'}`}>
    {icon}<span className="text-[8px] font-black uppercase">{children}</span>
  </button>
);

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-slate-900/50 p-5 rounded-[2rem] border border-white/5 space-y-3">
    <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-white/5">{icon}</div>
    <div><div className="text-xl font-black text-white">{value}</div><div className="text-[8px] font-black text-slate-600 uppercase mt-0.5">{label}</div></div>
  </div>
);

export default AdminDashboard;
