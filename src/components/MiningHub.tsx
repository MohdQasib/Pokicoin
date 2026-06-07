import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  HelpCircle, 
  ChevronRight, 
  Users, 
  Flame, 
  TrendingUp,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  X,
  AlertCircle,
  Calendar,
  Ticket,
  Tv,
  Trash2,
  CheckCircle2,
  Plus,
  Copy,
  Share2,
  Activity,
  Cpu
} from 'lucide-react';
import { MiningTeamMember } from '../types';
import LuckyWheel from './LuckyWheel';
import ScratchCard3D from './ScratchCard3D';
import DailySignIn from './DailySignIn';

interface MiningHubProps {
  balance: number;
  miningRate: number;
  isMining: boolean;
  onStartMining: () => void;
  timeLeftMs: number;
  teamMembers: MiningTeamMember[];
  quizPremiumBooster: boolean;
  baseRate: number;
  securityCircleRate: number;
  referralRate: number;
  quizRate: number;
  onRewardAwarded: (amount: number) => void;
  
  // 2X Speed Boost additions
  isSpeedBoostActive: boolean;
  speedBoostCountdown: string;
  onStartSpeedBoost: () => void;

  // Referral and Security circle handlers
  onAddMember: (name: string, isSecurity: boolean) => void;
  onRemoveMember: (id: string) => void;
  onPingMember: (id: string) => void;
}

