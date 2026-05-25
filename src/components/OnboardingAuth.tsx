import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  Mail, 
  Phone, 
  Lock, 
  User, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Globe, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ChevronRight, 
  Fingerprint,
  Smartphone,
  Info
} from 'lucide-react';
import { useFirebase } from '../lib/firebase';
import { 
  auth,
  db,
  requestOTPMessage, 
  confirmOTPAndAuthorize, 
  validateIndianPhoneNumber 
} from '../lib/firebaseCompatService';

interface OnboardingAuthProps {
  onLoginSuccess: (user: { name: string; email: string; phone?: string; uid?: string }) => void;
}

export default function OnboardingAuth({ onLoginSuccess }: OnboardingAuthProps) {
  // Tabs: Form A (login), Form B (signup), Form C (phone verification)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'phone'>('signup');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91'); // Default to +91 Indian code or others
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Status metrics
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [passStrength, setPassStrength] = useState({ length: false, format: false });

  // Instantly sanitize password strength
  useEffect(() => {
    setPassStrength({
      length: password.length >= 8,
      format: /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)
    });
  }, [password]);

  // Clean error messages on switch
  const handleSwitchTab = (mode: 'login' | 'signup' | 'phone') => {
    setAuthMode(mode);
    setError('');
    setSuccessMsg('');
    setOtpRequested(false);
    setOtpCode('');
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const trimPhone = phone.trim();
    if (!trimPhone) {
      setError('Please provide a valid Indian mobile number.');
      return;
    }

    setLoading(true);
    const fullPhone = `${countryCode}${trimPhone}`;

    if (!useFirebase) {
      // Sandbox Simulator validation mode (Offline Fallback)
      setTimeout(() => {
        setLoading(false);
        setOtpRequested(true);
        setSuccessMsg(`[SIMULATOR] One-Time Verification code sent to ${fullPhone}. Use '123456' to pass.`);
      }, 1000);
      return;
    }

    try {
      // Validate with our strict Indian cellular filters first
      const valResponse = validateIndianPhoneNumber(trimPhone);
      if (!valResponse.isValid) {
        setError(valResponse.error || 'Please provide a valid Indian phone format (e.g. 10 digits starting with 6-9).');
        setLoading(false);
        return;
      }

      // Safe initialization of compatibility reCAPTCHA and OTP sms delivery
      const res = await requestOTPMessage(trimPhone, 'recaptcha-container', () => {
        setLoading(false);
        setOtpRequested(false);
      });

      if (res.success && res.confirmationResult) {
        setConfirmationResult(res.confirmationResult);
        setOtpRequested(true);
        setSuccessMsg(res.message);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      setError(err?.message || "Could not deliver OTP. Check number format or project settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (otpCode.length !== 6) {
      setError('Standard OTP codes must be exact 6 digits.');
      return;
    }

    setLoading(true);

    if (!useFirebase) {
      // Sandbox confirmation simulator
      setTimeout(() => {
        setLoading(false);
        if (otpCode === '123456') {
          const mockUser = {
            name: `Poki Miner ${phone.slice(-4)}`,
            email: `${phone}@pokicoin-rtdb.in`,
            phone: `${countryCode}${phone}`,
            uid: `rtdb_phone_${phone}`
          };
          onLoginSuccess(mockUser);
        } else {
          setError('Invalid simulated OTP verification code. Try "123456".');
        }
      }, 1000);
      return;
    }

    try {
      if (!confirmationResult) {
        throw new Error("No active verification session found. Request OTP again.");
      }

      const verifyRes = await confirmOTPAndAuthorize(confirmationResult, otpCode);
      if (verifyRes.success && verifyRes.user) {
        const user = verifyRes.user;
        setLoading(false);

        // Fetch display node name directly from Realtime Database to match Returning user name
        const userRef = db.ref(`users/${user.uid}`);
        const snapshot = await userRef.get();
        let userName = user.displayName || `Phone User ${user.phoneNumber?.slice(-4) || 'Peer'}`;
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data?.fullName) {
            userName = data.fullName;
          }
        }

        onLoginSuccess({
          name: userName,
          email: user.email || `${user.phoneNumber || user.uid}@pokicoin-rtdb.in`,
          phone: user.phoneNumber || undefined,
          uid: user.uid
        });
      } else {
        setError(verifyRes.message || 'Validation handshake rejected.');
      }
    } catch (err: any) {
      console.error("OTP Code validation failed:", err);
      setError(err?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInOrSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Sanitization & Security checks
    const targetEmail = email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please provide a grammatically correct email address.');
      return;
    }

    if (password.length < 8) {
      setError('Passphrase must align with 8-character size limits.');
      return;
    }

    setLoading(true);

    if (!useFirebase) {
      // Offline Local Mode support to guarantee zero lockout on review
      setTimeout(() => {
        setLoading(false);
        const resolvedName = name || targetEmail.split('@')[0];
        onLoginSuccess({
          name: resolvedName,
          email: targetEmail,
          uid: 'offline_local_sandbox_miner'
        });
      }, 1100);
      return;
    }

    try {
      if (authMode === 'signup') {
        const cleanedName = name.trim();
        if (!cleanedName) {
          setError('A validated full legal name is required for registration audit.');
          setLoading(false);
          return;
        }

        // Firebase Auth user registration via compatibility SDK
        const credential = await auth.createUserWithEmailAndPassword(targetEmail, password);
        const user = credential.user;
        if (!user) {
          throw new Error("Could not construct auth session payload on this node.");
        }

        // Sync metadata fields to DB (Verified Database Handshake via Compatibility SDK)
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

        setSuccessMsg("Account created! Logging inside Poki Wallet now...");
        setTimeout(() => {
          onLoginSuccess({
            name: cleanedName,
            email: targetEmail,
            uid: user.uid
          });
        }, 800);

      } else {
        // Form A: Login via Compatibility SDK
        const credential = await auth.signInWithEmailAndPassword(targetEmail, password);
        const user = credential.user;
        if (!user) {
          throw new Error("Credentials invalid. Connection handshakes rejected.");
        }

        // Verified Handshake Read
        const userRef = db.ref(`users/${user.uid}`);
        const snapshot = await userRef.get();
        let resolvedName = user.displayName || targetEmail.split('@')[0];

        if (snapshot.exists()) {
          const profile = snapshot.val();
          if (profile.fullName) resolvedName = profile.fullName;
        } else {
          // Sync profile to database if it was somehow skipped previously
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

        setSuccessMsg("Consensus unlocked. Loading modules...");
        setTimeout(() => {
          onLoginSuccess({
            name: resolvedName,
            email: targetEmail,
            uid: user.uid
          });
        }, 800);
      }
    } catch (err: any) {
      console.error("Auth Failure:", err);
      // Human friendly translations for raw firebase code exceptions:
      let readableErr = err?.message || 'Access gateway handshake denied. Verify details.';
      if (err?.code === 'auth/email-already-in-use') {
        readableErr = 'Security ledger entry conflict: Email already registered.';
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        readableErr = 'Security credential misalignment: Incorrect details.';
      } else if (err?.code === 'auth/user-not-found') {
        readableErr = 'Registration directory missing: User does not exist.';
      }
      setError(readableErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden fixed inset-0 m-0 p-0 bg-[#080602] text-white flex flex-col items-center justify-center z-[9999] font-sans antialiased">
      
      {/* Background ambient radial glow matching Poki's premium design philosophy */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-amber-950/20 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-yellow-950/20 rounded-full blur-[160px]"></div>
      </div>

      {/* Invisible Recaptcha rendering element required by Firebase Auth */}
      <div id="recaptcha-container"></div>

      <div className="relative w-full max-w-sm px-6 py-8 flex flex-col justify-between h-full max-h-[780px] z-10">
        
        {/* UPPER HEADER - APP BRAND */}
        <div className="flex flex-col items-center text-center mt-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center shadow-2xl shadow-amber-500/30 relative"
          >
            <Flame className="w-9 h-9 text-black fill-black/10" />
            <div className="absolute inset-0 border border-white/20 rounded-2xl"></div>
          </motion.div>
          
          <h2 className="text-2xl font-bold uppercase tracking-[0.15em] mt-5 text-[#fafffa] font-display flex items-center gap-1.5 leading-none">
            POKI<span className="text-amber-400 font-extrabold text-3xl">NET</span>
          </h2>
          <p className="text-[10px] text-amber-500/80 tracking-[0.3em] font-mono uppercase font-bold mt-1.5">
            minipocicoin.in • AUTH GATEWAY
          </p>
        </div>

        {/* AUTHENTICATION SLOTS / CARD VIEW */}
        <div className="my-auto">
          <div className="bg-[#0f0d08] border border-white/10 rounded-[32px] p-6 shadow-2xl shadow-black/80 relative overflow-hidden backdrop-blur-xl">
            
            {/* Horizontal Segment tabs selector */}
            <div className="flex bg-black/60 border border-white/5 rounded-2xl p-1 mb-6">
              <button
                onClick={() => handleSwitchTab('signup')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  authMode === 'signup' 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' 
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => handleSwitchTab('login')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  authMode === 'login' 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' 
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => handleSwitchTab('phone')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  authMode === 'phone' 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' 
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                OTP Phone
              </button>
            </div>

            {/* Error alerts indicator */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-[10px] bg-red-950/20 border border-red-500/30 text-red-300 p-3 rounded-2xl flex items-start gap-2 font-mono"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success alerts indicator */}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-[10px] bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl flex items-start gap-2 font-mono"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Conditional input form rendering */}
            <AnimatePresence mode="wait">
              {authMode !== 'phone' ? (
                // Form A (Login) & Form B (Secure Registration)
                <motion.form
                  key="email-forms"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onSubmit={handleSignInOrSignUp}
                  className="flex flex-col gap-4"
                >
                  {/* FULL LEGAL NAME (Sign-Up exclusive) */}
                  {authMode === 'signup' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 pl-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" /> Legal Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-black/50 border border-white/10 hover:border-white/20 focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/30 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none transition-all"
                      />
                    </div>
                  )}

                  {/* EMAIL INPUT */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 pl-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-400" /> Email Access
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@minipocicoin.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/50 border border-white/10 hover:border-white/20 focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/30 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none transition-all font-mono"
                    />
                  </div>

                  {/* PASSWORD INPUT */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center px-1.5">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" /> Private Key / password
                      </label>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/50 border border-white/10 hover:border-white/20 focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/30 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none transition-all"
                    />
                    
                    {/* Password complexity checklist (Exclusive to Sign Up) */}
                    {authMode === 'signup' && password.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1 bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <p className="text-[8.5px] uppercase font-mono text-white/30 tracking-wider">Complexity Thresholds:</p>
                        <div className="flex items-center gap-1.5 text-[8.5px] font-mono mt-0.5">
                          {passStrength.length ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                          )}
                          <span className={passStrength.length ? 'text-emerald-400' : 'text-white/40'}>
                            Minimum length 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8.5px] font-mono">
                          {passStrength.format ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                          )}
                          <span className={passStrength.format ? 'text-emerald-400' : 'text-white/40'}>
                            Includes numbers & special characters
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECURE REFERRAL CODE */}
                  {authMode === 'signup' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 pl-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Invite Code (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. POKI-ALPHA"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        className="bg-black/50 border border-white/10 hover:border-white/20 focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/30 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none transition-all font-mono uppercase"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer mt-3 disabled:opacity-50 flex items-center justify-center gap-2 select-none shadow-lg shadow-amber-500/10 active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                    ) : (
                      <>
                        {authMode === 'signup' ? 'Create Poki Core Key' : 'Unlock Mining Node'}
                        <ArrowRight className="w-3.5 h-3.5 text-black shrink-0" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                // Form C: Secure Phone OTP Authentication (With Country code & request flow)
                <motion.div
                  key="phone-otp-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col gap-4"
                >
                  <AnimatePresence mode="wait">
                    {!otpRequested ? (
                      /* STEP 1: REQUEST VERIFICATION SMS */
                      <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 pl-1.5">
                            <Phone className="w-3.5 h-3.5 text-amber-400" /> Phone Registration
                          </label>
                          <div className="flex gap-2">
                            <select 
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="bg-black/60 border border-white/10 hover:border-white/20 focus:border-amber-400 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none transition-all font-mono shrink-0"
                            >
                              <option value="+91">+91 (IN)</option>
                              <option value="+1">+1 (US)</option>
                              <option value="+44">+44 (UK)</option>
                              <option value="+61">+61 (AU)</option>
                              <option value="+971">+971 (AE)</option>
                              <option value="+82">+82 (KR)</option>
                            </select>
                            <input
                              type="tel"
                              required
                              placeholder="98765 43210"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g,''))}
                              className="flex-1 bg-black/50 border border-white/10 hover:border-white/20 focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/30 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none transition-all font-mono"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer mt-3 disabled:opacity-50 flex items-center justify-center gap-2 select-none active:scale-[0.98]"
                        >
                          {loading ? (
                            <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                          ) : (
                            <>
                              Request SMS Code
                              <Smartphone className="w-3.5 h-3.5 text-black shrink-0" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* STEP 2: VERIFY OTP CODE */
                      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 pl-1.5">
                            <Fingerprint className="w-3.5 h-3.5 text-amber-400" /> Enter 6-Digit OTP Code
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="e.g. 123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g,''))}
                            className="bg-black/50 border border-white/10 hover:border-white/20 focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/30 rounded-2xl px-4 py-4 text-center text-lg tracking-[0.4em] font-black text-amber-400 placeholder-white/10 focus:outline-none transition-all font-mono"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer mt-3 disabled:opacity-50 flex items-center justify-center gap-2 select-none active:scale-[0.98]"
                        >
                          {loading ? (
                            <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                          ) : (
                            <>
                              Verify & Unlock Node
                              <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => { setOtpRequested(false); setSuccessMsg(''); }}
                          className="text-[9px] font-bold tracking-widest font-mono text-amber-500/80 hover:text-amber-400 mx-auto uppercase mt-1 cursor-pointer"
                        >
                          ← Change Phone Number
                        </button>
                      </form>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Offline notification badge if config is empty */}
            {!useFirebase && (
              <div className="mt-4 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[8.5px] font-mono leading-relaxed text-amber-400/70 uppercase">
                  SIMULATOR ONLINE: Using local isolation mode since no network handshake is authorized. Feel free to pass or verify any details.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* BOTTOM METRICS BANNER / FOOTER */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex justify-center items-center gap-2 bg-[#0f0d08] border border-white/5 py-2 px-4 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <p className="text-[8.5px] font-mono text-white/40 uppercase tracking-widest leading-none">
              CONSENSUS QUORUM AT (<strong>512/512 ACTIVE</strong>)
            </p>
          </div>
          
          <p className="text-[8.5px] leading-relaxed text-white/30 text-center font-sans tracking-wide max-w-xs">
            By unlocking your node, you verify your device as a validated peer in the pokinet quorums. Core synchronizes continuously.
          </p>
        </div>

      </div>

    </div>
  );
}
