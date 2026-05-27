import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Zap } from 'lucide-react';

interface ConsensusTapProps {
  onRewardAwarded: (amount: number) => void;
  isDoubleRewardActive?: boolean;
}

export default function ConsensusTap({ onRewardAwarded, isDoubleRewardActive = false }: ConsensusTapProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [combo, setCombo] = useState(1);
  const [rewardWon, setRewardWon] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Visual rings and particle assets
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[]>([]);
  const tapRings = useRef<{ radius: number; targetRadius: number; speed: number; active: boolean }[]>([]);
  const coinAngle = useRef(0);
  const isScaleUp = useRef(false);
  const coinScale = useRef(1);

  const triggerStartGameWithAd = () => {
    startPlayLoop();
  };

  const startPlayLoop = () => {
    setScore(0);
    setEnergy(100);
    setCombo(1);
    setGameOver(false);
    setIsPlaying(true);
    setRewardWon(0);
    setIsSynced(false);
    particles.current = [];
    tapRings.current = [];
  };

  // Click handler
  const handleCoinTap = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || gameOver || energy <= 0) return;

    // Get event coordinates
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const distToCenter = Math.sqrt((clickX - centerX) ** 2 + (clickY - centerY) ** 2);

    // Spend energy point
    setEnergy(prev => Math.max(0, prev - 4));

    // Pop animation on coin
    coinScale.current = 1.15;

    // Emit beautiful golden shards
    for (let i = 0; i < 8; i++) {
      particles.current.push({
        x: clickX,
        y: clickY,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color: i % 2 === 0 ? '#fbbf24' : '#ffffff',
        size: Math.random() * 3 + 1.5,
        life: 20
      });
    }

    // Interactive ring check
    let timingExcel = false;
    for (let idx = 0; idx < tapRings.current.length; idx++) {
      const ring = tapRings.current[idx];
      if (ring.active) {
        const error = Math.abs(ring.radius - ring.targetRadius);
        if (error < 10) {
          timingExcel = true;
          ring.active = false;
          // Emit successful particles
          for (let k = 0; k < 12; k++) {
            particles.current.push({
              x: centerX,
              y: centerY,
              vx: Math.cos(k) * 4,
              vy: Math.sin(k) * 4,
              color: '#10b981',
              size: 4,
              life: 25
            });
          }
          break;
        }
      }
    }

    if (timingExcel) {
      setCombo(prev => prev + 1);
      setScore(prev => prev + Math.floor(15 * combo));
      setEnergy(prev => Math.min(100, prev + 12)); // replenish energy on perfect timing consensus
    } else {
      setScore(prev => prev + 5);
    }
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 240;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const coinBaseRadius = 40;

    let localFrame = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep cyber backdrop
      ctx.fillStyle = '#080603';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ring grid backdrop lines
      ctx.strokeStyle = 'rgba(234,179,8,0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
      ctx.stroke();

      localFrame++;

      // Slowly spawn consensus feedback rings
      if (localFrame % 80 === 0) {
        tapRings.current.push({
          radius: 110,
          targetRadius: coinBaseRadius * coinScale.current,
          speed: 1.1,
          active: true
        });
      }

      // Draw matching consensus target rings
      for (let idx = tapRings.current.length - 1; idx >= 0; idx--) {
        const ring = tapRings.current[idx];
        if (!ring.active) {
          tapRings.current.splice(idx, 1);
          continue;
        }

        ring.radius -= ring.speed;
        
        ctx.strokeStyle = Math.abs(ring.radius - coinBaseRadius) < 8 ? '#10b981' : '#f59e0b';
        ctx.lineWidth = Math.abs(ring.radius - coinBaseRadius) < 8 ? 2 : 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (ring.radius < coinBaseRadius - 15) {
          ring.active = false;
          setCombo(1); // Lose combo chain
        }
      }

      // Physics soft scale interpolation for coin pop effect
      coinScale.current += (1.0 - coinScale.current) * 0.12;

      // Rotate angle of coin face
      coinAngle.current += 0.015;

      // Draw central glow
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#eab308';
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(coinAngle.current);

      // Outer gold circle ring
      ctx.fillStyle = '#df8f00';
      ctx.beginPath();
      ctx.arc(0, 0, coinBaseRadius * coinScale.current, 0, Math.PI * 2);
      ctx.fill();

      // Inner koin relief
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, (coinBaseRadius - 4) * coinScale.current, 0, Math.PI * 2);
      ctx.fill();

      // Symbol P in the dead center
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${22 * coinScale.current}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 0, 0);

      ctx.restore();

      // Draw particle debris
      for (let k = particles.current.length - 1; k >= 0; k--) {
        const p = particles.current[k];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        if (p.life <= 0) particles.current.splice(k, 1);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver]);

  // Monitor energy drain game end state
  useEffect(() => {
    if (energy <= 0 && isPlaying) {
      handleGameOver();
    }
  }, [energy, isPlaying]);

  const handleGameOver = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    // Score conversion: 100 points = 1.5 POKI. If 2X double reward multiplier is active, double it
    const valRatio = isDoubleRewardActive ? 0.03 : 0.015;
    const finalEarned = parseFloat((score * valRatio).toFixed(2));
    setRewardWon(finalEarned);
    setIsSynced(false);
  };

  const claimCoinsToWallet = () => {
    if (rewardWon <= 0 || isSynced) return;
    onRewardAwarded(rewardWon);
    setIsSynced(true);
    alert(`⚡ Gained +${rewardWon.toFixed(2)} POKI. Mainnet peer validation succeeded!`);
  };

  return (
    <div className="w-full bg-black/30 border border-white/[0.04] rounded-2xl overflow-hidden relative flex flex-col items-center p-4">

      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#f59e0b]">Consensus Tap Engine</h5>
        </div>
        {isDoubleRewardActive && (
          <span className="text-[8px] bg-red-500/20 text-red-400 font-extrabold border border-red-500/30 px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5 animate-pulse">
            ⚡ 2X Payout Node
          </span>
        )}
      </div>

      <div className="w-full h-[240px] bg-black/80 rounded-xl relative overflow-hidden flex items-center justify-center border border-white/5">
        {!isPlaying && !gameOver ? (
          <div className="flex flex-col items-center gap-3 text-center p-4">
            <span className="text-[7.5px] uppercase font-bold tracking-[0.25em] text-white/40 leading-none">HIGH-SPEED MINING STATIONS</span>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">⚡ MULTI-CLICK VERIFIER</h4>
            <p className="text-[9.5px] text-white/50 leading-relaxed max-w-[240px]">
              Tap the spinning coin. For massive bonuses, tap EXACTLY when neon validation rings collapse onto the coin core! Combos recharge energy.
            </p>
            <button
              type="button"
              onClick={triggerStartGameWithAd}
              className="mt-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-[9px] uppercase tracking-widest py-2.5 px-6 rounded-xl shadow-lg cursor-pointer hover:brightness-110 active:scale-95 transition-all select-none"
            >
              SPAWN CLICK CORE
            </button>
          </div>
        ) : gameOver ? (
          <div className="flex flex-col items-center gap-3 text-center p-4 w-full">
            <h4 className="text-red-500 font-black text-xs uppercase tracking-widest">🪫 CPU Nodes Drained</h4>
            
            <div className="bg-[#100d07] border border-amber-500/10 p-3.5 rounded-xl flex flex-col gap-1 w-full max-w-[200px]">
              <span className="text-[8px] text-white/30 uppercase tracking-widest">Consensus Score</span>
              <p className="text-xl font-mono text-white font-black leading-none">{score}</p>
              
              <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-0.5">
                <span className="text-[8px] text-amber-400/50 uppercase tracking-widest">Revenue Claimable</span>
                <p className="text-sm font-mono font-bold text-amber-400">+{rewardWon.toFixed(2)} POKI</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={claimCoinsToWallet}
                  disabled={rewardWon <= 0 || isSynced}
                  className="flex-1 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-extrabold py-2 px-1.5 rounded-lg text-[8.5px] uppercase tracking-wider cursor-pointer disabled:opacity-40"
                >
                  {isSynced ? 'Success ✔' : 'Sync Balance'}
                </button>
                
                <button
                  type="button"
                  onClick={triggerStartGameWithAd}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold p-2 rounded-lg text-[8.5px] uppercase cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <canvas
              ref={canvasRef}
              onMouseDown={handleCoinTap}
              onTouchStart={handleCoinTap}
              className="w-full h-full cursor-pointer touch-none"
            />
            {/* Real-time stats HUD inside tap core */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between px-1 text-[9px] font-mono pointer-events-none text-white select-none">
              <span>SCORE: <strong className="text-amber-400">{score}</strong></span>
              <span className="text-emerald-400">COMBO: {combo}X</span>
            </div>

            {/* Custom high-fidelity energy CPU meter */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-col gap-1 pointer-events-none select-none">
              <div className="flex justify-between items-center text-[8px] font-mono text-white/50">
                <span className="flex items-center gap-0.5">CPU CORE ENERGY</span>
                <span>{energy}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${energy}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
