import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Users, 
  Key, 
  ShieldCheck, 
  Database, 
  BookOpen, 
  Sparkles, 
  Gamepad2,
  Trash2,
  LogOut,
  Sliders,
  Menu,
  ShieldAlert,
  Mail,
  User,
  Info,
  Layers,
  Settings,
  X,
  Check,
  Gift,
  UserPlus
} from 'lucide-react';

import { MiningTeamMember, WalletState, Transaction, Block, KYCDetails } from './types';
import MiningHub from './components/MiningHub';
import WalletHub from './components/WalletHub';
import KycPortal from './components/KycPortal';
import NetworkExplorer from './components/NetworkExplorer';
import WhitepaperQuiz from './components/WhitepaperQuiz';
import GamePortal from './components/GamePortal';
import OnboardingAuth from './components/OnboardingAuth';
import logoUrl from './assets/images/pokicoin_premium_logo_v3_1779866751607.png';

import { auth, rtdb } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, update } from 'firebase/database';

// Default initial network contacts
const DEFAULT_MEMBERS: MiningTeamMember[] = [
  { id: 'member_alice', name: 'Alice Chen', role: 'Invitee', isActive: true, avatarColor: 'bg-emerald-500 text-emerald-100', miningContribution: 0.005, isSecurityCircle: false },
  { id: 'member_bob', name: 'Bob Sterling', role: 'Invitee', isActive: true, avatarColor: 'bg-indigo-500 text-indigo-100', miningContribution: 0.005, isSecurityCircle: false },
  { id: 'member_charlie', name: 'Charlie Vance', role: 'Invitee', isActive: false, avatarColor: 'bg-[#f59e0b] text-[#78350f]', miningContribution: 0.005, isSecurityCircle: false },
  { id: 'member_dave', name: 'Dave Miller', role: 'Security', isActive: true, avatarColor: 'bg-amber-500 text-amber-955', miningContribution: 0.004, isSecurityCircle: true },
  { id: 'member_eva', name: 'Eva Kovic', role: 'Security', isActive: true, avatarColor: 'bg-yellow-500 text-[#78350f]', miningContribution: 0.004, isSecurityCircle: true }
];

// Helper to generate a mock block hash
const generateBlockHash = (height: number) => {
  return '000000000000' + Math.floor(Math.random() * 1000000000).toString(16).padStart(16, '0') + 'fbef' + height;
};

// Initial block tree starting state
const DEFAULT_BLOCKS: Block[] = [
  {
    number: 489311,
    hash: generateBlockHash(489311),
    parentHash: generateBlockHash(489310),
    timestamp: Date.now() - 15000,
    transactionCount: 2,
    sizeKb: 1.45,
    validator: 'Validator Singapore',
    transactions: [
      { id: 'tx01', sender: 'G324FA238FASDZPOKI', recipient: 'G821BAS8F12SAZPOKI', amount: 15.2, fee: 0.0001, timestamp: Date.now() - 18000, blockNumber: 489311, status: 'success' },
      { id: 'tx02', sender: 'G292S8D22S1XPOKI', recipient: 'G481BA28F10XPOKI', amount: 5.0, fee: 0.0001, timestamp: Date.now() - 16000, blockNumber: 489311, status: 'success' }
    ]
  },
  {
    number: 489310,
    hash: generateBlockHash(489310),
    parentHash: generateBlockHash(489309),
    timestamp: Date.now() - 35000,
    transactionCount: 1,
    sizeKb: 0.85,
    validator: 'Validator Tokyo',
    transactions: [
      { id: 'tx03', sender: 'G292S8D22S1XPOKI', recipient: 'G224FA238FASDZPOKI', amount: 121.4, fee: 0.0001, timestamp: Date.now() - 37000, blockNumber: 489310, status: 'success' }
    ]
  }
];

