import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Heart, Coins } from 'lucide-react';

interface KoinCollectorProps {
  onRewardAwarded: (amount: number) => void;
  isDoubleRewardActive?: boolean;
}

interface FallingObject {
  x: number;
  y: number;
  type: 'gold' | 'silver' | 'bomb';
  speed: number;
  radius: number;
}

export default function KoinCollector({ onRewardAwarded, isDoubleRewardActive = false }: KoinCollectorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [rewardWon, setRewardWon] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const playerXRef = useRef(150);

  const triggerStartGameWithAd = () => {
    startPlayLoop();
  };

  const startPlayLoop = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPlaying(true);
    setRewardWon(0);
    setIsSynced(false);
    playerXRef.current = 150;
  };

  // Touch/Mouse controls drag
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const relativeX = touch.clientX - rect.left;
    playerXRef.current = Math.max(30, Math.min(canvas.width - 30, relativeX));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    playerXRef.current = Math.max(30, Math.min(canvas.width - 30, relativeX));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = canvasRef.current;
      const wWidth = canvas ? canvas.width : 300;
      if (e.key === 'ArrowLeft') {
        playerXRef.current = Math.max(30, playerXRef.current - 18);
      } else if (e.key === 'ArrowRight') {
        playerXRef.current = Math.min(wWidth - 30, playerXRef.current + 18);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Canvas loop
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

    const basketWidth = 60;
    const basketHeight = 14;
    const basketY = canvas.height - basketHeight - 5;

    let localScore = 0;
    let localLives = 3;
    let objects: FallingObject[] = [];
    let spawnTimer = 0;

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Space starry black background
      ctx.fillStyle = '#060502';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dash background mesh lines
      ctx.strokeStyle = 'rgba(234,179,8,0.06)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.moveTo(0, canvas.height - 40);
      ctx.lineTo(canvas.width, canvas.height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      spawnTimer++;
      if (spawnTimer % 35 === 0) {
        const randType = Math.random();
        let type: FallingObject['type'] = 'gold';
        if (randType > 0.85) {
          type = 'bomb';
        } else if (randType > 0.68) {
          type = 'silver';
        }

        objects.push({
          x: Math.random() * (canvas.width - 24) + 12,
          y: -15,
          type,
          speed: Math.random() * 2 + 1.8 + (localScore * 0.02),
          radius: type === 'gold' ? 8 : type === 'silver' ? 6.5 : 9
        });
        spawnTimer = 0;
      }

      // Update positions
      for (let idx = objects.length - 1; idx >= 0; idx--) {
        const obj = objects[idx];
        obj.y += obj.speed;

        // Draw items
        if (obj.type === 'gold') {
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#eab308';
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(obj.x - 2, obj.y - 2, obj.radius / 2.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (obj.type === 'silver') {
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ef4444';
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Flame tail
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(obj.x - 4, obj.y - 4);
          ctx.lineTo(obj.x + 4, obj.y - 4);
          ctx.lineTo(obj.x, obj.y - 12);
          ctx.fill();
        }

        // Collision Check basket height
        const distY = Math.abs(obj.y - basketY);
        const distX = Math.abs(obj.x - playerXRef.current);

        if (distY < 8 && distX < basketWidth / 2) {
          if (obj.type === 'gold') {
            localScore += 10;
          } else if (obj.type === 'silver') {
            localScore += 25;
          } else {
            localLives = Math.max(0, localLives - 1);
            setLives(localLives);
          }
          setScore(localScore);
          objects.splice(idx, 1);
        } else if (obj.y > canvas.height + 20) {
          objects.splice(idx, 1);
        }
      }

      // Draw players catching chest
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#eab308';
      const grad = ctx.createLinearGradient(playerXRef.current - basketWidth/2, basketY, playerXRef.current + basketWidth/2, basketY + basketHeight);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(playerXRef.current - basketWidth/2, basketY, basketWidth, basketHeight, [0,0,6,6]);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (localLives <= 0) {
        handleGameOver();
        return;
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

    // 100 points = 0.50 POKI. If 2X double reward active, scale to 1.00 POKI
    const ratio = isDoubleRewardActive ? 0.01 : 0.005;
    const finalEarned = parseFloat((score * ratio).toFixed(2));
    setRewardWon(finalEarned);
    setIsSynced(false);
  };

  const syncCoins = () => {
    if (rewardWon <= 0 || isSynced) return;
    onRewardAwarded(rewardWon);
    setIsSynced(true);
    alert(`🎉 Success! +${rewardWon.toFixed(2)} POKI synced! Ledger node updated.`);
  };

  return (
    <div className="w-full bg-[#0a0802]/30 border border-white/[0.04] rounded-2xl overflow-hidden relative flex flex-col items-center p-4">

      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-amber-500 animate-bounce" />
          <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#f59e0b]">Classic Poki Collector</h5>
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
            <span className="text-[7.5px] uppercase font-bold tracking-[0.25em] text-white/40 leading-none">HIGH-SPEED YIELD CATCHER</span>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">💰 COIN COLLECTOR</h4>
            <p className="text-[9.5px] text-white/50 leading-relaxed max-w-[240px]">
              Drag catcher chest left or right. Capture golden and silver coins. Avoid falling volcanic fireballs to survive!
            </p>
            <button
              type="button"
              onClick={triggerStartGameWithAd}
              className="mt-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-[9px] uppercase tracking-widest py-2.5 px-6 rounded-xl shadow-lg cursor-pointer hover:brightness-110 active:scale-95 transition-all select-none"
            >
              LAUNCH CATCH CORE
            </button>
          </div>
        ) : gameOver ? (
          <div className="flex flex-col items-center gap-3 text-center p-4 w-full">
            <h4 className="text-red-500 font-black text-xs uppercase tracking-widest">⚠️ Node De-synchronized</h4>
            
            <div className="bg-[#100d07] border border-amber-500/10 p-3.5 rounded-xl flex flex-col gap-1 w-full max-w-[200px]">
              <span className="text-[8px] text-white/30 uppercase tracking-widest">Total Points Eaten</span>
              <p className="text-xl font-mono text-white font-black leading-none">{score}</p>
              
              <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-0.5">
                <span className="text-[8px] text-amber-400/50 uppercase tracking-widest">Miner Allocation</span>
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
                  {isSynced ? 'Success ✔' : 'Claim to Wallet'}
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
              className="w-full h-full cursor-crosshair touch-none"
            />
            {/* Real-time status scoreboard */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between px-1 text-[9px] font-mono pointer-events-none text-white select-none">
              <span>SCORE: <strong className="text-amber-400">{score}</strong></span>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart 
                    key={i}
                    className={`w-3.5 h-3.5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-white/10'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
