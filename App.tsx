
import React, { useState, useEffect } from 'react';
import { Home, Wallet, Trophy, User as UserIcon, ShieldCheck, Zap, Loader2, ShieldAlert, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { User, AppNotification } from './types';
import { auth, db } from './firebase-mock';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import HomePage from './pages/HomePage';
import WalletPage from './pages/WalletPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import AviatorGame from './pages/AviatorGame';
import MinesGame from './pages/MinesGame';
import ChickenRoadGame from './pages/ChickenRoadGame';
import LimboGame from './pages/LimboGame';
import SpinPage from './pages/SpinPage';
import HelpPage from './pages/HelpPage';
import ChatPage from './pages/ChatPage';
import MiningPage from './pages/MiningPage';
import LegalPage from './pages/LegalPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [sdkStatus, setSdkStatus] = useState('Initializing Core...');

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        setSdkStatus('Network Timeout - Retrying...');
        if (!user) setLoading(false);
      }
    }, 10000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setSdkStatus('Syncing Identity...');
      
      if (firebaseUser) {
        try {
          const userData = await db.getUser(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            setSdkStatus('Access Granted');
            db.listenToUser(firebaseUser.uid, (updated) => setUser(updated));
            
            if (userData.is_admin || firebaseUser.email === 'earnsure@admin.com') {
              setCurrentPage('admin');
            }
          } else {
            setUser(null);
            setSdkStatus('Profile Not Found');
          }
        } catch (e: any) {
          console.error("Initialization Error:", e);
          setError("Failed to reach secure servers. Check your connection.");
        }
      } else {
        setUser(null);
        setSdkStatus('Gateways Ready');
      }
      
      setLoading(false);
    }, (err) => {
      console.error("Auth Listener Error:", err);
      setError("Authentication handshake failed.");
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    if (u.is_admin || u.email === 'earnsure@admin.com') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('home');
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleLegalNavigate = (type: 'terms' | 'privacy') => {
    setLegalType(type);
    setCurrentPage('legal');
  };

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white p-10 text-center">
      <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center border border-rose-500/20 mb-6">
        <AlertTriangle className="text-rose-500" size={40} />
      </div>
      <h2 className="text-xl font-black uppercase italic tracking-tighter mb-2">Protocol Error</h2>
      <p className="text-slate-500 text-xs font-medium mb-8 max-w-xs">{error}</p>
      <button 
        onClick={handleRetry}
        className="w-full max-w-xs py-4 bg-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <RefreshCw size={14} /> Reconnect to Server
      </button>
    </div>
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white p-6">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-blue-600 blur-[80px] opacity-30 animate-pulse"></div>
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center relative border border-white/10 shadow-2xl overflow-hidden animate-float">
           <img src="https://i.ibb.co/wZptWH5p/logo.png" alt="logo" className="w-16 h-auto object-contain mix-blend-multiply" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
          <Loader2 className="animate-spin" size={16} /> Secure Handshake
        </div>
        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{sdkStatus}</div>
      </div>
      <button 
        onClick={handleRetry}
        className="mt-12 text-[8px] font-black uppercase text-slate-700 tracking-[0.3em] hover:text-slate-500 transition-colors"
      >
        Taking too long? Tap to restart
      </button>
    </div>
  );

  if (!user) return <AuthPage onAuthSuccess={handleAuthSuccess} />;

  if (user?.is_banned) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-10 text-center">
      <div className="w-24 h-24 bg-red-600/10 rounded-[2.5rem] flex items-center justify-center border border-red-500/20 mb-8">
        <ShieldAlert size={48} className="text-red-500" />
      </div>
      <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Access Revoked</h1>
      <p className="text-slate-500 text-xs font-medium mb-10">Your account is suspended for security reasons.</p>
      <button onClick={() => { auth.signOut(); setUser(null); }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Logout</button>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage user={user} onNavigate={setCurrentPage} />;
      case 'wallet': return <WalletPage user={user} />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'profile': return <ProfilePage user={user} onLogout={() => { auth.signOut(); setUser(null); }} onNavigate={setCurrentPage} onLegal={handleLegalNavigate} />;
      case 'admin': return <AdminDashboard onBack={() => setCurrentPage('home')} />;
      case 'aviator': return <AviatorGame user={user} onBack={() => setCurrentPage('home')} />;
      case 'mines': return <MinesGame user={user} onBack={() => setCurrentPage('home')} />;
      case 'chicken-road': return <ChickenRoadGame user={user} onBack={() => setCurrentPage('home')} />;
      case 'limbo': return <LimboGame user={user} onBack={() => setCurrentPage('home')} />;
      case 'spin': return <SpinPage user={user} onBack={() => setCurrentPage('home')} />;
      case 'mining': return <MiningPage user={user} onBack={() => setCurrentPage('home')} />;
      case 'help': return <HelpPage onBack={() => setCurrentPage('profile')} onNavigate={setCurrentPage} />;
      case 'chat': return <ChatPage user={user} onBack={() => setCurrentPage('help')} />;
      case 'legal': return <LegalPage onBack={() => setCurrentPage('profile')} type={legalType} />;
      default: return <HomePage user={user} onNavigate={setCurrentPage} />;
    }
  };

  const isGamePage = ['admin', 'aviator', 'mines', 'chicken-road', 'limbo', 'spin', 'mining', 'help', 'chat', 'legal'].includes(currentPage);
  const showBottomNav = !isGamePage;
  const showHeader = !isGamePage;
  
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-950 overflow-hidden relative shadow-2xl border-x border-white/[0.02]">
      {activeToast && (
        <div className="fixed top-6 left-6 right-6 z-[200] animate-in slide-in-from-top-10 duration-500">
           <div className={`p-5 rounded-[2rem] shadow-2xl border-2 backdrop-blur-2xl flex items-center gap-4 ${
             activeToast.type === 'success' ? 'bg-emerald-600/20 border-emerald-500/30' : 'bg-blue-600/20 border-blue-500/30'
           }`}>
              <div className="flex-1">
                 <div className="text-xs font-black text-white uppercase">{activeToast.title}</div>
                 <div className="text-[10px] font-bold text-slate-300 mt-0.5">{activeToast.body}</div>
              </div>
              <button onClick={() => setActiveToast(null)}><X size={18} className="text-slate-500" /></button>
           </div>
        </div>
      )}

      {showHeader && (
        <header className="p-4 flex items-center justify-between bg-slate-900/40 backdrop-blur-2xl border-b border-white/[0.05] sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
              <img src="https://i.ibb.co/wZptWH5p/logo.png" alt="logo" className="w-8 h-auto object-contain mix-blend-multiply" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter text-white uppercase">EarnSure</h1>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-green-500">Secure Node</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-slate-950 border border-white/10 pl-2 pr-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-inner">
              <div className="w-5 h-5 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-[10px]">
                <span className="text-slate-950 font-black">C</span>
              </div>
              <span className="font-black text-sm text-white tabular-nums">
                {(user?.wallet_coins ?? 0).toLocaleString()}
              </span>
            </div>
            {user?.is_admin && (
               <button onClick={() => setCurrentPage('admin')} className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                 <ShieldCheck size={16} />
               </button>
            )}
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto no-scrollbar ${showBottomNav ? 'pb-24' : ''}`}>
        {renderPage()}
      </main>

      {showBottomNav && (
        <nav className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-slate-900/90 backdrop-blur-3xl border border-white/10 flex justify-around items-center px-4 py-3 z-50 rounded-[2.5rem] shadow-2xl">
          <NavItem icon={<Home size={22} />} label="Vault" active={currentPage === 'home'} onClick={() => setCurrentPage('home')} />
          <NavItem icon={<Wallet size={22} />} label="Bank" active={currentPage === 'wallet'} onClick={() => setCurrentPage('wallet')} />
          <NavItem icon={<Trophy size={22} />} label="Best" active={currentPage === 'leaderboard'} onClick={() => setCurrentPage('leaderboard')} />
          <NavItem icon={<UserIcon size={22} />} label="Self" active={currentPage === 'profile'} onClick={() => setCurrentPage('profile')} />
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${active ? 'text-blue-500' : 'text-slate-500'}`}>
    <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : ''}`}>
      {icon}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
  </button>
);

export default App;
