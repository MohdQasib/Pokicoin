import React, { useMemo } from 'react';
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
  Clock
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
}: MiningHubProps) {
  // Format the running balance to exactly 8 decimal places
  const formattedBalance = useMemo(() => {
    return balance.toFixed(8);
  }, [balance]);

  // Format countdown timer (HH:MM:SS)
  const formattedTimeLeft = useMemo(() => {
    if (timeLeftMs <= 0) return '00:00:00';
    const totalSecs = Math.floor(timeLeftMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeftMs]);

  // Progress of session (out of 24 hours)
  const sessionProgressPercent = useMemo(() => {
    const totalMs = 24 * 60 * 60 * 1000;
    const progress = Math.max(0, Math.min(100, (timeLeftMs / totalMs) * 100));
    return 100 - progress; // We want 0% at start, 100% when expired (or vice versa, let's show remaining progress bar)
  }, [timeLeftMs]);

  const activeRefCount = teamMembers.filter(m => m.isActive && !m.isSecurityCircle).length;
  const securityCircleCount = teamMembers.filter(m => m.isSecurityCircle).length;

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white overflow-y-auto no-scrollbar pb-6">
      {/* Header Info Banner */}
      <div className="p-4 border-b border-white/10 bg-[#020208]/40 backdrop-blur-md flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-cyan-400">Mainnet Simulation Session</span>
        </div>
        <div className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-mono text-white/50 flex items-center gap-1">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>UTC {new Date().toISOString().substring(11, 19)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between p-6 gap-6 relative z-10">
        
        {/* Real-time Ticking Counter */}
        <div className="w-full text-center py-2 flex flex-col items-center">
          <div className="text-[9.5px] uppercase tracking-[0.3em] text-cyan-400 font-display font-semibold mb-2.5 flex items-center gap-1.5 justify-center">
            <span className="inline-block relative">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Real-Time Mining Balance
          </div>
          <div className="flex items-baseline justify-center font-mono select-none bg-white/5 p-4 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(6,182,212,0.08)]">
            {/* Split decimals for stylized high-tech counter sizing */}
            <span className="text-4xl font-bold text-white font-display">
              {formattedBalance.substring(0, formattedBalance.indexOf('.'))}
            </span>
            <span className="text-3xl text-cyan-400 font-bold font-display">.</span>
            <span className="text-2xl text-cyan-400/90 font-mono tracking-tight font-medium">
              {formattedBalance.substring(formattedBalance.indexOf('.') + 1)}
            </span>
            <span className="ml-2.5 text-[10px] font-bold tracking-widest text-white/40 self-end mb-1">VMC</span>
          </div>
          
          <div className="mt-3 flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] text-white/60">
              Mining Speed: <strong className="text-cyan-400 font-mono">+{miningRate.toFixed(4)}</strong> VMC/hr
            </span>
          </div>
        </div>

        {/* Core Mining Trigger Circle Button (Replicated from the Theme design) */}
        <div className="relative flex items-center justify-center my-4 select-none">
          {/* Pulsing Backing Blast Glow */}
          <div className="absolute w-60 h-60 bg-cyan-500/10 rounded-full blur-[40px] animate-pulse"></div>

          {/* Large outer border frame */}
          <div className="w-52 h-52 rounded-full border-[10px] border-white/5 flex items-center justify-center relative">
            {/* Fine outer dashed alignment orbit that spins slow in active mode */}
            <div className={`absolute inset-[2px] border border-dashed border-cyan-500/35 rounded-full ${isMining ? 'orbit-spin-slow' : ''}`}></div>
            <div className={`absolute inset-[-4px] border border-white/10 rounded-full animate-pulse`}></div>

            {/* Interactive Inner Trigger Gradient Button */}
            <motion.button
              id="mine-button-trigger"
              whileTap={{ scale: 0.95 }}
              onClick={onStartMining}
              disabled={isMining}
              className={`w-40 h-40 rounded-full flex flex-col items-center justify-center relative cursor-pointer outline-none transition-all duration-300 border border-white/15 ${
                isMining 
                  ? 'bg-gradient-to-b from-cyan-600 to-blue-900 shadow-[0_0_60px_rgba(6,182,212,0.4)]' 
                  : 'bg-gradient-to-b from-white/10 to-white/[0.01] hover:bg-white/15 hover:border-white/20'
              }`}
            >
              {isMining ? (
                <div className="flex flex-col items-center pointer-events-none">
                  <div className="lightning-bolt-glowing flex items-center justify-center mb-1">
                    <Zap className="w-10 h-10 text-white fill-cyan-300/30" />
                  </div>
                  <span className="text-2xl font-bold font-mono tracking-tighter text-white">
                    {formattedTimeLeft}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-300 mt-1 animate-pulse">
                    Mining Active
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center pointer-events-none">
                  <div className="flex items-center justify-center mb-1 bg-white/5 p-3 rounded-full border border-white/10">
                    <Zap className="w-7 h-7 text-white/90" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-[0.2em] uppercase">TAP TO MINE</span>
                  <span className="text-[8.5px] text-white/50 font-mono tracking-wider mt-1 uppercase">Start 24H Session</span>
                </div>
              )}
            </motion.button>
          </div>
        </div>

        {/* Rate Breakdown and Boost Calculations Card */}
        <div className="w-full bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-display font-semibold text-white/85 uppercase tracking-[0.150em] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Mining Speed Engine
            </h3>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/20 px-2.5 py-0.5 rounded-full border border-cyan-800/30">
              +{miningRate.toFixed(4)} VMC/hr
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Base Rate */}
            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/15 flex flex-col gap-1">
              <span className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">Base Rate</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-medium text-white/80">+{baseRate.toFixed(3)}</span>
                <span className="text-[8.5px] text-white/40 font-mono">100%</span>
              </div>
            </div>

            {/* Security Circle Bonus */}
            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/15 flex flex-col gap-1">
              <span className="text-white/40 text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1 justify-between">
                Security
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-medium text-cyan-400">+{securityCircleRate.toFixed(3)}</span>
                <span className="text-[8.5px] text-white/40 font-mono">({securityCircleCount}/5 links)</span>
              </div>
            </div>

            {/* Team Referral Bonus */}
            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/15 flex flex-col gap-1">
              <span className="text-white/40 text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1 justify-between">
                Referrals
                <Users className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-medium text-cyan-300">+{referralRate.toFixed(3)}</span>
                <span className="text-[8.5px] text-white/40 font-mono">({activeRefCount} Active)</span>
              </div>
            </div>

            {/* Tech Quiz Booster */}
            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/15 flex flex-col gap-1">
              <span className="text-white/40 text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1 justify-between">
                Academy Boost
                <Award className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className={`font-mono font-medium ${quizPremiumBooster ? 'text-cyan-400' : 'text-white/30'}`}>
                  +{quizRate.toFixed(3)}
                </span>
                <span className={`text-[8.5px] font-mono px-1 py-0.2 rounded ${quizPremiumBooster ? 'text-cyan-400 bg-cyan-950/20' : 'text-white/30'}`}>
                  {quizPremiumBooster ? 'ACTIVE' : 'LOCKED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Step Tutorial Indicator */}
        <div className="w-full bg-white/[0.02] rounded-xl p-4 border border-white/10 text-xs">
          <div className="flex items-start gap-3">
            <div className="bg-cyan-950/20 p-2 rounded-xl text-cyan-400 border border-cyan-900/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white/80 uppercase tracking-widest text-[9.5px]">Simulation Consensus mechanics</p>
              <p className="text-white/45 mt-1 text-[11px] leading-relaxed font-sans">
                Tokens are simulated dynamically inside this application based on consensus mechanisms. To access these funds and transfer them to your Testnet Wallet, you must complete the <strong>Synthetic Validation KYC</strong> and migrate your balance.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
