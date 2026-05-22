import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Mail, Phone, Lock, User, CheckCircle2, Flame, Sparkles } from 'lucide-react';

interface OnboardingAuthProps {
  onLoginSuccess: (user: { name: string; email: string; phone?: string }) => void;
}

export default function OnboardingAuth({ onLoginSuccess }: OnboardingAuthProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'phone'>('signup');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (authMode === 'signup' && (!name || !password || (email === '' && phone === ''))) {
      setError('Please provide your name, details and a password.');
      return;
    }
    if (authMode === 'login' && (!email || !password)) {
      setError('Please provide your email and secure password.');
      return;
    }
    if (authMode === 'phone' && (!phone || !password)) {
      setError('Please provide your phone and secure code.');
      return;
    }

    setLoading(true);
    // Simulate lightning fast verification
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: name || (email ? email.split('@')[0] : 'Poki Miner'),
        email: email || `${phone}@poki.in`,
        phone: phone || undefined
      });
      // Save credentials locally
      localStorage.setItem('poki_user_logged', 'true');
      localStorage.setItem('poki_user_name', name || (email ? email.split('@')[0] : 'Poki Miner'));
      localStorage.setItem('poki_user_email', email || `${phone}@poki.in`);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0802] font-sans text-white p-6 justify-between overflow-y-auto no-scrollbar relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
      
      {/* Brand logo container */}
      <div className="flex flex-col items-center text-center mt-6">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20"
        >
          <Flame className="w-9 h-9 text-black fill-black/20" />
        </motion.div>
        
        <h2 className="text-xl font-bold uppercase tracking-widest mt-4 text-amber-400">Poki Koin Hub</h2>
        <p className="text-[10px] text-white/50 tracking-wider uppercase mt-1 mb-6">Autonomous Mining Gateway</p>
      </div>

      {/* Auth Box Container */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          {/* Header toggles */}
          <div className="flex border-b border-white/10 pb-3 mb-4 text-xs font-semibold gap-3">
            <button
              onClick={() => { setAuthMode('signup'); setError(''); }}
              className={`pb-1 uppercase tracking-wider ${authMode === 'signup' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-white/40'}`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setAuthMode('login'); setError(''); }}
              className={`pb-1 uppercase tracking-wider ${authMode === 'login' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-white/40'}`}
            >
              Log In
            </button>
            <button
              onClick={() => { setAuthMode('phone'); setError(''); }}
              className={`pb-1 uppercase tracking-wider ${authMode === 'phone' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-white/40'}`}
            >
              Phone Auth
            </button>
          </div>

          {error && (
            <div className="mb-3 text-[10px] bg-red-950/20 border border-red-500/20 text-red-400 p-2 rounded-lg font-mono">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {authMode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <User className="w-3 h-3 text-amber-400" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
                />
              </div>
            )}

            {authMode !== 'phone' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <Mail className="w-3 h-3 text-amber-400" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@minipocicoin.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none font-mono"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <Phone className="w-3 h-3 text-amber-400" /> Mobile Phone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none font-mono"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" /> Secret Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
              />
            </div>

            {authMode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Referral Invite Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="POKIFAN-99"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none uppercase font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-tr from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating Gate...' : authMode === 'signup' ? 'Create Poki Wallet' : 'Unlock Mining Hub'}
            </button>
          </form>
        </div>
      </div>

      {/* Safety notice disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[10px] leading-relaxed text-amber-200/60 text-center font-sans mt-4">
        🔒 Simulated End-to-End Cryptography with 256-bit secure hash, fully responsive with automatic custom domain (<strong>minipocicoin.in</strong>) binding support.
      </div>
    </div>
  );
}
