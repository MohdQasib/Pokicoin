import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  Copy, 
  Unlock, 
  Send, 
  History, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  RotateCcw,
  RefreshCw,
  CreditCard,
  Smartphone,
  Globe,
  DollarSign
} from 'lucide-react';
import { WalletState, Transaction, MiningTeamMember } from '../types';

interface WalletHubProps {
  walletState: WalletState;
  onWalletCreate: (publicKey: string, passphrase: string) => void;
  onWalletUnlock: (passphrase: string) => void;
  onWalletLock: () => void;
  onSendTransaction: (recipient: string, amount: number) => { success: boolean; tx?: Transaction; error?: string };
  onMigrateBalance: () => void;
  kycApproved: boolean;
  transactions: Transaction[];
  teamMembers: MiningTeamMember[];
  balance: number; // total raw mined balance
  onWithdraw?: (method: string, address: string, amountPoki: number, amountINR: number) => { success: boolean; error?: string; tx?: Transaction };
}

const MOCK_BIP39_WORDS = [
  'poki', 'koin', 'mining', 'wallet', 'crypto', 'blockchain', 'ledger', 'node', 'genesis', 'staking',
  'stellar', 'consensus', 'network', 'security', 'circle', 'validation', 'hash', 'block', 'transaction',
  'token', 'speed', 'booster', 'referral', 'kyc', 'liveness', 'passphrase', 'private', 'public',
  'orbit', 'solar', 'nebula', 'planet', 'galaxy', 'cosmos', 'rocket', 'launch', 'emerald', 'sapphire',
  'anchor', 'beacon', 'canvas', 'diesel', 'engine', 'fabric', 'fossil', 'geyser', 'hybrid', 'matrix'
];

