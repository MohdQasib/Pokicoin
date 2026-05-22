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
  Info, 
  TrendingUp, 
  Smartphone,
  Layers,
  Activity,
  Cpu,
  Globe,
  BellRing
} from 'lucide-react';

import { MiningTeamMember, WalletState, Transaction, Block, KYCDetails, MiningSession } from './types';
import MiningHub from './components/MiningHub';
import TeamManager from './components/TeamManager';
import WalletHub from './components/WalletHub';
import KycPortal from './components/KycPortal';
import NetworkExplorer from './components/NetworkExplorer';
import WhitepaperQuiz from './components/WhitepaperQuiz';

// Default initial network contacts
const DEFAULT_MEMBERS: MiningTeamMember[] = [
  { id: 'member_alice', name: 'Alice Chen', role: 'Invitee', isActive: true, avatarColor: 'bg-emerald-500 text-emerald-100', miningContribution: 0.005, isSecurityCircle: false },
  { id: 'member_bob', name: 'Bob Sterling', role: 'Invitee', isActive: true, avatarColor: 'bg-indigo-500 text-indigo-100', miningContribution: 0.005, isSecurityCircle: false },
  { id: 'member_charlie', name: 'Charlie Vance', role: 'Invitee', isActive: false, avatarColor: 'bg-amber-500 text-amber-100', miningContribution: 0.005, isSecurityCircle: false },
  { id: 'member_dave', name: 'Dave Miller', role: 'Security', isActive: true, avatarColor: 'bg-cyan-500 text-cyan-100', miningContribution: 0.004, isSecurityCircle: true },
  { id: 'member_eva', name: 'Eva Kovic', role: 'Security', isActive: true, avatarColor: 'bg-purple-500 text-purple-100', miningContribution: 0.004, isSecurityCircle: true }
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
      { id: 'tx01', sender: 'G324FA238FASDZVM', recipient: 'G821BAS8F12SAZVM', amount: 15.2, fee: 0.0001, timestamp: Date.now() - 18000, blockNumber: 489311, status: 'success' },
      { id: 'tx02', sender: 'G292S8D22S1XVM', recipient: 'G481BA28F10XVM', amount: 5.0, fee: 0.0001, timestamp: Date.now() - 16000, blockNumber: 489311, status: 'success' }
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
      { id: 'tx03', sender: 'G292S8D22S1XVM', recipient: 'G224FA238FASDZVM', amount: 121.4, fee: 0.0001, timestamp: Date.now() - 37000, blockNumber: 489310, status: 'success' }
    ]
  }
];

