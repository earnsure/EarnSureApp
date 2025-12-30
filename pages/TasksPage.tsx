
import React, { useState, useEffect } from 'react';
import { db } from '../firebase-mock';
import { Task, TaskProof, User } from '../types';
import { CheckCircle2, Clock, ImagePlus, Send, Eye, X, AlertCircle, ChevronRight, Zap, LucideIcon } from 'lucide-react';
import { IMGBB_API_KEY } from '../constants';

interface TasksPageProps {
  user: User;
}

const TasksPage: React.FC<TasksPageProps> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userProofs, setUserProofs] = useState<Record<string, TaskProof>>({});

  useEffect(() => {
    const loadData = async () => {
      const remoteTasks = await db.getTasks();
      // Provide defaults if DB is empty
      if (remoteTasks.length === 0) {
        setTasks([
          { id: 't1', title: 'Follow on Twitter', reward: 50, description: 'Follow our official handle and upload screenshot.', require_proof: true, is_active: true },
          { id: 't2', title: 'Join Telegram', reward: 30, description: 'Join our community for daily updates.', require_proof: true, is_active: true },
          { id: 't3', title: 'Subscribe YouTube', reward: 100, description: 'Subscribe and hit the bell icon.', require_proof: true, is_active: true }
        ]);
      } else {
        setTasks(remoteTasks);
      }
    };

    loadData();

    const unsubscribe = db.listenToProofs((allProofs) => {
      const proofMap: Record<string, TaskProof> = {};
      allProofs.filter(p => p.uid === user.uid).forEach(p => {
        proofMap[p.task_id] = p;
      });
      setUserProofs(proofMap);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || !e.target.files?.[0]) return;
    setIsUploading(true);

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        const newProof: TaskProof = {
          id: Math.random().toString(36).substr(2, 9),
          uid: user.uid,
          task_id: selectedTask.id,
          proof_url: data.data.url,
          status: 'pending',
          submitted_at: Date.now()
        };
        
        await db.submitProof(newProof);
        alert("Verification request sent! Admin will review your proof within 24 hours.");
      }
    } catch (err) {
      alert("Connectivity error. Please try again.");
    } finally {
      setIsUploading(false);
      setSelectedTask(null);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
            <Zap className="text-blue-500 fill-current" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Gig Economy</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Verification Server</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
          <div className="text-lg font-black text-white">{tasks.length}</div>
          <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Total</div>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
          {/* Added explicit cast to TaskProof[] to resolve 'unknown' status access */}
          <div className="text-lg font-black text-emerald-500">{(Object.values(userProofs) as TaskProof[]).filter(p => p.status === 'approved').length}</div>
          <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Done</div>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
          {/* Added explicit cast to TaskProof[] to resolve 'unknown' status access */}
          <div className="text-lg font-black text-blue-500">{(Object.values(userProofs) as TaskProof[]).filter(p => p.status === 'pending').length}</div>
          <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Wait</div>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map(task => {
          const proof = userProofs[task.id];
          const status = proof?.status;
          
          return (
            <div key={task.id} className="bg-slate-900/60 backdrop-blur-md p-5 rounded-[2.5rem] flex flex-col gap-4 border border-white/5 group hover:border-white/10 transition-all shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-white/5 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Award</span>
                  <span className="text-sm font-black text-blue-500">+{task.reward}</span>
                </div>
                
                <div className="flex-1 min-w-0 py-1">
                  <div className="font-black text-white text-sm uppercase tracking-tight truncate">{task.title}</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2 italic">
                    {task.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-black/20 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2">
                  {status === 'pending' && <StatusBadge color="text-blue-500" bgColor="bg-blue-500/10" icon={Clock} label="Under Review" />}
                  {status === 'approved' && <StatusBadge color="text-emerald-500" bgColor="bg-emerald-500/10" icon={CheckCircle2} label="Verified" />}
                  {status === 'rejected' && <StatusBadge color="text-rose-500" bgColor="bg-rose-500/10" icon={AlertCircle} label="Rejected" />}
                  {!status && <StatusBadge color="text-slate-500" bgColor="bg-slate-800/50" icon={Zap} label="Available" />}
                </div>

                <div className="flex items-center gap-2">
                  {proof && (
                    <button 
                      onClick={() => setViewingProofUrl(proof.proof_url)}
                      className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 border border-white/5 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  
                  {(status === 'rejected' || !status) && (
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                      {status === 'rejected' ? 'Retry' : 'Submit'} <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-sm rounded-[3rem] p-8 border border-white/10 space-y-8 shadow-[0_0_100px_rgba(37,99,235,0.1)] relative">
            <button onClick={() => setSelectedTask(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
            <div className="text-center space-y-2 pt-4">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{selectedTask.title}</h3>
              <p className="text-slate-500 text-xs font-medium px-4">{selectedTask.description}</p>
            </div>
            <div className={`p-8 bg-slate-950 rounded-[2rem] border-2 border-dashed transition-all ${isUploading ? 'border-blue-500 animate-pulse' : 'border-slate-800 hover:border-blue-500/40'} text-center group`}>
              <label className="cursor-pointer block space-y-4">
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center mx-auto border border-white/5 shadow-inner">
                   <ImagePlus className="text-blue-500" size={32} />
                </div>
                <div>
                  <div className="font-black text-white text-sm uppercase tracking-widest">{isUploading ? 'Transferring...' : 'Upload Evidence'}</div>
                </div>
              </label>
            </div>
            <button onClick={() => setSelectedTask(null)} className="w-full py-4.5 rounded-2xl bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest active:scale-95">Cancel</button>
          </div>
        </div>
      )}

      {viewingProofUrl && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[110] flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Verification Node</h3>
            <button onClick={() => setViewingProofUrl(null)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"><X size={24} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <img src={viewingProofUrl} alt="Submitted Proof" className="w-full h-full object-contain rounded-3xl" />
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ color: string, bgColor: string, icon: LucideIcon, label: string }> = ({ color, bgColor, icon: Icon, label }) => (
  <div className={`${bgColor} ${color} px-3 py-1.5 rounded-xl border border-current/10 flex items-center gap-1.5`}>
    <Icon size={12} />
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </div>
);

export default TasksPage;
