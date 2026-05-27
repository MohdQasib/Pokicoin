import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Key, 
  Coins, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { WalletState } from '../types';

// Import our premium playable games
import PokiBird from './games/PokiBird';
import ConsensusTap from './games/ConsensusTap';
import PokiSnake from './games/PokiSnake';
import SpaceMiner from './games/SpaceMiner';
import KoinCollector from './games/KoinCollector';

interface GamePortalProps {
  balance: number;
  walletState: WalletState;
  onRewardAwarded: (amount: number) => void;
}

export default function GamePortal({
  balance,
  walletState,
  onRewardAwarded
}: GamePortalProps) {
  // Current active game category
  const [activeGame, setActiveGame] = useState<'bird' | 'tap' | 'snake' | 'space' | 'collector' | null>(null);

  // Consolidated clean games directory
  const gamesList = [
    {
      id: 'bird' as const,
      emoji: '🦅',
      title: 'Poki Bird Ledger Flight',
      description: 'Navigate glowing flight firewalls and avoid obstacles. Earn coins dynamically with every standard node successfully verified!',
      payout: '1.25 POKI / pass',
      bgColor: 'from-[#1c0f05] to-[#070501]',
      accentColor: 'text-amber-500',
      borderColor: 'border-amber-500/20'
    },
    {
      id: 'space' as const,
      emoji: '🚀',
      title: 'Asteroid Space Miner',
      description: 'Pilot your ship and fire consensus pulse lasers to shred oncoming block high-density dust caches. High score multiplier converts straight into assets.',
      payout: '100 pts = 0.50 POKI',
      bgColor: 'from-[#0c0d1c] to-[#070501]',
      accentColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/20'
    },
    {
      id: 'tap' as const,
      emoji: '⚡',
      title: 'Consensus Tap Speedrun',
      description: 'Touch and tap the rhythm of spinning ledger coins to verification peak ranges. Form combo cycles to release booster states.',
      payout: '1.00 POKI / run',
      bgColor: 'from-[#051c0f] to-[#070501]',
      accentColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20'
    },
    {
      id: 'snake' as const,
      emoji: '🐍',
      title: 'Ledger Chain Snake',
      description: 'Guide your blockchain snake to consume reward nodes safely without crashing back into your own validator tail. High-level path survival rewarded.',
      payout: '0.75 POKI / target',
      bgColor: 'from-[#05131c] to-[#070501]',
      accentColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/20'
    },
    {
      id: 'collector' as const,
      emoji: '💰',
      title: 'Classic Koin Collector',
      description: 'Drag and maneuver your mining chest to catch gold or silver validator coins falling from above, while evading raw volatile system faults.',
      payout: '1.50 POKI / game',
      bgColor: 'from-[#1a1403] to-[#070501]',
      accentColor: 'text-amber-400',
      borderColor: 'border-amber-500/20'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0802] font-sans text-white overflow-y-auto no-scrollbar pb-10 p-4">
      
      {/* Header Element */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 sticky top-0 bg-[#0a0802]/85 backdrop-blur-md z-10">
        <div>
          <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
            <Gamepad2 className="w-5 h-5 text-amber-500" />
            POKI ARCADE PORTAL
          </h2>
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Validate network state through gamified mining</p>
        </div>
        <Coins className="w-4 h-4 text-amber-500 animate-bounce" />
      </div>

      {/* Linked Miner Address Board */}
      <div className="bg-gradient-to-tr from-[#141005]/80 to-[#070501]/95 border border-amber-500/15 rounded-2xl p-3.5 flex items-center justify-between backdrop-blur-sm mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-[7.5px] bg-[#fbbf24] text-black px-1.5 py-0.5 rounded font-mono font-black tracking-wider leading-none uppercase">MINER VERIFIED</span>
              <span className="text-[9px] text-white/30 truncate shrink max-w-[100px] font-mono leading-none">{walletState.publicKey}</span>
            </div>
            <p className="text-xs font-bold font-mono text-white mt-1 leading-none">
              Balance: <span className="text-amber-400">{balance.toFixed(4)} POKI</span>
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-[8px] uppercase tracking-wider text-white/30 block">EST VAL</span>
          <span className="text-[11px] text-amber-400 font-extrabold font-mono leading-none">₹ {(balance * 0.50).toFixed(2)}</span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* ACTIVE SLOT - DIRECT PLAY EXPANDED CONTAINER          */}
      {/* ==================================================== */}
      <AnimatePresence mode="wait">
        {activeGame && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mb-6 w-full p-1 border border-amber-500/30 bg-[#0e0a03]/95 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.06)] relative"
          >
            {/* Game Screen Close Command Button bar */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/5 bg-[#141005]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold font-mono text-white/60 tracking-wider">
                  ACTIVE FRAME: {activeGame.toUpperCase()} CONSOLE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveGame(null)}
                className="bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-extrabold text-[8.5px] uppercase px-3 py-1 rounded-xl cursor-pointer"
              >
                ✕ Close Console
              </button>
            </div>

            {/* Launch components dynamically */}
            <div className="p-3 bg-black/40">
              {activeGame === 'bird' && (
                <PokiBird onRewardAwarded={onRewardAwarded} isDoubleRewardActive={false} />
              )}
              {activeGame === 'space' && (
                <SpaceMiner onRewardAwarded={onRewardAwarded} isDoubleRewardActive={false} />
              )}
              {activeGame === 'tap' && (
                <ConsensusTap onRewardAwarded={onRewardAwarded} isDoubleRewardActive={false} />
              )}
              {activeGame === 'snake' && (
                <PokiSnake onRewardAwarded={onRewardAwarded} isDoubleRewardActive={false} />
              )}
              {activeGame === 'collector' && (
                <KoinCollector onRewardAwarded={onRewardAwarded} isDoubleRewardActive={false} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* ARCADE STATIONS GRID                                 */}
      {/* ==================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b] font-display">
              🎯 HIGH-YIELD ARCADE STATIONS
            </h3>
          </div>
          <span className="text-[8px] text-white/30 uppercase font-mono">Consensus Validated (1.0x)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gamesList.map((g) => (
            <div 
              key={g.id}
              onClick={() => {
                setActiveGame(g.id);
                setTimeout(() => {
                  const el = document.querySelector('canvas');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
              className={`group relative bg-gradient-to-br ${g.bgColor} border ${g.borderColor} hover:border-amber-500/40 rounded-2xl p-4.5 cursor-pointer transition-all hover:-translate-y-0.5 shadow-lg select-none overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] blur-xl rounded-full"></div>
              
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl bg-white/[0.02] border ${g.borderColor} flex items-center justify-center text-xl group-hover:scale-105 transition-all`}>
                  <span>{g.emoji}</span>
                </div>
                <span className="text-[7.5px] font-black tracking-widest font-mono bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded uppercase leading-none">
                  PAYOUT ACTIVE
                </span>
              </div>

              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-3.5 group-hover:text-amber-400 transition-colors">
                {g.title}
              </h4>
              
              <p className="text-[10px] text-white/50 mt-1 lines-clamp-3 leading-relaxed">
                {g.description}
              </p>

              <div className="mt-4 flex items-center justify-between text-[8px] font-mono border-t border-white/5 pt-2.5">
                <span className="text-white/30 uppercase">Rate: {g.payout}</span>
                <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  LAUNCH GAME <ArrowRight className="w-3 h-3 text-amber-500" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
