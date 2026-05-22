import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  HelpCircle, 
  ChevronRight, 
  Users, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Flame, 
  TrendingUp,
  Clock,
  Sparkles,
  HelpCircle as QuestionIcon,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';
import { MiningTeamMember } from '../types';

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
}

const SPIN_AWARDS = [
  { value: 1.0, label: '+1.0 POKI', color: '#b45309' }, // amber-700
  { value: 2.5, label: '+2.5 POKI', color: '#f59e0b' }, // amber-500
  { value: 5.0, label: '+5.0 POKI', color: '#d97706' }, // amber-600
  { value: 10.0, label: '+10 POKI', color: '#eab308' }, // yellow-500
  { value: 15.0, label: '+15 POKI', color: '#facc15' }, // yellow-400
  { value: 50.0, label: 'JACKPOT 50', color: '#ca8a04' } // yellow-600 with sparkle
];

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
}: MiningHubProps) {
  // Format the running balance to exactly 8 decimal places
  const formattedBalance = useMemo(() => {
    return balance.toFixed(8);
  }, [balance]);

  // INR Conversion Display
  const currentInrValue = useMemo(() => {
    return (balance * 0.50).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  }, [balance]);

  // Calculator inputs
  const [pokiCalcInput, setPokiCalcInput] = useState('');
  const [inrCalcInput, setInrCalcInput] = useState('');

  const handlePokiCalc = (val: string) => {
    setPokiCalcInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setInrCalcInput((num * 0.50).toFixed(2));
    } else {
      setInrCalcInput('');
    }
  };

  const handleInrCalc = (val: string) => {
    setInrCalcInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setPokiCalcInput((num / 0.50).toFixed(2));
    } else {
      setPokiCalcInput('');
    }
  };

  // Format countdown timer (HH:MM:SS)
  const formattedTimeLeft = useMemo(() => {
    if (timeLeftMs <= 0) return '00:00:00';
    const totalSecs = Math.floor(timeLeftMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeftMs]);

  // Spinner states
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [hasSpunToday, setHasSpunToday] = useState(() => {
    const lastSpin = localStorage.getItem('poki_last_spin_time');
    if (!lastSpin) return false;
    const past = parseInt(lastSpin);
    const oneDay = 24 * 60 * 60 * 1000;
    return (Date.now() - past) < oneDay;
  });
  const [spinResultMsg, setSpinResultMsg] = useState<string | null>(null);

  const startLuckySpinner = () => {
    if (isSpinning || hasSpunToday) return;
    setIsSpinning(true);
    setSpinResultMsg(null);

    // Pick a random segment (0 - 5)
    const targetSegment = Math.floor(Math.random() * SPIN_AWARDS.length);
    const award = SPIN_AWARDS[targetSegment];

    // Compute rotation angles: 360 degrees per full rotation. We spin at least 5 times (1800 degrees) + delta
    const segmentAngle = 360 / SPIN_AWARDS.length;
    // Align so that pointer points to segment correctly on rotation
    const baseStopAngle = 360 - (targetSegment * segmentAngle) - (segmentAngle / 2);
    const fullRotations = 3600; // 10 full turns
    const finalAngle = fullRotations + baseStopAngle;

    setSpinAngle(finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      onRewardAwarded(award.value);
      setHasSpunToday(true);
      setSpinResultMsg(`🎉 Congratulations! You received +${award.value.toFixed(1)} Poki Koin!`);
      localStorage.setItem('poki_last_spin_time', Date.now().toString());
    }, 4500); // sync with spinning transition delay
  };

  // Daily Tasks list state
  const [claimedTasks, setClaimedTasks] = useState<string[]>(() => {
    const saved = localStorage.getItem('poki_claimed_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [adRunningTask, setAdRunningTask] = useState<string | null>(null);
  const [adProgress, setAdProgress] = useState(0);

  const dailyTasksList = [
    { id: 'task_checkin', title: 'Daily Check-In Reward', coins: 0.50, description: 'Claim your basic daily human check-in coins' },
    { id: 'task_twitter', title: 'Follow Poki Twitter', coins: 1.00, description: 'Follow @PokiKoin for critical updates', actionUrl: 'https://x.com' },
    { id: 'task_tg', title: 'Join Poki Telegram', coins: 1.50, description: 'Join our decentralized telegram group', actionUrl: 'https://t.me' },
    { id: 'task_ad', title: 'Sponsor Portal Watch-Ad', coins: 2.50, description: 'Watch a short sponsored telemetry clip to boost consensus' }
  ];

  const handleTaskAction = (taskId: string, coins: number, actionUrl?: string) => {
    if (claimedTasks.includes(taskId)) return;

    if (taskId === 'task_ad') {
      setAdRunningTask(taskId);
      setAdProgress(0);
      const timer = setInterval(() => {
        setAdProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setAdRunningTask(null);
            claimTaskReward(taskId, coins);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      return;
    }

    if (actionUrl) {
      window.open(actionUrl, '_blank', 'noopener,noreferrer');
    }

    // instaclaim task
    setTimeout(() => {
      claimTaskReward(taskId, coins);
    }, 1000);
  };

  const claimTaskReward = (taskId: string, coins: number) => {
    const nextClaimed = [...claimedTasks, taskId];
    setClaimedTasks(nextClaimed);
    localStorage.setItem('poki_claimed_tasks', JSON.stringify(nextClaimed));
    onRewardAwarded(coins);
    
    // Auto clear at midnight simulated trigger
    setTimeout(() => {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg z-50';
      toast.innerText = `🎁 Received +${coins.toFixed(2)} Poki Koin Task Bonus!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }, 100);
  };

  const resetAllTasksForTesting = () => {
    localStorage.removeItem('poki_claimed_tasks');
    localStorage.removeItem('poki_last_spin_time');
    setClaimedTasks([]);
    setHasSpunToday(false);
    setSpinResultMsg(null);
    setSpinAngle(0);
  };

  const activeRefCount = teamMembers.filter(m => m.isActive && !m.isSecurityCircle).length;
  const securityCircleCount = teamMembers.filter(m => m.isSecurityCircle).length;

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white overflow-y-auto no-scrollbar pb-6">
      {/* Header Info Banner */}
      <div className="p-4 border-b border-white/10 bg-[#0a0802]/40 backdrop-blur-md flex justify-between items-center sticky top-0 z-15">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber-400">Poki Autonomous Network</span>
        </div>
        <div className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-mono text-white/50 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>UTC {new Date().toISOString().substring(11, 19)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between p-5 gap-5 relative z-10">
        
        {/* Real-time Ticking Counter with beautiful Golden glow */}
        <div className="w-full text-center py-1 flex flex-col items-center">
          <div className="text-[9.5px] uppercase tracking-[0.3em] text-amber-400 font-display font-semibold mb-2 flex items-center gap-1.5 justify-center">
            <span className="inline-block relative">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Real-Time Mining Balance
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white/[0.03] p-4 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(245,158,11,0.06)] w-full max-w-[310px]">
            <div className="flex items-baseline justify-center font-mono select-none">
              <span className="text-4xl font-bold text-white font-display">
                {formattedBalance.substring(0, formattedBalance.indexOf('.'))}
              </span>
              <span className="text-3xl text-amber-400 font-bold font-display">.</span>
              <span className="text-2xl text-amber-400/95 font-mono tracking-tight font-medium">
                {formattedBalance.substring(formattedBalance.indexOf('.') + 1)}
              </span>
              <span className="ml-2.5 text-[10px] font-bold tracking-widest text-amber-400 self-end mb-1">POKI</span>
            </div>
            
            {/* Real-Time Conversion Display into INR (Pi style) */}
            <div className="w-full border-t border-white/5 mt-2 pt-2 flex items-center justify-between text-[11px] font-semibold text-white/60">
              <span className="text-[9px] uppercase text-white/30 tracking-wider">INR Conversion (₹0.50/Poki)</span>
              <span className="text-amber-300 font-mono text-xs">₹ {currentInrValue} INR</span>
            </div>
          </div>
          
          <div className="mt-2.5 flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[10px] text-white/60">
              Mining Speed: <strong className="text-amber-400 font-mono">+{miningRate.toFixed(4)}</strong> POKI/hr
            </span>
          </div>
        </div>

        {/* Central Mining Trigger Circle Button */}
        <div className="relative flex items-center justify-center my-2 select-none">
          <div className="absolute w-52 h-52 bg-amber-500/10 rounded-full blur-[40px] animate-pulse"></div>

          <div className="w-48 h-48 rounded-full border-[8px] border-white/5 flex items-center justify-center relative">
            <div className={`absolute inset-[2px] border border-dashed border-amber-500/35 rounded-full ${isMining ? 'orbit-spin-slow' : ''}`}></div>
            <div className={`absolute inset-[-4px] border border-white/10 rounded-full animate-pulse`}></div>

            <motion.button
              id="mine-button-trigger"
              whileTap={{ scale: 0.95 }}
              onClick={onStartMining}
              disabled={isMining}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center relative cursor-pointer outline-none transition-all duration-300 border border-white/15 ${
                isMining 
                  ? 'bg-gradient-to-b from-amber-500 via-amber-600 to-yellow-900 shadow-[0_0_50px_rgba(245,158,11,0.35)]' 
                  : 'bg-gradient-to-b from-white/10 to-white/[0.01] hover:bg-white/15 hover:border-yellow-500/20'
              }`}
            >
              {isMining ? (
                <div className="flex flex-col items-center pointer-events-none">
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
                <div className="flex flex-col items-center pointer-events-none">
                  <div className="flex items-center justify-center mb-1 bg-white/5 p-2 rounded-full border border-white/10">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[11px] font-bold text-white tracking-[0.2em] uppercase">TAP TO MINE</span>
                  <span className="text-[8px] text-white/50 font-mono tracking-wider mt-1 uppercase">Start 24H Cycle</span>
                </div>
              )}
            </motion.button>
          </div>
        </div>

        {/* INR calculator - Quick computation panel */}
        <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Exchange Calculator (INR)
            </h4>
            <span className="text-[9px] font-mono text-white/40">1 POKI = ₹0.50 INR</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[8px] uppercase tracking-wider text-white/40 font-semibold font-mono">POKI Coins</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="20"
                  value={pokiCalcInput}
                  onChange={(e) => handlePokiCalc(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
                <span className="absolute right-2.5 top-1.5 text-[9px] text-amber-400 font-bold font-mono">POKI</span>
              </div>
            </div>
            
            <div className="text-white/30 font-bold text-sm mt-3">⇄</div>
            
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[8px] uppercase tracking-wider text-white/40 font-semibold font-mono">Indian Rupees (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="10"
                  value={inrCalcInput}
                  onChange={(e) => handleInrCalc(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
                <span className="absolute right-2.5 top-1.5 text-[9px] text-amber-400 font-bold font-mono">INR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lucky Spinner (Spin & Win Daily) Wheel segment code */}
        <div className="w-full bg-white/5 rounded-xl p-4.5 border border-white/10 flex flex-col gap-3 relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Lucky Spin & Win segment
            </h3>
            <span className="text-[8px] bg-amber-950/20 px-2 py-0.5 border border-amber-500/20 text-amber-400 font-mono rounded">
              Once Daily
            </span>
          </div>

          <div className="flex flex-col items-center py-2 relative">
            {/* Spinning Indicator pointer arrow */}
            <div className="absolute top-1 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-amber-400 drop-shadow"></div>
            
            {/* Circle Segment Graphic wheel */}
            <div className="w-32 h-32 rounded-full border-4 border-amber-500/40 relative overflow-hidden flex items-center justify-center bg-black shadow-lg">
              <motion.div
                id="spinner-wheel-rotor"
                animate={{ rotate: spinAngle }}
                transition={isSpinning ? { duration: 4, ease: [0.1, 0.8, 0.25, 1] } : { duration: 0 }}
                className="w-full h-full rounded-full relative"
                style={{ transformOrigin: 'center center' }}
              >
                {/* Visual Segment Dividers */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {SPIN_AWARDS.map((award, i) => {
                    const angle = 60; // 360 / 6
                    const rad1 = (i * angle * Math.PI) / 180;
                    const rad2 = (((i + 1) * angle) * Math.PI) / 180;
                    const x1 = 50 + 50 * Math.cos(rad1);
                    const y1 = 50 + 50 * Math.sin(rad1);
                    const x2 = 50 + 50 * Math.cos(rad2);
                    const y2 = 50 + 50 * Math.sin(rad2);
                    
                    return (
                      <g key={i}>
                        <path
                          d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                          fill={award.color}
                        />
                        {/* Text placed in segment */}
                        <text
                          x={50 + 28 * Math.cos((rad1 + rad2) / 2)}
                          y={52 + 28 * Math.sin((rad1 + rad2) / 2)}
                          fill="white"
                          fontSize="5"
                          fontWeight="bold"
                          textAnchor="middle"
                          transform={`rotate(${(i * angle) + 30}, ${50 + 28 * Math.cos((rad1 + rad2) / 2)}, ${52 + 28 * Math.sin((rad1 + rad2) / 2)})`}
                        >
                          {award.value}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="50" cy="50" r="10" fill="#000" stroke="#f59e0b" strokeWidth="2" />
                </svg>
              </motion.div>
              {/* Spinner core cap */}
              <div className="absolute w-6 h-6 bg-black rounded-full border-2 border-amber-400 flex items-center justify-center text-[7px] font-bold text-amber-400">
                Poki
              </div>
            </div>

            {/* Results & trigger action */}
            <div className="w-full text-center mt-3">
              {spinResultMsg && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-amber-300 font-bold mb-2 p-1 bg-amber-950/20 border border-amber-500/20 rounded-lg leading-snug"
                >
                  {spinResultMsg}
                </motion.p>
              )}

              <button
                id="spin-trigger-action-btn"
                onClick={startLuckySpinner}
                disabled={isSpinning || hasSpunToday}
                className="w-full max-w-[180px] bg-gradient-to-tr from-amber-500 to-yellow-500 text-black font-extrabold py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer hover:brightness-110 disabled:opacity-40 transition-all font-sans"
              >
                {isSpinning ? 'SPINNING SEGMENTS...' : hasSpunToday ? 'ALREADY SPUN TODAY' : 'SPIN FOR BONUS POKI'}
              </button>
            </div>
          </div>
        </div>

        {/* Daily Tasks Module check list */}
        <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Daily Tasks Hub
            </h3>
            <span className="text-[8px] text-white/40">Earn instant bonus POKI</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {dailyTasksList.map((task) => {
              const isClaimed = claimedTasks.includes(task.id);
              const isRunning = adRunningTask === task.id;

              return (
                <div key={task.id} className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs transition-all hover:bg-black/40">
                  <div className="flex-1 pr-3">
                    <h5 className="font-bold text-white/95 text-xs flex items-center gap-1">
                      {task.title}
                      <span className="text-[9px] text-amber-400 font-mono">(+{task.coins.toFixed(2)} POKI)</span>
                    </h5>
                    <p className="text-[10px] text-white/40 leading-relaxed mt-0.5">{task.description}</p>

                    {isRunning && (
                      <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${adProgress}%` }}></div>
                      </div>
                    )}
                  </div>

                  <button
                    id={`task-btn-${task.id}`}
                    onClick={() => handleTaskAction(task.id, task.coins, task.actionUrl)}
                    disabled={isClaimed || isRunning}
                    className={`flex items-center justify-center px-4 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold text-center transition-all cursor-pointer select-none ${
                      isClaimed
                        ? 'bg-amber-500/10 text-amber-500 pointer-events-none border border-amber-500/20'
                        : isRunning
                        ? 'bg-white/10 text-white/40 pointer-events-none'
                        : 'bg-white/5 hover:bg-amber-400 hover:text-black border border-white/10 hover:border-transparent text-white'
                    }`}
                  >
                    {isClaimed ? (
                      <span className="flex items-center gap-1"><Check className="w-3 h-3" /> CLAIMED</span>
                    ) : isRunning ? (
                      'PLAYING...'
                    ) : (
                      'CLAIM'
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Test developer reset action */}
          <button
            id="reset-tasks-testing-btn"
            onClick={resetAllTasksForTesting}
            className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-mono hover:text-amber-400 text-center flex items-center gap-1 justify-center mt-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset task spins for testing
          </button>
        </div>

        {/* Rate Breakdown and Boost Calculations Card */}
        <div className="w-full bg-white/5 rounded-xl p-4.5 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-[10px] font-display font-semibold text-white/85 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Mining Speed Engine
            </h3>
            <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/20 px-2.5 py-0.5 rounded-full border border-amber-800/30">
              +{miningRate.toFixed(4)} POKI/hr
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {/* Base Rate */}
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/15 flex flex-col gap-1">
              <span className="text-white/40 text-[8.5px] uppercase tracking-wider font-semibold">Base Rate</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono font-medium text-white/80">+{baseRate.toFixed(3)}</span>
                <span className="text-[8px] text-white/40 font-mono">100%</span>
              </div>
            </div>

            {/* Security Circle Bonus */}
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/15 flex flex-col gap-1">
              <span className="text-white/40 text-[8.5px] uppercase tracking-wider font-semibold flex items-center gap-1 justify-between">
                Security
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono font-medium text-amber-400">+{securityCircleRate.toFixed(3)}</span>
                <span className="text-[8px] text-white/40 font-mono">({securityCircleCount}/5 links)</span>
              </div>
            </div>

            {/* Team Referral Bonus */}
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/15 flex flex-col gap-1">
              <span className="text-white/40 text-[8.5px] uppercase tracking-wider font-semibold flex items-center gap-1 justify-between">
                Referrals
                <Users className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono font-medium text-amber-300 font-bold">+{referralRate.toFixed(3)}</span>
                <span className="text-[8px] text-white/40 font-mono">({activeRefCount} Active)</span>
              </div>
            </div>

            {/* Tech Quiz Booster */}
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/15 flex flex-col gap-1">
              <span className="text-white/40 text-[8.5px] uppercase tracking-wider font-semibold flex items-center gap-1 justify-between">
                Academy Boost
                <Award className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className={`font-mono font-medium ${quizPremiumBooster ? 'text-amber-400 font-bold' : 'text-white/30'}`}>
                  +{quizRate.toFixed(3)}
                </span>
                <span className={`text-[8px] font-mono px-1 py-0.2 rounded ${quizPremiumBooster ? 'text-amber-400 bg-amber-950/20' : 'text-white/30'}`}>
                  {quizPremiumBooster ? 'ACTIVE' : 'LOCKED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Step Tutorial Indicator */}
        <div className="w-full bg-white/[0.02] rounded-xl p-4 border border-white/10 text-xs">
          <div className="flex items-start gap-3">
            <div className="bg-amber-950/20 p-2 rounded-xl text-amber-400 border border-amber-900/30 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white/80 uppercase tracking-widest text-[9.5px]">Pi-Inspired Mechanism</p>
              <p className="text-white/45 mt-1 text-[10.5px] leading-relaxed font-sans">
                You can easily add your own custom domain (<strong>minipocicoin.in</strong>) and host this exact site on flat GitHub Pages. All states synchronize automatically. KYC audits safeguard rewards!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
