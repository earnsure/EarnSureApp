
import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, LogOut, Settings, ShieldCheck, FileText, 
  Smartphone, Languages, Lock, ChevronRight, Share2, 
  KeyRound, HelpCircle, Bell, Fingerprint, X, Loader2, CheckCircle2, Gift,
  Download, Smartphone as AndroidIcon
} from 'lucide-react';
import { User as UserType } from '../types';
import { auth, db } from '../firebase-mock';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

interface ProfilePageProps {
  onLogout: () => void;
  user: UserType;
  onNavigate: (page: string) => void;
  onLegal: (type: 'terms' | 'privacy') => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout, user, onNavigate, onLegal }) => {
  const [notifStatus, setNotifStatus] = useState<string>('Unknown');
  const [showPassModal, setShowPassModal] = useState(false);
  const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // YE LINK AAPKO APK UPLOAD KARNE KE BAAD UPDATE KARNA HAI
  const APK_DOWNLOAD_URL = "#"; 

  useEffect(() => {
    if ("Notification" in window) {
      setNotifStatus(Notification.permission);
    }
  }, []);

  const handleDownloadAPK = () => {
    if (APK_DOWNLOAD_URL === "#") {
      alert("APK Deployment in progress. Please check back later.");
      return;
    }
    window.open(APK_DOWNLOAD_URL, '_blank');
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdating) return;
    if (passForm.new.length < 6) return alert("Min 6 characters required.");
    if (passForm.new !== passForm.confirm) return alert("Passwords do not match.");
    
    setIsUpdating(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error("No session.");
      const credential = EmailAuthProvider.credential(currentUser.email, passForm.old);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passForm.new);
      await db.updateUser(user.uid, { password: passForm.new });
      alert("Success! Password updated.");
      setShowPassModal(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 relative overflow-x-hidden">
      <div className="flex flex-col items-center py-6 space-y-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-[2.5rem] bg-slate-800 p-1 border-4 border-blue-500/20 shadow-2xl overflow-hidden rotate-6">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=0f172a`} alt="avatar" className="-rotate-6 scale-110" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl border-4 border-slate-950">
            <ShieldCheck size={16} className="text-white" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">{user.name}</h2>
          <div className="text-blue-500 text-xs font-black uppercase tracking-widest">+91 {user.phone}</div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-blue-500/30 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
         <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-blue-500">
                  <AndroidIcon size={16} /><span className="text-[10px] font-black uppercase">Official App</span>
               </div>
               <h3 className="text-lg font-black text-white italic">Download APK</h3>
               <p className="text-[9px] font-bold text-slate-500 uppercase">Version 2.6.0 • Secure</p>
            </div>
            <button onClick={handleDownloadAPK} className="bg-blue-600 text-white p-4 rounded-2xl active:scale-90 transition-all shadow-xl shadow-blue-600/20">
               <Download size={24} />
            </button>
         </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <div><div className="text-[10px] font-black uppercase opacity-60">My Refer Code</div><div className="text-3xl font-black">{user.referral_code}</div></div>
             <button onClick={() => { navigator.clipboard.writeText(user.referral_code); alert("Copied!"); }} className="bg-white text-indigo-900 px-6 py-3 rounded-2xl font-black text-xs">Copy</button>
          </div>
          <div className="bg-black/20 p-4 rounded-2xl flex items-center gap-3 border border-white/5">
             <Gift className="text-yellow-400" size={24} />
             <div className="text-[11px] font-black uppercase tracking-tight">Invite friends & earn 100 Coins</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <ProfileItem icon={<Bell size={18} />} label="Push Notifications" value={notifStatus === 'granted' ? 'ON' : 'OFF'} onClick={() => Notification.requestPermission()} />
        <ProfileItem icon={<KeyRound size={18} />} label="Security Settings" onClick={() => setShowPassModal(true)} />
        <ProfileItem icon={<HelpCircle size={18} />} label="Help & Chat" onClick={() => onNavigate('help')} />
        <ProfileItem icon={<ShieldCheck size={18} />} label="Privacy Policy" onClick={() => onLegal('privacy')} />
        <ProfileItem icon={<FileText size={18} />} label="Terms" onClick={() => onLegal('terms')} />
        <ProfileItem icon={<Settings size={18} />} label="App Version" value="2.6.0" />
      </div>

      <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-red-600/10 text-red-500 font-black border border-red-600/20">
        <LogOut size={20} /> Logout
      </button>

      {showPassModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="w-full max-w-sm bg-slate-900 rounded-[3rem] p-8 space-y-6 relative border border-blue-500/20">
            <button onClick={() => setShowPassModal(false)} className="absolute top-6 right-6 text-slate-500"><X size={24} /></button>
            <h3 className="text-xl font-black text-white italic uppercase text-center">Reset Security Key</h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <input type="password" required placeholder="Old Password" value={passForm.old} onChange={e => setPassForm({...passForm, old: e.target.value})} className="w-full bg-black rounded-2xl p-4 text-xs font-bold text-white outline-none" />
              <input type="password" required placeholder="New Password" value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} className="w-full bg-black rounded-2xl p-4 text-xs font-bold text-white outline-none" />
              <input type="password" required placeholder="Confirm New" value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} className="w-full bg-black rounded-2xl p-4 text-xs font-bold text-white outline-none" />
              <button type="submit" disabled={isUpdating} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl">
                {isUpdating ? <Loader2 className="animate-spin mx-auto" /> : 'Update Protocol'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileItem = ({ icon, label, value, onClick }: any) => (
  <button onClick={onClick} className="w-full bg-slate-900/40 p-5 rounded-[2rem] flex items-center gap-4 group hover:bg-slate-800 transition-all border border-white/5">
    <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-all">{icon}</div>
    <div className="flex-1 text-left font-black text-slate-200 text-sm">{label}</div>
    {value && <span className="text-[10px] font-black px-3 py-1 rounded-lg text-blue-500 bg-blue-500/10">{value}</span>}
    <ChevronRight size={18} className="text-slate-600" />
  </button>
);

export default ProfilePage;
