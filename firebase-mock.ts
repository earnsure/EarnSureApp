
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, child, remove, push, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { User, Transaction, TransactionType, Task, TaskProof, WithdrawalRequest, ChatMessage, AppNotification, Announcement } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyBtiLE796arI_V9GeHOClaOum5ntGObPjg",
  authDomain: "earnsure-earing.firebaseapp.com",
  databaseURL: "https://earnsure-earing-default-rtdb.firebaseio.com",
  projectId: "earnsure-earing",
  storageBucket: "earnsure-earing.firebasestorage.app",
  messagingSenderId: "66927574906",
  appId: "1:66927574906:web:d051f02bff9bc4a9a320c3",
  measurementId: "G-FVH3DLJGK1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

export const db = {
  getUser: async (uid: string): Promise<User | null> => {
    try {
      const userRef = ref(rtdb, `users/${uid}`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() as User : null;
    } catch (e) { return null; }
  },

  checkDeviceInUse: async (deviceId: string): Promise<boolean> => {
    try {
      const usersRef = ref(rtdb, 'users');
      const deviceQuery = query(usersRef, orderByChild('device_id'), equalTo(deviceId));
      const snapshot = await get(deviceQuery);
      return snapshot.exists();
    } catch (e) { return false; }
  },
  
  saveUser: async (user: User) => set(ref(rtdb, `users/${user.uid}`), user),
  updateUser: async (uid: string, data: Partial<User>) => update(ref(rtdb, `users/${uid}`), data),
  getAllUsers: async (): Promise<User[]> => {
    const snapshot = await get(ref(rtdb, 'users'));
    return snapshot.exists() ? Object.values(snapshot.val()) as User[] : [];
  },

  addTransaction: async (uid: string, tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const txId = Math.random().toString(36).slice(2, 11);
    const timestamp = Date.now();
    const newTx = { ...tx, id: txId, timestamp };
    await set(ref(rtdb, `transactions/${uid}/${txId}`), newTx);
    
    const userRef = ref(rtdb, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val() as User;
      const amountChange = tx.type === TransactionType.EARN ? tx.amount : -tx.amount;
      await update(userRef, { wallet_coins: Math.max(0, (userData.wallet_coins || 0) + amountChange) });
    }
  },

  listenToUser: (uid: string, callback: (user: User) => void) => onValue(ref(rtdb, `users/${uid}`), s => s.exists() && callback(s.val())),
  listenToTransactions: (uid: string, callback: (txs: Transaction[]) => void) => onValue(ref(rtdb, `transactions/${uid}`), s => callback(s.exists() ? Object.values(s.val() as any).sort((a:any,b:any) => b.timestamp - a.timestamp) as Transaction[] : [])),
  getTasks: async (): Promise<Task[]> => {
    const s = await get(ref(rtdb, 'tasks'));
    return s.exists() ? Object.values(s.val()) as Task[] : [];
  },
  listenToTasks: (callback: (tasks: Task[]) => void) => onValue(ref(rtdb, 'tasks'), s => callback(s.exists() ? Object.values(s.val()) as Task[] : [])),
  saveTask: async (task: Task) => set(ref(rtdb, `tasks/${task.id}`), task),
  deleteTask: async (taskId: string) => remove(ref(rtdb, `tasks/${taskId}`)),
  submitProof: async (proof: TaskProof) => set(ref(rtdb, `proofs/${proof.id}`), proof),
  listenToProofs: (callback: (proofs: TaskProof[]) => void) => onValue(ref(rtdb, 'proofs'), s => callback(s.exists() ? Object.values(s.val()) as TaskProof[] : [])),
  updateProofStatus: async (proofId: string, status: 'approved' | 'rejected') => update(ref(rtdb, `proofs/${proofId}`), { status }),
  createWithdrawalRequest: async (request: WithdrawalRequest) => set(ref(rtdb, `withdrawals/${request.id}`), request),
  listenToWithdrawals: (callback: (reqs: WithdrawalRequest[]) => void) => onValue(ref(rtdb, 'withdrawals'), s => callback(s.exists() ? Object.values(s.val()) as WithdrawalRequest[] : [])),
  updateWithdrawalStatus: async (requestId: string, status: 'approved' | 'rejected') => update(ref(rtdb, `withdrawals/${requestId}`), { status }),
  sendNotification: async (uid: string, notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotifRef = push(ref(rtdb, `notifications/${uid}`));
    return set(newNotifRef, { ...notification, id: newNotifRef.key, timestamp: Date.now(), read: false });
  },
  listenToNotifications: (uid: string, callback: (notifs: AppNotification[]) => void) => onValue(ref(rtdb, `notifications/${uid}`), s => callback(s.exists() ? Object.values(s.val()) as AppNotification[] : [])),
  markNotificationRead: async (uid: string, notifId: string) => update(ref(rtdb, `notifications/${uid}/${notifId}`), { read: true }),
  postAnnouncement: async (announcement: Omit<Announcement, 'id' | 'timestamp'>) => {
    const newAnnRef = push(ref(rtdb, 'announcements'));
    return set(newAnnRef, { ...announcement, id: newAnnRef.key, timestamp: Date.now() });
  },
  listenToAnnouncements: (callback: (anns: Announcement[]) => void) => onValue(ref(rtdb, 'announcements'), s => callback(s.exists() ? Object.values(s.val()) as Announcement[] : [])),
  sendMessage: async (targetUid: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessageRef = push(ref(rtdb, `chats/${targetUid}`));
    return set(newMessageRef, { ...message, id: newMessageRef.key, timestamp: Date.now() });
  },
  listenToChat: (uid: string, callback: (msgs: ChatMessage[]) => void) => onValue(ref(rtdb, `chats/${uid}`), s => callback(s.exists() ? Object.values(s.val()) as ChatMessage[] : [])),
  listenToActiveChats: (callback: (uids: string[]) => void) => onValue(ref(rtdb, 'chats'), s => callback(s.exists() ? Object.keys(s.val()) : []))
};

export const initApp = () => {
  console.log("EarnSure Secure Core v2.6.0 Initialized.");
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
};