export default function MiningHub({
  balance,
  miningRate,
  isMining,
  onStartMining,
  timeLeftMs,
  teamMembers,
  quizPremiumBooster,
  baseRate,
  securityCircleRate,
  referralRate,
  quizRate,
  onRewardAwarded,
  isSpeedBoostActive,
  speedBoostCountdown,
  onStartSpeedBoost,
  onAddMember,
  onRemoveMember,
  onPingMember
}: MiningHubProps) {
  
  // Format the running balance to exactly 8 decimal places
  const formattedBalance = useMemo(() => {
    return balance.toFixed(8);
  }, [balance]);

  // INR Conversion Display
  const currentInrValue = useMemo(() => {
    return (balance * 0.011).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  }, [balance]);

  // Format countdown string
  const formattedTimeLeft = useMemo(() => {
    if (timeLeftMs <= 0) return "00:00:00";
    const hours = Math.floor(timeLeftMs / (3600 * 1000)).toString().padStart(2, '0');
    const minutes = Math.floor((timeLeftMs % (3600 * 1000)) / (60 * 1000)).toString().padStart(2, '0');
    const seconds = Math.floor((timeLeftMs % (60 * 1000)) / 1000).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, [timeLeftMs]);

  // --- SUBPAGE modal manager ---
  const [activeEarningModal, setActiveEarningModal] = useState<'none' | 'daily' | 'spin' | 'scratch'>('none');

  // --- SPONSORED TELEMETRY AD WATCH ---
  const [telemetryAdPlaying, setTelemetryAdPlaying] = useState(false);
  const [telemetryAdTimer, setTelemetryAdTimer] = useState(5);
  const [lastTelemetryAdTime, setLastTelemetryAdTime] = useState(() => {
    const saved = localStorage.getItem('poki_last_telemetry_ad_watch');
    return saved ? parseInt(saved) : 0;
  });
  const [telemetryAdCooldownRemaining, setTelemetryAdCooldownRemaining] = useState('');

  const isTelemetryAdCooldown = useMemo(() => {
    if (lastTelemetryAdTime === 0) return false;
    const diff = Date.now() - lastTelemetryAdTime;
    const cooldown = 3 * 60 * 1000; // 3 mins limits
    return diff < cooldown;
  }, [lastTelemetryAdTime]);

  useEffect(() => {
    if (!isTelemetryAdCooldown) {
      if (telemetryAdCooldownRemaining !== '') {
        setTelemetryAdCooldownRemaining('');
      }
      return;
    }

    const interval = setInterval(() => {
      const diff = (lastTelemetryAdTime + 3 * 60 * 1000) - Date.now();
      if (diff <= 0) {
        setTelemetryAdCooldownRemaining('');
        clearInterval(interval);
      } else {
        const MathSecs = Math.ceil(diff / 1000);
        setTelemetryAdCooldownRemaining(`${MathSecs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTelemetryAdCooldown, lastTelemetryAdTime, telemetryAdCooldownRemaining]);

  const handleWatchTelemetryAd = () => {
    if (telemetryAdPlaying || isTelemetryAdCooldown) return;
    setTelemetryAdPlaying(true);
    setTelemetryAdTimer(5);

    const interval = setInterval(() => {
      setTelemetryAdTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTelemetryAdPlaying(false);
          onRewardAwarded(1.50); // reward size
          const timestamp = Date.now();
          setLastTelemetryAdTime(timestamp);
          localStorage.setItem('poki_last_telemetry_ad_watch', timestamp.toString());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- LOGICAL REAL CRYPTO MINING ENGINE SIMULATION ---
  const [minerLogs, setMinerLogs] = useState<string[]>([
    "[System] Initializing Poki Autonomous Node...",
    "[System] Listening on peer validator cluster port 3000...",
    "[Consensus] Core status synced with Mumbai-2 primary ledgers.",
    "[Consensus] Success: Block PoW handshake validated successfully."
  ]);
  const consoleBottomRef = useRef<HTMLDivElement | null>(null);

  // Fluctuating hardware stats
  const [hashrate, setHashrate] = useState(0);
  const [coreTemp, setCoreTemp] = useState(46.2);

  useEffect(() => {
    if (isMining) {
      setHashrate(parseFloat((12.45 + Math.random() * 6.4).toFixed(2)));
    } else {
      setHashrate(0);
    }

    const statsTimer = setInterval(() => {
      if (isMining) {
        setHashrate(parseFloat((12.45 + Math.random() * 6.4).toFixed(2)));
      } else {
        setHashrate(0);
      }
    }, 3000);

    return () => clearInterval(statsTimer);
  }, [isMining]);

  // CPU core temperature fluctuation dynamically between 45.5°C and 47.2°C every 10 seconds
  useEffect(() => {
    const tempTimer = setInterval(() => {
      setCoreTemp(parseFloat((45.5 + Math.random() * (47.2 - 45.5)).toFixed(1)));
    }, 10000);
    return () => clearInterval(tempTimer);
  }, []);

  // Log streams simulator
  useEffect(() => {
    if (!isMining) return;

    const logTemplates = [
      () => `[Consensus] Hashing candidate block @ ${hashrate.toFixed(2)} MH/s...`,
      () => `[PoW Core] Solution match derived with 9 trailing zeros.`,
      () => `[Sync Node] Broadcaster dispatch verified by Singapore Validator Cluster.`,
      () => `[Consensus] Solved block difficulty delta adjustment (+0.01%)`,
      () => `[Network] Latency index mapped: 14ms (Optimal Consensus)`,
      () => `[Poki Chain] Block validated Successfully. Reward transaction posted.`,
      () => `[System] Thermal core parameters operating at ${coreTemp.toFixed(1)}°C.`
    ];

    const logInterval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * logTemplates.length);
      const generatedString = `[${new Date().toLocaleTimeString()}] ${logTemplates[randomIdx]()}`;
      setMinerLogs(prev => [...prev.slice(-14), generatedString]);
    }, 4500);

    return () => clearInterval(logInterval);
  }, [isMining, hashrate, coreTemp]);

  // Auto-scroll logs board
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [minerLogs]);

  // --- DYNAMIC CUSTOMER UNIQUE REFERRAL CODE GENERATOR ---
  const userReferralCode = useMemo(() => {
    let code = localStorage.getItem('poki_user_referral_code');
    if (!code) {
      const randomId = Math.floor(100000 + Math.random() * 900000);
      code = `POK-${randomId}-M`;
      localStorage.setItem('poki_user_referral_code', code);
    }
    return code;
  }, []);

  const referralLink = useMemo(() => {
    return `https://minipokicoin.in/join?ref=${userReferralCode}`;
  }, [userReferralCode]);

  // --- REFERRALS & SIMPLIFIED TEAM SYSTEM ---
  const [newMemberName, setNewMemberName] = useState('');
  const [teamNotification, setTeamNotification] = useState<string | null>(null);

  const directTeam = useMemo(() => {
    return teamMembers;
  }, [teamMembers]);

  const activeRefCount = useMemo(() => {
    return teamMembers.filter(m => m.isActive).length;
  }, [teamMembers]);

  const handleAddNewMemberNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    
    onAddMember(newMemberName.trim(), false); // all added as standard refer list friends
    setNewMemberName('');
    showTeamNotification(`🎉 Friend added successfully: ${newMemberName}`);
  };

  const showTeamNotification = (msg: string) => {
    setTeamNotification(msg);
    setTimeout(() => setTeamNotification(null), 3000);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    showTeamNotification("📋 Referral Link Copied to Clipboard!");
  };

  const shareWhatsApp = () => {
    const text = `Hey! Join my Poki Autonoumous Mining team and let's mine POKI coins together! Solve PoW hashes and check-in daily to earn free rewards. Play here: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const showDailyAdBoostFlow = () => {
    if (isSpeedBoostActive) return;
    setAdWatchModal(true);
    setBoostAdTimer(5);
    const interval = setInterval(() => {
      setBoostAdTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdWatchModal(false);
          onStartSpeedBoost();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const [adWatchModal, setAdWatchModal] = useState(false);
  const [boostAdTimer, setBoostAdTimer] = useState(5);

  const hasSpunToday = useMemo(() => {
    const count = parseInt(localStorage.getItem('poki_spin_count_today') || '0');
    return count >= 3;
  }, [activeEarningModal]);

  const hasScratchedToday = useMemo(() => {
    const count = parseInt(localStorage.getItem('poki_scratch_count_today') || '0');
    return count >= 3;
  }, [activeEarningModal]);

  const dailyClaimStatus = useMemo(() => {
    const lastClaim = localStorage.getItem('poki_streak_last_claim');
    if (!lastClaim) return "READY";
    const diff = Date.now() - parseInt(lastClaim);
    if (diff < 24 * 60 * 60 * 1000) {
      return "CLAIMED";
    }
    return "READY";
  }, [activeEarningModal]);

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white overflow-y-auto no-scrollbar pb-24 p-4 md:p-6 select-none relative">
      
      {/* Sticky beautiful header with current clock */}
      <div className="p-4 border-b border-white/10 bg-[#080602]/85 backdrop-blur-md flex justify-between items-center sticky top-0 z-15">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber-500/80 font-bold">Poki Autonomous Network</span>
        </div>
        <div className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-mono text-white/50 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>UTC {new Date().toISOString().substring(11, 19)}</span>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-between gap-6 py-6 relative z-10 w-full max-w-xl mx-auto">
        
        {/* Real-time Ticking Counter with beautiful Golden glow */}
        <div className="w-full text-center py-2 flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400/80 font-display font-semibold mb-2 flex items-center gap-1.5 justify-center">
            <span className="inline-block relative">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Active Validator Node
          </div>
          
          <div className="bg-gradient-to-b from-[#1c180d] to-[#0a0804] border border-amber-500/15 py-4 px-6 rounded-2.5xl w-full flex flex-col items-center shadow-lg relative overflow-hidden select-text">
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-baseline justify-center font-display leading-none">
              <span className="text-4xl text-white font-extralight tracking-tight font-sans">
                {formattedBalance.substring(0, formattedBalance.indexOf('.'))}
              </span>
              <span className="text-3xl text-amber-400 font-bold">.</span>
              <span className="text-2xl text-amber-400/95 font-mono tracking-tight font-medium">
                {formattedBalance.substring(formattedBalance.indexOf('.') + 1)}
              </span>
              <span className="ml-2.5 text-[10px] font-bold tracking-widest text-amber-400 self-end mb-1">POKI</span>
            </div>
            
            {/* Real-Time Conversion Display into INR */}
            <div className="w-full border-t border-white/5 mt-3 pt-2.5 flex items-center justify-between text-[11px] font-medium text-white/50">
              <span className="text-[9px] uppercase tracking-wider">INR exchange value (1 POKI = ₹0.011)</span>
              <span className="text-amber-300 font-mono font-bold text-xs">₹ {currentInrValue} INR</span>
            </div>
          </div>
          
          <div className="mt-3.5 flex items-center gap-1.5 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[10px] text-white/60 font-medium font-sans">
              Mining Speed Rate: <strong className="text-amber-400 font-mono">+{miningRate.toFixed(4)}</strong> POKI/hr
            </span>
          </div>
        </div>

        {/* Central Mining Trigger Circle Button */}
        <div className="relative flex items-center justify-center my-2 select-none">
          <div className="absolute w-56 h-56 bg-amber-500/10 rounded-full blur-[45px] animate-pulse"></div>

          <div className="w-52 h-52 rounded-full border-[8px] border-white/5 flex items-center justify-center relative shadow-inner">
            <div className={`absolute inset-[3px] border border-dashed border-amber-500/35 rounded-full ${isMining ? 'orbit-spin-slow' : ''}`}></div>
            <div className="absolute inset-[-4px] border border-white/10 rounded-full animate-pulse"></div>

            <motion.button
              id="mine-button-trigger"
              whileTap={{ scale: 0.95 }}
              onClick={onStartMining}
              disabled={isMining}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center relative cursor-pointer outline-none transition-all duration-300 border border-white/15 ${
                isMining 
                  ? 'bg-gradient-to-b from-[#b45309] to-[#451a03] shadow-[0_0_50px_rgba(245,158,11,0.3)] border-amber-400/40' 
                  : 'bg-gradient-to-b from-white/10 to-white/[0.01] hover:bg-white/15 hover:border-yellow-500/20'
              }`}
            >
              {isMining ? (
                <div className="flex flex-col items-center pointer-events-none text-center">
                  <div className="lightning-bolt-glowing flex items-center justify-center mb-1">
                    <Zap className="w-9 h-9 text-white fill-amber-300/30 animate-bounce" />
                  </div>
                  <span className="text-xl font-bold font-mono tracking-tighter text-white">
                    {formattedTimeLeft}
                  </span>
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.3em] text-amber-200 mt-1 animate-pulse">
                    Mining Active
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center pointer-events-none text-center">
                  <div className="flex items-center justify-center mb-1 bg-white/5 p-2 rounded-full border border-white/10">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[11px] font-bold text-white tracking-[0.2em] uppercase leading-none">TAP TO MINE</span>
                  <span className="text-[8px] text-white/50 font-mono tracking-wider mt-1 uppercase">Start 24H Cycle</span>
                </div>
              )}
            </motion.button>
          </div>
        </div>

        {/* 2X Speed Boost Section */}
        <button
          onClick={showDailyAdBoostFlow}
          disabled={isSpeedBoostActive}
          className={`w-full max-w-sm backdrop-blur-md bg-gradient-to-r ${isSpeedBoostActive ? 'from-orange-500/10 to-orange-600/10 border-orange-500/40' : 'from-white/[0.03] to-white/[0.01] hover:from-white/[0.05] border-white/10'} rounded-2xl p-4.5 flex items-center justify-between transition-all select-none group border shadow-md overflow-hidden relative`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center gap-3.5 relative z-10 text-left">
            <div className={`p-2.5 rounded-xl border ${isSpeedBoostActive ? 'bg-orange-500/20 border-orange-400 text-orange-400 animate-pulse' : 'bg-white/5 border-white/10 text-orange-400 group-hover:scale-105'} transition-transform shrink-0`}>
              <Cpu className="w-5 h-5 shrink-0" />
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">2X SPEED BOOST</h4>
                {isSpeedBoostActive && (
                  <span className="text-[8px] font-mono bg-orange-500/20 text-orange-400 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">ACTIVE</span>
                )}
              </div>
              <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                {isSpeedBoostActive 
                  ? `Boost active: ${speedBoostCountdown} remaining`
                  : "Double your consensus hashing speed (Valid for 6 Hours)"}
              </p>
            </div>
          </div>

          {!isSpeedBoostActive && (
            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 relative z-10" />
          )}
        </button>


        {/* ===================== LOGICAL REAL CRYPTO MINING TELEMETRY (REPLACEMENT FOR CALCULATOR) ===================== */}
        <div className="w-full max-w-sm bg-[#090805] border border-amber-500/15 rounded-2.5xl p-4 shadow-xl flex flex-col gap-3">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">
                Crypto Node Hash Rate Monitor
              </h4>
            </div>
            <span className="text-[8.5px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest select-none">
              {isMining ? "Active Mining" : "Node Standby"}
            </span>
          </div>

          {/* Core Hardware Metrics */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[9.5px]">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col">
              <span className="text-white/45 text-[8px] uppercase tracking-wider">GPU Thread hashrate</span>
              <span className="text-white font-bold text-xs mt-1">
                {isMining ? `${hashrate.toFixed(2)} MH/s` : "0.00 MH/s"}
              </span>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col">
              <span className="text-white/45 text-[8px] uppercase tracking-wider">CPU core temp</span>
              <span className={`font-bold text-xs mt-1 ${coreTemp > 50 ? 'text-orange-400' : 'text-white'}`}>
                {coreTemp.toFixed(1)} °C
              </span>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col">
              <span className="text-white/45 text-[8px] uppercase tracking-wider">Blockchain Difficulty</span>
              <span className="text-white font-bold text-[10px] mt-1">
                12.89 T (PoW Block)
              </span>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col">
              <span className="text-white/45 text-[8px] uppercase tracking-wider">consensus peers</span>
              <span className="text-amber-400 font-bold text-xs mt-1">
                14 / 32 Connected
              </span>
            </div>
          </div>

          {/* Scrolling Logging stdout console */}
          <div className="bg-black border border-white/5 rounded-xl p-3 h-32 overflow-y-auto font-mono text-[8px] leading-relaxed text-emerald-400/80 flex flex-col gap-1 text-left no-scrollbar scroll-smooth">
            {minerLogs.map((log, index) => (
              <div key={index} className="whitespace-pre-line tracking-tight select-text">
                {log}
              </div>
            ))}
            <div ref={consoleBottomRef} />
          </div>
          <div className="text-[7px] text-white/30 text-center font-mono leading-none tracking-widest uppercase mt-0.5">
            Real-time stdout telemetry generated by thread validation compiler
          </div>
        </div>

        {/* ===================== DAILY TASKS ===================== */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          
          {/* Header Title for Daily Tasks */}
          <div className="flex items-center justify-between mb-1.5 select-none pl-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-[0.15em] text-[#ffb503] font-sans">
                Daily Tasks
              </h4>
            </div>
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Rewards hub</span>
          </div>

          <div className="flex flex-col gap-3">
            
            {/* Row 1: sPiner */}
            <button
              onClick={() => setActiveEarningModal('spin')}
              className="w-full backdrop-blur-md bg-white/[0.03] border border-amber-500/10 hover:border-amber-400/50 rounded-2xl px-4.5 py-3.5 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group shadow relative overflow-hidden select-none"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>
              
              <div className="flex items-center gap-3 relative z-10 text-left">
                <div className="w-8 h-8 flex items-center justify-center bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 group-hover:rotate-12 transition-transform shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col justify-center">
                  <h5 className="text-[12px] font-bold uppercase text-white tracking-wider font-sans group-hover:text-amber-400 transition-colors">Network Raffle</h5>
                  <p className="text-[8.5px] text-white/45 font-medium leading-none mt-1">Spin the flat colorful prize wheel</p>
                </div>
              </div>

              <span className={`text-[9.5px] font-mono font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border select-none ${
                !hasSpunToday 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-white/5 text-white/30 border-white/5'
              }`}>
                {hasSpunToday ? 'DONE' : 'SPIN'}
              </span>
            </button>

            {/* Row 2: Daily SignIn */}
            <button
              onClick={() => setActiveEarningModal('daily')}
              className="w-full backdrop-blur-md bg-white/[0.03] border border-amber-500/10 hover:border-amber-400/50 rounded-2xl px-4.5 py-3.5 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group shadow relative overflow-hidden select-none"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>
              
              <div className="flex items-center gap-3 relative z-10 text-left">
                <div className="w-8 h-8 flex items-center justify-center bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 group-hover:scale-105 transition-transform shrink-0">
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col justify-center">
                  <h5 className="text-[12px] font-bold uppercase text-white tracking-wider font-sans group-hover:text-amber-400 transition-colors">Daily Sign-In</h5>
                  <p className="text-[8.5px] text-white/45 font-medium leading-none mt-1">Stamp consecutive check-in lines</p>
                </div>
              </div>

              <span className={`text-[9.5px] font-mono font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border select-none ${
                dailyClaimStatus === 'READY' 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-white/5 text-white/30 border-white/5'
              }`}>
                {dailyClaimStatus === 'READY' ? 'STAMP' : 'CLAIMED'}
              </span>
            </button>

            {/* Row 3: Screacth CarD */}
            <button
              onClick={() => setActiveEarningModal('scratch')}
              className="w-full backdrop-blur-md bg-white/[0.03] border border-amber-500/10 hover:border-amber-400/50 rounded-2xl px-4.5 py-3.5 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group shadow relative overflow-hidden select-none"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>
              
              <div className="flex items-center gap-3 relative z-10 text-left">
                <div className="w-8 h-8 flex items-center justify-center bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 group-hover:scale-105 transition-transform shrink-0">
                  <Ticket className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col justify-center">
                  <h5 className="text-[12px] font-bold uppercase text-white tracking-wider font-sans group-hover:text-amber-400 transition-colors">Scratch Card</h5>
                  <p className="text-[8.5px] text-white/45 font-medium leading-none mt-1">Rub & swipe to scrape gold layers</p>
                </div>
              </div>

              <span className={`text-[9.5px] font-mono font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border select-none ${
                !hasScratchedToday 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-white/5 text-white/30 border-[#ffffff]/5'
              }`}>
                {hasScratchedToday ? 'DONE' : 'PLAY'}
              </span>
            </button>

            {/* Row 4: Claim Node Rewards */}
            <button
              onClick={handleWatchTelemetryAd}
              disabled={telemetryAdPlaying || isTelemetryAdCooldown}
              className={`w-full backdrop-blur-md bg-white/[0.03] border border-amber-500/10 rounded-2xl px-4.5 py-3.5 flex items-center justify-between transition-all select-none group shadow relative overflow-hidden ${
                telemetryAdPlaying || isTelemetryAdCooldown
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:border-amber-400/50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              }`}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="flex items-center gap-3 relative z-10 text-left">
                <div className="w-8 h-8 flex items-center justify-center bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 group-hover:scale-105 transition-transform shrink-0">
                  <Tv className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col justify-center">
                  <h5 className="text-[12px] font-bold uppercase text-white tracking-wider font-sans group-hover:text-amber-400 transition-colors">Claim Node Rewards</h5>
                  <p className="text-[8.5px] text-white/45 font-medium leading-none mt-1">Get telemetry rewards (+1.50 POKI)</p>
                </div>
              </div>

              <span className={`text-[9.5px] font-mono font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border select-none ${
                !isTelemetryAdCooldown 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-white/5 text-white/30 border-white/5'
              }`}>
                {isTelemetryAdCooldown ? telemetryAdCooldownRemaining : 'CLAIM'}
              </span>
            </button>

          </div>
        </div>

        {/* Mining speed breakdown */}
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 select-none text-left">
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/40 border-b border-white/5 pb-2.5 mb-4">
            Security Consensus Speed Ledger
          </h4>
          
          <div className="flex flex-col gap-3 font-mono text-[10.5px]">
            
            <div className="flex justify-between items-center text-white/60">
              <span className="flex items-center gap-1.5 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Base Mining Speed
              </span>
              <span className="text-white">{baseRate.toFixed(4)} POKI/h</span>
            </div>

            <div className="flex justify-between items-center text-white/60">
              <span className="flex items-center gap-1.5 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Referred Friends Active Boost
              </span>
              <span className="text-amber-400 font-bold">+{referralRate.toFixed(4)} POKI/h</span>
            </div>

            <div className="flex justify-between items-center text-white/60">
              <span className="flex items-center gap-1.5 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Technical Specs Quiz Boosts
              </span>
              <span className="text-amber-400/90 font-bold">+{quizRate.toFixed(4)} POKI/h</span>
            </div>

            {isSpeedBoostActive && (
              <div className="flex justify-between items-center text-orange-400 font-bold border-t border-orange-500/10 pt-2 md:pt-3">
                <span className="flex items-center gap-1.5 font-sans">
                  ⚡ 2X Active Multiply Booster
                </span>
                <span>x 2.0</span>
              </div>
            )}

          </div>
        </div>

        {/* ===================== SIMPLIFIED REFER FRIENDS SECTION (REQUIREMENT 2, 3) ===================== */}
        <div id="refer-friends-section" className="w-full max-w-sm border-t border-white/5 pt-6 mt-2 select-none text-left">
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#f0be1e]">Refer Friends</h3>
              <p className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5 leading-none">Share link to build active mining consensus</p>
            </div>
            <Users className="w-4.5 h-4.5 text-amber-500" />
          </div>

          {teamNotification && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{teamNotification}</span>
            </div>
          )}

          {/* Simple Link Share Button Panel */}
          <div className="bg-[#0e0c05] border border-amber-500/15 rounded-2xl p-4.5 mb-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-mono uppercase tracking-widest text-white/40 font-bold">Your Unique Referral Code</span>
              <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                {userReferralCode}
              </span>
            </div>

            {/* Tap to copy main link button */}
            <button
              onClick={copyReferralLink}
              className="w-full py-3 px-4 bg-white/[0.02] border border-white/10 hover:border-amber-400/50 rounded-xl flex items-center justify-between transition-colors outline-none cursor-pointer group text-left"
            >
              <span className="font-mono text-[9px] text-white/60 truncate max-w-[220px]">
                {referralLink}
              </span>
              <Copy className="w-4 h-4 text-white/30 group-hover:text-amber-400 transition-colors shrink-0 mL-2" />
            </button>

            {/* Direct Social Media Whatsapp Share */}
            <button
              onClick={shareWhatsApp}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow hover:from-emerald-400 transition-all outline-none active:scale-[0.98]"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Link on WhatsApp
            </button>
          </div>





        </div>

      </div>

      {/* ===================== SIMULATED SPEED AD BOOST MODAL ===================== */}
      <AnimatePresence>
        {adWatchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-50 text-center select-none"
          >
            <div className="absolute top-[20%] flex flex-col items-center">
              <Zap className="w-12 h-12 text-orange-500 animate-bounce mb-3" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#facc15]">High-Rate Interstitial Ad Frame</h4>
              <p className="text-[10px] text-white/30 uppercase mt-0.5 tracking-wider font-mono">Unlocking 2X speed booster keys</p>
            </div>

            <div className="w-full max-w-sm bg-[#0c0a06] border border-white/10 rounded-3xl p-8 my-6 flex flex-col items-center gap-4 relative overflow-hidden shadow-2xl">
              <div className="text-4xl font-extrabold font-mono text-orange-400">{boostAdTimer}</div>
              <p className="text-xs text-white/45 uppercase tracking-widest">Streaming sponsored telemetry verification...</p>
              
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10 mt-2.5">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                ></motion.div>
              </div>
            </div>

            <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] absolute bottom-12 font-mono">
              Generating active signature handshake
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== EASE-IN OVERLAY MODALS FOR REWARD MECHANICS ===================== */}
      <AnimatePresence>
        {activeEarningModal !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000000]/95 backdrop-blur-md flex items-center justify-center p-4 z-40"
            onClick={() => setActiveEarningModal('none')} // SAFE OVERLAY CLOSE AS REQUESTED IN REQ 7!
          >
            <motion.div
              initial={{ scale: 0.94, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 30 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
              className="bg-[#0b0904] border border-amber-500/25 max-w-md w-full p-6 pb-8 rounded-3xl relative flex flex-col shadow-[0_20px_50px_-10px_rgba(245,158,11,0.25)]"
              onClick={(e) => e.stopPropagation()} // Stop propagation to let inner forms operate normally
            >
              {/* Outer top right close indicator */}
              <button
                onClick={() => setActiveEarningModal('none')}
                className="absolute top-4 right-4 text-white/40 hover:text-white hover:bg-white/5 p-1 rounded-full outline-none transition-colors border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Reward Modal routing */}
              {activeEarningModal === 'daily' && (
                <DailySignIn 
                  onRewardAwarded={onRewardAwarded} 
                  onClose={() => setActiveEarningModal('none')} 
                />
              )}

              {activeEarningModal === 'spin' && (
                <LuckyWheel 
                  onRewardAwarded={onRewardAwarded} 
                />
              )}

              {activeEarningModal === 'scratch' && (
                <ScratchCard3D 
                  onRewardAwarded={onRewardAwarded} 
                />
              )}

              {activeEarningModal === 'none' && (
                <div className="text-center py-6">
                  <span className="text-sm uppercase tracking-widest text-[#ffd700]">CONSENSUS REWARD ENGINE CLOSED</span>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== TELEMETRY COMMERCIAL AD PLAYER OVERLAY ===================== */}
      <AnimatePresence>
        {telemetryAdPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 z-50 text-center select-none"
          >
            <div className="absolute top-[18%] flex flex-col items-center">
              <Tv className="w-10 h-10 text-amber-500 animate-bounce mb-3" />
              <h4 className="text-sm font-black uppercase tracking-widest text-[#facc15] font-display">Poki Telemetry Broadcaster</h4>
              <p className="text-[10px] text-white/30 uppercase mt-0.5 tracking-wider font-mono">Securing network handshake telemetry</p>
            </div>

            <div className="w-full max-w-sm bg-[#0c0a06] border border-white/10 rounded-3xl p-8 my-6 flex flex-col items-center gap-4 relative overflow-hidden shadow-2xl">
              <div className="text-3xl font-extrabold font-mono text-amber-400">{telemetryAdTimer}</div>
              <p className="text-xs text-white/45 uppercase tracking-widest">Constructing ledger nodes validation...</p>
              
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10 mt-2">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                ></motion.div>
              </div>
            </div>

            <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] absolute bottom-12 font-mono">
              Do not exit frame until validation finishes
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