export default function App() {
  // Mobile frame tab routing
  const [activeTab, setActiveTab] = useState<'mine' | 'team' | 'wallet' | 'kyc' | 'explorer' | 'academy'>('mine');

  // --- STATE DECLARATIONS (with client-side state initialization/local storage fallback) ---
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('vmc_mining_balance');
    return saved ? parseFloat(saved) : 10.0; // Start with a seed of 10 coins
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
      publicKey: '',
      privateKeyPhrase: '',
      isCreated: false,
      isUnlocked: false,
      unverifiedBalance: 2.24, // unverified start
      transferableBalance: 7.76, // transferable start
      migratedBalance: 0.0 // starts with 0 spendable migrated coins
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

  // Blockchain Ledger Simulator State
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const saved = localStorage.getItem('vmc_ledger_blocks');
    return saved ? JSON.parse(saved) : DEFAULT_BLOCKS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('vmc_address_txs');
    return saved ? JSON.parse(saved) : [];
  });

  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  // Refs for precise ticker accumulation
  const lastTickTimeRef = useRef<number>(Date.now());
  const balanceRef = useRef<number>(balance);

  // Sync refs to avoid dependency re-triggers
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  // Save states to local storage
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


  // --- SPEED RATE METRIC BREAKDOWNS (Hourly metrics) ---
  const BASE_RATE = 0.02; // constant base
  
  const SECURITY_CIRCLE_RATE = useMemo(() => {
    // Each security contact adds +0.004 VMC/hr and cap at 5 members max
    const securityCount = teamMembers.filter(m => m.isSecurityCircle).length;
    return Math.min(5, securityCount) * 0.004;
  }, [teamMembers]);

  const REFERRAL_RATE = useMemo(() => {
    // Each referral contact who is active adds +0.005 VMC/hr
    const activeRef = teamMembers.filter(m => !m.isSecurityCircle && m.isActive).length;
    return activeRef * 0.005;
  }, [teamMembers]);

  const QUIZ_RATE = useMemo(() => {
    return quizPremiumBooster ? 0.05 : 0.0;
  }, [quizPremiumBooster]);

  const TOTAL_MINING_RATE = useMemo(() => {
    return BASE_RATE + SECURITY_CIRCLE_RATE + REFERRAL_RATE + QUIZ_RATE;
  }, [BASE_RATE, SECURITY_CIRCLE_RATE, REFERRAL_RATE, QUIZ_RATE]);


  // --- COUNTDOWN / SESSION TIMER MANAGER ---
  useEffect(() => {
    if (!isMining || sessionStartTime === 0) {
      setTimeLeftMs(0);
      return;
    }

    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in ms
    
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


  // --- REAL-TIME HIGH FREQUENCY MICRO-TICKER LOOP ---
  useEffect(() => {
    let animationFrameId: number;
    lastTickTimeRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const elapsedMs = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;

      if (isMining && TOTAL_MINING_RATE > 0 && elapsedMs > 0) {
        // Convert hourly rate to millisecond rate
        const ratePerMs = TOTAL_MINING_RATE / (3600 * 1000);
        const earned = ratePerMs * elapsedMs;
        
        // Accumulate balance and separate into transferable/unverified pools
        const nextBalance = balanceRef.current + earned;
        setBalance(nextBalance);
        
        // Ratio update for wallet display
        // Standard self-accrued rate is BASE_RATE + QUIZ_RATE
        // Teammates accrued is SECURITY_CIRCLE_RATE + REFERRAL_RATE
        const selfRatio = (BASE_RATE + QUIZ_RATE) / TOTAL_MINING_RATE;
        const refereeRatio = 1 - selfRatio;

        setWalletState(prev => {
          const addedTransferable = earned * selfRatio;
          const addedUnverified = earned * refereeRatio;
          return {
            ...prev,
            transferableBalance: prev.transferableBalance + addedTransferable,
            unverifiedBalance: prev.unverifiedBalance + addedUnverified
          };
        });
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isMining, TOTAL_MINING_RATE]);


  // --- AUTOMATED BLOCK FORGER SIMULATOR (Every 5.2 seconds) ---
  useEffect(() => {
    const blockInterval = setInterval(() => {
      setBlocks(prevBlocks => {
        const nextBlockHeight = prevBlocks[0].number + 1;
        const timestampNow = Date.now();
        const validatorNames = ['Validator London', 'Validator San Francisco', 'Validator Tokyo', 'Validator Singapore', 'Validator Sydney'];
        const selectedValidator = validatorNames[Math.floor(Math.random() * validatorNames.length)];

        // Pull queued transactions
        const txsToInclude = [...pendingTransactions];
        setPendingTransactions([]); // clear queue

        const newBlock: Block = {
          number: nextBlockHeight,
          hash: generateBlockHash(nextBlockHeight),
          parentHash: prevBlocks[0].hash,
          timestamp: timestampNow,
          transactionCount: txsToInclude.length + (Math.random() > 0.4 ? 1 : 0), // include dummy consensus fees
          sizeKb: parseFloat((0.51 + Math.random() * 1.5).toFixed(2)),
          validator: selectedValidator,
          transactions: txsToInclude.length > 0 ? txsToInclude.map(tx => ({...tx, blockNumber: nextBlockHeight, status: 'success'})) : []
        };

        // If there were actual pending transactions mapped, update the resolved status in history
        if (txsToInclude.length > 0) {
          setTransactions(prevTxs => {
            return prevTxs.map(t => {
              const matchedPending = txsToInclude.find(pending => pending.id === t.id);
              if (matchedPending) {
                return { ...t, status: 'success', blockNumber: nextBlockHeight };
              }
              return t;
            });
          });
        }

        return [newBlock, ...prevBlocks.slice(0, 8)]; // keep latest 9 blocks
      });
    }, 5200);

    return () => clearInterval(blockInterval);
  }, [pendingTransactions]);


  // --- EVENT HANDLERS ---
  const handleStartMining = () => {
    if (isMining) return;
    setIsMining(true);
    setSessionStartTime(Date.now());
    setTimeLeftMs(24 * 60 * 60 * 1000);
  };

  const handleAddMember = (name: string, isSecurity: boolean) => {
    const nextId = 'member_' + Math.random().toString(36).substring(2, 9);
    const colors = [
      'bg-emerald-500 text-emerald-100',
      'bg-indigo-500 text-indigo-100',
      'bg-pink-500 text-pink-100',
      'bg-cyan-500 text-cyan-100',
      'bg-teal-500 text-teal-100',
      'bg-purple-500 text-purple-100',
      'bg-orange-500 text-orange-100'
    ];
    const pickedColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember: MiningTeamMember = {
      id: nextId,
      name,
      role: isSecurity ? 'Security' : 'Invitee',
      isActive: true, // starts active to trigger boost feedback instantly
      avatarColor: pickedColor,
      miningContribution: isSecurity ? 0.004 : 0.005,
      isSecurityCircle: isSecurity
    };

    setTeamMembers(prev => [...prev, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const handlePingMember = (id: string) => {
    // Set inactive referral member to active for 4 minutes to let user check metrics
    setTeamMembers(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          isActive: true,
          lastPingTime: Date.now()
        };
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
      isUnlocked: true // auto unlock on create
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
      return { success: false, error: 'Insufficient migrated ledger balance.' };
    }

    const txId = 'tx_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const newTx: Transaction = {
      id: txId,
      sender: walletState.publicKey,
      recipient,
      amount,
      fee: 0.0001,
      timestamp: Date.now(),
      blockNumber: 0, // pending
      status: 'pending'
    };

    // Deduct transaction details from spendable balance
    setWalletState(prev => ({
      ...prev,
      migratedBalance: prev.migratedBalance - (amount + 0.0001)
    }));

    // Add to transaction logs and queue for block mining forge
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
    setKycDetails(prev => ({
      ...prev,
      status: 'approved'
    }));
  };

  const handleUnlockQuizBooster = () => {
    setQuizPremiumBooster(true);
  };

  const handleMigrateBalance = () => {
    if (kycDetails.status !== 'approved' || walletState.transferableBalance <= 0) return;

    // Migrate self-mined transferable balance over to spendable migrated wallet ledger balance
    const transferableToMigrate = walletState.transferableBalance;
    
    // Log as a special "System Ledger Migration" transaction on the blockchain explorer!
    const migrationTxId = 'mig_' + Math.random().toString(36).substring(2, 10);
    const migrationTx: Transaction = {
      id: migrationTxId,
      sender: 'COINBASE_MIGRATION_ANCHOR_NODE',
      recipient: walletState.publicKey,
      amount: transferableToMigrate,
      fee: 0.0,
      timestamp: Date.now(),
      blockNumber: 0, // pending
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

  const handleClearPersistence = () => {
    if (confirm('Are you sure you want to hard reset all virtual mining parameters? Your local mock blockchain progress will be cleared.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#020208] text-white font-sans flex flex-col xl:flex-row antialiased overflow-x-hidden relative">
      
      {/* Background ambient radial blur lights matching Immersive UI Design */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-900/15 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-purple-900/15 rounded-full blur-[150px]"></div>
        <div className="absolute top-[40%] left-[30%] w-[35%] h-[35%] bg-cyan-950/10 rounded-full blur-[110px]"></div>
      </div>

      {/* LEFT SIDEBAR: Broad decentralized telemetry dashboard metrics (Desktop-Only Panel) */}
      <div className="hidden xl:flex xl:w-5/12 p-8 flex-col justify-between border-r border-white/10 backdrop-blur-md bg-white/[0.01] relative z-10">
        
        {/* Title / Brand Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-widest text-[#f5fbfd] select-none">
                VMC<span className="text-cyan-400">NET</span>
              </h1>
              <p className="text-[10px] text-white/50 tracking-[0.2em] font-mono uppercase">Decentralized Stellar consensus</p>
            </div>
          </div>
          <p className="text-xs text-white/40 max-w-sm mt-4 leading-relaxed border-l border-white/20 pl-3">
            Simulates real-time consensus protocol parameters inside your browser, showing network logs, mobile cryptographic distribution, and peer identity audits.
          </p>
        </div>

        {/* Central telemetry logs info */}
        <div className="flex flex-col gap-6 my-6">
          
          <h3 className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em] leading-none">Node Telemetry Indices</h3>
          
          <div className="grid grid-cols-2 gap-4">
            
            {/* Height Indicator */}
            <div className="bg-white/[0.04] border border-white/10 p-5 rounded-2xl backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-16 h-16 bg-blue-500/5 rounded-full blur-md"></div>
              <div className="flex items-center justify-between text-white/40">
                <span className="text-[9px] font-bold font-mono uppercase tracking-wider">Consensus Height</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-light font-display mt-2 text-white">#{blocks[0].number}</p>
              <span className="text-[8.5px] font-mono text-cyan-400 flex items-center gap-1 mt-1.5">
                • Active core validated ok
              </span>
            </div>

            {/* Mining Velocity */}
            <div className="bg-white/[0.04] border border-white/10 p-5 rounded-2xl backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-md"></div>
              <div className="flex items-center justify-between text-white/40">
                <span className="text-[9px] font-bold font-mono uppercase tracking-wider font-sans">Local Node Speed</span>
                <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <p className="text-2xl font-light font-display mt-2 text-white">+{TOTAL_MINING_RATE.toFixed(4)} <span className="text-xs text-white/40 font-mono">/hr</span></p>
              <span className={`text-[8.5px] font-mono flex items-center gap-1 mt-1.5 ${isMining ? 'text-cyan-400' : 'text-white/40'}`}>
                {isMining ? '⚡ Core actively hashing' : '💤 Core simulation idle'}
              </span>
            </div>

            {/* Active Nodes */}
            <div className="bg-white/[0.04] border border-white/10 p-5 rounded-2xl backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between text-white/40">
                <span className="text-[9px] font-bold font-mono uppercase tracking-wider">Global Validators</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-light font-display mt-2 text-white">128<span className="text-xs text-white/30">/128</span></p>
              <span className="text-[8.5px] font-mono text-cyan-400/80 flex items-center gap-1 mt-1.5">
                • Threshold quorum stable
              </span>
            </div>

            {/* KYC status details */}
            <div className="bg-white/[0.04] border border-white/10 p-5 rounded-2xl backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between text-white/40">
                <span className="text-[9px] font-bold font-mono uppercase tracking-wider">KYC Audit Lock</span>
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
              <p className={`text-base font-bold font-display mt-2.5 uppercase tracking-widest ${
                kycDetails.status === 'approved' 
                  ? 'text-cyan-400' 
                  : kycDetails.status === 'verifying' 
                  ? 'text-amber-500 animate-pulse' 
                  : 'text-white/40'
              }`}>
                {kycDetails.status === 'approved' ? 'VERIFIED HUMAN' : kycDetails.status === 'verifying' ? 'AUDITING...' : 'REQUIRED'}
              </p>
              <span className="text-[8.5px] font-mono text-white/30 flex items-center gap-1 mt-1.5">
                Prevents bot farms
              </span>
            </div>

          </div>

          {/* Halving progress bar */}
          <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl backdrop-blur-sm shadow-inner flex flex-col gap-2.5">
            <div className="flex justify-between text-[9px] text-[#06b6d4] font-bold font-mono uppercase tracking-widest">
              <span>Next Halving Pool Status</span>
              <span>78% FILLED</span>
            </div>
            
            <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500" style={{ width: '78%' }}></div>
            </div>

            <div className="flex justify-between text-[8px] text-white/30 font-mono uppercase tracking-wide">
              <span>Rate: {TOTAL_MINING_RATE.toFixed(4)} VMC/hr</span>
              <span>Target: {(TOTAL_MINING_RATE / 2).toFixed(4)} (Post Halving)</span>
            </div>
          </div>

        </div>

        {/* Action resets */}
        <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/10">
          <div className="text-[9px] text-white/30 font-mono uppercase tracking-wider">
            <p className="text-white/40 font-bold">VMC Consensus v1.4.0</p>
            <p className="mt-0.5">PI STELLAR MECHANICS MOCK</p>
          </div>
          <button
            id="clear-persistence-btn"
            onClick={handleClearPersistence}
            className="text-[9px] font-bold tracking-widest font-mono bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 px-3 py-1.5 rounded-lg cursor-pointer transition-colors uppercase"
          >
            Clear State
          </button>
        </div>

      </div>


      {/* RIGHT PANEL: High-Fidelity curved smartphone frame hosting the mobile miner application */}
      <div className="flex-1 flex justify-center items-center p-4 sm:p-6 md:p-8 relative z-10">
        
        {/* Curvaceous Smartphone container markup */}
        <div className="w-full max-w-sm h-[740px] rounded-[48px] bg-[#020208]/92 border-[8px] border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative flex flex-col overflow-hidden ring-1 ring-white/15 backdrop-blur-xl">
          
          {/* Top Notch speaker and camera bar mock */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-white/10 rounded-b-2xl z-50 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-1 bg-black rounded-full mb-1"></div>
            <div className="w-2 h-2 bg-black rounded-full ml-4 mb-1"></div>
          </div>

          {/* Core Simulated App viewport */}
          <div className="flex-1 flex flex-col h-full pt-6 relative bg-transparent">
            
            <AnimatePresence mode="wait">
              {activeTab === 'mine' && (
                <motion.div 
                  key="mine-tab" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden"
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
                  />
                </motion.div>
              )}

              {activeTab === 'team' && (
                <motion.div 
                  key="team-tab" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <TeamManager
                    teamMembers={teamMembers}
                    onAddMember={handleAddMember}
                    onRemoveMember={handleRemoveMember}
                    onPingMember={handlePingMember}
                  />
                </motion.div>
              )}

              {activeTab === 'wallet' && (
                <motion.div 
                  key="wallet-tab" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden"
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
                </motion.div>
              )}

              {activeTab === 'kyc' && (
                <motion.div 
                  key="kyc-tab" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <KycPortal
                    kycDetails={kycDetails}
                    onKycSubmit={handleKycSubmit}
                    onKycApprove={handleKycApprove}
                  />
                </motion.div>
              )}

              {activeTab === 'explorer' && (
                <motion.div 
                  key="explorer-tab" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <NetworkExplorer
                    blocks={blocks}
                    activeBlockHeight={blocks[0].number}
                  />
                </motion.div>
              )}

              {activeTab === 'academy' && (
                <motion.div 
                  key="academy-tab" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <WhitepaperQuiz
                    quizPremiumBooster={quizPremiumBooster}
                    onUnlockQuizBooster={handleUnlockQuizBooster}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom persistent smartphone navigation dock */}
            <div className="bg-[#020208]/85 border-t border-white/10 py-3.5 px-2 flex justify-between items-center shrink-0 backdrop-blur-md relative z-10">
              
              {/* Mine Tab Button */}
              <button
                id="dock-tab-mine"
                onClick={() => setActiveTab('mine')}
                className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 ${
                  activeTab === 'mine' ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Zap className={`w-4.5 h-4.5 ${activeTab === 'mine' && isMining ? 'text-cyan-400 fill-cyan-400/20 animate-pulse' : ''}`} />
                <span className="text-[9px] font-semibold tracking-wider uppercase">Mining</span>
              </button>

              {/* Team Tab Button */}
              <button
                id="dock-tab-team"
                onClick={() => setActiveTab('team')}
                className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 ${
                  activeTab === 'team' ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span className="text-[9px] font-semibold tracking-wider uppercase">Team</span>
              </button>

              {/* Wallet Tab Button */}
              <button
                id="dock-tab-wallet"
                onClick={() => setActiveTab('wallet')}
                className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 ${
                  activeTab === 'wallet' ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Key className="w-4.5 h-4.5" />
                <span className="text-[9px] font-semibold tracking-wider uppercase">Wallet</span>
              </button>

              {/* KYC Tab Button */}
              <button
                id="dock-tab-kyc"
                onClick={() => setActiveTab('kyc')}
                className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 ${
                  activeTab === 'kyc' ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <ShieldCheck className="w-4.5 h-4.5" />
                <span className="text-[9px] font-semibold tracking-wider uppercase">KYC</span>
              </button>

              {/* Explorer Tab Button */}
              <button
                id="dock-tab-explorer"
                onClick={() => setActiveTab('explorer')}
                className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 ${
                  activeTab === 'explorer' ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Database className="w-4.5 h-4.5" />
                <span className="text-[9px] font-semibold tracking-wider uppercase">Ledger</span>
              </button>

              {/* Academy Tab Button */}
              <button
                id="dock-tab-academy"
                onClick={() => setActiveTab('academy')}
                className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 ${
                  activeTab === 'academy' ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <BookOpen className="w-4.5 h-4.5" />
                <span className="text-[9px] font-semibold tracking-wider uppercase">Tech</span>
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
