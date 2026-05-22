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
  ExternalLink, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  RotateCcw,
  RefreshCw,
  TrendingDown
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
}

// BIP39-like dictionary for passphrase generation
const MOCK_BIP39_WORDS = [
  'apple', 'banana', 'cherry', 'digital', 'crypto', 'blockchain', 'ledger', 'node', 'genesis', 'staking',
  'stellar', 'consensus', 'network', 'wallet', 'security', 'circle', 'validation', 'hash', 'block', 'transaction',
  'token', 'mining', 'speed', 'booster', 'referral', 'kyc', 'liveness', 'passphrase', 'private', 'public',
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
}: WalletHubProps) {
  const [typedPassphrase, setTypedPassphrase] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [passphraseVisible, setPassphraseVisible] = useState(false);
  const [transactionNotification, setTransactionNotification] = useState<Transaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Generate 24 random words from the bip39 list
  const generatedPassphraseWords = useMemo(() => {
    const shuffled = [...MOCK_BIP39_WORDS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 24).join(' ');
  }, []);

  // Generate a mock public address from the word generator
  const generatedPublicKey = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < generatedPassphraseWords.length; i++) {
      hash = (hash << 5) - hash + generatedPassphraseWords.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return 'G' + Math.abs(hash).toString(16).toUpperCase().padStart(12, '3') + 'XVM';
  }, [generatedPassphraseWords]);

  const handleCreate = () => {
    onWalletCreate(generatedPublicKey, generatedPassphraseWords);
    setTypedPassphrase(generatedPassphraseWords); // pre-populate for ease
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedPassphrase.trim()) return;
    onWalletUnlock(typedPassphrase.trim());
  };

  const handleSimulatedBiometricUnlock = () => {
    // Allows instant unlock if wallet is already created
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

    // Simulate node validation delay
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

  const handleCopyPassphrase = () => {
    navigator.clipboard.writeText(walletState.privateKeyPhrase || generatedPassphraseWords);
  };

  const handleCopyPublicAddress = () => {
    navigator.clipboard.writeText(walletState.publicKey);
  };

  // List of transfer recipients (peers) for easy click fill 
  const availablePeers = teamMembers.filter(m => !m.isSecurityCircle || m.role === 'Security');

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white overflow-y-auto no-scrollbar pb-6 p-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 sticky top-0 bg-[#020208]/40 backdrop-blur-md z-10">
        <div>
          <h2 className="text-base font-display font-bold text-white uppercase tracking-widest font-sans">Simulated Node Wallet</h2>
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Decentralized asset ledger verified keys</p>
        </div>
        <Key className="w-5 h-5 text-cyan-400" />
      </div>

      {!walletState.isCreated ? (
        /* WALLET GENERATOR VIEW */
        <div className="flex-1 flex flex-col justify-center py-4 relative z-10">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center gap-5 backdrop-blur-sm shadow-xl">
            <div className="w-12 h-12 bg-cyan-950/40 text-cyan-400 border border-cyan-800/45 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#67e8f9]">Generate Cryptographic Keys</h3>
              <p className="text-[11px] text-white/50 mt-1.5 px-3 leading-relaxed">
                Decentralized nodes require a passphrase. This 24-word string resolves to your asymmetric key pairs. We do not store this private vector.
              </p>
            </div>

            <div className="w-full bg-[#020208]/60 p-4 rounded-xl border border-white/10 relative">
              <span className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-mono block mb-2 text-left">Asymmetric BIP39 Seed Matrix</span>
              <div className={`text-xs font-mono select-all bg-[#020208]/30 border border-white/10 p-3 rounded-xl leading-relaxed text-left break-all h-20 overflow-y-auto no-scrollbar ${passphraseVisible ? 'text-white' : 'text-white/20 blur-[4px]'}`}>
                {generatedPassphraseWords}
              </div>
              
              <div className="flex justify-end gap-2 mt-3">
                <button
                  id="toggle-passphrase-visibility"
                  onClick={() => setPassphraseVisible(!passphraseVisible)}
                  className="p-1 px-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] text-white/60 flex items-center gap-1 cursor-pointer"
                >
                  {passphraseVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {passphraseVisible ? 'Hide' : 'Reveal'}
                </button>
                <button
                  id="copy-passphrase-seed"
                  onClick={handleCopyPassphrase}
                  className="p-1 px-2.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[9px] text-[#67e8f9] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Seed
                </button>
              </div>
            </div>

            <div className="bg-orange-950/20 border border-orange-500/20 p-4 rounded-xl text-left text-[11px] flex gap-3 text-orange-200">
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-sans">
                <strong>CRITICAL:</strong> Keep your passphrase secure. Any individual with this seed matrix can sign blocks and transfer your virtual balances.
              </p>
            </div>

            <button
              id="initial-create-wallet-btn"
              onClick={handleCreate}
              className="w-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
            >
              Initialize Node & Copy Seed
            </button>
          </div>
        </div>
      ) : !walletState.isUnlocked ? (
        /* WALLET UNLOCK VIEW */
        <div className="flex-1 flex flex-col justify-center py-4 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-5 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-cyan-950/40 border border-cyan-900/30 rounded-full flex items-center justify-center mx-auto text-cyan-400 mb-2">
                <Unlock className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#67e8f9]">Unlock Ledger Access</h3>
              <p className="text-[11px] text-white/55 mt-1">Provide seed matrix credentials to confirm your signature</p>
            </div>

            <form onSubmit={handleUnlock} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Seed Phrase Passphrase</label>
                <textarea
                  id="unlock-passphrase-input"
                  rows={3}
                  placeholder="Paste your 24-word secure phrase here..."
                  value={typedPassphrase}
                  onChange={(e) => setTypedPassphrase(e.target.value)}
                  className="bg-[#020208]/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white/95 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  id="biometric-fingerprint-unlock-btn"
                  type="button"
                  onClick={handleSimulatedBiometricUnlock}
                  className="bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-bold py-2.5 px-3 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                  <span>Use Touch ID</span>
                </button>
                
                <button
                  id="submit-unlock-wallet-btn"
                  type="submit"
                  className="flex-1 bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Unlock Nodes
                </button>
              </div>

              <button
                id="reset-passphrase-wallet-btn"
                type="button"
                onClick={onWalletLock}
                className="text-[9px] text-[#22d3ee] hover:text-[#67e8f9] uppercase tracking-widest text-center flex items-center gap-1 justify-center border-t border-white/10 pt-3 cursor-pointer mt-1"
              >
                <RotateCcw className="w-3 h-3" /> Re-generate master seed
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* WALLET MAIN VIEW (UNLOCKED) */
        <div className="flex flex-col gap-6 relative z-10">
          {/* Unlocked Header Card */}
          <div className="bg-gradient-to-tr from-[#020208]/80 to-[#121228]/80 border border-cyan-500/20 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] text-white/40 font-mono tracking-widest uppercase">Validated Balance Ledger</span>
                <div className="text-3xl font-light font-display mt-1 text-white flex items-baseline">
                  {walletState.migratedBalance.toFixed(4)}
                  <span className="text-xs text-cyan-400 font-bold ml-2 font-mono uppercase tracking-wider">VMC</span>
                </div>
              </div>
              <button
                id="lock-wallet-menu-btn"
                onClick={onWalletLock}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 px-2.5 py-1 rounded-full text-[8.5px] uppercase font-mono tracking-widest cursor-pointer"
              >
                Lock Wallet
              </button>
            </div>

            {/* Public Address */}
            <div className="bg-[#020208]/60 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-white/65 font-mono">
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <span className="text-[8px] font-mono uppercase bg-white/5 border border-white/10 text-cyan-400 px-1 py-0.5 rounded truncate shrink">Public Key Address</span>
                <span className="font-mono text-[9.5px] select-all truncate shrink w-full block">{walletState.publicKey}</span>
              </div>
              <button
                id="copy-public-key-address"
                onClick={handleCopyPublicAddress}
                className="text-white/30 hover:text-cyan-400 p-1 cursor-pointer shrink-0"
                title="Copy Address"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Balance Details Breakdown Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Unverified Referral Balance */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[8.5px] text-white/40 uppercase tracking-widest font-semibold font-mono block">Unverified Bonus</span>
                <div className="text-base font-bold font-mono mt-1 text-cyan-400">
                  {walletState.unverifiedBalance.toFixed(4)} <span className="text-[9px] text-white/30 font-normal">VMC</span>
                </div>
              </div>
              <p className="text-[9px] text-white/45 mt-2 leading-relaxed">
                Peer reference tokens that validate dynamically as nodes complete Synthetic KYC.
              </p>
            </div>

            {/* Transferable Balance */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between relative">
              <div>
                <span className="text-[8.5px] text-white/40 uppercase tracking-widest font-semibold font-mono block">Transferable Core</span>
                <div className="text-base font-bold font-mono mt-1 text-cyan-300">
                  {walletState.transferableBalance.toFixed(4)} <span className="text-[9px] text-white/30 font-normal">VMC</span>
                </div>
              </div>
              
              {kycApproved ? (
                <button
                  id="migrate-transferable-balance-btn"
                  onClick={handleMigrate}
                  disabled={isMigrating || walletState.transferableBalance <= 0}
                  className="mt-2.5 w-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold py-1.5 px-2 rounded-lg text-[9px] uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isMigrating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                  {isMigrating ? 'Migrating...' : 'Migrate'}
                </button>
              ) : (
                <div className="mt-2.5 p-1 px-1.5 rounded bg-white/5 border border-white/10 text-[8px] leading-relaxed text-white/35 text-center uppercase tracking-wider font-mono">
                  🔒 Requires KYC
                </div>
              )}
            </div>

          </div>

          {/* Send Transaction Simulator */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <Send className="w-4 h-4 text-cyan-400" />
              Transfer Peer Exchange
            </h3>

            {/* Error notifications */}
            {errorMessage && (
              <div className="mb-3 bg-red-950/20 border border-red-500/20 text-red-300 p-2.5 rounded-lg text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errorMessage}
              </div>
            )}

            {transactionNotification && (
              <div className="mb-3 bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 p-3 rounded-lg text-xs">
                <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-widest text-[10px]">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  Transaction Verified
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                  Hash: <span className="text-[#67e8f9]">{transactionNotification.id.substring(0, 16)}...</span>
                </p>
              </div>
            )}

            <form onSubmit={handleSend} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] text-white/40 uppercase tracking-widest font-mono">Recipient Public ID or Peer</label>
                <div className="flex gap-2">
                  <input
                    id="recipient-address-input"
                    type="text"
                    placeholder="G... node public vector"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="flex-1 bg-[#020208]/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/90 placeholder-white/25 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  {availablePeers.length > 0 && (
                    <select
                      id="peer-selector-shortcut"
                      tabIndex={0}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setRecipient(val);
                          e.target.value = '';
                        }
                      }}
                      className="bg-[#020208]/60 border border-white/10 rounded-xl px-2 py-2 text-[9px] uppercase tracking-wider text-white/60 focus:outline-none focus:border-cyan-500 cursor-pointer text-left font-semibold"
                    >
                      <option value="">Choose Contact...</option>
                      {availablePeers.map(p => (
                        <option key={p.id} value={`G${p.id.substring(0, 8).toUpperCase()}${p.name.substring(0, 2).toUpperCase()}`}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] text-white/40 uppercase tracking-widest font-mono font-sans">Amount VMC</label>
                <div className="relative">
                  <input
                    id="transaction-amount-input"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full bg-[#020208]/40 border border-white/10 rounded-xl pl-3 pr-20 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[8.5px] font-bold text-cyan-400 font-mono uppercase">
                    Limit: {walletState.migratedBalance.toFixed(2)}
                  </span>
                </div>
                <span className="text-[8px] text-white/30 font-mono mt-0.5 ml-1">Fee: 0.0001 VMC consensus</span>
              </div>

              <button
                id="send-transaction-submit-btn"
                type="submit"
                disabled={isSending || walletState.migratedBalance < Number(sendAmount)}
                className="w-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
              >
                {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isSending ? 'Verifying block ledger...' : 'Authorize Transaction'}
              </button>
            </form>
          </div>

          {/* Past Transactions Ledger list */}
          <div>
            <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1.5 leading-none">
              <History className="w-3.5 h-3.5 text-white/35" />
              Verifiable Blockchain Ledger
            </h3>

            {transactions.length === 0 ? (
              <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-xl p-4 text-center text-xs text-white/35">
                No ledger records mapped to this address vector yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {transactions.map((tx) => {
                  const isSender = tx.sender === walletState.publicKey;
                  return (
                    <div key={tx.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${
                          isSender 
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        }`}>
                          {isSender ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white/90">
                            {isSender ? 'Transfer Out' : 'Received Peer'}
                          </p>
                          <p className="text-[8.5px] text-white/40 font-mono tracking-wide mt-0.5 leading-none">
                            Address: {isSender ? tx.recipient.substring(0, 10) : tx.sender.substring(0, 10)}... | Block #{tx.blockNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold font-mono ${isSender ? 'text-orange-400' : 'text-cyan-400'}`}>
                          {isSender ? '-' : '+'}{tx.amount.toFixed(4)} VMC
                        </span>
                        <p className="text-[8px] text-white/30 font-mono mt-0.5">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
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
