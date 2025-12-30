
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { auth, db, rtdb } from '../firebase-mock';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { get, ref, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { Mail, Lock, User as UserIcon, Smartphone, ArrowRight, Zap, Loader2, ShieldAlert, KeyRound, Coins, ShieldCheck, Fingerprint } from 'lucide-react';
import { TransactionType } from '../types';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'admin';

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    referral: ''
  });

  useEffect(() => {
    let id = localStorage.getItem('earnsure_device_uuid');
    if (!id) {
      id = 'ES-DEVICE-' + Math.random().toString(36).slice(2, 15).toUpperCase() + Date.now().toString(36).toUpperCase();
      localStorage.setItem('earnsure_device_uuid', id);
    }
    setDeviceId(id);
  }, []);

  const generateReferralCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    // First 4 letters
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // Last 2 numbers
    for (let i = 0; i < 2; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const email = formData.email.trim();
    const password = formData.password;

    try {
      if (mode === 'admin') {
        // Master Admin Credentials verification
        const isMaster = email.toLowerCase() === 'earnsure@admin.com' && password === 'topking005' && verificationCode.trim() === '28032009';
        
        if (isMaster) {
          let cred;
          try {
            // Try standard sign in
            cred = await signInWithEmailAndPassword(auth, email, password);
          } catch (signInError: any) {
            // If user doesn't exist or credentials invalid, try to check if user exists at all
            if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/user-not-found') {
              try {
                // We try creating the master if it doesn't exist. 
                // Note: If it exists with a different password, this will still throw email-already-in-use.
                cred = await createUserWithEmailAndPassword(auth, email, password);
              } catch (createError: any) {
                // If it fails because email exists, it means the master password in Auth is different from the hardcoded one.
                if (createError.code === 'auth/email-already-in-use') {
                   throw new Error("Master credentials mismatch. Please contact server owner to reset master password.");
                }
                throw new Error("Critical: Master node creation failed.");
              }
            } else {
              throw signInError;
            }
          }

          if (cred) {
            let adminUser = await db.getUser(cred.user.uid);
            if (!adminUser) {
              adminUser = {
                uid: cred.user.uid,
                name: 'EarnSure Admin',
                email: email,
                phone: '0000000000',
                password: password,
                wallet_coins: 999999,
                referral_code: 'ADMIN',
                joined_date: Date.now(),
                device_id: deviceId,
                is_admin: true
              };
              await db.saveUser(adminUser);
            } else {
              // Ensure they have admin flags
              await db.updateUser(cred.user.uid, { is_admin: true, password: password });
              adminUser.is_admin = true;
            }
            onAuthSuccess(adminUser);
            return;
          }
        } else {
          alert("SECURITY: Unauthorized root access attempt blocked.");
          setIsSubmitting(false);
          return;
        }
      }

      if (mode === 'login') {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          // Check if account is banned before proceeding
          const userData = await db.getUser(cred.user.uid);
          if (userData?.is_banned) {
            throw new Error("ACCOUNT_BANNED");
          }
          await db.updateUser(cred.user.uid, { password: password });
          if (userData) onAuthSuccess(userData);
        } catch (loginErr: any) {
          if (loginErr.message === "ACCOUNT_BANNED") {
            alert("ACCESS DENIED: This node has been terminated due to policy violations.");
          } else if (loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/wrong-password') {
            alert("AUTH ERROR: Invalid email or password. Please verify your credentials.");
          } else {
            alert("PROTOCOL ERROR: " + loginErr.message);
          }
          setIsSubmitting(false);
          return;
        }
      } else if (mode === 'register') {
        // ANTI-CHEAT: Check if this device already has an account
        const deviceTaken = await db.checkDeviceInUse(deviceId);
        if (deviceTaken) {
          alert("ANTI-FRAUD: This device is already linked to an existing node. Multi-accounting is prohibited.");
          setIsSubmitting(false);
          return;
        }

        // Referral Validation Logic
        let inviterUid = '';
        if (formData.referral.trim()) {
          const usersRef = ref(rtdb, 'users');
          const referralQuery = query(usersRef, orderByChild('referral_code'), equalTo(formData.referral.trim().toUpperCase()));
          const referralSnapshot = await get(referralQuery);
          
          if (!referralSnapshot.exists()) {
            alert("INVALID CODE: Referral code '" + formData.referral + "' not found in active records.");
            setIsSubmitting(false);
            return;
          }
          
          const inviterData = Object.values(referralSnapshot.val())[0] as User;
          inviterUid = inviterData.uid;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const newUser: User = {
          uid: cred.user.uid,
          name: formData.name,
          email: email,
          phone: formData.phone,
          password: password,
          wallet_coins: 0,
          referral_code: generateReferralCode(),
          referred_by: inviterUid || undefined,
          joined_date: Date.now(),
          device_id: deviceId,
          is_admin: false
        };
        
        await db.saveUser(newUser);

        // Process Referral Bonus (100 for inviter, 50 for invited)
        if (inviterUid) {
          await db.addTransaction(inviterUid, {
            uid: inviterUid,
            amount: 100,
            type: TransactionType.EARN,
            method: 'Referral Bonus',
            description: `Network Expansion: ${formData.name}`
          });
          
          await db.sendNotification(inviterUid, {
            title: 'Invite Success',
            body: `+100 Coins credited for expanding the network with ${formData.name}!`,
            type: 'success'
          });

          await db.addTransaction(cred.user.uid, {
            uid: cred.user.uid,
            amount: 50,
            type: TransactionType.EARN,
            method: 'Welcome Bonus',
            description: 'New Node Handshake Bonus'
          });
        }

        onAuthSuccess(newUser);
      }
    } catch (error: any) {
      console.error("Auth Exception:", error.code, error.message);
      let msg = "A gateway error occurred. Check your network.";
      if (error.code === 'auth/email-already-in-use') msg = "This email is already registered as a node.";
      if (error.code === 'auth/weak-password') msg = "Security protocol requires a stronger password (min 6 chars).";
      if (error.code === 'auth/invalid-email') msg = "The provided email format is invalid.";
      alert(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-[#020617] flex flex-col p-6 overflow-y-auto no-scrollbar relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_transparent_70%)] opacity-30"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative z-10 py-10">
        <div className="w-full max-w-sm flex items-center gap-5">
          {mode === 'admin' ? (
            <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-lg animate-pulse shrink-0">
               <ShieldAlert size={32} className="text-red-500" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(255,255,255,0.1)] border border-white/10 shrink-0 overflow-hidden p-2">
               <img src="https://i.ibb.co/wZptWH5p/logo.png" alt="logo" className="w-full h-auto object-contain mix-blend-multiply" />
            </div>
          )}
          
          <div className="text-left">
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
              {mode === 'admin' ? 'ROOT ACCESS' : 'EARNSURE APP'}
            </h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">
              {mode === 'register' ? 'Device Fingerprinting Active' : 'Earning Protocol Active'}
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm flex bg-[#0f172a] p-1 rounded-2xl border border-white/5 shadow-xl">
          <button 
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            Login
          </button>
          <button 
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {mode === 'register' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <InputGroup icon={<UserIcon size={18} />} placeholder="Full Name" type="text" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
              <InputGroup icon={<Smartphone size={18} />} placeholder="Mobile (+91)" type="tel" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} required />
              <div className="flex items-center gap-3 bg-blue-600/5 p-4 rounded-2xl border border-blue-500/10">
                 <ShieldCheck size={20} className="text-blue-500" />
                 <div className="flex-1">
                    <div className="text-[9px] font-black text-white uppercase">Security Layer</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase">Single mobile node binding.</div>
                 </div>
              </div>
            </div>
          )}
          
          <InputGroup 
            icon={<Mail size={18} />} 
            placeholder={mode === 'admin' ? "Admin Email" : "Email Address"} 
            type="email" 
            value={formData.email} 
            onChange={v => setFormData({...formData, email: v})} 
            required 
          />
          
          <InputGroup 
            icon={<Lock size={18} />} 
            placeholder="Password" 
            type="password" 
            value={formData.password} 
            onChange={v => setFormData({...formData, password: v})} 
            required 
          />

          {mode === 'admin' && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <InputGroup 
                icon={<KeyRound size={18} />} 
                placeholder="Master Root Code" 
                type="text" 
                value={verificationCode} 
                onChange={setVerificationCode} 
                required 
              />
            </div>
          )}
          
          {mode === 'register' && (
            <div className="relative animate-in slide-in-from-bottom-2 duration-300">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600"><ArrowRight size={18} /></div>
              <input 
                type="text"
                placeholder="Referral Code (Optional)"
                value={formData.referral}
                onChange={(e) => setFormData({...formData, referral: e.target.value})}
                className="w-full bg-[#0f172a] border border-white/5 rounded-2xl py-4.5 pl-12 pr-6 text-white text-xs font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-xl transition-all active:scale-95 mt-4 disabled:opacity-50 flex items-center justify-center gap-2 ${mode === 'admin' ? 'bg-red-600 text-white shadow-red-600/20' : 'bg-blue-600 text-white shadow-blue-600/20'}`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              mode === 'admin' ? 'Access Dashboard' : mode === 'login' ? 'Login' : 'Secure Register'
            )}
          </button>
        </form>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full border border-white/5 opacity-50">
             <Fingerprint size={12} className="text-blue-500" />
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{deviceId.slice(0, 16)}...</span>
          </div>

          {mode !== 'admin' ? (
            <button 
              type="button"
              onClick={() => {
                setMode('admin');
                setFormData({ ...formData, email: '', password: '' });
              }} 
              className="flex items-center gap-2 text-slate-700 text-[9px] font-black uppercase tracking-[0.3em] hover:text-red-500 transition-colors mt-2"
            >
              <ShieldAlert size={14} /> Admin Terminal
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => setMode('login')} 
              className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] hover:text-blue-500 transition-colors mt-2"
            >
              Back to User Gateway
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ icon: React.ReactNode, placeholder: string, type: string, value: string, onChange: (v: string) => void, required?: boolean }> = ({ icon, placeholder, type, value, onChange, required }) => (
  <div className="relative group">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">{icon}</div>
    <input 
      type={type} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#0f172a] border border-white/5 rounded-2xl py-4.5 pl-12 pr-6 text-white text-xs font-bold outline-none focus:border-blue-500 transition-all"
      required={required}
    />
  </div>
);

export default AuthPage;
