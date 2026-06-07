export interface MiningTeamMember {
  id: string;
  name: string;
  role: 'Inviter' | 'Invitee' | 'Security'; // Security refers to security circle
  isActive: boolean;
  avatarColor: string;
  miningContribution: number; // in POKI/hr
  isSecurityCircle: boolean;
  lastPingTime?: number; // timestamp of last ping
}

export interface WalletState {
  publicKey: string;
  privateKeyPhrase: string; // 24 words
  isCreated: boolean;
  isUnlocked: boolean;
  unverifiedBalance: number; // Balance from referrals
  transferableBalance: number; // Balance from own mining
  migratedBalance: number; // Balance in the blockchain ledger
}

export interface Transaction {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  fee: number;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'success' | 'failed';
  type?: 'mining' | 'game_fee' | 'game_win' | 'conversion' | 'withdrawal';
  description?: string;
  metadata?: any;
}

export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  transactionCount: number;
  sizeKb: number;
  validator: string;
  transactions: Transaction[];
}

export interface KYCDetails {
  fullName: string;
  country: string;
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentNumber: string;
  selfieDataUrl?: string;
  submitted: boolean;
  status: 'none' | 'verifying' | 'step_face_mesh' | 'step_liveness' | 'approved' | 'rejected';
}

export interface MiningSession {
  isActive: boolean;
  startTime: number; // timestamp
  elapsedTimeMs: number; // accumulated time
  lastUpdatedTime: number; // timestamp of last balance update
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}
