import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck
} from 'lucide-react';
import { useFirebase } from '../lib/firebase';
import { auth, db } from '../lib/firebaseCompatService';
import firebase from 'firebase/compat/app';

interface OnboardingAuthProps {
  onLoginSuccess: (user: { name: string; email: string; phone?: string; uid?: string }) => void;
}

export default function OnboardingAuth({ onLoginSuccess }: OnboardingAuthProps) {
  // Inside Email login or signup flow
  const [isSignUp, setIsSignUp] = useState(false);

  // Field values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Status metrics
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [passStrength, setPassStrength] = useState({ length: false, format: false });

  // Update password complexity metrics
  useEffect(() => {
    setPassStrength({
      length: password.length >= 8,
      format: /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)
    });
  }, [password]);

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!useFirebase) {
      // Simulator mock Google sign in
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess({
          name: 'Google Miner Pro',
          email: 'miner.google@gmail.com',
          uid: 'rtdb_google_mock'
        });
      }, 1000);
      return;
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      if (user) {
        // Handshake profile write to secure database node
        const userRef = db.ref(`users/${user.uid}`);
        const snapshot = await userRef.get();
        let displayName = user.displayName || 'Google Miner';
        
        if (!snapshot.exists()) {
          await userRef.set({
            userId: user.uid,
            fullName: displayName,
            email: user.email || `${user.uid}@gmail.com`,
            balance: 10.0,
            transferableBalance: 0.0,
            isMining: false,
            updatedAt: new Date().toISOString()
          });
        } else {
          const val = snapshot.val();
          if (val?.fullName) {
            displayName = val.fullName;
          }
        }

        setSuccessMsg("Google connected successfully. Redirecting...");
        setTimeout(() => {
          onLoginSuccess({
            name: displayName,
            email: user.email || `${user.uid}@gmail.com`,
            uid: user.uid
          });
        }, 800);
      }
    } catch (err: any) {
      console.error("Google Auth failure:", err);
      if (err?.code === 'auth/popup-blocked') {
        setError("Sign-in popup is blocked. Please allow popups or try using Email Credentials option.");
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setError("Sign-in cancelled. Please try again.");
      } else {
        setError(err?.message || "Google Sign-In was interrupted.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignInOrSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetEmail = email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please enter a valid grammatical email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    if (!useFirebase) {
      // Offline local bypass
      setTimeout(() => {
        setLoading(false);
        const resolvedName = name.trim() || targetEmail.split('@')[0];
        onLoginSuccess({
          name: resolvedName,
          email: targetEmail,
          uid: 'offline_local_sandbox_miner'
        });
      }, 1000);
      return;
    }

    try {
      if (isSignUp) {
        const cleanedName = name.trim();
        if (!cleanedName) {
          setError('Please specify your full legal name for profile registration.');
          setLoading(false);
          return;
        }

        // Firebase Auth user registration via compatibility SDK
        const credential = await auth.createUserWithEmailAndPassword(targetEmail, password);
        const user = credential.user;
        if (!user) {
          throw new Error("Could not construct auth session payload on this node.");
        }

        // Sync metadata fields to DB
        const userRef = db.ref(`users/${user.uid}`);
        await userRef.set({
          userId: user.uid,
          fullName: cleanedName,
          email: targetEmail,
          balance: 10.0, // initial welcome reward
          transferableBalance: 0.0,
          isMining: false,
          updatedAt: new Date().toISOString()
        });

        setSuccessMsg("Account registered successfully! Secure wallet unlocking now...");
        setTimeout(() => {
          onLoginSuccess({
            name: cleanedName,
            email: targetEmail,
            uid: user.uid
          });
        }, 800);

      } else {
        // Login via Compatibility SDK
        const credential = await auth.signInWithEmailAndPassword(targetEmail, password);
        const user = credential.user;
        if (!user) {
          throw new Error("Credentials incorrect. Authorization handshake rejected.");
        }

        // DB Read to synchronize display variables
        const userRef = db.ref(`users/${user.uid}`);
        const snapshot = await userRef.get();
        let resolvedName = user.displayName || targetEmail.split('@')[0];

        if (snapshot.exists()) {
          const profile = snapshot.val();
          if (profile.fullName) resolvedName = profile.fullName;
        } else {
          // If profile is somehow missing, write one gracefully
          await userRef.set({
            userId: user.uid,
            fullName: resolvedName,
            email: targetEmail,
            balance: 10.0,
            transferableBalance: 0.0,
            isMining: false,
            updatedAt: new Date().toISOString()
          });
        }

        setSuccessMsg("Consensus accepted. Initializing modules...");
        setTimeout(() => {
          onLoginSuccess({
            name: resolvedName,
            email: targetEmail,
            uid: user.uid
          });
        }, 800);
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      let readableErr = err?.message || 'Access gateway handshake denied. Verify details.';
      if (err?.code === 'auth/email-already-in-use') {
        readableErr = 'Security ledger entry conflict: Email already registered.';
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        readableErr = 'Invalid details. Check email structure or passphrase alignment.';
      } else if (err?.code === 'auth/user-not-found') {
        readableErr = 'User account does not exist. Please register first.';
      }
      setError(readableErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#060401] text-white flex flex-col justify-center items-center p-4 md:p-8 font-sans antialiased relative overflow-hidden select-none">
      
      {/* Background elegant modern radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#b45309]/10 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#d97706]/10 rounded-full blur-[160px]"></div>
      </div>

      <div className="relative w-full max-w-[420px] bg-[#0c0a06]/90 border border-white/5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] rounded-[36px] p-6 md:p-8 backdrop-blur-3xl z-10 transition-all">
        
        {/* LOGO & HERO MODULE */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-white/[0.04] mb-6">
          <motion.div 
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/10 relative"
          >
            <Flame className="w-8 h-8 text-black fill-black/5" />
            <div className="absolute inset-0 border border-white/10 rounded-2xl"></div>
          </motion.div>
          
          <h2 className="text-xl font-extrabold uppercase tracking-[0.2em] mt-4 text-[#fcfdfa] flex items-center gap-1">
            POKI<span className="text-amber-500 font-black">NET</span>
          </h2>
          <p className="text-[9.5px] text-amber-500/70 tracking-[0.25em] font-mono uppercase font-bold mt-1">
            India's Leading Virtual Mining Quorum
          </p>
        </div>

        {/* FEEDBACK SYSTEM ALERTS */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-[10.5px] bg-red-500/5 border border-red-500/20 text-red-400 p-3.5 rounded-2xl flex items-start gap-2.5 font-sans leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-[10.5px] bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-2xl flex items-start gap-2.5 font-sans leading-relaxed"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* EMAIL CREDENTIALS ACCESS (SIGN-IN / SIGN-UP) */}
        <div className="min-h-[200px]">
          <form
            onSubmit={handleEmailSignInOrSignUp}
            className="flex flex-col gap-4"
          >
            {/* LEGAL FULL NAME (Exclusive for registration/signup) */}
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9.5px] font-mono font-extrabold text-[#9ca3af] uppercase tracking-wider pl-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" /> Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/40 border border-white/5 hover:border-white/10 focus:border-amber-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none transition-all"
                />
              </div>
            )}

            {/* EMAIL FIELD */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9.5px] font-mono font-extrabold text-[#9ca3af] uppercase tracking-wider pl-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" /> Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/40 border border-white/5 hover:border-white/10 focus:border-amber-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none transition-all font-mono"
              />
            </div>

            {/* PASSWORD FIELD */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9.5px] font-mono font-extrabold text-[#9ca3af] uppercase tracking-wider pl-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" /> Private Passphrase
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/40 border border-white/5 hover:border-white/10 focus:border-amber-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none transition-all"
              />

              {/* Passphrase Complexity indicator */}
              {isSignUp && password.length > 0 && (
                <div className="bg-black/60 border border-white/5 p-3 rounded-2xl flex flex-col gap-1.5 mt-1">
                  <p className="text-[8.5px] uppercase font-mono text-white/30 tracking-wider">Complexity Filters:</p>
                  
                  <div className="flex items-center gap-2 text-[8.5px] font-mono">
                    {passStrength.length ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mx-1"></div>
                    )}
                    <span className={passStrength.length ? 'text-emerald-400' : 'text-white/40'}>
                      At least 8 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[8.5px] font-mono">
                    {passStrength.format ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mx-1"></div>
                    )}
                    <span className={passStrength.format ? 'text-emerald-400' : 'text-white/40'}>
                      Contains numbers & symbols
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SIGN-UP INVITE OPTION */}
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9.5px] font-mono font-extrabold text-[#9ca3af] uppercase tracking-wider pl-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Invite Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. POKI-GOLD"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="bg-black/40 border border-white/5 hover:border-white/10 focus:border-amber-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none transition-all font-mono uppercase"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3.5 rounded-2.5xl text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer mt-2 disabled:opacity-50 flex items-center justify-center gap-2 select-none shadow-md shadow-amber-500/5 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
              ) : (
                <>
                  {isSignUp ? 'Create Core Node' : 'Unlock Mining Node'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Toggle between Login and Signup */}
            <div className="text-center mt-2.5">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}
                className="text-[9.5px] font-semibold text-amber-500/70 hover:text-amber-400 transition-colors uppercase tracking-widest font-mono cursor-pointer decoration-dotted underline underline-offset-4"
              >
                {isSignUp ? "Already a verified member? Log In" : "New member? Sign Up / Create Account"}
              </button>
            </div>
          </form>
        </div>

        {/* OR DIVIDER LINE */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[1px] flex-1 bg-white/[0.04]"></div>
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">OR</span>
          <div className="h-[1px] flex-1 bg-white/[0.04]"></div>
        </div>

        {/* GOOGLE SIGN-IN BUTTON WITH COLORFUL OFFICIAL LOGO */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-[#14120e] hover:bg-[#1a1712] text-white border border-white/5 hover:border-white/10 font-bold py-3.5 px-4 rounded-2.5xl text-[10.5px] uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center justify-center select-none active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          ) : (
            <>
              {/* Clean Official Colorful Google 'G' Icon */}
              <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

      </div>

      {/* CORE FOOTER BRAND METRICS */}
      <div className="flex flex-col items-center gap-2 mt-6">
        <div className="flex justify-center items-center gap-1.5 bg-[#0f0d08] border border-white/5 py-1.5 px-3.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-[8.5px] font-mono text-white/40 uppercase tracking-widest leading-none">
            Secure Cryptographic Validation Mode
          </p>
        </div>
      </div>

    </div>
  );
}
