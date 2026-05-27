import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Gift, Check, Clock, X, Info } from 'lucide-react';

interface DailySignInProps {
  onRewardAwarded: (amount: number) => void;
  onClose: () => void;
}

const DAILY_STREAK_REWARDS = [
  { day: 1, amount: 0.10, label: '0.1' },
  { day: 2, amount: 0.20, label: '0.2' },
  { day: 3, amount: 0.30, label: '0.3' },
  { day: 4, amount: 0.40, label: '0.4' },
  { day: 5, amount: 0.50, label: '0.5' },
  { day: 6, amount: 0.60, label: '0.6' },
  { day: 7, amount: 1.00, label: '1.0' },
  { day: 8, amount: 1.25, label: '1.25' },
  { day: 9, amount: 1.50, label: '1.5' },
  { day: 10, amount: 1.75, label: '1.75' },
  { day: 11, amount: 2.00, label: '2.0' },
  { day: 12, amount: 2.25, label: '2.25' },
  { day: 13, amount: 2.50, label: '2.5' },
  { day: 14, amount: 25.00, label: 'Mystery Box' }
];

export default function DailySignIn({ onRewardAwarded, onClose }: DailySignInProps) {
  const [streakDaysClaimed, setStreakDaysClaimed] = useState<number>(() => {
    const saved = localStorage.getItem('poki_streak_claimed');
    return saved ? parseInt(saved) : 0;
  });

  const [lastClaimTime, setLastClaimTime] = useState<number>(() => {
    const saved = localStorage.getItem('poki_streak_last_claim');
    return saved ? parseInt(saved) : 0;
  });

  // Synchronize limits for tester resets instantly
  useEffect(() => {
    const syncDaily = () => {
      const savedClaim = localStorage.getItem('poki_streak_last_claim');
      const savedClaimed = localStorage.getItem('poki_streak_claimed');
      if (savedClaim) {
        setLastClaimTime(parseInt(savedClaim));
      } else {
        setLastClaimTime(0);
      }
      if (savedClaimed) {
        setStreakDaysClaimed(parseInt(savedClaimed));
      } else {
        setStreakDaysClaimed(0);
      }
    };
    window.addEventListener('storage', syncDaily);
    const interval = setInterval(syncDaily, 1500); // Poll as fallback
    return () => {
      window.removeEventListener('storage', syncDaily);
      clearInterval(interval);
    };
  }, []);

  const [claimStatusMsg, setClaimStatusMsg] = useState<string | null>(null);
  const [countdownString, setCountdownString] = useState('');

  // 48h limit rule: Reset streak if missed check-in continuum longer than 48 hours
  useEffect(() => {
    if (lastClaimTime > 0) {
      const hoursSince = (Date.now() - lastClaimTime) / (3600 * 1000);
      if (hoursSince > 48) {
        setStreakDaysClaimed(0);
        localStorage.setItem('poki_streak_claimed', '0');
        setClaimStatusMsg("Streak broken! You exceeded 48 hours between node validations. Recalibrating to Day 1.");
      }
    }
  }, [lastClaimTime]);

  const canClaimToday = useMemo(() => {
    if (lastClaimTime === 0) return true;
    const diff = Date.now() - lastClaimTime;
    const cooldown = 24 * 60 * 60 * 1000; // STRICT 24H LOCK
    return diff >= cooldown;
  }, [lastClaimTime]);

  // Track ticking cooldown
  useEffect(() => {
    if (canClaimToday) {
      setCountdownString('');
      return;
    }

    const updateTimer = () => {
      const nextAvailable = lastClaimTime + 24 * 60 * 60 * 1000;
      const remainingMs = nextAvailable - Date.now();
      
      if (remainingMs <= 0) {
        setCountdownString('');
      } else {
        const hrs = Math.floor(remainingMs / 3600000).toString().padStart(2, '0');
        const mins = Math.floor((remainingMs % 3600000) / 60000).toString().padStart(2, '0');
        const secs = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0');
        setCountdownString(`${hrs}:${mins}:${secs}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [canClaimToday, lastClaimTime]);

  const handleClaim = (dayNum: number) => {
    if (!canClaimToday) {
      setClaimStatusMsg("24-Hour safety lock is engaged. Please wait for the cooldown timer.");
      return;
    }

    if (dayNum !== streakDaysClaimed + 1) {
      setClaimStatusMsg(`Progressive validation required. Next slot is Day ${streakDaysClaimed + 1}.`);
      return;
    }

    const reward = DAILY_STREAK_REWARDS[dayNum - 1];
    let nextStreak = streakDaysClaimed + 1;
    let finalAmount = reward.amount;

    if (dayNum === 14) {
      // 14th mysteries jackpot random bounds [25, 45] POKI
      const randomBonus = 25.0 + Math.random() * 20.0;
      finalAmount = randomBonus;
    }

    onRewardAwarded(finalAmount);
    // If Day 14 was claimed, let's wrap around and auto-start from Day 0
    if (nextStreak >= 14) {
      nextStreak = 0;
    }

    setStreakDaysClaimed(nextStreak);
    setLastClaimTime(Date.now());
    
    localStorage.setItem('poki_streak_claimed', nextStreak.toString());
    localStorage.setItem('poki_streak_last_claim', Date.now().toString());

    setClaimStatusMsg(`🎉 Success! Day ${dayNum} Checked-in successfully. Gained +${finalAmount.toFixed(2)} POKI. Saving verification...`);

    // Automatically close the daily check-in modal after 1.5 seconds so the user doesn't have to manually click back
    setTimeout(() => {
      onClose();
    }, 1500);
  };



  return (
    <div className="w-full relative flex flex-col font-sans select-none p-1">
      
      {/* Absolute Beautifully Styled Circular Close Header Button */}
      <button
        onClick={onClose}
        id="close-streak-modal-header"
        className="absolute -top-1 -right-1 w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 text-white/60 hover:text-white rounded-full outline-none select-none cursor-pointer border border-white/5 transition-all z-10 shadow-md"
        title="Close check-in"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header Info */}
      <div className="text-center mb-5 mt-2">
        <h3 className="text-sm font-[900] uppercase tracking-[0.2em] text-[#ffb700] flex items-center justify-center gap-1.5">
          <Calendar className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          STREAK REGISTRY
        </h3>
        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
          Lock daily validations consecutively
        </p>
      </div>

      {claimStatusMsg && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-[#facc15] rounded-2xl p-4 text-[10.5px] leading-relaxed text-center font-sans tracking-tight">
          {claimStatusMsg}
        </div>
      )}

      {/* 14 Days Matrix visual grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 my-3">
        {DAILY_STREAK_REWARDS.map((item) => {
          const isClaimed = item.day <= streakDaysClaimed;
          const isNextSlot = item.day === streakDaysClaimed + 1;
          const isCurrent = isNextSlot && canClaimToday;
          const isMystery = item.day === 14;

          return (
            <button
              key={item.day}
              disabled={isClaimed || !isCurrent}
              onClick={() => handleClaim(item.day)}
              className={`relative aspect-[4/5] rounded-xl flex flex-col justify-between p-2.5 text-center border select-none transition-all outline-none ${
                isClaimed
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-bold opacity-80'
                  : isCurrent
                  ? 'bg-gradient-to-b from-amber-600/15 to-amber-950/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:border-amber-300 cursor-pointer animate-pulse'
                  : 'bg-[#100c05]/80 border-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              <div className="text-[8.5px] font-mono font-black tracking-wider text-white/60">D-{item.day}</div>
              
              <div className="flex justify-center items-center py-1">
                {isMystery ? (
                  <Gift className={`w-5 h-5 shrink-0 ${isClaimed ? 'text-amber-500' : 'text-amber-400/90'}`} />
                ) : isClaimed ? (
                  <Check className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <span className="text-xs font-black tracking-tight text-white">
                    +{item.label}
                  </span>
                )}
              </div>

              <span className="text-[7px] tracking-wide font-mono uppercase font-semibold text-white/30">
                {isMystery ? 'Mystery' : 'POKI'}
              </span>

              {/* Glowing ring overlay on currently claimable */}
              {isCurrent && <div className="absolute inset-0 rounded-xl border border-amber-400/55 pointer-events-none"></div>}
            </button>
          );
        })}
      </div>

      {/* Reset Warnings */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-[9.5px] leading-relaxed text-white/40 mb-5 flex gap-2.5 text-left font-sans">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Active Concurrency Lock:</strong> Checked-in balances require active 24-Hour locks. Inactivity bounds exceeding 48 hours resets progress securely.
        </div>
      </div>

      {/* Main trigger CTA button updated with beautiful Glassmorphism design and custom neon labels */}
      <div className="flex flex-col gap-3 mt-1">
        <button
          onClick={() => handleClaim(streakDaysClaimed + 1)}
          disabled={!canClaimToday || streakDaysClaimed >= 14}
          className={`w-full py-4 rounded-2xl text-[10.5px] uppercase font-black tracking-widest select-none transition-all flex items-center justify-center gap-2 outline-none border ${
            canClaimToday && streakDaysClaimed < 14
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer'
              : 'bg-white/5 text-white/50 border-white/5 cursor-not-allowed'
          }`}
        >
          {canClaimToday ? (
            <>
              <Check className="w-4 h-4" />
              Claim Day {streakDaysClaimed + 1} Stamp
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 animate-spin text-amber-500" />
              Unlock active in {countdownString || '24:00:00'}
            </>
          )}
        </button>
      </div>

    </div>
  );
}