export default function App() {
  // Redesigned exactly 5 tabs state routing: 'mining' | 'games' | 'earning' | 'wallet' | 'more'
  const [activeTab, setActiveTab] = useState<'mining' | 'games' | 'earning' | 'wallet' | 'more'>('mining');

  // Subpage states inside the Tab 5 MORE view
  const [moreSubView, setMoreSubView] = useState<'none' | 'ledger' | 'specs' | 'terms' | 'contact' | 'about' | 'monetization'>('none');

  // --- STATE DECLARATIONS ---
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('vmc_mining_balance');
    return saved ? parseFloat(saved) : 10.0;
  });

  const [isMining, setIsMining] = useState<boolean>(() => {
    return localStorage.getItem('vmc_is_mining') === 'true';
  });

  const [sessionStartTime, setSessionStartTime] = useState<number>(() => {
    const saved = localStorage.getItem('vmc_session_startTime');
    return saved ? parseInt(saved) : 0;
  });

  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  const [teamMembers, setTeamMembers] = useState<MiningTeamMember[]>(() => {
    const saved = localStorage.getItem('vmc_team_members');
    return saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
  });

  const [walletState, setWalletState] = useState<WalletState>(() => {
    const saved = localStorage.getItem('vmc_wallet_state');
    return saved ? JSON.parse(saved) : {
      publicKey: 'G_POKI_MAINNET_NODE_772A',
      privateKeyPhrase: 'poki koin smart algorithm consensus secure phone validator decentral mainnet trust peer',
      isCreated: true,
      isUnlocked: true,
      unverifiedBalance: 2.24,
      transferableBalance: 7.76,
      migratedBalance: 0.5
    };
  });

  const [kycDetails, setKycDetails] = useState<KYCDetails>(() => {
    const saved = localStorage.getItem('vmc_kyc_details');
    return saved ? JSON.parse(saved) : {
      fullName: '',
      country: '',
      documentType: 'passport',
      documentNumber: '',
      submitted: false,
      status: 'none'
    };
  });

  const [quizPremiumBooster, setQuizPremiumBooster] = useState<boolean>(() => {
    return localStorage.getItem('vmc_quiz_booster') === 'true';
  });

  const [isMissionClaimed, setIsMissionClaimed] = useState<boolean>(() => {
    const claimedDate = localStorage.getItem('poki_daily_mission_claimed_date');
    return claimedDate === new Date().toDateString();
  });

  useEffect(() => {
    const syncMissionState = () => {
      const claimedDate = localStorage.getItem('poki_daily_mission_claimed_date');
      setIsMissionClaimed(claimedDate === new Date().toDateString());
    };
    window.addEventListener('storage', syncMissionState);
    const interval = setInterval(syncMissionState, 1500);
    return () => {
      window.removeEventListener('storage', syncMissionState);
      clearInterval(interval);
    };
  }, []);

  const referralCount = useMemo(() => {
    const totalInvitees = teamMembers.filter(m => !m.isSecurityCircle).length;
    // We start with 3 default invitees. Newly added invitees count toward the 5 invitations target.
    return Math.min(5, Math.max(0, totalInvitees - 3));
  }, [teamMembers]);

  const [blocks, setBlocks] = useState<Block[]>(() => {
    const saved = localStorage.getItem('vmc_ledger_blocks');
    return saved ? JSON.parse(saved) : DEFAULT_BLOCKS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('vmc_address_txs');
    return saved ? JSON.parse(saved) : [];
  });

  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  // Refs for micro-ticker loop
  const lastTickTimeRef = useRef<number>(Date.now());
  const balanceRef = useRef<number>(balance);

  // Sync refs to avoid dependency re-triggers
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  // --- FIREBASE AND AUTH CONNECTIONS ---
  const [firebaseUser, setFirebaseUser] = useState<{ name: string; email: string; phone?: string; uid?: string } | null>(() => {
    const savedName = localStorage.getItem('poki_user_name');
    const savedEmail = localStorage.getItem('poki_user_email');
    const savedUid = localStorage.getItem('poki_user_uid');
    if (savedEmail && savedName) {
      return { name: savedName, email: savedEmail, uid: savedUid || 'guest_user' };
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // --- USER PROFILE AND LOCAL CARD DATA ---
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    country: ''
  });

  // Load / initialize Profile Information from Local or Firebase
  useEffect(() => {
    if (firebaseUser) {
      const savedCard = localStorage.getItem('poki_profile_card_details');
      if (savedCard) {
        setProfileForm(JSON.parse(savedCard));
      } else {
        const spaceIdx = firebaseUser.name.indexOf(' ');
        const derivedFirst = spaceIdx > 0 ? firebaseUser.name.substring(0, spaceIdx) : firebaseUser.name;
        const derivedLast = spaceIdx > 0 ? firebaseUser.name.substring(spaceIdx + 1) : '';
        setProfileForm({
          firstName: derivedFirst,
          lastName: derivedLast,
          email: firebaseUser.email,
          phone: firebaseUser.phone || '9198765432',
          age: '24',
          country: 'India'
        });
      }
    }
  }, [firebaseUser]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('poki_profile_card_details', JSON.stringify(profileForm));
    
    // Update active memory session name as well
    const updatedName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    if (firebaseUser) {
      const nextUser = { ...firebaseUser, name: updatedName, email: profileForm.email, phone: profileForm.phone };
      setFirebaseUser(nextUser);
      localStorage.setItem('poki_user_name', updatedName);
      localStorage.setItem('poki_user_email', profileForm.email);
    }
    alert("📝 Personal validator parameters verified and safely locked into the device environment!");
  };

  // --- 2X SPEED BOOST STATE ENGINE ---
  const [isSpeedBoostActive, setIsSpeedBoostActive] = useState<boolean>(() => {
    const expiry = localStorage.getItem('poki_speed_boost_expiry');
    if (!expiry) return false;
    return Date.now() < parseInt(expiry);
  });
  const [speedBoostExpiresAt, setSpeedBoostExpiresAt] = useState<number>(() => {
    const expiry = localStorage.getItem('poki_speed_boost_expiry');
    return expiry ? parseInt(expiry) : 0;
  });
  const [speedBoostCountdown, setSpeedBoostCountdown] = useState<string>('00:00:00');

  useEffect(() => {
    if (!isSpeedBoostActive || speedBoostExpiresAt === 0) {
      setSpeedBoostCountdown('00:00:00');
      return;
    }

    const updateCountdown = () => {
      const remainingMs = speedBoostExpiresAt - Date.now();
      if (remainingMs <= 0) {
        setIsSpeedBoostActive(false);
        setSpeedBoostExpiresAt(0);
        localStorage.removeItem('poki_speed_boost_expiry');
        setSpeedBoostCountdown('00:00:00');
      } else {
        const totalSecs = Math.floor(remainingMs / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        setSpeedBoostCountdown(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isSpeedBoostActive, speedBoostExpiresAt]);

  const handleStartSpeedBoost = () => {
    const duration = 6 * 60 * 60 * 1000; // 6 hours
    const expiry = Date.now() + duration;
    setSpeedBoostExpiresAt(expiry);
    setIsSpeedBoostActive(true);
    localStorage.setItem('poki_speed_boost_expiry', expiry.toString());
    alert("⚡ Consensus boost aligned successfully! Your speed is doubled to +0.0760 POKI/hr for 6 Hours code!");
  };

  // Firebase auth connection monitoring
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let name = user.displayName || user.email?.split('@')[0] || 'Poki Miner';
        let email = user.email || `${user.phoneNumber || user.uid}@poki.in`;
        let phone = user.phoneNumber || '';
        
        try {
          const userRef = ref(rtdb, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.fullName) name = data.fullName;
            if (data.email) email = data.email;
            if (data.phone) phone = data.phone;
            if (data.balance !== undefined && data.balance > balanceRef.current) {
              setBalance(data.balance);
            }
          }
        } catch (e) {
          console.warn("RTDB Profile fetching error:", e);
        }

        setFirebaseUser({ name, email, phone, uid: user.uid });
        localStorage.setItem('poki_user_logged', 'true');
        localStorage.setItem('poki_user_name', name);
        localStorage.setItem('poki_user_email', email);
        localStorage.setItem('poki_user_uid', user.uid);
      } else {
        setFirebaseUser(null);
        localStorage.removeItem('poki_user_logged');
        localStorage.removeItem('poki_user_name');
        localStorage.removeItem('poki_user_email');
        localStorage.removeItem('poki_user_uid');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync state values back to Firebase Realtime DB
  useEffect(() => {
    if (firebaseUser?.uid && rtdb) {
      const userRef = ref(rtdb, `users/${firebaseUser.uid}`);
      const timer = setTimeout(() => {
        update(userRef, {
          balance: balance,
          transferableBalance: walletState.transferableBalance,
          updatedAt: new Date().toISOString()
        }).catch(err => console.debug("Syncing balance in background failed:", err));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [balance, firebaseUser, walletState.transferableBalance]);

  // Save states back to standard local states
  useEffect(() => {
    localStorage.setItem('vmc_mining_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('vmc_is_mining', isMining.toString());
    localStorage.setItem('vmc_session_startTime', sessionStartTime.toString());
  }, [isMining, sessionStartTime]);

  useEffect(() => {
    localStorage.setItem('vmc_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('vmc_wallet_state', JSON.stringify(walletState));
  }, [walletState]);

  useEffect(() => {
    localStorage.setItem('vmc_kyc_details', JSON.stringify(kycDetails));
  }, [kycDetails]);

  useEffect(() => {
    localStorage.setItem('vmc_quiz_booster', quizPremiumBooster.toString());
  }, [quizPremiumBooster]);

  useEffect(() => {
    localStorage.setItem('vmc_ledger_blocks', JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    localStorage.setItem('vmc_address_txs', JSON.stringify(transactions));
  }, [transactions]);

  // --- MINING HOURLY METRICS & MODIFIERS ---
  const BASE_RATE = 0.02;
  
  const SECURITY_CIRCLE_RATE = useMemo(() => {
    const securityCount = teamMembers.filter(m => m.isSecurityCircle).length;
    return Math.min(5, securityCount) * 0.004;
  }, [teamMembers]);

  const REFERRAL_RATE = useMemo(() => {
    const activeRef = teamMembers.filter(m => !m.isSecurityCircle && m.isActive).length;
    return activeRef * 0.005;
  }, [teamMembers]);

  const QUIZ_RATE = useMemo(() => {
    return quizPremiumBooster ? 0.01 : 0.0;
  }, [quizPremiumBooster]);

  // Calculate real structural rate, double if active SPEED BOOST is engaged!
  const TOTAL_MINING_RATE = useMemo(() => {
    const baseSum = BASE_RATE + SECURITY_CIRCLE_RATE + REFERRAL_RATE + QUIZ_RATE;
    return isSpeedBoostActive ? baseSum * 2 : baseSum;
  }, [BASE_RATE, SECURITY_CIRCLE_RATE, REFERRAL_RATE, QUIZ_RATE, isSpeedBoostActive]);

  // 24H cycles timer countdown
  useEffect(() => {
    if (!isMining || sessionStartTime === 0) {
      setTimeLeftMs(0);
      return;
    }

    const sessionDuration = 24 * 60 * 60 * 1000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStartTime;
      const remaining = Math.max(0, sessionDuration - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        setIsMining(false);
        setSessionStartTime(0);
        setTimeLeftMs(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining, sessionStartTime]);

  // Real-time precise idle mining state counter tick
  useEffect(() => {
    if (!isMining || TOTAL_MINING_RATE <= 0) return;

    lastTickTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;

      if (elapsed > 0) {
        const ratePerMs = TOTAL_MINING_RATE / (3600 * 1000);
        const earned = ratePerMs * elapsed;
        
        const nextBal = balanceRef.current + earned;
        setBalance(nextBal);

        const selfRatio = (BASE_RATE + QUIZ_RATE) / (isSpeedBoostActive ? (TOTAL_MINING_RATE / 2) : TOTAL_MINING_RATE);
        const refereeRatio = 1 - selfRatio;

        setWalletState(prev => {
          const addTransferable = earned * selfRatio;
          const addUnverified = earned * refereeRatio;
          return {
            ...prev,
            transferableBalance: prev.transferableBalance + addTransferable,
            unverifiedBalance: prev.unverifiedBalance + addUnverified
          };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining, TOTAL_MINING_RATE, isSpeedBoostActive]);

  // Blockchain block compiler (for ledger simulation)
  useEffect(() => {
    const blockInterval = setInterval(() => {
      const txs = [...pendingTransactions];
      if (txs.length > 0) {
        setPendingTransactions([]);
      }

      const nextHeight = blocks[0] ? blocks[0].number + 1 : 489312;
      const nextParentHash = blocks[0] ? blocks[0].hash : generateBlockHash(nextHeight - 1);

      const nextBlock: Block = {
        number: nextHeight,
        hash: generateBlockHash(nextHeight),
        parentHash: nextParentHash,
        timestamp: Date.now(),
        transactionCount: txs.length + (Math.random() > 0.5 ? 1 : 0),
        sizeKb: parseFloat((0.45 + Math.random() * 1.6).toFixed(2)),
        validator: 'Singapore Validator Node #' + Math.floor(Math.random() * 100),
        transactions: txs.map(t => ({ ...t, blockNumber: nextHeight, status: 'success' }))
      };

      setBlocks(prev => [nextBlock, ...prev.slice(0, 8)]);

      if (txs.length > 0) {
        setTransactions(prevTxs => {
          return prevTxs.map(t => {
            const matches = txs.find(pending => pending.id === t.id);
            if (matches) {
              return { ...t, status: 'success', blockNumber: nextHeight };
            }
            return t;
          });
        });
      }
    }, 5500);

    return () => clearInterval(blockInterval);
  }, [pendingTransactions, blocks]);

  // Event managers
  const handleStartMining = () => {
    if (isMining) return;
    setIsMining(true);
    setSessionStartTime(Date.now());
    setTimeLeftMs(2 * 60 * 60 * 1000); // 24 hours
  };

  const handleAddMember = (name: string, isSecurity: boolean) => {
    const nextId = 'member_' + Math.random().toString(36).substring(2, 9);
    const colors = ['bg-emerald-500 text-emerald-100', 'bg-indigo-500 text-indigo-100', 'bg-pink-500 text-pink-100', 'bg-amber-500 text-amber-955'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newMember: MiningTeamMember = {
      id: nextId,
      name,
      role: isSecurity ? 'Security' : 'Invitee',
      isActive: true,
      avatarColor: color,
      miningContribution: isSecurity ? 0.004 : 0.005,
      isSecurityCircle: isSecurity
    };

    setTeamMembers(prev => [...prev, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const handlePingMember = (id: string) => {
    setTeamMembers(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, isActive: true, lastPingTime: Date.now() };
      }
      return m;
    }));
  };

  const handleWalletCreate = (publicKey: string, passphrase: string) => {
    setWalletState(prev => ({
      ...prev,
      publicKey,
      privateKeyPhrase: passphrase,
      isCreated: true,
      isUnlocked: true
    }));
  };

  const handleWalletUnlock = (passphrase: string) => {
    if (walletState.isCreated && passphrase.trim() === walletState.privateKeyPhrase.trim()) {
      setWalletState(prev => ({ ...prev, isUnlocked: true }));
    }
  };

  const handleWalletLock = () => {
    setWalletState(prev => ({ ...prev, isUnlocked: false }));
  };

  const handleSendTransaction = (recipient: string, amount: number) => {
    if (amount > walletState.migratedBalance) {
      return { success: false, error: 'Insufficient balance' };
    }

    const txId = 'tx_' + Math.random().toString(36).substring(2, 10);
    const newTx: Transaction = {
      id: txId,
      sender: walletState.publicKey,
      recipient,
      amount,
      fee: 0.0001,
      timestamp: Date.now(),
      blockNumber: 0,
      status: 'pending'
    };

    setWalletState(prev => ({
      ...prev,
      migratedBalance: prev.migratedBalance - (amount + 0.0001)
    }));

    setTransactions(prev => [newTx, ...prev]);
    setPendingTransactions(prev => [...prev, newTx]);

    return { success: true, tx: newTx };
  };

  const handleKycSubmit = (fullName: string, country: string, docType: KYCDetails['documentType'], docNum: string, selfieUrl?: string) => {
    setKycDetails({
      fullName,
      country,
      documentType: docType,
      documentNumber: docNum,
      selfieDataUrl: selfieUrl,
      submitted: true,
      status: 'verifying'
    });
  };

  const handleKycApprove = () => {
    setKycDetails(prev => ({ ...prev, status: 'approved' }));
  };

  const handleUnlockQuizBooster = () => {
    setQuizPremiumBooster(true);
    alert("📝 Consensus Specs verified! +0.0100 POKI/h boost is active.");
  };

  const handleMigrateBalance = () => {
    if (kycDetails.status !== 'approved' || walletState.transferableBalance <= 0) return;

    const transferableToMigrate = walletState.transferableBalance;
    const migrationTxId = 'mig_' + Math.random().toString(36).substring(2, 10);
    const migrationTx: Transaction = {
      id: migrationTxId,
      sender: 'COINBASE_MIGRATION_ANCHOR_NODE',
      recipient: walletState.publicKey,
      amount: transferableToMigrate,
      fee: 0.0,
      timestamp: Date.now(),
      blockNumber: 0,
      status: 'pending'
    };

    setTransactions(prev => [migrationTx, ...prev]);
    setPendingTransactions(prev => [...prev, migrationTx]);

    setWalletState(prev => ({
      ...prev,
      transferableBalance: 0,
      migratedBalance: prev.migratedBalance + transferableToMigrate
    }));
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn("Authentication signout bypassed structurally: ", e);
    }
    localStorage.removeItem('poki_user_logged');
    localStorage.removeItem('poki_user_name');
    localStorage.removeItem('poki_user_email');
    localStorage.removeItem('poki_user_uid');
    localStorage.removeItem('poki_profile_card_details');
    localStorage.removeItem('poki_is_admin');
    window.location.reload();
  };

  const handleGameRewardAwarded = (amount: number) => {
    setBalance(prev => prev + amount);
    setWalletState(prev => ({
      ...prev,
      transferableBalance: prev.transferableBalance + amount
    }));
  };

  const handleClearPersistence = () => {
    if (confirm('Verify: Reset entire device blockchain credentials?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080602] flex items-center justify-center text-white p-6 font-mono relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-amber-950/15 rounded-full blur-[140px]"></div>
        </div>
        <div className="flex flex-col items-center gap-4 text-center z-10">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-amber-500/80 font-bold animate-pulse">Connecting Decentracode Ledger Gateway...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <OnboardingAuth 
        onLoginSuccess={(userInfo) => {
          setFirebaseUser(userInfo);
          localStorage.setItem('poki_user_logged', 'true');
          localStorage.setItem('poki_user_name', userInfo.name);
          localStorage.setItem('poki_user_email', userInfo.email);
          if (userInfo.uid) localStorage.setItem('poki_user_uid', userInfo.uid);
        }} 
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#080602] text-white flex flex-col relative select-none antialiased">
      
      {/* Background ambient radial blur lights matching Immersive UI Design - Warm Gold Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#b45309]/5 rounded-full blur-[130px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#d97706]/7 rounded-full blur-[150px]"></div>
      </div>

      {/* Center web-container with responsive balance - on mobile 100%, on desktop centered nicely */}
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-grow relative z-10 bg-[#0c0a06]/35 min-h-screen border-x border-white/5 shadow-2xl pb-24">
        
        {/* APP HEADER */}
        <header className="w-full bg-[#0c0a06]/90 border-b border-white/5 py-4 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl relative shadow-md shadow-amber-500/10 flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src={logoUrl} 
                alt="Pokicoin Golden Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 border border-white/10 rounded-xl"></div>
            </div>
            <div>
              <h1 className="text-sm font-[900] tracking-wider uppercase text-white leading-none">
                POKI<span className="text-amber-500">COIN</span>
              </h1>
              <span className="text-[7.5px] font-mono tracking-widest text-white/40 uppercase leading-none block mt-1">Concentric Quorum</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Global Signout header trigger */}
            <button
              onClick={handleLogout}
              className="text-[8px] font-bold tracking-widest font-mono text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/25 bg-red-500/5 px-2 py-1 rounded bg-opacity-40 cursor-pointer transition-colors uppercase"
            >
              Log out
            </button>

            {/* Profile Avatar Trigger Button */}
            <button
              onClick={() => setProfileModalOpen(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-extrabold text-xs cursor-pointer shadow active:scale-95 transition-all outline-none"
            >
              {profileForm.firstName ? profileForm.firstName.substring(0, 1).toUpperCase() : 'U'}
            </button>
          </div>
        </header>

        {/* VIEWPORT CONTROLLER */}
        <div className="flex-grow w-full flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: MINING HUB */}
            {activeTab === 'mining' && (
              <motion.div
                key="tab-mining"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1"
              >
                <MiningHub
                  balance={balance}
                  miningRate={TOTAL_MINING_RATE}
                  isMining={isMining}
                  onStartMining={handleStartMining}
                  timeLeftMs={timeLeftMs}
                  teamMembers={teamMembers}
                  quizPremiumBooster={quizPremiumBooster}
                  baseRate={BASE_RATE}
                  securityCircleRate={SECURITY_CIRCLE_RATE}
                  referralRate={REFERRAL_RATE}
                  quizRate={QUIZ_RATE}
                  onRewardAwarded={handleGameRewardAwarded}
                  // Boost additions
                  isSpeedBoostActive={isSpeedBoostActive}
                  speedBoostCountdown={speedBoostCountdown}
                  onStartSpeedBoost={handleStartSpeedBoost}
                  onAddMember={handleAddMember}
                  onRemoveMember={handleRemoveMember}
                  onPingMember={handlePingMember}
                />
              </motion.div>
            )}

            {/* TAB 2: GAMES / ARCADE PORTAL */}
            {activeTab === 'games' && (
              <motion.div
                key="tab-games"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1"
              >
                <GamePortal
                  balance={balance}
                  walletState={walletState}
                  onRewardAwarded={handleGameRewardAwarded}
                />
              </motion.div>
            )}

            {/* TAB 3: MORE EARNING (SURVEYS & TASKS MODULE) */}
            {activeTab === 'earning' && (
              <motion.div
                key="tab-earning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 p-5 md:p-6"
              >
                <div className="flex flex-col gap-5">
                  {/* Beautiful Title Segment */}
                  <div className="border-b border-white/10 pb-3">
                    <h3 className="text-base font-bold uppercase tracking-widest text-[#facc15]">More Earning Portal</h3>
                    <p className="text-[9.5px] uppercase tracking-wider text-white/40 mt-1">Boost Miner Hashpower by Completing sponsored Tasks & Surveys</p>
                  </div>

                  {/* Daily Mission - Recruit 5 New Nodes */}
                  <div className="bg-[#100d07] border border-amber-500/20 rounded-3xl p-5 relative overflow-hidden shadow-[0_4px_30px_rgba(245,158,11,0.03)]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
                    
                    <div className="flex items-center justify-between mb-4.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                          <Gift className="w-4 h-4 animate-bounce" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full">ACTIVE DAILY MISSION</span>
                          </div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-0.5">Dual-Consensus Recruiter</h4>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[9.5px] font-mono font-extrabold text-[#facc15] bg-[#fac515]/10 px-2.5 py-1 rounded-lg border border-amber-500/20 shadow-inner">+25.0 POKI</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-white/60 leading-relaxed max-w-md">
                      Invite <strong className="text-white">5 new validator nodes</strong> to establish a larger peer network. Both invitees and the local operator get massive ledger allocations.
                    </p>

                    {/* Progress Segment */}
                    <div className="mt-4 bg-[#14110b]/80 border border-white/[0.03] rounded-2xl p-3.5">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                        <span className="text-white/40 uppercase font-bold text-[8.5px] tracking-wider">Recruitment Progress</span>
                        <span className="text-amber-400 font-extrabold">{referralCount} / 5 Nodes Invited</span>
                      </div>
                      
                      {/* Real Progress Bar */}
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${(referralCount / 5) * 100}%` }}
                        ></div>
                      </div>

                      {/* Micro inline action to recruit a member instantly */}
                      {referralCount < 5 && !isMissionClaimed && (
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const target = e.target as HTMLFormElement;
                            const input = target.elements.namedItem('nodeName') as HTMLInputElement;
                            const newName = input.value.trim();
                            if (newName) {
                              handleAddMember(newName, false);
                              input.value = '';
                            }
                          }}
                          className="mt-3.5 flex gap-2"
                        >
                          <input 
                            name="nodeName"
                            type="text" 
                            required
                            placeholder="Enter friend's miner alias..."
                            className="bg-black/40 border border-white/5 hover:border-white/10 focus:border-amber-500/40 text-[9.5px] text-white placeholder-white/30 px-3 py-2 rounded-xl flex-1 focus:outline-none transition-all font-sans leading-relaxed"
                          />
                          <button 
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[9px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all cursor-pointer select-none active:scale-95"
                          >
                            🚀 INVITE NODE
                          </button>
                        </form>
                      )}

                      {/* Claim reward panel */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.04] pt-3.5">
                        <div className="text-[9px] text-white/40">
                          {isMissionClaimed 
                            ? "✓ Reward of 25.0 POKI successfully claimed today."
                            : referralCount >= 5 
                            ? "🎉 Mission completed! Core networks synchronized." 
                            : "Add more validator peers to verify consensus."}
                        </div>
                        
                        {isMissionClaimed ? (
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tracking-wider text-[8.5px] font-mono font-bold px-3.5 py-1.5 rounded-xl uppercase">
                            <Check className="w-3 h-3 shrink-0" />
                            Claimed
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={referralCount < 5}
                            onClick={() => {
                              // Claim reward!
                              const bonusReward = 25.0;
                              const updatedBal = balance + bonusReward;
                              setBalance(updatedBal);
                              localStorage.setItem('vmc_mining_balance', updatedBal.toString());
                              
                              if (firebaseUser?.uid && rtdb) {
                                try {
                                  const userRef = ref(rtdb, `users/${firebaseUser.uid}`);
                                  update(userRef, { balance: updatedBal });
                                } catch (e) {
                                  console.warn("RTDB balance sync during claim error:", e);
                                }
                              }
                              
                              localStorage.setItem('poki_daily_mission_claimed_date', new Date().toDateString());
                              setIsMissionClaimed(true);
                              alert("🎉 Daily Recruiter Mission Claimed! +25.0 POKI added directly to your mining pool.");
                            }}
                            className={`px-4 py-1.5 rounded-xl text-[9px] uppercase tracking-widest font-mono font-extrabold transition-all outline-none ${
                              referralCount >= 5 
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer active:scale-95' 
                                : 'bg-white/5 border border-white/5 text-white/30 cursor-not-allowed'
                            }`}
                          >
                            🎁 Claim 25 POKI
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Aesthetic Layout for Future Survey & Task Integrations */}
                  <div className="bg-[#120f09]/40 border border-amber-500/10 rounded-3xl p-5 text-center flex flex-col items-center gap-3 py-8">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-1">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Survey & Task Engine Integration</h4>
                    <p className="text-[10px] text-white/50 max-w-sm leading-relaxed">
                      This earning module is specifically reserved for surveys, custom offerwalls, and monetization. Perfect for integrating external SDKs like Pollfish, Tapjoy, or custom Google Ad Exchange rewards.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono uppercase tracking-widest px-3.5 py-1.5 rounded-full mt-2">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
                      Sandbox Ready: Dynamic SDK Hook Pending
                    </div>
                  </div>

                  {/* Illustrative Tasks Widgets matching Pokicoin theme */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[8px] font-mono tracking-widest text-amber-400 uppercase bg-amber-400/10 px-2 py-0.5 rounded">High Payout</span>
                          <span className="text-[9.5px] text-amber-400 font-extrabold font-mono">+10.0 POKI</span>
                        </div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wide">Sponsored Polls & Surveys</h5>
                        <p className="text-[9.5px] text-white/40 mt-1 leading-normal">
                          Give critical feedback on next-gen tech. Your survey responses direct funding directly to consensus pools.
                        </p>
                      </div>
                      <button disabled className="mt-4 w-full bg-white/5 border border-white/10 text-white/40 text-[9px] uppercase tracking-wider font-mono py-2 rounded-xl cursor-not-allowed">
                        Integrate Poll/Survey SDK Here
                      </button>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[8px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded">Direct Task</span>
                          <span className="text-[9.5px] text-emerald-400 font-extrabold font-mono">+5.50 POKI</span>
                        </div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wide">Dynamic Social Retweets</h5>
                        <p className="text-[9.5px] text-white/40 mt-1 leading-normal">
                          Complete immediate Twitter/Telegram subscription verifications to instantly multiply daily mining gains.
                        </p>
                      </div>
                      <button disabled className="mt-4 w-full bg-white/5 border border-white/10 text-white/40 text-[9px] uppercase tracking-wider font-mono py-2 rounded-xl cursor-not-allowed">
                        Integrate Task Auth Check
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 4: WALLET & INR MATRIX */}
            {activeTab === 'wallet' && (
              <motion.div
                key="tab-wallet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1"
              >
                <WalletHub
                  walletState={walletState}
                  onWalletCreate={handleWalletCreate}
                  onWalletUnlock={handleWalletUnlock}
                  onWalletLock={handleWalletLock}
                  onSendTransaction={handleSendTransaction}
                  onMigrateBalance={handleMigrateBalance}
                  kycApproved={kycDetails.status === 'approved'}
                  transactions={transactions}
                  teamMembers={teamMembers}
                  balance={balance}
                />

                {/* Integration of KYC submission portal right beside wallet for core balance migration */}
                <div className="px-6 pb-6 mt-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-500">KYC Validation Engine</div>
                      <span className="text-[8px] font-mono bg-white/5 px-2 py-0.5 rounded text-white/45 uppercase">Identity lock</span>
                    </div>
                    
                    <KycPortal
                      kycDetails={kycDetails}
                      onKycSubmit={handleKycSubmit}
                      onKycApprove={handleKycApprove}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: MORE SUBMENU ROOT */}
            {activeTab === 'more' && (
              <motion.div
                key="tab-more"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 p-4 md:p-6"
              >
                {moreSubView === 'none' ? (
                  <div className="flex flex-col gap-5">
                    {/* Sticky section sub-title */}
                    <div className="border-b border-white/10 pb-3">
                      <h3 className="text-base font-bold uppercase tracking-widest text-[#f5fbfd]">Concentric Sub-Pages Menu</h3>
                      <p className="text-[9.5px] uppercase tracking-wider text-white/40 mt-1">Explore verifiable ledgers and developer contacts</p>
                    </div>

                    {/* Subpage dynamic list */}
                    <div className="flex flex-col gap-3">
                      
                      {/* item 1: Ledger Network Explorer */}
                      <button
                        onClick={() => setMoreSubView('ledger')}
                        className="w-full bg-[#0c0a06] hover:bg-[#120f09] border border-white/5 rounded-2xl p-4.5 text-left flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase group-hover:text-amber-400 transition-colors">Verifiable Blockchain Ledger</h4>
                          <p className="text-[9.5px] text-white/40 mt-1 uppercase font-mono tracking-wider">Sync Height #{blocks[0].number}</p>
                        </div>
                        <Database className="w-4.5 h-4.5 text-white/20 group-hover:text-amber-500 group-hover:rotate-6 transition-all shrink-0" />
                      </button>

                      {/* item 2: Specs Whitepaper */}
                      <button
                        onClick={() => setMoreSubView('specs')}
                        className="w-full bg-[#0c0a06] hover:bg-[#120f09] border border-white/5 rounded-2xl p-4.5 text-left flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase group-hover:text-amber-400 transition-colors">Technical Validator Specs</h4>
                          <p className="text-[9.5px] text-white/40 mt-1 uppercase font-mono tracking-wider">Verify consensus & active quiz boosts</p>
                        </div>
                        <BookOpen className="w-4.5 h-4.5 text-white/20 group-hover:text-amber-500 group-hover:scale-105 transition-all shrink-0" />
                      </button>

                      {/* item 3: Terms & Conditions */}
                      <button
                        onClick={() => setMoreSubView('terms')}
                        className="w-full bg-[#0c0a06] hover:bg-[#120f09] border border-white/5 rounded-2xl p-4.5 text-left flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase group-hover:text-amber-400 transition-colors">Terms & General Guidelines</h4>
                          <p className="text-[9.5px] text-white/40 mt-1 uppercase font-mono tracking-wider">Legal network parameters</p>
                        </div>
                        <ShieldAlert className="w-4.5 h-4.5 text-white/20 group-hover:text-amber-500 transition-all shrink-0" />
                      </button>

                      {/* item 4: Support Contact Us */}
                      <button
                        onClick={() => setMoreSubView('contact')}
                        className="w-full bg-[#0c0a06] hover:bg-[#120f09] border border-white/5 rounded-2xl p-4.5 text-left flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase group-hover:text-amber-400 transition-colors">Support Helpline & Contacts</h4>
                          <p className="text-[9.5px] text-white/40 mt-1 uppercase font-mono tracking-wider">Connect directly to core protocol nodes</p>
                        </div>
                        <Mail className="w-4.5 h-4.5 text-white/20 group-hover:text-amber-500 transition-all shrink-0" />
                      </button>

                      {/* item 5: About Us details */}
                      <button
                        onClick={() => setMoreSubView('about')}
                        className="w-full bg-[#0c0a06] hover:bg-[#120f09] border border-white/5 rounded-2xl p-4.5 text-left flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase group-hover:text-amber-400 transition-colors">About Pokicoin Network</h4>
                          <p className="text-[9.5px] text-white/40 mt-1 uppercase font-mono tracking-wider">Halving curves & Decentralized autonomous setups</p>
                        </div>
                        <Info className="w-4.5 h-4.5 text-white/20 group-hover:text-amber-500 transition-all shrink-0" />
                      </button>

                      {/* item 6: Ad Exchange Consent & Monetization Disclosure */}
                      <button
                        onClick={() => setMoreSubView('monetization')}
                        className="w-full bg-[#0c0a06] hover:bg-[#120f09] border border-white/5 rounded-2xl p-4.5 text-left flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group shadow-md"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase group-hover:text-amber-400 transition-colors">Ad Exchange Consent & Monetization</h4>
                          <p className="text-[9.5px] text-white/40 mt-1 uppercase font-mono tracking-wider">Required disclosures for Google AdSense compliance</p>
                        </div>
                        <Sparkles className="w-4.5 h-4.5 text-white/20 group-hover:text-amber-500 transition-all shrink-0" />
                      </button>

                    </div>

                    {/* Telemetry settings reset */}
                    <div className="bg-[#120f09]/60 border border-amber-500/10 rounded-2xl p-4 flex justify-between items-center mt-6">
                      <div className="text-[9.5px] text-white/30 font-mono uppercase tracking-wider pl-1 font-semibold leading-relaxed">
                        <p className="text-amber-400/90 font-bold">Node persistence console</p>
                        <p className="mt-0.5">₹ 1 POKI = ₹0.50 INR ledger parity</p>
                      </div>
                      <button
                        onClick={handleClearPersistence}
                        className="text-[9.5px] font-bold tracking-widest font-mono bg-red-400/10 hover:bg-red-400/20 border border-red-400/25 text-red-500 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors uppercase"
                      >
                        Clear State
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Compact Back Button header */}
                    <button
                      onClick={() => setMoreSubView('none')}
                      className="self-start text-[9.5px] font-extrabold tracking-widest font-mono text-amber-500/80 hover:text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer mb-5 outline-none transition-all"
                    >
                      ← Back to Sub-Pages menu
                    </button>

                    {/* Subpage components triggers */}
                    {moreSubView === 'ledger' && (
                      <NetworkExplorer
                        blocks={blocks}
                        activeBlockHeight={blocks[0].number}
                      />
                    )}

                    {moreSubView === 'specs' && (
                      <WhitepaperQuiz
                        quizPremiumBooster={quizPremiumBooster}
                        onUnlockQuizBooster={handleUnlockQuizBooster}
                      />
                    )}

                    {moreSubView === 'terms' && (
                      <div className="bg-[#0c0a06] border border-white/5 rounded-3xl p-5 md:p-6 text-left shadow-lg">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#facc15] border-b border-white/5 pb-2.5 mb-4">Concentric Network Rules</h4>
                        
                        <div className="flex flex-col gap-4 font-sans text-xs text-white/60 leading-relaxed pl-1">
                          <p>
                            <strong>1. Single Device Consensus:</strong> Each individual smartphone is authorized to host only 1 validator node. Operating bot-farms, emulator virtual servers or multiclient cloning modules will violate consensus security signatures.
                          </p>
                          <p>
                            <strong>2. KYC Validation Compliance:</strong> Verified human consensus signatures are required to unlock, convert and migrate direct Mining transferable balances over to Spendable Wallet ledger pools. Anonymous tokens without KYC are subject to quarantine.
                          </p>
                          <p>
                            <strong>3. Halving Protocol:</strong> Dynamic rate reductions will occur automatically on specific ledger thresholds to protect network token metrics. The next regular halving will restrict consensus speed velocity by 50%.
                          </p>
                        </div>
                      </div>
                    )}

                    {moreSubView === 'contact' && (
                      <div className="bg-[#0c0a06] border border-white/5 rounded-3xl p-5 md:p-6 text-left shadow-lg flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#facc15] border-b border-white/5 pb-2.5">Global Help Circle Nodes</h4>
                        
                        <div className="flex flex-col gap-3 text-xs leading-relaxed font-sans text-white/65">
                          <p className="flex justify-between border-b border-white/[0.03] pb-2">
                            <span className="font-semibold">Sovereign Domain:</span>
                            <span className="text-amber-400 font-mono">support.minipocicoin.in</span>
                          </p>
                          <p className="flex justify-between border-b border-white/[0.03] pb-2">
                            <span className="font-semibold">Security Consensus:</span>
                            <span className="text-amber-400 font-mono">consensus@miniot.org</span>
                          </p>
                          <p className="flex justify-between pb-1">
                            <span className="font-semibold">Developer Telegram Node:</span>
                            <span className="text-amber-400 font-mono">@PokiKoinSovereignNode</span>
                          </p>
                        </div>

                        <div className="p-3 bg-white/5 rounded-2xl text-[10px] leading-relaxed text-white/45 font-sans mt-1">
                          Our security circle is monitored 24/7. Response velocity is determined by active network transaction block queues.
                        </div>
                      </div>
                    )}

                    {moreSubView === 'about' && (
                      <div className="bg-[#0c0a06] border border-white/5 rounded-3xl p-5 md:p-6 text-left shadow-lg flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#facc15] border-b border-white/5 pb-2.5">About Poki Networks</h4>
                        
                        <p className="text-xs text-white/65 leading-relaxed font-sans pl-1">
                          Pokicoin represents India's leading lightweight virtual server mining quorum, allowing normal consumer smartphones to participate safely in decentralised ledger validations without heating chips or wasting lithium batteries.
                        </p>
                        <p className="text-xs text-white/65 leading-relaxed font-sans pl-1">
                          By linking dynamic security circles and mining quorums, users confirm transaction blocks directly in background micro-threads. Under cryptographic INR parities, 1 POKI establishes a solid consensus equivalent of exactly ₹0.50 INR.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mt-2 text-center text-xs font-mono">
                          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                            <span className="text-white/35 text-[9px] block uppercase">Next Halving Pool</span>
                            <span className="text-[#facc15] font-bold block mt-1">85% Filled</span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                            <span className="text-white/35 text-[9px] block uppercase">Genesis Block Era</span>
                            <span className="text-emerald-400 font-bold block mt-1">2026 ACTIVE</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {moreSubView === 'monetization' && (
                      <div className="bg-[#0c0a06] border border-white/5 rounded-3xl p-5 md:p-6 text-left shadow-lg flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#facc15] border-b border-white/5 pb-2.5">Ad Exchange & Monetization Policies</h4>
                        
                        <div className="flex flex-col gap-4 font-sans text-xs text-white/60 leading-relaxed pl-1">
                          <p>
                            <strong>Google AdSense & Certified Ad Exchange Compliance:</strong>
                            <br />
                            This application complies with standard Google Publisher Policies to serve clean, family-safe, relevant advertisements. Third-party vendors, including Google, use device cookies to serve ads based on user interests or prior sessions on Pokicoin.
                          </p>
                          <p>
                            <strong>1. Personalised Advertising Disclosures:</strong>
                            <br />
                            Google's use of advertising cookies enables it and its partners to serve ads securely. Users can completely opt out of personalized advertising by visiting Google's Ad Settings center or by accessing <span className="text-amber-400 font-mono">www.aboutads.info</span>.
                          </p>
                          <p>
                            <strong>2. Consent & Privacy Policy Parameters:</strong>
                            <br />
                            We comply strictly with GDPR (European Union consent matrix) and CCPA (California Privacy laws). Absolutely no sensitive secure variables like private keys, seed matrix words, or submitted KYC details are shared or processed outside. Only general regional analytics is sent for high-speed ledger synchronization.
                          </p>
                        </div>

                        <div className="p-3 bg-white/5 rounded-2xl text-[10px] leading-relaxed text-white/45 font-sans mt-2">
                          Please direct formal inquiries regarding Ad Consent Frameworks to <span className="text-amber-400 font-mono">compliance@minipocicoin.in</span>. This ensures immediate review by core protocol nodes.
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* DEVELOPER/TESTER SYSTEM TELEMETRY CONTROLLER PANEL */}
        {(firebaseUser?.email?.toLowerCase() === 'uu104015@gmail.com' || localStorage.getItem('poki_is_admin') === 'true') && (
          <div className="fixed bottom-[74px] sm:bottom-[78px] left-0 right-0 z-30 w-full max-w-xl mx-auto px-4 pointer-events-none select-none">
            <div className="bg-[#0b0802]/95 border border-amber-500/40 rounded-2xl p-3 shadow-[0_0_20px_rgba(245,158,11,0.3)] font-mono pointer-events-auto flex flex-col gap-2 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-[9.5px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  ADMIN SYSTEM TELEMETRY
                </div>
                <div className="text-[7.5px] text-white/50 uppercase tracking-widest font-bold">uu104015@gmail.com (Tester Account)</div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('poki_spin_count_today', '0');
                    localStorage.setItem('poki_spin_date', new Date().toDateString());
                    window.dispatchEvent(new Event('storage'));
                    alert("🔄 Wheel spins reset! You have 3/3 daily spins available.");
                  }}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-400 text-amber-300 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer text-[8px]"
                >
                  ♻️ Wheel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('poki_scratch_count_today', '0');
                    localStorage.setItem('poki_scratch_date', new Date().toDateString());
                    window.dispatchEvent(new Event('storage'));
                    alert("🔄 Scratch cards reset! Cards are unlocked & scratchable.");
                  }}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-400 text-amber-300 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer text-[8px]"
                >
                  ♻️ Scratch
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('poki_streak_last_claim', '0');
                    localStorage.setItem('poki_streak_claimed', '0');
                    window.dispatchEvent(new Event('storage'));
                    alert("🔄 Check-in resets! Progressive validations are claimable.");
                  }}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-400 text-amber-300 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer text-[8px]"
                >
                  ♻️ Check-In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('poki_daily_mission_claimed_date');
                    setIsMissionClaimed(false);
                    window.dispatchEvent(new Event('storage'));
                    alert("🔄 Invite Mission reset! Goal is now claimable on completion.");
                  }}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-400 text-amber-300 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer text-[8px]"
                >
                  ♻️ Mission
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTeamMembers(DEFAULT_MEMBERS);
                    localStorage.setItem('vmc_team_members', JSON.stringify(DEFAULT_MEMBERS));
                    alert("👥 Network Team reset to default! Referral Progress is now 0/5.");
                  }}
                  className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-400 text-yellow-300 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer text-[8px]"
                >
                  👥 Reset Team
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const bonus = 500;
                    const newBal = balance + bonus;
                    setBalance(newBal);
                    localStorage.setItem('vmc_mining_balance', newBal.toString());
                    if (firebaseUser?.uid && rtdb) {
                      try {
                        const userRef = ref(rtdb, `users/${firebaseUser.uid}`);
                        update(userRef, { balance: newBal });
                      } catch (e) {
                        console.warn("RTDB sync error on admin inject:", e);
                      }
                    }
                    alert(`💰 Added +${bonus} POKI directly to balance ledger!`);
                  }}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-400 text-emerald-300 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer text-[8px]"
                >
                  ➕ +500 POKI
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWalletState(prev => {
                      const updated = {
                        ...prev,
                        transferableBalance: prev.transferableBalance + 1000
                      };
                      localStorage.setItem('vmc_wallet_state', JSON.stringify(updated));
                      if (firebaseUser?.uid && rtdb) {
                        try {
                          const userRef = ref(rtdb, `users/${firebaseUser.uid}`);
                          update(userRef, { transferableBalance: updated.transferableBalance });
                        } catch (e) {
                          console.warn("RTDB transferable sync error:", e);
                        }
                      }
                      return updated;
                    });
                    alert("💎 Gained +1000 POKI Transferable Balance!");
                  }}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-400 text-emerald-300 py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer text-[8px] col-span-2 md:col-span-1"
                >
                  💎 +1k Trans
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION FIXED BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 w-full bg-[#0a0802] border-t border-white/[0.04] backdrop-blur-2xl py-3.5 shadow-2xl shrink-0 select-none">
          <div className="w-full max-w-2xl mx-auto px-1 flex justify-between items-center sm:px-4">
            
            {/* 1. MINING */}
            <button
              id="bottom-tab-mining"
              onClick={() => { setActiveTab('mining'); setMoreSubView('none'); }}
              className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 font-sans ${
                activeTab === 'mining' ? 'text-amber-400' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Zap className={`w-4 h-4 ${activeTab === 'mining' && isMining ? 'text-amber-400 fill-amber-400/20 animate-pulse' : ''}`} />
              <span className="text-[7.5px] font-extrabold uppercase tracking-wider leading-none mt-1">Mining</span>
            </button>

            {/* 2. GAME ARCADE */}
            <button
              id="bottom-tab-games"
              onClick={() => { setActiveTab('games'); setMoreSubView('none'); }}
              className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 font-sans ${
                activeTab === 'games' ? 'text-amber-400' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="text-[7.5px] font-extrabold uppercase tracking-wider leading-none mt-1">Arcade</span>
            </button>

            {/* 3. MORE EARNING */}
            <button
              id="bottom-tab-earning"
              onClick={() => { setActiveTab('earning'); setMoreSubView('none'); }}
              className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 font-sans ${
                activeTab === 'earning' ? 'text-amber-400' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'earning' ? 'text-amber-400 fill-amber-400/10' : ''}`} />
              <span className="text-[7.5px] font-extrabold uppercase tracking-wider leading-none mt-1">Earning</span>
            </button>

            {/* 4. WALLET */}
            <button
              id="bottom-tab-wallet"
              onClick={() => { setActiveTab('wallet'); setMoreSubView('none'); }}
              className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 font-sans ${
                activeTab === 'wallet' ? 'text-amber-400' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Key className="w-4 h-4" />
              <span className="text-[7.5px] font-extrabold uppercase tracking-wider leading-none mt-1">Wallet</span>
            </button>

            {/* 5. MORE */}
            <button
              id="bottom-tab-more"
              onClick={() => setActiveTab('more')}
              className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 font-sans ${
                activeTab === 'more' ? 'text-amber-400' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Menu className="w-4.5 h-4.5" />
              <span className="text-[7.5px] font-extrabold uppercase tracking-wider leading-none mt-1">More</span>
            </button>

          </div>
        </nav>

      </div>

      {/* ===================== USER PROFILE MODAL OVERLAY ===================== */}
      <AnimatePresence>
        {profileModalOpen && (
          <dialog
            open
            className="fixed inset-0 bg-black/95 w-full h-full p-4 flex items-center justify-center z-40 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-[#0c0a06] border border-amber-500/20 max-w-sm w-full p-6 sm:p-7 rounded-3xl relative flex flex-col shadow-2xl relative select-none text-white my-8 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button
                onClick={() => setProfileModalOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white p-1 rounded-full text-xs cursor-pointer outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-2 mb-5">
                <div className="w-11 h-11 bg-gradient-to-tr from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-black font-black text-sm mx-auto mb-2">
                  {profileForm.firstName ? profileForm.firstName.substring(0, 1).toUpperCase() : 'U'}
                </div>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#facc15] leading-none">Validator Profile</h3>
                <p className="text-[8px] text-white/45 tracking-[0.25em] uppercase font-mono mt-1">India's sovereign node parameter card</p>
              </div>

              {/* EDIT DETAIL FIELDS FORM */}
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5 text-left">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8.5px] font-mono font-bold text-white/40 uppercase tracking-widest pl-1">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="bg-black/55 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-400 font-sans"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8.5px] font-mono font-bold text-[#9ca3af] uppercase tracking-widest pl-1">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sharma"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="bg-black/55 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-400 font-sans"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8.5px] font-mono font-bold text-[#9ca3af] uppercase tracking-widest pl-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    placeholder="email@poki.in"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="bg-black/55 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8.5px] font-mono font-bold text-[#9ca3af] uppercase tracking-widest pl-1 font-sans">Verification Mobile Node</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91..."
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="bg-black/55 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8.5px] font-mono font-bold text-[#9ca3af] uppercase tracking-widest pl-1">Age</label>
                    <input
                      type="number"
                      required
                      placeholder="24"
                      value={profileForm.age}
                      onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                      className="bg-black/55 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8.5px] font-mono font-bold text-[#9ca3af] uppercase tracking-widest pl-1">Country</label>
                    <input
                      type="text"
                      required
                      placeholder="India"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                      className="bg-black/55 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-400 font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer mt-1.5 transition-colors"
                >
                  Save Profile Settings
                </button>
              </form>

              {/* SEPARATE LOGOUT BUTTON INSIDE PROFILE DETAIL SCREEN */}
              <div className="border-t border-white/5 mt-4.5 pt-4">
                <button
                  id="profile-logout-action-trigger"
                  onClick={() => { setProfileModalOpen(false); handleLogout(); }}
                  className="w-full bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 text-red-400 hover:text-red-300 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer transition-colors flex items-center justify-center gap-1.5 select-none"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  Logout Secure Session
                </button>
              </div>

            </motion.div>
          </dialog>
        )}
      </AnimatePresence>

    </div>
  );
}
