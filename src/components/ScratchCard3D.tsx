import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Sparkles, RefreshCw, Lock, CheckCircle2, Play } from 'lucide-react';

interface ScratchCard3DProps {
  onRewardAwarded: (amount: number) => void;
}

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
  opacity: number;
}

export default function ScratchCard3D({ onRewardAwarded }: ScratchCard3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [scratchValue, setScratchValue] = useState(0);
  const [scratchDone, setScratchDone] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasScratchedStarted, setHasScratchedStarted] = useState(false);
  const [percentScratched, setPercentScratched] = useState(0);

  // Sparkle particle system for amazing physical swipe animations
  const [particles, setParticles] = useState<SparkleParticle[]>([]);
  const particleIdRef = useRef(0);

  // States for Daily Play count limit (max 3 plays per day)
  const [scratchCountToday, setScratchCountToday] = useState<number>(() => {
    const savedCount = localStorage.getItem('poki_scratch_count_today');
    const savedDate = localStorage.getItem('poki_scratch_date');
    const todayStr = new Date().toDateString();

    if (savedDate !== todayStr) {
      localStorage.setItem('poki_scratch_date', todayStr);
      localStorage.setItem('poki_scratch_count_today', '0');
      return 0;
    }
    return savedCount ? parseInt(savedCount) : 0;
  });

  // Track if ad watched for 2nd / 3rd attempts
  const [hasWatchedAdForNextScratch, setHasWatchedAdForNextScratch] = useState(false);

  // Simulated ad player states
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  // Sync state on lock changes
  useEffect(() => {
    const syncLimits = () => {
      const savedCount = localStorage.getItem('poki_scratch_count_today');
      if (savedCount) {
        setScratchCountToday(parseInt(savedCount));
      }
    };
    window.addEventListener('storage', syncLimits);
    const interval = setInterval(syncLimits, 1500); // Poll as fallback
    return () => {
      window.removeEventListener('storage', syncLimits);
      clearInterval(interval);
    };
  }, []);

  // Update sparkle particles animation
  useEffect(() => {
    if (particles.length === 0) return;

    const frame = requestAnimationFrame(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + Math.cos(p.angle) * p.speed,
            y: p.y + Math.sin(p.angle) * p.speed + 0.3, // slight gravity
            opacity: p.opacity - 0.04,
            size: p.size * 0.95
          }))
          .filter(p => p.opacity > 0)
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [particles]);

  const triggerAdForScratch = () => {
    if (isAdPlaying || isDrawing) return;
    setIsAdPlaying(true);
    setAdCountdown(5);

    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAdPlaying(false);
          setHasWatchedAdForNextScratch(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Generate scratch reward value
  const initRewardValue = () => {
    const val = parseFloat((1.20 + Math.random() * 4.80).toFixed(2));
    setScratchValue(val);
    setScratchDone(false);
    setHasScratchedStarted(false);
    setPercentScratched(0);
  };

  useEffect(() => {
    initRewardValue();
  }, [scratchCountToday]);

  // Paint coating layer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || scratchDone) return;

    // Only draw the canvas if we're free to play or completed watching ads
    const isFree = scratchCountToday === 0;
    if (!isFree && !hasWatchedAdForNextScratch) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear previous
    ctx.clearRect(0,0,w,h);

    // Fill matte black/brown background
    ctx.fillStyle = '#110d05';
    ctx.fillRect(0, 0, w, h);

    // Draw stylish Poki gold gradient
    const goldGrad = ctx.createLinearGradient(0, 0, w, h);
    goldGrad.addColorStop(0, '#eab308');
    goldGrad.addColorStop(0.3, '#fef08a');
    goldGrad.addColorStop(0.6, '#ca8a04');
    goldGrad.addColorStop(0.8, '#fef9c3');
    goldGrad.addColorStop(1, '#854d0e');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw tech lines to emphasize digital miners
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.12;
    for (let i = -50; i < w + h; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
      ctx.stroke();
    }

    // Inner stylish gold frame border
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#3f2b05';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, [10]);
    ctx.stroke();

    // Text descriptions
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#1e1b0c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = '900 12px "Inter", sans-serif';
    ctx.fillText('SCRATCH CODENAME POKI', w / 2, h / 2 - 10);
    
    ctx.font = '500 7.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4c3f0c';
    ctx.fillText('⚡ SWIPE TO COMPILE BLOCKS ⚡', w / 2, h / 2 + 10);

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }, [scratchValue, scratchCountToday, hasWatchedAdForNextScratch, scratchDone]);

  // Scratch action drawing vectors + sparks emitter
  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2, false); // 16px scratch brush
    ctx.fill();

    // Create AMAZING star sparks particles at cursor/touch bounds
    const newSparkles: SparkleParticle[] = [];
    const colors = ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff'];
    
    // Emit 4 particles per scratch sweep increment
    for (let i = 0; i < 4; i++) {
      particleIdRef.current++;
      newSparkles.push({
        id: particleIdRef.current,
        x: clientX - rect.left, // relative to the parent container bounds for CSS absolute layout
        y: clientY - rect.top,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
        angle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 3,
        opacity: 0.8 + Math.random() * 0.2
      });
    }
    setParticles(prev => [...prev, ...newSparkles].slice(-45)); // limit max active particles to 45 for perfect performance

    if (!hasScratchedStarted) {
      setHasScratchedStarted(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scratchDone) return;
    setIsDrawing(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || scratchDone) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    calculatePercentScratched();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scratchDone) return;
    setIsDrawing(true);
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing || scratchDone) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    calculatePercentScratched();
  };

  // Perform calculation of remaining scraped pixels
  const calculatePercentScratched = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    
    // Sample matrix layout
    const columns = 28;
    const rows = 18;
    const cellW = w / columns;
    const cellH = h / rows;
    let transparentCells = 0;

    for (let c = 0; c < columns; c++) {
      for (let r = 0; r < rows; r++) {
        const px = Math.floor(c * cellW + cellW / 2);
        const py = Math.floor(r * cellH + cellH / 2);
        const imgData = ctx.getImageData(px, py, 1, 1);
        if (imgData.data[3] < 50) { 
          transparentCells++;
        }
      }
    }

    const ratio = transparentCells / (columns * rows);
    setPercentScratched(Math.round(ratio * 100));

    // If more than 40% cleared, automatically trigger claim!
    if (ratio > 0.40) {
      completeScratchReveal();
    }
  };

  const completeScratchReveal = () => {
    if (scratchDone) return;
    setScratchDone(true);
    setPercentScratched(100);
    
    onRewardAwarded(scratchValue);
    
    const newCount = scratchCountToday + 1;
    setScratchCountToday(newCount);
    localStorage.setItem('poki_scratch_count_today', newCount.toString());
    localStorage.setItem('poki_scratch_date', new Date().toDateString());
    setHasWatchedAdForNextScratch(false); // reset lock
  };

  const remainingScratches = Math.max(0, 3 - scratchCountToday);

  return (
    <div className="w-full flex flex-col items-center p-1 text-center select-none" ref={containerRef}>
      
      <div className="text-center mb-1">
        <h3 className="text-sm font-[900] uppercase tracking-[0.2em] text-[#ffbf00] flex items-center justify-center gap-1.5">
          <Award className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          GOLD SCRATCH CARD
        </h3>
        <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
          Rub layout back & forth to reveal reward
        </p>
      </div>

      {/* Main scratch card dynamic panel wrapped with particle sparks overlay */}
      <div className="relative w-72 h-44 rounded-2xl p-[1.5px] bg-gradient-to-b from-amber-500/20 to-white/0 select-none overflow-hidden mt-4 border border-white/10 shadow-xl">
        
        {/* Background scratch reveal platform (Underneath prize display) */}
        <div className="w-full h-full rounded-2xl bg-[#090805] flex flex-col items-center justify-center relative p-4">
          <div className="absolute w-24 h-24 rounded-full bg-amber-500/[0.04] blur-xl"></div>
          
          <Award className="w-8 h-8 text-amber-500 animate-bounce mb-1 z-10" />
          <h4 className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/40 leading-none">SECURE CLAIM VALIDATION</h4>
          <span className="text-3xl font-[900] font-mono text-[#ffd700] mt-1 z-10">
            +{scratchValue.toFixed(2)} <span className="text-sm font-sans tracking-tight text-white/70">POKI</span>
          </span>
          <p className="text-[8px] font-medium text-white/30 uppercase tracking-widest mt-1 z-10">
            MINER CONSENSUS VERIFIED
          </p>
          
          {scratchDone && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-[#0d0903]/95 rounded-2xl z-20 flex flex-col items-center justify-center p-4 border border-amber-500/20"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <span className="text-xs font-bold text-amber-400 mt-1.5 uppercase tracking-wider">REWARD ALIGNED!</span>
              <p className="text-[10px] text-white/50 mt-1 max-w-[200px]">
                Added <strong className="text-white">+{scratchValue.toFixed(2)} POKI</strong> directly to your ledger pool.
              </p>
            </motion.div>
          )}
        </div>

        {/* Dynamic coating canvas */}
        {!scratchDone && (scratchCountToday === 0 || hasWatchedAdForNextScratch) && (
          <canvas
            ref={canvasRef}
            width={288}
            height={176}
            className="absolute inset-0 w-full h-full rounded-2xl cursor-pointer touch-none z-10 active:scale-[1.005] active:shadow-inner transition-transform bg-transparent"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {/* Cooldown Limit Lock Mask */}
        {scratchCountToday >= 3 && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-15">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
              <Lock className="w-4.5 h-4.5 text-red-500" />
            </div>
            <span className="text-[11px] font-bold text-white tracking-widest uppercase">DAILY CARDS DEPLETED</span>
            <span className="text-[8.5px] font-mono text-white/45 tracking-wider mt-1 leading-tight max-w-[200px]">
              Maximum 3 daily revelations claimed! Watch sponsored ads in check-in tab to instantly play more.
            </span>
          </div>
        )}

        {/* Ad wall overlay to unlock next scratch */}
        {scratchCountToday < 3 && scratchCountToday > 0 && !hasWatchedAdForNextScratch && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-15">
            <button
              onClick={triggerAdForScratch}
              disabled={isAdPlaying}
              className="w-12 h-12 rounded-full bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-400 flex items-center justify-center mb-3 animate-pulse cursor-pointer transition-colors"
            >
              <Play className="w-5 h-5 text-amber-500 fill-amber-500" />
            </button>
            <span className="text-[10.5px] font-bold text-amber-400 tracking-wider uppercase">SCRATCH LOCK ACTIVE</span>
            <span className="text-[8px] font-mono text-white/45 tracking-widest uppercase mt-1">
              Unlock Card #{scratchCountToday + 1} with Sponsor Ad
            </span>
          </div>
        )}

        {/* Live Sparkle rendering panel overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: `translate(-50%, -50%)`,
                boxShadow: `0 0 10px ${p.color}`,
                transition: 'opacity 0.05s ease'
              }}
            />
          ))}
        </div>

      </div>

      {/* Stats tracker & controls panel */}
      <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
        
        <div className="flex justify-between items-center px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-[9px] font-mono text-white/50">
          <span>CARDS SCRATCHED TODAY:</span>
          <span className="font-bold text-amber-400">{scratchCountToday} / 3 CARDS</span>
        </div>

        {scratchCountToday < 3 && !scratchDone && (scratchCountToday === 0 || hasWatchedAdForNextScratch) && (
          <div className="flex items-center justify-center gap-2 bg-amber-500/5 border border-amber-500/10 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></div>
            <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest">
              {hasScratchedStarted 
                ? `Reveal progress: ${percentScratched}% of 40% target`
                : 'Rub & wipe across top golden cover to scratch!'}
            </span>
          </div>
        )}

        {scratchCountToday > 0 && !hasWatchedAdForNextScratch && scratchCountToday < 3 && (
          <button
            onClick={triggerAdForScratch}
            disabled={isAdPlaying}
            className="w-full py-4 rounded-2xl bg-black/60 border border-amber-500/30 hover:border-amber-400 text-amber-400 font-bold uppercase tracking-widest text-[9.5px] cursor-pointer flex items-center justify-center gap-2 select-none active:scale-98 transition-all"
          >
            📺 Watch Ad to Unlock Scratch Card #{scratchCountToday + 1}
          </button>
        )}

        {scratchDone && scratchCountToday < 3 && (
          <button
            onClick={() => {
              initRewardValue();
              setScratchDone(false);
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-[9.5px] uppercase tracking-widest cursor-pointer hover:from-amber-400"
          >
            Unlock Next Reveal Scratch
          </button>
        )}

        <div className="text-[7.5px] font-mono text-center text-white/30 uppercase tracking-widest mt-1 leading-tight">
          {scratchCountToday === 0 ? "First card of the day is 100% Free! Subsequent attempts require sponsored ads." : "Ad sponsor cleared! Drag to scrape and claim gold rewards."}
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
