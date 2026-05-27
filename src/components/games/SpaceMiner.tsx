import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Shield, Cpu } from 'lucide-react';

interface SpaceMinerProps {
  onRewardAwarded: (amount: number) => void;
  isDoubleRewardActive?: boolean;
}

interface MiningLaser {
  x: number;
  y: number;
  speed: number;
}

interface OreAsteroid {
  x: number;
  y: number;
  speed: number;
  size: number;
  hp: number;
  scoreVal: number;
}

export default function SpaceMiner({ onRewardAwarded, isDoubleRewardActive = false }: SpaceMinerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [rewardWon, setRewardWon] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Ship movement and projectile states
  const shipX = useRef(150);
  const lasers = useRef<MiningLaser[]>([]);
  const asteroids = useRef<OreAsteroid[]>([]);
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number }[]>([]);
  const frameCounter = useRef(0);

  const triggerStartGameWithAd = () => {
    startPlayLoop();
  };

  const startPlayLoop = () => {
    setScore(0);
    setShields(3);
    setGameOver(false);
    setIsPlaying(true);
    setRewardWon(0);
    setIsSynced(false);
    shipX.current = 150;
    lasers.current = [];
    asteroids.current = [];
    particles.current = [];
    frameCounter.current = 0;
  };

  // Drag controls for touch and mouse
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const relativeX = touch.clientX - rect.left;
    shipX.current = Math.max(15, Math.min(canvas.width - 15, relativeX));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    shipX.current = Math.max(15, Math.min(canvas.width - 15, relativeX));
  };

  // Keyboard support arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = canvasRef.current;
      const widthMax = canvas ? canvas.width : 300;
      if (e.key === 'ArrowLeft' || e.key === 'KeyA') {
        shipX.current = Math.max(15, shipX.current - 16);
      } else if (e.key === 'ArrowRight' || e.key === 'KeyD') {
        shipX.current = Math.min(widthMax - 15, shipX.current + 16);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Canvas Render Loop
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

    let localShields = 3;

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep Space background
      ctx.fillStyle = '#06050a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      frameCounter.current++;

      // Shoot automated lasers upwards
      if (frameCounter.current % 11 === 0) {
        lasers.current.push({
          x: shipX.current,
          y: canvas.height - 25,
          speed: 4.5
        });
      }

      // Spawn falling raw asteroids
      if (frameCounter.current % 45 === 0) {
        const size = Math.random() * 15 + 10;
        asteroids.current.push({
          x: Math.random() * (canvas.width - size * 2) + size,
          y: -20,
          speed: Math.random() * 1.5 + 1.2 + (frameCounter.current * 0.0001), 
          size,
          hp: Math.ceil(size / 7),
          scoreVal: Math.ceil(size * 10)
        });
      }

      // Draw and update laser beams
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#10b981';
      ctx.fillStyle = '#34d399';
      for (let idx = lasers.current.length - 1; idx >= 0; idx--) {
        const laser = lasers.current[idx];
        laser.y -= laser.speed;
        
        ctx.fillRect(laser.x - 1.5, laser.y, 3, 8);

        // Delete offscreen lasers
        if (laser.y < 0) {
          lasers.current.splice(idx, 1);
        }
      }
      ctx.shadowBlur = 0;

      // Draw and update falling asteroids
      for (let aIdx = asteroids.current.length - 1; aIdx >= 0; aIdx--) {
        const ast = asteroids.current[aIdx];
        ast.y += ast.speed;

        // Draw Asteroid polygon
        ctx.strokeStyle = '#64748b';
        ctx.fillStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw cracked lines on damanaged asteroid
        if (ast.hp === 1) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.moveTo(ast.x - ast.size / 2, ast.y);
          ctx.lineTo(ast.x + ast.size / 2, ast.y);
          ctx.stroke();
        }

        // Collision Check Laser beams vs Asteroid circular bounds
        for (let lIdx = lasers.current.length - 1; lIdx >= 0; lIdx--) {
          const l = lasers.current[lIdx];
          const distLaser = Math.sqrt((l.x - ast.x) ** 2 + (l.y - ast.y) ** 2);
          if (distLaser < ast.size + 4) {
            ast.hp--;
            lasers.current.splice(lIdx, 1);

            // Shard impact particles
            for (let p = 0; p < 3; p++) {
              particles.current.push({
                x: l.x,
                y: l.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: '#64748b',
                life: 15
              });
            }

            break;
          }
        }

        // Asteroid fully decimated
        if (ast.hp <= 0) {
          setScore(prev => prev + ast.scoreVal);
          
          // Emit golden "Poki energy" dust floating down
          for (let p = 0; p < 8; p++) {
            particles.current.push({
              x: ast.x,
              y: ast.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: '#fbbf24',
              life: 25
            });
          }

          asteroids.current.splice(aIdx, 1);
          continue;
        }

        // Collision Check Asteroid vs spaceship (Y bounds canvas.height - 20)
        const shipY = canvas.height - 20;
        const distShip = Math.sqrt((shipX.current - ast.x) ** 2 + (shipY - ast.y) ** 2);
        if (distShip < ast.size + 12) {
          localShields = Math.max(0, localShields - 1);
          setShields(localShields);
          
          // Emit heavy impact fire spark particles
          for (let p = 0; p < 15; p++) {
            particles.current.push({
              x: ast.x,
              y: ast.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#ef4444',
              life: 30
            });
          }

          asteroids.current.splice(aIdx, 1);

          if (localShields <= 0) {
            handleGameOver();
            return;
          }
        }

        // Boundary offscreen asteroid cleanup
        if (ast.y > canvas.height + ast.size * 2) {
          asteroids.current.splice(aIdx, 1);
        }
      }

      // Draw the triangular spaceschip player
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#3b82f6';
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(shipX.current, canvas.height - 25); // ship tip
      ctx.lineTo(shipX.current - 12, canvas.height - 10); // bottom left
      ctx.lineTo(shipX.current + 12, canvas.height - 10); // bottom right
      ctx.closePath();
      ctx.fill();

      // Reactor gold flame engine
      ctx.fillStyle = frameCounter.current % 2 === 0 ? '#f97316' : '#eab308';
      ctx.beginPath();
      ctx.moveTo(shipX.current - 4, canvas.height - 9);
      ctx.lineTo(shipX.current + 4, canvas.height - 9);
      ctx.lineTo(shipX.current, canvas.height - 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw active particles
      for (let k = particles.current.length - 1; k >= 0; k--) {
        const p = particles.current[k];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 25;
        ctx.fillRect(p.x, p.y, p.life > 15 ? 2.5 : 1.2, p.life > 15 ? 2.5 : 1.2);
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
    setIsPlaying(false);
    setGameOver(true);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    // Score conversion: 100 points = 0.50 POKI. If 2X double reward multiplier is active, double to 1.00 POKI
    const ratio = isDoubleRewardActive ? 0.01 : 0.005;
    const finalEarned = parseFloat((score * ratio).toFixed(2));
    setRewardWon(finalEarned);
    setIsSynced(false);
  };

  const syncCoins = () => {
    if (rewardWon <= 0 || isSynced) return;
    onRewardAwarded(rewardWon);
    setIsSynced(true);
    alert(`🎉 Success! Mined raw crystal ores. Synced +${rewardWon.toFixed(2)} POKI with terminal node.`);
  };

  return (
    <div className="w-full bg-[#0a0802]/30 border border-white/[0.04] rounded-2xl overflow-hidden relative flex flex-col items-center p-4">

      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
          <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#f59e0b]">Space Asteroid Miner</h5>
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
            <span className="text-[7.5px] uppercase font-bold tracking-[0.25em] text-white/40 leading-none">CYBER STELLAR EXPEDITION</span>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">🚀 CRYSTAL HARVESTER</h4>
            <p className="text-[9.5px] text-white/50 leading-relaxed max-w-[240px]">
              Drag ship left/right with mouse, touch, or use arrow keys. Shoot oncoming raw mining ores. Do NOT collide with the asteroids!
            </p>
            <button
              type="button"
              onClick={triggerStartGameWithAd}
              className="mt-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-[9px] uppercase tracking-widest py-2.5 px-6 rounded-xl shadow-lg cursor-pointer hover:brightness-110 active:scale-95 transition-all select-none"
            >
              LAUNCH PILOT CORE
            </button>
          </div>
        ) : gameOver ? (
          <div className="flex flex-col items-center gap-3 text-center p-4 w-full">
            <h4 className="text-red-500 font-black text-xs uppercase tracking-widest">🚨 Hull Integrity Failure</h4>
            
            <div className="bg-[#100d07] border border-amber-500/10 p-3.5 rounded-xl flex flex-col gap-1 w-full max-w-[200px]">
              <span className="text-[8px] text-white/30 uppercase tracking-widest">Ores Decimated</span>
              <p className="text-xl font-mono text-white font-black leading-none">{score}</p>
              
              <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-0.5">
                <span className="text-[8px] text-amber-400/50 uppercase tracking-widest">Poki Cargo Collected</span>
                <p className="text-sm font-mono font-bold text-amber-400">+{rewardWon.toFixed(2)} POKI</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={syncCoins}
                  disabled={rewardWon <= 0 || isSynced}
                  className="flex-1 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-extrabold py-2 px-1.5 rounded-lg text-[8.5px] uppercase tracking-wider cursor-pointer disabled:opacity-40"
                >
                  {isSynced ? 'Success ✔' : 'Claim Cargo'}
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
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              className="w-full h-full cursor-none touch-none"
            />
            {/* HUD */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between px-1 text-[9px] font-mono pointer-events-none text-white select-none">
              <span>SCORE: <strong className="text-amber-400">{score}</strong></span>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Shield 
                    key={i}
                    className={`w-3.5 h-3.5 ${i < shields ? 'text-cyan-400 fill-cyan-400/20' : 'text-white/10'}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="absolute bottom-2 left-0 right-0 text-center text-[7px] text-white/30 uppercase tracking-widest pointer-events-none select-none">
              🖱️ Drag Mouse / Tap Left-Right to steer
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
