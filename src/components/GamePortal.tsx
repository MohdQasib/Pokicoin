import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Key, 
  Play, 
  RotateCcw, 
  Award, 
  Coins, 
  Heart, 
  Megaphone, 
  ExternalLink,
  ShieldAlert,
  Tv,
  Sparkles,
  Volume2,
  TrendingUp
} from 'lucide-react';
import { WalletState } from '../types';

interface GamePortalProps {
  balance: number;
  walletState: WalletState;
  onRewardAwarded: (amount: number) => void;
}

interface FallingObject {
  x: number;
  y: number;
  type: 'gold' | 'silver' | 'bomb'; // gold koin, silver bonus, or bad fireball
  speed: number;
  radius: number;
}

export default function GamePortal({
  balance,
  walletState,
  onRewardAwarded
}: GamePortalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [rewardWon, setRewardWon] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  // Stats for the visual sponsored monetization ads
  const [adEarnings, setAdEarnings] = useState(0.0);
  const [adCicksCount, setAdClicksCount] = useState(0);
  const [adMessage, setAdMessage] = useState<string | null>(null);

  // Canvas-based interactive game refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const playerXRef = useRef(150); // initial bucket X position
  const touchXRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Ad banner simulated triggers
  const triggerAdRevenue = (bannerName: string) => {
    setAdClicksCount(prev => prev + 1);
    const addedBonus = 0.10;
    setAdEarnings(prev => prev + addedBonus);
    onRewardAwarded(addedBonus);
    
    setAdMessage(`🎯 Clicked Sponsored Ad: Added +0.10 POKI into your linked wallet from ${bannerName} Partner Node!`);
    setTimeout(() => setAdMessage(null), 4000);
  };

  // Setup the gaming loop
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas resolution dynamically
    canvas.width = 320;
    canvas.height = 250;

    const basketWidth = 60;
    const basketHeight = 15;
    const basketY = canvas.height - basketHeight - 5;

    let localScore = 0;
    let localLives = 3;
    let objects: FallingObject[] = [];
    let spawnTimer = 0;

    // keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        playerXRef.current = Math.max(basketWidth / 2, playerXRef.current - 18);
      } else if (e.key === 'ArrowRight') {
        playerXRef.current = Math.min(canvas.width - basketWidth / 2, playerXRef.current + 18);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Main Canvas Update Loop
    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render scrolling background stars
      ctx.fillStyle = '#0a0802';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw horizontal dashed baseline grids
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.moveTo(0, canvas.height - 40);
      ctx.lineTo(canvas.width, canvas.height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      // Spawn falling objects
      spawnTimer++;
      if (spawnTimer % 35 === 0) {
        const randType = Math.random();
        let type: FallingObject['type'] = 'gold';
        if (randType > 0.85) {
          type = 'bomb';
        } else if (randType > 0.7) {
          type = 'silver';
        }

        objects.push({
          x: Math.random() * (canvas.width - 20) + 10,
          y: -10,
          type,
          speed: Math.random() * 2 + 1.8 + (localScore * 0.02), // accelerate as score rises
          radius: type === 'gold' ? 8 : type === 'silver' ? 6 : 9
        });
        spawnTimer = 0;
      }

      // Update positions and render objects
      objects.forEach((obj, idx) => {
        obj.y += obj.speed;

        // Render falling items with precise graphics
        if (obj.type === 'gold') {
          // Glow effect
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#fbbf24';
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#fef08a'; // inner gold shine
          ctx.beginPath();
          ctx.arc(obj.x - 2, obj.y - 2, obj.radius / 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (obj.type === 'silver') {
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(obj.x - 1, obj.y - 1, obj.radius / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // BOMB skull obstacle
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
          // Skull dot eyes
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(obj.x - 3, obj.y - 2, 2, 0, Math.PI * 2);
          ctx.arc(obj.x + 3, obj.y - 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Collision Check basket height detection
        const distanceY = Math.abs(obj.y - basketY);
        const distanceX = Math.abs(obj.x - playerXRef.current);

        if (distanceY < 8 && distanceX < basketWidth / 2) {
          // Caught! Match rewards
          if (obj.type === 'gold') {
            localScore += 10;
          } else if (obj.type === 'silver') {
            localScore += 25; // silver bonus coins
          } else {
            localLives = Math.max(0, localLives - 1);
            setLives(localLives);
          }
          setScore(localScore);
          objects.splice(idx, 1);
        } else if (obj.y > canvas.height + 20) {
          // Missed item
          if (obj.type === 'gold') {
            // Missed gold reduces half heart or lives if missed too many
          }
          objects.splice(idx, 1);
        }
      });

      // Render the player control bucket (basket)
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f59e0b';
      ctx.fillStyle = 'all';
      // Basket gradient colors
      const grad = ctx.createLinearGradient(playerXRef.current - basketWidth/2, basketY, playerXRef.current + basketWidth/2, basketY + basketHeight);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(0.5, '#eab308');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;

      // Draw rounded catcher chest
      ctx.beginPath();
      ctx.roundRect(playerXRef.current - basketWidth / 2, basketY, basketWidth, basketHeight, [0, 0, 8, 8]);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw a gold strip inside the chest
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(playerXRef.current - basketWidth/4, basketY + 3, basketWidth/2, 2);
      ctx.shadowBlur = 0;

      // Game Over trigger
      if (localLives <= 0) {
        setGameOver(true);
        setIsPlaying(false);
        // Conver score to Poki rewards: 100 points = +0.50 POKI
        const convertedReward = parseFloat((localScore * 0.005).toFixed(2));
        setRewardWon(convertedReward);
        setIsSynced(false);
      } else {
        animationRef.current = requestAnimationFrame(update);
      }
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver]);

  // Touch & Drag Mouse Handlers for fully responsive mobile play
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

  const startGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPlaying(true);
    setRewardWon(0);
    setIsSynced(false);
    playerXRef.current = 160;
  };

  const claimGameCoins = () => {
    if (rewardWon <= 0 || isSynced) return;
    onRewardAwarded(rewardWon);
    setIsSynced(true);
    
    // Auto visual success feedback
    const banner = document.getElementById('success-claim-alert');
    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 3500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0802] font-sans text-white overflow-y-auto no-scrollbar pb-6 p-5">
      
      {/* Visual Header and auto link info */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 sticky top-0 bg-[#0a0802]/40 backdrop-blur-md z-10">
        <div>
          <h2 className="text-base font-display font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            Poki Koin Play Arcade
          </h2>
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Earn gold while gaming in the portal</p>
        </div>
        <Coins className="w-5 h-5 text-amber-400 animate-bounce" />
      </div>

      {adMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-amber-500 text-black px-3.5 py-2.5 rounded-xl text-xs font-bold font-sans mb-3 text-center tracking-wide leading-snug flex items-center gap-1.5 justify-center shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-black shrink-0" />
          {adMessage}
        </motion.div>
      )}

      {/* Auto Connected Wallet Status Card */}
      <div className="bg-gradient-to-tr from-[#1a1505]/70 to-[#070501]/80 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.06)] backdrop-blur-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-[8px] bg-amber-500 text-black px-1 py-0.2 rounded font-mono font-bold leading-none tracking-wider uppercase">WALLET LINKED</span>
              <span className="text-[10px] text-white/30 truncate shrink max-w-[120px] font-mono leading-none">{walletState.isCreated ? walletState.publicKey : 'G_LOCAL_SANDBOX_XVM'}</span>
            </div>
            {/* Synchronized wallet central balance */}
            <p className="text-md font-bold font-mono text-white mt-1 leading-none">
              Synced Balance: <span className="text-amber-400">{balance.toFixed(4)} POKI</span>
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-[9px] uppercase tracking-wider text-white/40 block">INR VALUE</span>
          <span className="text-xs text-amber-300 font-bold font-mono leading-none">₹ {(balance * 0.50).toFixed(2)}</span>
        </div>
      </div>

      {/* STRATEGIC UPPER BANNER AD PLACEHOLDER (Google Adsense Mock) */}
      <div 
        onClick={() => triggerAdRevenue('PropellerAds Banner')}
        className="bg-white/[0.02] border border-dashed border-amber-500/15 p-2 rounded-xl mb-4 text-center cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/30 transition-all flex flex-col items-center justify-center select-none"
      >
        <div className="flex items-center gap-1 text-[8px] text-white/30 uppercase tracking-widest font-mono">
          <Tv className="w-3 h-3 text-amber-400 animate-pulse" /> Sponsored Campaign Node
        </div>
        <p className="text-[10px] text-amber-400 font-bold mt-0.5 uppercase tracking-wide">
          💰 Click to Support Poki Hub Consensus & Claim +0.10 POKI Bonus!
        </p>
        <span className="text-[7px] text-white/20 uppercase font-mono mt-0.5">Partner AdEngine ID: PropellerAds-minipocicoin-489</span>
      </div>

      {/* CORE HTML5 GAME CONTAINER */}
      <div ref={containerRef} className="w-full bg-[#030303] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col items-center py-5">
        
        {!isPlaying && !gameOver ? (
          /* GAME LOBBY VIEW */
          <div className="flex flex-col items-center p-6 text-center gap-4">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center animate-pulse">
              <Coins className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 leading-snug">HTML5 Game: Poki Koin Collector</h3>
              <p className="text-[11px] text-white/50 mt-1 lines-clamp-2 leading-relaxed">
                Move the gold catcher chest left / right. Catch shiny gold Poki Koins. Dodge the volatile fireballs!
              </p>
            </div>

            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5 w-full text-left flex flex-col gap-1 text-[11px] font-mono select-none">
              <span className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5 font-sans leading-none">Gaming Rules</span>
              <p className="text-white/70">• Gold Coins = <strong className="text-amber-400 font-bold">+10 pts</strong></p>
              <p className="text-white/70">• Silver Coins = <strong className="text-white font-bold">+25 pts</strong></p>
              <p className="text-white/70">• Red Fireball = <strong className="text-red-400 font-bold">Lose 1 Heart</strong></p>
              <p className="text-white/40 mt-1.5 border-t border-white/5 pt-1 font-sans">Payout Rate: 100 Points = +0.50 Poki Koins</p>
            </div>

            <button
              id="start-poki-collector-game-btn"
              onClick={startGame}
              className="mt-2.5 bg-gradient-to-tr from-amber-500 to-yellow-500 text-black font-extrabold px-8 py-3 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-amber-500/10 hover:brightness-110 active:scale-95 transition-all"
            >
              Start Game Session
            </button>
          </div>
        ) : gameOver ? (
          /* GAME OVER / REWARD TRANSFER VIEW */
          <div className="flex flex-col items-center p-6 text-center gap-4 w-full">
            <h3 className="text-sm font-black uppercase tracking-widest text-red-500 leading-none">⚠️ Game Finished</h3>
            
            <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl w-full max-w-[260px] flex flex-col gap-2 relative">
              <span className="text-[9px] tracking-widest uppercase text-white/30">Session High Score</span>
              <p className="text-3xl font-light font-mono text-white font-display leading-none">{score}</p>
              
              <div className="border-t border-white/5 mt-3 pt-3 flex flex-col gap-1">
                <span className="text-[9px] uppercase text-white/40 tracking-wider">Poki Koin Conversion Earnings</span>
                <p className="text-xl font-bold font-mono text-amber-400 flex items-center justify-center gap-1 leading-none">
                  +{rewardWon.toFixed(2)} POKI
                </p>
              </div>
            </div>

            {/* Sync claim alerts */}
            <div id="success-claim-alert" className="hidden bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 text-xs rounded-xl w-full flex items-center justify-center gap-1.5 uppercase font-mono">
              ✅ Synced +{rewardWon.toFixed(2)} Coins with Central DB!
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[260px]">
              <button
                id="sync-reward-blockchain-btn"
                onClick={claimGameCoins}
                disabled={rewardWon <= 0 || isSynced}
                className="flex-1 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
              >
                {isSynced ? 'Wallet Synced ✔' : 'Sync to Wallet'}
              </button>
              
              <button
                id="replay-collector-game-btn"
                onClick={startGame}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-extrabold cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Replay
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE INTERACTIVE CANVAS PLAY GAME VIEW */
          <div className="flex flex-col items-center w-full">
            {/* Game overlay stats header */}
            <div className="w-full px-5 pb-3 flex justify-between text-xs tracking-wider border-b border-white/5 mb-3">
              <div className="flex items-center gap-1 text-white/70">
                Score: <strong className="text-amber-400 font-mono text-base font-bold select-none">{score}</strong>
              </div>
              
              {/* Rewards Accumulating */}
              <div className="flex items-center gap-1 text-white/70">
                Reward: <strong className="text-emerald-400 font-mono select-none">+{ (score * 0.005).toFixed(2) } POKI</strong>
              </div>

              {/* Heart Lives icons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 (size) ${i < lives ? 'text-red-500 fill-red-500' : 'text-white/10'}`}
                  />
                ))}
              </div>
            </div>

            {/* Responsive HTML5 canvas screen */}
            <canvas
              ref={canvasRef}
              onTouchMove={handleTouchMove}
              onMouseMove={handleMouseMove}
              className="border border-white/10 rounded-xl bg-[#030302] cursor-crosshair max-w-full drop-shadow-[0_0_20px_rgba(245,158,11,0.1)] touch-none"
            />

            {/* Visual Desktop controls helper */}
            <div className="mt-3.5 text-[10px] text-white/30 text-center font-sans tracking-wide uppercase">
              🖱️ Drag Mouse or use ⬅ ➡ arrow keys to control chest
            </div>
          </div>
        )}
      </div>

      {/* STRATEGIC LOWER BANNER AD PLACEHOLDER (Adsterra / PropellerAds Mock) */}
      <div 
        onClick={() => triggerAdRevenue('Adsterra Media Partner')}
        className="bg-white/[0.02] border border-dashed border-amber-500/15 p-2 rounded-xl mt-4 text-center cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/30 transition-all flex flex-col items-center justify-center select-none"
      >
        <div className="flex items-center gap-1 text-[8px] text-white/30 uppercase tracking-widest font-mono">
          <Megaphone className="w-3.5 h-3.5 text-amber-500 hover:scale-110" /> Adsterra Media Node
        </div>
        <p className="text-[10px] text-amber-400 font-bold mt-0.5 uppercase tracking-wide">
          🚀 Supported High-Speed Server node: click-claim +0.10 POKI instantly!
        </p>
        <span className="text-[7px] text-white/20 uppercase font-mono mt-0.5">Media Source: minipocicoin-zone-9022</span>
      </div>

      {/* Ad Partner stats console (Adsterra tracker) */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-3 mt-4 text-[10px] font-mono leading-relaxed select-none">
        <span className="text-[8px] uppercase tracking-[0.2em] text-white/30 font-sans block mb-1">Affiliate Partner Monetization Ledger</span>
        <div className="grid grid-cols-2 gap-2 text-white/60">
          <span>🎯 Total AdClicks: <strong className="text-white font-sans">{adCicksCount}</strong></span>
          <span>💎 Total clicks earned: <strong className="text-amber-400 font-bold">+{adEarnings.toFixed(2)} POKI</strong></span>
        </div>
      </div>

    </div>
  );
}
