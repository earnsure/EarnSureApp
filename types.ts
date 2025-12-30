
export enum TransactionType {
  EARN = 'earn',
  DEDUCT = 'deduct',
  WITHDRAW = 'withdraw'
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  wallet_coins: number;
  referral_code: string;
  referred_by?: string;
  joined_date: number;
  device_id: string;
  is_admin?: boolean;
  is_banned?: boolean;
  last_checkin?: number;
  checkin_streak?: number;
  mining_start_time?: number | null;
  is_mining?: boolean;
  last_scratch_date?: string;
  scratch_count?: number;
}

export interface Transaction {
  id: string;
  uid: string;
  amount: number;
  type: TransactionType;
  method: string;
  timestamp: number;
  description: string;
}

export interface WithdrawalRequest {
  id: string;
  uid: string;
  amount: number;
  coins: number;
  method: 'UPI' | 'Wallet' | 'GiftCard';
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface Task {
  id: string;
  title: string;
  reward: number;
  description: string;
  url?: string;
  require_proof: boolean;
  is_active: boolean;
}

export interface TaskProof {
  id: string;
  uid: string;
  task_id: string;
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isAdmin: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'alert' | 'info';
  timestamp: number;
  read: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  timestamp: number;
}
