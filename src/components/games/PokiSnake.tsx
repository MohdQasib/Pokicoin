import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface PokiSnakeProps {
  onRewardAwarded: (amount: number) => void;
  isDoubleRewardActive?: boolean;
}

interface Point {
  x: number;
  y: number;
}

export default function PokiSnake({ onRewardAwarded, isDoubleRewardActive = false }: PokiSnakeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [rewardWon, setRewardWon] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameIntervalRef = useRef<number | null>(null);

  // Snake structure state
  const snake = useRef<Point[]>([{ x: 10, y: 10 }]);
  const direction = useRef<Point>({ x: 1, y: 0 }); // start crawling right
  const nextDirection = useRef<Point>({ x: 1, y: 0 });
  const food = useRef<Point>({ x: 5, y: 5 });
  const gridSize = 15;
  const tileCountX = 20; // 300px width
  const tileCountY = 16; // 240px height

  // Particle explosion effects on food eaten
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
    snake.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    direction.current = { x: 1, y: 0 };
    nextDirection.current = { x: 1, y: 0 };
    spawnFood();
    particles.current = [];

    // Trigger interval clock for snake moving
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    gameIntervalRef.current = window.setInterval(gameTick, 140);
  };

  const spawnFood = () => {
    let randX, randY;
    let onSnake = true;
    while (onSnake) {
      randX = Math.floor(Math.random() * tileCountX);
      randY = Math.floor(Math.random() * tileCountY);
      onSnake = snake.current.some(segment => segment.x === randX && segment.y === randY);
    }
    food.current = { x: randX || 5, y: randY || 5 };
  };

  // Keyboard controls keydown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      if ((key === 'ArrowUp' || key === 'KeyW') && direction.current.y === 0) {
        nextDirection.current = { x: 0, y: -1 };
      } else if ((key === 'ArrowDown' || key === 'KeyS') && direction.current.y === 0) {
        nextDirection.current = { x: 0, y: 1 };
      } else if ((key === 'ArrowLeft' || key === 'KeyA') && direction.current.x === 0) {
        nextDirection.current = { x: -1, y: 0 };
      } else if ((key === 'ArrowRight' || key === 'KeyD') && direction.current.x === 0) {
        nextDirection.current = { x: 1, y: 0 };
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, [isPlaying, gameOver]);

  // Touch Direction Pad handlers for fully responsive mobile play
  const changeDirection = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (!isPlaying || gameOver) return;
    if (dir === 'UP' && direction.current.y === 0) {
      nextDirection.current = { x: 0, y: -1 };
    } else if (dir === 'DOWN' && direction.current.y === 0) {
      nextDirection.current = { x: 0, y: 1 };
    } else if (dir === 'LEFT' && direction.current.x === 0) {
      nextDirection.current = { x: -1, y: 0 };
    } else if (dir === 'RIGHT' && direction.current.x === 0) {
      nextDirection.current = { x: 1, y: 0 };
    }
  };

  // Central movement engine clocked frame tick
  const gameTick = () => {
    if (!isPlaying) return;

    // Resolve direction
    direction.current = nextDirection.current;

    const head = { ...snake.current[0] };
    head.x += direction.current.x;
    head.y += direction.current.y;

    // Check boundary collisison
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
      handleGameOver();
      return;
    }

    // Check self tail collision
    if (snake.current.some(segment => segment.x === head.x && segment.y === head.y)) {
      handleGameOver();
      return;
    }

    // Move snake
    snake.current.unshift(head);

    // Check if eating food
    if (head.x === food.current.x && head.y === food.current.y) {
      setScore(prev => prev + 1);
      spawnFood();

      // Explode neon pixels
      for (let i = 0; i < 8; i++) {
        particles.current.push({
          x: head.x * gridSize + gridSize / 2,
          y: head.y * gridSize + gridSize / 2,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          color: '#fbbf24',
          life: 18
        });
      }
    } else {
      snake.current.pop(); // reduce tail length if no food matched
    }

    draw();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 240;

    // Clear canvas
    ctx.fillStyle = '#060503';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render underlying grid mesh
    ctx.strokeStyle = 'rgba(245,158,11,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw snake segments with a glowing look
    snake.current.forEach((seg, index) => {
      ctx.shadowBlur = index === 0 ? 8 : 0;
      ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = index === 0 ? '#fbbf24' : 'rgba(245,158,11,0.7)';
      ctx.beginPath();
      ctx.roundRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2, 3);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw the spinning golden cryptocurrency Coin Food
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#eab308';
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(food.current.x * gridSize + gridSize / 2, food.current.y * gridSize + gridSize / 2, gridSize / 2.4, 0, Math.PI * 2);
    ctx.fill();

    // inner dollar shine
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', food.current.x * gridSize + gridSize / 2, food.current.y * gridSize + gridSize / 2);
    ctx.shadowBlur = 0;

    // Update debris
    for (let k = particles.current.length - 1; k >= 0; k--) {
      const p = particles.current[k];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 18;
      ctx.fillRect(p.x, p.y, 2, 2);
      ctx.globalAlpha = 1.0;
      if (p.life <= 0) particles.current.splice(k, 1);
    }
  };

  const handleGameOver = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);

    // Each food coin = 0.75 POKI. If 2X double rewards active, scale to 1.50 POKI
    const scalar = isDoubleRewardActive ? 1.50 : 0.75;
    const finalEarned = parseFloat((score * scalar).toFixed(2));
    setRewardWon(finalEarned);
    setIsSynced(false);
  };

  const claimWalletCoins = () => {
    if (rewardWon <= 0 || isSynced) return;
    onRewardAwarded(rewardWon);
    setIsSynced(true);
    alert(`🎉 Added +${rewardWon.toFixed(2)} POKI to your active balances. Core server matched.`);
  };

  return (
    <div className="w-full bg-[#0a0802]/30 border border-white/[0.04] rounded-2xl overflow-hidden relative flex flex-col items-center p-4">

      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 pr-1 text-sm">🐍</span>
          <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#f59e0b]">Ledger Chain Snake</h5>
        </div>
        {isDoubleRewardActive && (
          <span className="text-[8px] bg-red-500/20 text-red-400 font-extrabold border border-red-500/30 px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5 animate-pulse animate-duration-1000">
            ⚡ 2X Payout Node
          </span>
        )}
      </div>

      <div className="w-full bg-black/80 rounded-xl relative overflow-hidden flex flex-col items-center border border-white/5">
        {!isPlaying && !gameOver ? (
          <div className="flex flex-col items-center gap-3 text-center p-4 py-8 h-[240px] justify-center">
            <span className="text-[7.5px] uppercase font-bold tracking-[0.25em] text-white/40 leading-none">RETRO NODE CHAIN CLUSTER</span>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">🐍 SYSTEM BLOCK SNAKE</h4>
            <p className="text-[9.5px] text-white/50 leading-relaxed max-w-[240px]">
              Navigate the neon snake without crashing. Eat golden coins to grow longer. Each node eaten generates {isDoubleRewardActive ? "1.50" : "0.75"} POKI.
            </p>
            <button
              type="button"
              onClick={triggerStartGameWithAd}
              className="mt-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-[9px] uppercase tracking-widest py-2.5 px-6 rounded-xl shadow-lg cursor-pointer hover:brightness-110 active:scale-95 transition-all select-none"
            >
              SPAWN SNAKE CORE
            </button>
          </div>
        ) : gameOver ? (
          <div className="flex flex-col items-center gap-3 text-center p-4 h-[240px] justify-center w-full">
            <h4 className="text-red-500 font-black text-xs uppercase tracking-widest">🪘 Node Overflow Error</h4>
            
            <div className="bg-[#100d07] border border-amber-500/10 p-3 rounded-xl flex flex-col gap-1 w-full max-w-[200px]">
              <span className="text-[8px] text-white/30 uppercase tracking-widest">Growth Nodes Eaten</span>
              <p className="text-xl font-mono text-white font-black leading-none">{score}</p>
              
              <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-0.5">
                <span className="text-[8px] text-amber-400/50 uppercase tracking-widest">Yield Produced</span>
                <p className="text-sm font-mono font-bold text-amber-400">+{rewardWon.toFixed(2)} POKI</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={claimWalletCoins}
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
          <div className="w-full h-full flex flex-col">
            <div className="relative w-full h-[240px]">
              <canvas
                ref={canvasRef}
                className="w-full h-full touch-none"
              />
              <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between px-1 text-[9px] font-mono pointer-events-none text-white select-none">
                <span>NODES EATEN: <strong className="text-amber-400">{score}</strong></span>
                <span>YIELD: <strong className="text-emerald-400">+{rewardWon.toFixed(1)} POKI</strong></span>
              </div>
            </div>

            {/* Glowing Touch directional arrow keys control pad for mobile players */}
            <div className="w-full bg-[#0a0802] border-t border-white/5 p-3 flex flex-col items-center justify-center gap-1.5 select-none">
              <button
                type="button"
                onClick={() => changeDirection('UP')}
                className="w-10 h-10 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-400 active:scale-90 text-white shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              >
                <ArrowUp className="w-4 h-4 text-amber-400" />
              </button>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => changeDirection('LEFT')}
                  className="w-10 h-10 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-400 active:scale-90 text-white shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400" />
                </button>
                
                <div className="w-10 h-10 flex items-center justify-center text-[8px] text-white/30 font-mono">DIR</div>
                
                <button
                  type="button"
                  onClick={() => changeDirection('RIGHT')}
                  className="w-10 h-10 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-400 active:scale-90 text-white shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => changeDirection('DOWN')}
                className="w-10 h-10 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-400 active:scale-90 text-white shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              >
                <ArrowDown className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
