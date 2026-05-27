import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Navigation } from 'lucide-react';

interface PokiBirdProps {
  onRewardAwarded: (amount: number) => void;
  isDoubleRewardActive?: boolean;
}

interface Obstacle {
  x: number;
  topHeight: number;
  bottomHeight: number;
  width: number;
  passed: boolean;
}

export default function PokiBird({ onRewardAwarded, isDoubleRewardActive = false }: PokiBirdProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [rewardWon, setRewardWon] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Physics params
  const coinY = useRef(100);
  const coinVelocity = useRef(0);
  const gravity = 0.28;
  const jumpForce = -5.4;
  const obstacles = useRef<Obstacle[]>([]);
  const frameCounter = useRef(0);

  // Sound/Vibes particle emitters
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number }[]>([]);

  const triggerStartGameWithAd = () => {
    startPlayLoop();
  };

  const startPlayLoop = () => {
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setRewardWon(0);
    setIsSynced(false);
    coinY.current = 100;
    coinVelocity.current = 0;
    obstacles.current = [];
    frameCounter.current = 0;
    particles.current = [];
  };

  const handleJump = () => {
    if (!isPlaying || gameOver) return;
    coinVelocity.current = jumpForce;
    
    // Emit tap particles
    for (let i = 0; i < 4; i++) {
      particles.current.push({
        x: 60,
        y: coinY.current,
        vx: -1.5 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 3,
        color: '#facc15',
        life: 25
      });
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  // Main Canvas Loop
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 240;

    const obstacleWidth = 44;
    const gapHeight = 75;

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Starry sky background
      ctx.fillStyle = '#090703';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid guidelines background
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // Update physics for the coin player
      coinVelocity.current += gravity;
      coinVelocity.current = Math.min(6, coinVelocity.current); // terminal velocity
      coinY.current += coinVelocity.current;

      // Handle floor & ceiling boundaries
      if (coinY.current < 6) {
        coinY.current = 6;
        coinVelocity.current = 0;
      }
      if (coinY.current > canvas.height - 6) {
        handleGameOver();
        return;
      }

      // Draw the beautiful golden Coin bird
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#eab308';
      ctx.beginPath();
      ctx.arc(60, coinY.current, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308';
      ctx.fill();

      // Wing animation indicators
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(60 - 2, coinY.current + (coinVelocity.current > 0 ? 1 : -2), 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Spawn pipes (Validator nodes)
      frameCounter.current++;
      if (frameCounter.current % 75 === 0) {
        const minH = 20;
        const maxH = canvas.height - gapHeight - 20;
        const topHeight = Math.floor(Math.random() * (maxH - minH)) + minH;
        const bottomHeight = canvas.height - topHeight - gapHeight;

        obstacles.current.push({
          x: canvas.width,
          topHeight,
          bottomHeight,
          width: obstacleWidth,
          passed: false
        });
      }

      // Draw & move obstacles
      for (let i = obstacles.current.length - 1; i >= 0; i--) {
        const obs = obstacles.current[i];
        obs.x -= 1.8; // speed of blocks scrolling

        // Top pipe node
        const topGrad = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
        topGrad.addColorStop(0, '#f59e0b');
        topGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = topGrad;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        // Pipe rectangle
        ctx.rect(obs.x, 0, obs.width, obs.topHeight);
        ctx.fill();
        ctx.stroke();

        // Pipe Lip at the bottom
        ctx.fillStyle = '#eab308';
        ctx.fillRect(obs.x - 2, obs.topHeight - 8, obs.width + 4, 8);
        ctx.strokeRect(obs.x - 2, obs.topHeight - 8, obs.width + 4, 8);

        // Bottom pipe node
        const botGrad = ctx.createLinearGradient(obs.x, canvas.height - obs.bottomHeight, obs.x + obs.width, canvas.height);
        botGrad.addColorStop(0, '#f59e0b');
        botGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = botGrad;
        
        ctx.beginPath();
        ctx.rect(obs.x, canvas.height - obs.bottomHeight, obs.width, obs.bottomHeight);
        ctx.fill();
        ctx.stroke();

        // Pipe Lip at top
        ctx.fillStyle = '#eab308';
        ctx.fillRect(obs.x - 2, canvas.height - obs.bottomHeight, obs.width + 4, 8);
        ctx.strokeRect(obs.x - 2, canvas.height - obs.bottomHeight, obs.width + 4, 8);

        // Score update
        if (!obs.passed && obs.x + obs.width < 60) {
          obs.passed = true;
          setScore(prev => prev + 1);
        }

        // Collision Check player radius (7.5px) vs top / bottom boundaries
        const playerX = 60;
        const playerY = coinY.current;
        const pr = 7.5;

        const hitTop = (playerX + pr > obs.x && playerX - pr < obs.x + obs.width && playerY - pr < obs.topHeight);
        const hitBottom = (playerX + pr > obs.x && playerX - pr < obs.x + obs.width && playerY + pr > canvas.height - obs.bottomHeight);

        if (hitTop || hitBottom) {
          handleGameOver();
          return;
        }

        // Clean out screen left obstacles
        if (obs.x < -obs.width) {
          obstacles.current.splice(i, 1);
        }
      }

      // Draw particle trails
      for (let k = particles.current.length - 1; k >= 0; k--) {
        const p = particles.current[k];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 25;
        ctx.fillRect(p.x, p.y, p.life > 12 ? 3 : 1.5, p.life > 12 ? 3 : 1.5);
        ctx.globalAlpha = 1.0;
        if (p.life <= 0) particles.current.splice(k, 1);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver]);

  const handleGameOver = () => {
    setGameOver(true);
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    // Score to Poki: 1 barrier pass = 1.25 POKI!
    // If double reward category active, default reward matches double rate or 2X scaling is enabled
    const scaling = isDoubleRewardActive ? 2.50 : 1.25;
    const initialReward = parseFloat((score * scaling).toFixed(2));
    setRewardWon(initialReward);
    setIsSynced(false);
  };

  const syncClaimCoins = () => {
    if (rewardWon <= 0 || isSynced) return;
    onRewardAwarded(rewardWon);
    setIsSynced(true);
    alert(`🎉 Success! +${rewardWon.toFixed(2)} POKI earned. Your central consensus block has updated.`);
  };

  return (
    <div className="w-full bg-black/30 border border-white/[0.04] rounded-2xl overflow-hidden relative flex flex-col items-center p-4">

      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-amber-500 animate-pulse rotate-90" />
          <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#f59e0b]">Validator Poki-Bird</h5>
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
            <span className="text-[7.5px] uppercase font-bold tracking-[0.25em] text-white/40 leading-none">PREMIUM CONSENSUS ARCADE</span>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">⚡ COIN FLIGHT</h4>
            <p className="text-[9.5px] text-white/50 leading-relaxed max-w-[240px]">
              Tap or press spacebar to steer. Escape neon pipe firewalls. Barrier gaps payout {isDoubleRewardActive ? "2.5" : "1.25"} POKI.
            </p>
            <button
              type="button"
              onClick={triggerStartGameWithAd}
              className="mt-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-[9px] uppercase tracking-widest py-2.5 px-6 rounded-xl shadow-lg shadow-amber-500/15 cursor-pointer hover:brightness-110 active:scale-95 transition-all select-none"
            >
              LAUNCH SEED NODE
            </button>
          </div>
        ) : gameOver ? (
          <div className="flex flex-col items-center gap-3 text-center p-4 w-full">
            <h4 className="text-red-500 font-black text-xs uppercase tracking-widest">🚨 Connection Terminated</h4>
            
            <div className="bg-[#100d07] border border-amber-500/10 p-3.5 rounded-xl flex flex-col gap-1 w-full max-w-[200px]">
              <span className="text-[8px] text-white/30 uppercase tracking-widest">Blocks Cleared</span>
              <p className="text-xl font-mono text-white font-black leading-none">{score}</p>
              
              <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-0.5">
                <span className="text-[8px] text-amber-400/50 uppercase tracking-widest">Yield Gained</span>
                <p className="text-sm font-mono font-bold text-amber-400">+{rewardWon.toFixed(2)} POKI</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={syncClaimCoins}
                  disabled={rewardWon <= 0 || isSynced}
                  className="flex-1 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-extrabold py-2 px-1.5 rounded-lg text-[8.5px] uppercase tracking-wider cursor-pointer disabled:opacity-40"
                >
                  {isSynced ? 'Synced ✔' : 'Claim to Wallet'}
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
          <div className="w-full h-full relative" onClick={handleJump}>
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-pointer touch-none"
            />
            {/* Inline real-time Score and Controls layout overlay */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between px-1 text-[10px] font-mono pointer-events-none text-white select-none">
              <span>SCORE: <strong className="text-amber-400">{score}</strong></span>
              <span>YIELD: <strong className="text-emerald-400">+{rewardWon.toFixed(1)} POKI</strong></span>
            </div>
            
            <div className="absolute bottom-2.5 left-0 right-0 text-center text-[7px] text-white/30 uppercase tracking-widest pointer-events-none select-none">
              👆 Tap / spacebar to jump
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
