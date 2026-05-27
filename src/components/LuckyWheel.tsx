import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, X, RefreshCw, Play, Lock, HelpCircle } from 'lucide-react';

interface LuckyWheelProps {
  onRewardAwarded: (amount: number) => void;
}

const SPIN_AWARDS = [
  { value: 1.5, label: '+1.5 POKI', color: '#131008', textColor: '#facc15' },
  { value: 2.5, label: '+2.5 POKI', color: '#ca8a04', textColor: '#000000' },
  { value: 5.0, label: '+5.0 POKI', color: '#251f0f', textColor: '#eab308' },
  { value: 10.0, label: '+10 POKI', color: '#f59e0b', textColor: '#000000' },
  { value: 1.5, label: '+1.5 POKI', color: '#1e180b', textColor: '#fef08a' }, // customized values for perfect balance distribution
  { value: 50.0, label: 'JACKPOT 50', color: '#fef08a', textColor: '#000000' }
];

export default function LuckyWheel({ onRewardAwarded }: LuckyWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinResultMsg, setSpinResultMsg] = useState<string | null>(null);

  // States for Daily Play count limit (max 3 plays per day)
  const [spinCountToday, setSpinCountToday] = useState<number>(() => {
    const savedCount = localStorage.getItem('poki_spin_count_today');
    const savedDate = localStorage.getItem('poki_spin_date');
    const todayStr = new Date().toDateString();

    if (savedDate !== todayStr) {
      localStorage.setItem('poki_spin_date', todayStr);
      localStorage.setItem('poki_spin_count_today', '0');
      return 0;
    }
    return savedCount ? parseInt(savedCount) : 0;
  });

  // Track if user has verified the ad for terms 2 & 3
  const [hasWatchedAdForNextSpin, setHasWatchedAdForNextSpin] = useState(false);

  // Simulated ad player states
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  // Sync state on lock changes (for when they reset counts from DailySignIn popups)
  useEffect(() => {
    const syncLimits = () => {
      const savedCount = localStorage.getItem('poki_spin_count_today');
      if (savedCount) {
        setSpinCountToday(parseInt(savedCount));
      }
    };
    window.addEventListener('storage', syncLimits);
    const interval = setInterval(syncLimits, 1500); // Poll as fallback
    return () => {
      window.removeEventListener('storage', syncLimits);
      clearInterval(interval);
    };
  }, []);

  const triggerAdForSpin = () => {
    if (isAdPlaying || isSpinning) return;
    setIsAdPlaying(true);
    setAdCountdown(5);

    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAdPlaying(false);
          setHasWatchedAdForNextSpin(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerLuckySpinner = () => {
    if (isSpinning || isAdPlaying) return;
    
    // Safety boundaries check
    const isFreeTurn = spinCountToday === 0;
    if (!isFreeTurn && !hasWatchedAdForNextSpin) {
      triggerAdForSpin();
      return;
    }

    if (spinCountToday >= 3) {
      alert("Daily spins limit reached (3/3). Watch sponsor ads in check-in lobby to unlock unlimited extra spins!");
      return;
    }

    setIsSpinning(true);
    setSpinResultMsg(null);

    // Randomize winning slice
    const targetSeg = Math.floor(Math.random() * SPIN_AWARDS.length);
    const award = SPIN_AWARDS[targetSeg];

    const segmentAngle = 360 / SPIN_AWARDS.length;
    // Set a random offset inside the segment (perfect mechanical angle)
    const randomOffset = (Math.random() * 0.5 - 0.25) * segmentAngle;
    const stopAngle = 360 - (targetSeg * segmentAngle) - (segmentAngle / 2) + randomOffset;
    const spins = 360 * 9; // 9 dynamic high speed sweeps for breathtaking build-up
    const totalRotation = spins + stopAngle;

    setSpinAngle(prev => {
      const currentMod = prev % 360;
      return prev - currentMod + totalRotation;
    });

    // Match 6 seconds ultra smooth physics decay
    setTimeout(() => {
      setIsSpinning(false);
      onRewardAwarded(award.value);
      
      const newCount = spinCountToday + 1;
      setSpinCountToday(newCount);
      localStorage.setItem('poki_spin_count_today', newCount.toString());
      localStorage.setItem('poki_spin_date', new Date().toDateString());
      setHasWatchedAdForNextSpin(false); // Reset ad lock for next spin
      
      setSpinResultMsg(`🎉 Congratulations! You received +${award.value.toFixed(1)} POKI into your balance!`);
    }, 6200);
  };

  const remainingSpins = Math.max(0, 3 - spinCountToday);

  return (
    <div className="w-full flex flex-col items-center p-1 relative select-none">
      
      <div className="text-center mb-1">
        <h3 className="text-sm font-[900] uppercase tracking-[0.2em] text-[#ffbf00] flex items-center justify-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
          LUCKY SPIN WHEEL
        </h3>
        <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
          Test consensus rates dynamically
        </p>
      </div>

      {/* Flat Colorful Custom Wheel */}
      <div className="relative flex flex-col items-center my-6">
        
        {/* Glow behind */}
        <div className="absolute inset-x-0 top-0 bottom-0 m-auto w-56 h-56 rounded-full bg-amber-500/[0.05] blur-3xl"></div>

        {/* Outer Wheel Rim */}
        <div className="relative w-64 h-64 rounded-full p-2 bg-gradient-to-b from-amber-500/20 via-[#181308] to-black border border-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.12)] flex items-center justify-center">
          
          {/* Neon pointer arrow with physical twitch feedback on rotating pegs! */}
          <motion.div 
            animate={isSpinning ? { rotate: [0, -15, 8, -12, 6, -10, 4, -8, 2, 0], y: [0, 1.5, 0] } : {}}
            transition={isSpinning ? { repeat: 19, duration: 0.32, ease: "easeInOut" } : {}}
            className="absolute top-[-3px] z-30 flex flex-col items-center origin-top"
          >
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-[#ffbf00] drop-shadow-[0_2px_10px_rgba(250,204,21,0.6)]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-300 mt-[-7px] border border-black shadow"></div>
          </motion.div>

          <div className="w-full h-full rounded-full overflow-hidden bg-black relative flex items-center justify-center border border-white/5 shadow-inner">
            
            <motion.div
              animate={{ rotate: spinAngle }}
              transition={isSpinning ? { duration: 6, ease: [0.08, 0.85, 0.15, 1.0] } : { duration: 0 }}
              className="w-full h-full rounded-full relative"
            >
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* SVG Filter for high-end subtle bevel gold highlights */}
                <defs>
                  <radialGradient id="goldGleam" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                    <stop offset="80%" stopColor="#000000" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0a0803" stopOpacity="0.4" />
                  </radialGradient>
                </defs>

                {SPIN_AWARDS.map((award, idx) => {
                  const numSlices = SPIN_AWARDS.length;
                  const deg = 360 / numSlices;
                  const r1 = (idx * deg * Math.PI) / 180;
                  const r2 = (((idx + 1) * deg) * Math.PI) / 180;
                  const x1 = 50 + 50 * Math.cos(r1);
                  const y1 = 50 + 50 * Math.sin(r1);
                  const x2 = 50 + 50 * Math.cos(r2);
                  const y2 = 50 + 50 * Math.sin(r2);

                  return (
                    <g key={idx}>
                      {/* Premium textured/color matched segment */}
                      <path 
                        d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`} 
                        fill={award.color}
                        className="transition-all opacity-95 hover:opacity-100"
                        stroke="#251f12"
                        strokeWidth="0.5"
                      />

                      {/* Overlapping gold gleam radial gradient map for real metallic finish */}
                      <path 
                        d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`} 
                        fill="url(#goldGleam)"
                        className="pointer-events-none"
                      />
                      
                      {/* Divider separator luxury gold wire line */}
                      <line 
                        x1="50" y1="50" x2={x1} y2={y1} 
                        stroke="#f59e0b" 
                        strokeWidth="0.45" 
                        strokeOpacity="0.25" 
                      />

                      {/* Text value rotated along segment */}
                      <text
                        x="73"
                        y="51.5"
                        fill={award.textColor}
                        fontSize="3.8"
                        fontWeight="900"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        transform={`rotate(${(idx * deg) + (deg / 2)}, 50, 50)`}
                        className="tracking-wide uppercase select-none font-sans"
                        style={{ textShadow: award.textColor === '#000000' ? 'none' : '0px 1px 3px rgba(0,0,0,0.85)' }}
                      >
                        {award.label}
                      </text>
                    </g>
                  );
                })}

                {/* Highly polished 3D metal central core shield cap */}
                <circle cx="50" cy="50" r="14.5" fill="#131008" stroke="#ca8a04" strokeWidth="1.2" />
                <circle cx="50" cy="50" r="11" fill="url(#goldGleam)" />
                <circle cx="50" cy="50" r="8" fill="#f59e0b" />
              </svg>

              {/* Central branding tag */}
              <div className="absolute inset-0 m-auto w-10 h-10 rounded-full flex items-center justify-center">
                <span className="font-sans font-[900] text-[8px] tracking-widest text-[#0c0a06]">POKI</span>
              </div>

            </motion.div>
          </div>
        </div>

        {/* Results Banner */}
        <AnimatePresence>
          {spinResultMsg && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mt-5 p-3 bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold text-[10px] uppercase font-mono tracking-wide rounded-2xl max-w-[280px] shadow-lg text-center"
            >
              {spinResultMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Buttons and Limits Panel */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        
        {/* Play Tracker Stat */}
        <div className="flex justify-between items-center px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-[9px] font-mono text-white/50">
          <span>SPINS PLAYED TODAY:</span>
          <span className="font-bold text-amber-400">{spinCountToday} / 3 TURNS</span>
        </div>

        {/* Main CTA Trigger button mapping limits */}
        {spinCountToday >= 3 ? (
          <div className="bg-red-500/15 border border-red-500/20 text-red-400 p-3 rounded-2xl text-[9px] text-center font-mono uppercase tracking-widest leading-relaxed">
            🚫 3/3 daily spins completed!
            <p className="text-[7.5px] text-white/45 mt-0.5 normal-case font-sans">
              Watch promotional ads in Daily Check-in tab to instantly unlock unlimited spins!
            </p>
          </div>
        ) : (spinCountToday > 0 && !hasWatchedAdForNextSpin) ? (
          // Watch Ad first button
          <button
            onClick={triggerAdForSpin}
            disabled={isAdPlaying}
            className="w-full py-4 rounded-2xl bg-[#0e0c03] border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-amber-300 hover:bg-amber-500/5 font-extrabold uppercase text-[10px] tracking-widest select-none transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
          >
            <Play className="w-4 h-4 text-amber-400" />
            📺 Watch Ad to Unlock Spin #{spinCountToday + 1}
          </button>
        ) : (
          // Ready to Spin button (FREE or ad verified)
          <button
            onClick={triggerLuckySpinner}
            disabled={isSpinning}
            className={`w-full py-4 rounded-2xl text-[10px] uppercase tracking-widest font-black select-none transition-all flex items-center justify-center gap-2.5 border ${
              isSpinning
                ? 'bg-amber-500/15 text-white/30 border-amber-500/5 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black border-amber-400/20 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.01] active:scale-[0.98]'
            }`}
          >
            {isSpinning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Rotating Wheel...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 animate-pulse text-black" />
                {spinCountToday === 0 ? "FREE DAILY SPIN" : `SPIN WHEEL #${spinCountToday + 1}`}
              </>
            )}
          </button>
        )}

        <div className="text-[7.5px] font-mono text-center text-white/30 uppercase tracking-widest mt-1">
          {spinCountToday === 0 ? "First spin daily is 100% Free. Next attempts require viewing partner ads." : "Ad verified! Trigger spin now."}
        </div>
      </div>

      {/* Ad Play Overlay */}
      <AnimatePresence>
        {isAdPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="max-w-xs flex flex-col items-center">
              <span className="text-[8px] font-mono tracking-[0.3em] text-[#ffbf00] bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-4">
                SPONSOR CHANNEL VALIDATOR
              </span>
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-xl font-bold font-mono text-amber-400 animate-pulse mb-4">
                {adCountdown}s
              </div>
              <h4 className="text-sm font-semibold tracking-wide text-white uppercase">Securing Sponsor Packet...</h4>
              <p className="text-[10px] text-white/50 max-w-[240px] mt-2 leading-relaxed">
                Consensus validator nodes verification in progress. Do not lock device or close this layout.
              </p>
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-amber-500" 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
