import React from 'react';
import { motion } from 'motion/react';
import { Gamepad2, ArrowUpRight, Sparkles } from 'lucide-react';

export default function GamePortal() {
  const launchExternalGame = () => {
    window.open("https://pokicoin-runner-482786697335.asia-southeast1.run.app", "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#0a0802] font-sans text-white p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-gradient-to-b from-[#141005] to-[#070501] border border-amber-500/15 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.05)] relative overflow-hidden"
      >
        {/* Abstract lights */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full"></div>

        {/* Console icon */}
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-6 shrink-0 shadow-inner">
          <Gamepad2 className="w-8 h-8 animate-pulse" />
        </div>

        {/* Title */}
        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase mb-4">
          <Sparkles className="w-3 h-3 text-amber-500" />
          POKICOIN RUNNER ACTIVE
        </span>
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-3">
          Game Portal Migrated
        </h2>
        <p className="text-xs text-white/60 leading-relaxed mb-8">
          The gaming console has updated! We have migrated the game engine to a high-speed external server to give you smooth lag-free performance. 
        </p>

        {/* Launch Button */}
        <button
          type="button"
          onClick={launchExternalGame}
          className="w-full bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs py-4 px-6 rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.3)] transition-all active:scale-98 cursor-pointer"
        >
          <span>Play Pokicoin Runner</span>
          <ArrowUpRight className="w-4 h-4 stroke-[3px]" />
        </button>

        {/* Extra link helper */}
        <p className="text-[9.5px] text-white/30 font-mono mt-4 uppercase tracking-wider">
          Opens securely in a new fast browser window
        </p>
      </motion.div>
    </div>
  );
}