export default function WalletHub({
  walletState,
  onWalletCreate,
  onWalletUnlock,
  onWalletLock,
  onSendTransaction,
  onMigrateBalance,
  kycApproved,
  transactions,
  teamMembers,
  balance,
  onWithdraw
}: WalletHubProps) {
  const [typedPassphrase, setTypedPassphrase] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [passphraseVisible, setPassphraseVisible] = useState(false);
  const [transactionNotification, setTransactionNotification] = useState<Transaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Withdrawal States
  const [withdrawalMethod, setWithdrawalMethod] = useState<'upi' | 'phone' | 'crypto'>('upi');
  const [upiId, setUpiId] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [cryptoAddr, setCryptoAddr] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Constants
  const MIN_WITHDRAWAL_POKI = 4545;
  const PARITY_MULTIPLIER = 0.011; // 1 POKI = 0.011 INR, so 4,545 POKI = ~50 INR

  // Derived Values
  const defaultExchangeRateText = "1 POKI = ₹0.011 INR Ledger Parity";

  // Generate 24 random words
  const generatedPassphraseWords = useMemo(() => {
    const shuffled = [...MOCK_BIP39_WORDS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 24).join(' ');
  }, []);

  // Generate a mock public address
  const generatedPublicKey = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < generatedPassphraseWords.length; i++) {
      hash = (hash << 5) - hash + generatedPassphraseWords.charCodeAt(i);
      hash |= 0;
    }
    return 'G' + Math.abs(hash).toString(16).toUpperCase().padStart(12, '3') + 'XVM';
  }, [generatedPassphraseWords]);

  const handleCreate = () => {
    onWalletCreate(generatedPublicKey, generatedPassphraseWords);
    setTypedPassphrase(generatedPassphraseWords);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedPassphrase.trim()) return;
    onWalletUnlock(typedPassphrase.trim());
  };

  const handleSimulatedBiometricUnlock = () => {
    if (walletState.isCreated) {
      onWalletUnlock(walletState.privateKeyPhrase);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(sendAmount);
    if (!recipient || isNaN(amount) || amount <= 0) {
      setErrorMessage('Please enter a valid recipient address and amount.');
      return;
    }

    if (amount > walletState.migratedBalance) {
      setErrorMessage('Insufficient migrated balance in wallet ledger.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    setTimeout(() => {
      const result = onSendTransaction(recipient, amount);
      setIsSending(false);
      
      if (result.success && result.tx) {
        setTransactionNotification(result.tx);
        setRecipient('');
        setSendAmount('');
        setTimeout(() => setTransactionNotification(null), 5000);
      } else {
        setErrorMessage(result.error || 'Transaction failed.');
      }
    }, 2000);
  };

  const handleMigrate = () => {
    if (!kycApproved) return;
    setIsMigrating(true);
    setTimeout(() => {
      onMigrateBalance();
      setIsMigrating(false);
    }, 2000);
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setWithdrawalSuccess(null);

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Please specify a valid amount of Poki Koins to withdraw.');
      return;
    }

    if (amount < MIN_WITHDRAWAL_POKI) {
      setErrorMessage(`The minimum withdrawal threshold is exactly ${MIN_WITHDRAWAL_POKI.toLocaleString()} POKI Coin (~₹50.00 INR equivalent).`);
      return;
    }

    // Determine target balance: can withdraw if migratedBalance or total raw balance is sufficient
    // We deduct from walletState.migratedBalance primarily to reflect token lock logic
    if (amount > walletState.migratedBalance) {
      setErrorMessage(`Insufficient validated ledger balance. You currently have ${walletState.migratedBalance.toFixed(2)} POKI in your verified wallet container.`);
      return;
    }

    let targetAddress = '';
    if (withdrawalMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setErrorMessage('Please enter a valid UPI address (e.g. name@upi).');
        return;
      }
      targetAddress = upiId.trim();
    } else if (withdrawalMethod === 'phone') {
      if (!phoneNo.trim() || phoneNo.length < 10) {
        setErrorMessage('Please enter a valid 10-digit phone number.');
        return;
      }
      targetAddress = phoneNo.trim();
    } else {
      if (!cryptoAddr.trim() || cryptoAddr.length < 15) {
        setErrorMessage('Please enter a valid Crypto Wallet Address (BEP-20 / ERC-20).');
        return;
      }
      targetAddress = cryptoAddr.trim();
    }

    setIsWithdrawing(true);

    const calculatedINR = amount * PARITY_MULTIPLIER;

    setTimeout(() => {
      if (onWithdraw) {
        const result = onWithdraw(withdrawalMethod, targetAddress, amount, calculatedINR);
        setIsWithdrawing(false);
        if (result.success) {
          setWithdrawalSuccess(`Withdrawal Request Created! ₹ ${calculatedINR.toFixed(2)} INR (${amount.toLocaleString()} POKI) is loaded under queue, pending verification.`);
          setWithdrawalAmount('');
          setUpiId('');
          setPhoneNo('');
          setCryptoAddr('');
        } else {
          setErrorMessage(result.error || 'Withdrawal dispatch failed.');
        }
      } else {
        setIsWithdrawing(false);
        setErrorMessage('Withdrawal handler not connected to main applet.');
      }
    }, 2500);
  };

  const handleCopyPassphrase = () => {
    navigator.clipboard.writeText(walletState.privateKeyPhrase || generatedPassphraseWords);
    alert('📋 Core BIP39 Passphrase copied safely!');
  };

  const handleCopyPublicAddress = () => {
    navigator.clipboard.writeText(walletState.publicKey);
    alert('📋 Wallet Public Key Address copied!');
  };

  const availablePeers = teamMembers.filter(m => !m.isSecurityCircle || m.role === 'Security');

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white overflow-y-auto no-scrollbar pb-6 p-6">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 sticky top-0 bg-[#0a0802]/85 backdrop-blur-md z-10 select-none">
        <div>
          <h2 className="text-base font-display font-black text-white uppercase tracking-widest font-sans">Verified Ledger Wallet</h2>
          <p className="text-[9.5px] text-white/40 mt-1 uppercase tracking-wider font-mono">Consensus peer sync & withdrawal node</p>
        </div>
        <Key className="w-5 h-5 text-amber-400 animate-pulse" />
      </div>

      {!walletState.isCreated ? (
        /* WALLET GENERATOR VIEW */
        <div className="flex-1 flex flex-col justify-center py-4 relative z-10 select-none">
          <div className="bg-white/5 rounded-2.5xl p-6 border border-white/10 flex flex-col items-center text-center gap-5 backdrop-blur-sm shadow-xl">
            <div className="w-12 h-12 bg-amber-950/40 text-amber-400 border border-amber-800/45 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#facc15]">Generate Core Wallet Keys</h3>
              <p className="text-[10.5px] text-white/50 mt-1.5 px-3 leading-relaxed font-sans">
                Each miner node uses an asymmetric BIP39 cryptographic passphrase. This ensures localized ledger ownership. We never record your secret private keys.
              </p>
            </div>

            <div className="w-full bg-[#0a0802]/80 p-4.5 rounded-2xl border border-white/10 relative">
              <span className="text-[8px] text-white/45 uppercase tracking-[0.2em] font-mono block mb-2 text-left">Generated Master seed Matrix</span>
              <div className={`text-xs font-mono select-all bg-[#030303]/40 border border-white/5 p-3 rounded-xl leading-relaxed text-left break-all h-20 overflow-y-auto no-scrollbar ${passphraseVisible ? 'text-white' : 'text-white/10 blur-[4.5px]'}`}>
                {generatedPassphraseWords}
              </div>
              
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setPassphraseVisible(!passphraseVisible)}
                  className="p-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] text-white/60 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {passphraseVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {passphraseVisible ? 'Hide seed' : 'Reveal'}
                </button>
                <button
                  onClick={handleCopyPassphrase}
                  className="p-1.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[9px] text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Seed
                </button>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-2xl text-left text-[10px] flex gap-3 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <p className="leading-relaxed font-sans">
                <strong>IMPORTANT NOTE:</strong> Save this private matrix credentials now. Secure offline persistence is recommended. Inability to supply seed key results in network asset loss.
              </p>
            </div>

            <button
              id="initial-create-wallet-btn"
              onClick={handleCreate}
              className="w-full bg-gradient-to-tr from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors cursor-pointer select-none active:scale-95"
            >
              Generate Wallet & Sync Account
            </button>
          </div>
        </div>
      ) : !walletState.isUnlocked ? (
        /* WALLET UNLOCK VIEW */
        <div className="flex-1 flex flex-col justify-center py-4 relative z-10 select-none">
          <div className="bg-white/5 border border-white/10 rounded-2.5xl p-6 flex flex-col gap-5 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-amber-950/40 border border-amber-900/30 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-2">
                <Unlock className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#facc15]">Unlock Ledger Container</h3>
              <p className="text-[10px] text-white/55 mt-1">Provide master 24-word credentials to decrypt keys</p>
            </div>

            <form onSubmit={handleUnlock} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] font-mono font-bold text-white/40 uppercase tracking-widest">Seed Phrase Matrix</label>
                <textarea
                  id="unlock-passphrase-input"
                  rows={3}
                  placeholder="Paste your 24-word secure phrase here to authenticate..."
                  value={typedPassphrase}
                  onChange={(e) => setTypedPassphrase(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white/95 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  id="biometric-fingerprint-unlock-btn"
                  type="button"
                  onClick={handleSimulatedBiometricUnlock}
                  className="bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-bold py-2.5 px-3 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Fingerprint className="w-4 h-4 text-amber-400" />
                  <span>Biometric unlock</span>
                </button>
                
                <button
                  id="submit-unlock-wallet-btn"
                  type="submit"
                  className="flex-1 bg-gradient-to-tr from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors cursor-pointer active:scale-95"
                >
                  Unlock Ledger
                </button>
              </div>

              <button
                id="reset-passphrase-wallet-btn"
                type="button"
                onClick={onWalletLock}
                className="text-[9px] text-[#facc15] hover:text-amber-300 uppercase tracking-widest text-center flex items-center gap-1.5 justify-center border-t border-white/5 pt-3.5 cursor-pointer mt-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 
                <span>Re-generate seed matrix</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* WALLET MAIN VIEW (UNLOCKED) */
        <div className="flex flex-col gap-5 relative z-10">
          
          {/* A. BALANCE DESKTOP SEGMENT (Poki coin balance and INR equivalent) */}
          <div className="bg-[#0b0904] border border-amber-500/20 rounded-3xl p-5.5 flex flex-col gap-4 relative overflow-hidden shadow-inner">
            <div className="absolute right-0 top-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex justify-between items-start border-b border-white/[0.04] pb-4">
              <div>
                <span className="text-[8px] font-mono text-white/45 tracking-widest uppercase">Verified Ledger Wallet</span>
                <div className="text-2xl font-black font-display text-white flex items-baseline select-none mt-0.5">
                  {walletState.migratedBalance.toFixed(4)}
                  <span className="text-[10px] text-amber-400 font-extrabold ml-1.5 font-mono">POKI</span>
                </div>
                {/* INR Conversion calculated with exact 0.001 Parity (1000 POKI = 1 INR) */}
                <div className="text-[11px] text-emerald-400 font-extrabold font-mono mt-0.5">
                  ₹ {(walletState.migratedBalance * PARITY_MULTIPLIER).toFixed(2)} INR Equivalent
                </div>
              </div>

              <button
                onClick={onWalletLock}
                className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 px-3 py-1.5 rounded-full text-[8.5px] uppercase font-mono tracking-widest cursor-pointer scale-95 transition-all"
              >
                Lock Wallet
              </button>
            </div>
          </div>

          {/* TRANSFER MECHANISM & MIGRATION CARD (IF USER WANTS TO SYNC PREVIOUS INLINE ASSETS) */}
          {walletState.transferableBalance > 0 && (
            <div className="bg-[#120f09]/40 border border-amber-500/10 rounded-2.5xl p-4 flex items-center justify-between">
              <div className="text-left">
                <h4 className="text-[11px] font-bold text-white uppercase font-sans">Convert Mined Assets</h4>
                <p className="text-[9px] text-white/40 uppercase mt-0.5">Migrate raw miner ledger into verified wallet container</p>
              </div>

              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
              >
                {isMigrating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                <span>Migrate balance</span>
              </button>
            </div>
          )}

          {/* B & C. WITHDRAWAL MATRIX (UPI ID, phone number, crypto wallet address) */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 text-left">
            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5 pb-3 border-b border-white/[0.04] mb-4.5">
              <CreditCard className="w-4.5 h-4.5 text-amber-500" />
              <span>Asset Redemption Pool</span>
            </h3>

            {errorMessage && (
              <div className="mb-4 bg-red-950/20 border border-red-500/25 text-red-300 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {withdrawalSuccess && (
              <div className="mb-4 bg-emerald-950/20 border border-emerald-500/25 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{withdrawalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawalSubmit} className="flex flex-col gap-4">
              
              {/* Select Withdrawal Options */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[8.5px] font-mono uppercase tracking-wider text-white/45 pl-0.5">Redemption Channel Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawalMethod('upi')}
                    className={`py-3.5 border rounded-xl font-bold uppercase text-[9px] tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                      withdrawalMethod === 'upi'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                        : 'border-white/5 bg-[#070502]/45 text-white/40 hover:border-white/10 hover:text-white/70'
                    }`}
                  >
                    <CreditCard className="w-4.5 h-4.5" />
                    <span>UPI Gate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawalMethod('phone')}
                    className={`py-3.5 border rounded-xl font-bold uppercase text-[9px] tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                      withdrawalMethod === 'phone'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                        : 'border-white/5 bg-[#070502]/45 text-white/40 hover:border-white/10 hover:text-white/70'
                    }`}
                  >
                    <Smartphone className="w-4.5 h-4.5" />
                    <span>Phone Gpay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawalMethod('crypto')}
                    className={`py-3.5 border rounded-xl font-bold uppercase text-[9px] tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                      withdrawalMethod === 'crypto'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                        : 'border-white/5 bg-[#070502]/45 text-white/40 hover:border-white/10 hover:text-white/70'
                    }`}
                  >
                    <Globe className="w-4.5 h-4.5" />
                    <span>Crypto (BSC)</span>
                  </button>
                </div>
              </div>

              {/* Dynamic input display matching current choice */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[8.5px] font-mono uppercase tracking-wider text-white/50 pl-1">
                  {withdrawalMethod === 'upi' ? 'UPI Address' : withdrawalMethod === 'phone' ? 'Phone Paytm/PhonePe Number' : 'BEP-20 / ERC-20 Address'}
                </label>
                
                {withdrawalMethod === 'upi' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter UPI Address (e.g. name@paytm, secure@oksbi)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-3.5 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                  />
                )}

                {withdrawalMethod === 'phone' && (
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number linked to GPay/Paytm"
                    value={phoneNo}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPhoneNo(val);
                    }}
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-3.5 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                  />
                )}

                {withdrawalMethod === 'crypto' && (
                  <input
                    type="text"
                    required
                    placeholder="Paste BEP20/ERC20 wallet destination vector (e.g. 0x...)"
                    value={cryptoAddr}
                    onChange={(e) => setCryptoAddr(e.target.value)}
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-3.5 py-3 text-[10.5px] text-white placeholder-white/20 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                  />
                )}
              </div>

              {/* Input for Withdrawal Coins quantity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[8.5px] font-mono uppercase tracking-wider text-white/50 pl-1">Redeem Amount (POKI)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder={`Enter amount (Minimum: ${MIN_WITHDRAWAL_POKI.toLocaleString()} POKI)`}
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="w-full bg-black/60 border border-white/5 rounded-xl pl-3.5 pr-24 py-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawalAmount(Math.floor(walletState.migratedBalance).toString())}
                    className="absolute right-3.5 top-3 text-[8.5px] font-extrabold uppercase text-[#facc15] font-mono hover:text-amber-300 cursor-pointer"
                  >
                    Max Limit
                  </button>
                </div>
                
                {/* Real-time calculated rate block */}
                <div className="flex justify-between items-center text-[8.5px] pl-1 font-mono uppercase tracking-wider">
                  <span className="text-white/30">Exchange: 1 POKI = ₹0.011 INR</span>
                  {withdrawalAmount && !isNaN(parseFloat(withdrawalAmount)) && (
                    <span className="text-emerald-400 font-extrabold">
                      Est. Payout: ₹ {(parseFloat(withdrawalAmount) * PARITY_MULTIPLIER).toFixed(2)} INR
                    </span>
                  )}
                </div>
              </div>

              {/* C. Fully professional and working withdrawal button that sends request to DB */}
              <button
                type="submit"
                disabled={isWithdrawing || walletState.migratedBalance < MIN_WITHDRAWAL_POKI}
                className={`w-full py-3.5 rounded-xl text-[10px] uppercase tracking-widest font-mono font-black border transition-all cursor-pointer ${
                  walletState.migratedBalance >= MIN_WITHDRAWAL_POKI
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-[#090804] border-amber-400/40 hover:from-amber-400 active:scale-98 shadow hover:shadow-xl'
                    : 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                {isWithdrawing ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting dispatch request...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-black shrink-0" />
                    <span>Submit withdrawal request</span>
                  </span>
                )}
              </button>

              {/* Notice text box right BELOW the withdrawal action button */}
              <div 
                id="withdrawal-notice-box" 
                className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-left text-amber-300 font-sans text-[11px] leading-relaxed shadow-inner"
              >
                Notice: Minimum withdrawal limit is 4,545 POKI (₹50.00). Payouts are processed within 24-48 hours directly to your UPI ID.
              </div>

              {/* D. Payment schedule disclosure note below button */}
              <div className="border-t border-white/[0.04] pt-4.5 mt-2 flex gap-3 text-white/45 pl-1 select-none">
                <AlertTriangle className="w-4 h-4 text-[#facc15]/60 shrink-0 mt-0.5" />
                <p className="text-[9px] leading-relaxed uppercase tracking-wide font-mono">
                  <strong className="text-white">Redemption Scheduler Dispatch Rule:</strong> Withdrawals requested before 15th of the month will be processed on the 30th/31st of the same month. Requests after the 15th will be processed on the 15th of the next month.
                </p>
              </div>

            </form>
          </div>

          {/* D. TRANSACTION HISTORY LIST (Ledger Transaction types color coding) */}
          <div>
            <h3 className="text-[9.5px] font-bold text-white/45 uppercase tracking-widest mb-3.5 flex items-center gap-1.5 pl-1">
              <History className="w-4 h-4 text-white/30 shrink-0" />
              <span>Verifiable Blockchain Ledger ({transactions.length})</span>
            </h3>

            {transactions.length === 0 ? (
              <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-2xl p-6 text-center text-[10px] text-white/35 font-mono uppercase tracking-wider">
                No ledger records mapped to this address vector yet. Initialize peer transfers or withdraw assets.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {transactions.map((tx) => {
                  const isSender = tx.sender === walletState.publicKey;
                  const isWithdrawal = tx.type === 'withdrawal' || tx.recipient.startsWith('WITHDRAWAL');
                  const isMining = tx.type === 'mining';

                  return (
                    <div 
                      key={tx.id} 
                      className={`border rounded-2xl p-3.5 flex justify-between items-center text-xs transition-all hover:border-white/15 shadow-sm bg-[#090804] ${
                        isWithdrawal 
                          ? 'border-orange-500 p-3.5 bg-gradient-to-r from-orange-950/15 to-rose-950/20' 
                          : isMining 
                          ? 'border-emerald-500/20 bg-gradient-to-r from-emerald-950/5 to-teal-950/10'
                          : 'border-white/5 hover:border-white/10 bg-black/45'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border shrink-0 ${
                          isWithdrawal 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                            : isMining 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                            : isSender 
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {isWithdrawal ? (
                            <CreditCard className="w-4 h-4" />
                          ) : isMining ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : isSender ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        
                        <div className="text-left flex flex-col gap-0.5">
                          <p className="font-extrabold text-white">
                            {isWithdrawal 
                              ? `INR Wallet Redemption` 
                              : isMining 
                              ? 'Mining Pool consensus gain' 
                              : isSender 
                              ? 'Validated Transfer Out' 
                              : 'Incoming Consensus Reward'}
                          </p>
                          
                          {/* Metadata / Address Info */}
                          <div className="font-mono text-[8.5px] uppercase tracking-wide text-white/40 flex flex-col gap-0.5 mt-0.5 leading-none">
                            <span>
                              {isWithdrawal 
                                ? `Channel: ${tx.recipient.replace('WITHDRAWAL-', '').toUpperCase()} | Target: ${tx.metadata?.destination || 'Requested wallet'}`
                                : `Peer Node Address: ${isSender ? tx.recipient.substring(0, 12) : tx.sender.substring(0, 12)}...`
                              }
                            </span>
                            <span>Block Height ID: #{tx.blockNumber || 108529}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1 font-mono">
                        <span className={`font-extrabold font-mono text-[11.5px] ${
                          isWithdrawal 
                            ? 'text-rose-500' 
                            : isMining 
                            ? 'text-emerald-400' 
                            : isSender 
                            ? 'text-orange-400' 
                            : 'text-amber-400'
                        }`}>
                          {isWithdrawal || isSender ? '-' : '+'}{tx.amount.toFixed(2)} POKI
                        </span>
                        
                        {/* Rupees Conversion calculated dynamically */}
                        <div className="text-[8.5px] text-white/35 font-mono">
                          ₹ {(tx.amount * PARITY_MULTIPLIER).toFixed(2)} INR
                        </div>

                        {/* Specific Withdrawal / Mining Status Badge */}
                        {isWithdrawal ? (
                          <span className="text-[8px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono px-2 py-0.5 rounded uppercase font-bold animate-pulse mt-0.5">
                            Processing queue
                          </span>
                        ) : (
                          <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-mono px-2 py-0.5 rounded uppercase mt-0.5">
                            Core Validated
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
