import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  UploadCloud, 
  Loader2, 
  User, 
  Globe2, 
  FileSpreadsheet, 
  Eye, 
  Fingerprint,
  RefreshCw,
  VideoOff
} from 'lucide-react';
import { KYCDetails } from '../types';

interface KycPortalProps {
  kycDetails: KYCDetails;
  onKycSubmit: (fullName: string, country: string, docType: KYCDetails['documentType'], docNum: string, selfieUrl?: string) => void;
  onKycApprove: () => void;
}

const LIVENESS_STEPS = [
  { id: 'neutral', label: 'Position your face in the oval indicator', duration: 3000 },
  { id: 'smile', label: 'Please SMILE widely for biometric consistency', duration: 3000 },
  { id: 'look_left', label: 'Turn your head slightly to the LEFT', duration: 2500 },
  { id: 'blink', label: 'BLINK both eyes to confirm liveness', duration: 2500 }
];

export default function KycPortal({
  kycDetails,
  onKycSubmit,
  onKycApprove,
}: KycPortalProps) {
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('United States');
  const [docType, setDocType] = useState<KYCDetails['documentType']>('passport');
  const [docNumber, setDocNumber] = useState('');
  
  // Camera scanning states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [livenessIndex, setLivenessIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [selfieCaptured, setSelfieCaptured] = useState<string | null>(null);
  
  // Validation processing pipeline states
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineLog, setPipelineLog] = useState<string>('Initializing standard OCR verification...');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean-up webcam stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(false);
    setCameraActive(true);
    setLivenessIndex(0);
    setScanProgress(0);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera blocked or unavailable, using simulation mode', err);
      setCameraError(true); // fall back to simulated scanner overlay
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Simulated capture or real capture from video track
  const handleCapture = () => {
    let capturedUrl = '';
    
    if (!cameraError && videoRef.current) {
      // Capture actual frame from stream onto canvas
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(-1, 1); // Mirror
        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        capturedUrl = canvas.toDataURL('image/jpeg');
      }
    } else {
      // Generate synthetic face pattern using canvas SVG style representation for high-fidelity fallback
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, 300, 300);
        // Face mesh circles
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(150, 150, 70, 100, 0, 0, 2 * Math.PI);
        ctx.stroke();
        // Dot scanning nodes inside the ellipse
        ctx.fillStyle = '#059669';
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 50;
          const x = 150 + Math.cos(angle) * dist;
          const y = 140 + Math.sin(angle) * dist * 1.3;
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
          ctx.fill();
        }
        capturedUrl = canvas.toDataURL('image/jpeg');
      }
    }

    setSelfieCaptured(capturedUrl);
    stopCamera();
  };

  // Run the sequential interactive liveness instructions
  useEffect(() => {
    if (!cameraActive || selfieCaptured) return;

    let progressInterval: NodeJS.Timeout;
    let stepTimer: NodeJS.Timeout;

    const startStepTimer = (index: number) => {
      if (index >= LIVENESS_STEPS.length) {
        handleCapture();
        return;
      }

      setScanProgress(0);
      const step = LIVENESS_STEPS[index];
      
      // Animate loader progress bar
      const tick = 100;
      const totalTicks = step.duration / tick;
      let currentTick = 0;

      progressInterval = setInterval(() => {
        currentTick++;
        setScanProgress((currentTick / totalTicks) * 100);
      }, tick);

      stepTimer = setTimeout(() => {
        clearInterval(progressInterval);
        setLivenessIndex(index + 1);
        startStepTimer(index + 1);
      }, step.duration);
    };

    startStepTimer(0);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimer);
    };
  }, [cameraActive, selfieCaptured]);

  // Handle Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !docNumber.trim()) return;
    
    // Save details to state with capture URL (fallback generated if selfie empty)
    onKycSubmit(fullName.trim(), country, docType, docNumber.trim(), selfieCaptured || '');
  };

  // Run the automated decentral-pipeline validator once details are submitted
  useEffect(() => {
    if (kycDetails.status === 'verifying') {
      const pipelineSteps = [
        { msg: 'OCR Extraction: Parsing document fields...', duration: 2000 },
        { msg: 'Facial Topology Audit: Comparing liveness mesh to image...', duration: 2500 },
        { msg: 'Risk Score Assessment: Checking validator node lists...', duration: 2000 },
        { msg: 'Consensus Signed: Submitting block migration token permit...', duration: 1500 }
      ];

      const runPipeline = (stepIndex: number) => {
        if (stepIndex >= pipelineSteps.length) {
          onKycApprove();
          return;
        }
        setPipelineStep(stepIndex);
        setPipelineLog(pipelineSteps[stepIndex].msg);

        setTimeout(() => {
          runPipeline(stepIndex + 1);
        }, pipelineSteps[stepIndex].duration);
      };

      runPipeline(0);
    }
  }, [kycDetails.status]);

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white overflow-y-auto no-scrollbar pb-6 p-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 sticky top-0 bg-[#020208]/40 backdrop-blur-md z-10">
        <div>
          <h2 className="text-base font-display font-bold text-white uppercase tracking-widest font-sans">Identity Ledger (KYC)</h2>
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Validate your human coordinate vector & unlock coins</p>
        </div>
        <ShieldAlert className="w-5 h-5 text-cyan-400" />
      </div>

      {kycDetails.status === 'none' && !selfieCaptured && (
        /* STEP 1: INITIAL DETAILS FORM */
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 justify-center py-4 relative z-10">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-4 backdrop-blur-sm shadow-xl">
            <h3 className="text-[10px] font-bold text-[#06b6d4] uppercase tracking-widest flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              1. Document Information
            </h3>

            {/* Legal Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] text-white/40 uppercase tracking-widest font-mono font-bold">Legal Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-white/20" />
                <input
                  id="kyc-full-name"
                  type="text"
                  required
                  placeholder="e.g. Satoshi Nakamoto"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#020208]/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Country Selector */}
            <div className="flex flex-col gap-1.5">
               <label className="text-[8px] text-white/40 uppercase tracking-widest font-mono font-bold">Issuing Country</label>
              <div className="relative">
                <Globe2 className="w-4 h-4 absolute left-3.5 top-3 text-white/20" />
                <select
                  id="kyc-country-select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#020208]/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white/80 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Australia">Australia</option>
                  <option value="Singapore">Singapore</option>
                </select>
              </div>
            </div>

            {/* Document Type Selectors */}
            <div className="flex flex-col gap-1.5">
               <label className="text-[8px] text-white/40 uppercase tracking-widest font-mono font-bold">Identification Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['passport', 'drivers_license', 'national_id'] as const).map((t) => (
                  <button
                    id={`doc-type-${t}`}
                    key={t}
                    type="button"
                    onClick={() => setDocType(t)}
                    className={`py-2 px-3 border rounded-xl text-[9px] font-bold text-center transition-all uppercase tracking-wider ${
                      docType === t
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-[#67e8f9]'
                        : 'bg-[#020208]/40 border-white/10 text-white/40'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Number */}
            <div className="flex flex-col gap-1.5">
               <label className="text-[8px] text-white/40 uppercase tracking-widest font-mono font-bold">Document Serial Number</label>
              <input
                id="doc-number-input"
                type="text"
                required
                placeholder="ID String (Passport ID / License ID)"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-[#020208]/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <button
            id="kyc-step-1-submit"
            type="submit"
            className="w-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer transition-colors"
          >
            Start Liveness Scan Verification
          </button>
        </form>
      )}

      {kycDetails.status === 'none' && !selfieCaptured && cameraActive && (
        /* LIVENESS BIOMETRIC WEBCAM SCAN OVERLAY MODAL */
        <div className="fixed inset-0 bg-[#020208]/95 z-[55] flex flex-col justify-center p-6 items-center backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#020208]/90 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-5 relative shadow-[0_0_55px_rgba(6,182,212,0.15)]">
            
            <div className="text-center w-full">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#67e8f9]">Liveness Matrix Calibration</h3>
              <p className="text-[9px] text-cyan-400 font-mono mt-1 uppercase tracking-wider font-semibold animate-pulse">Scanning Grid: {Math.floor(scanProgress)}%</p>
            </div>

            {/* Scanner Feed stage */}
            <div className="w-60 h-72 rounded-[30px] bg-[#020208] border border-white/10 overflow-hidden relative flex items-center justify-center">
              {cameraError ? (
                /* Falling Back: Simulated Neon Vector Face Grid */
                <div id="simulated-camera-feed" className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
                  
                  {/* Sweep scan bar */}
                  <motion.div
                    animate={{ y: [-100, 300] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                    className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                  />

                  {/* Wireframe face mockup */}
                  <div className="w-36 h-48 rounded-full border border-cyan-500/30 flex flex-col items-center justify-center relative bg-cyan-950/5">
                    {/* Glowing dots */}
                    <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-10 left-8 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-10 right-8 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-500 absolute top-24 left-16"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute bottom-10 left-12"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute bottom-10 right-12"></span>
                    
                    <span className="text-[8px] font-mono text-cyan-400/60 mt-16 text-center tracking-wider leading-relaxed">
                      [ NODE SCANNING ]<br />GRID COMPLETE
                    </span>
                  </div>
                </div>
              ) : (
                /* True Webcam Capture frame */
                <div className="w-full h-full relative">
                  <video
                    id="kyc-video-feed"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Oval Frame indicator overlay */}
                  <div className="absolute inset-0 border-[24px] border-[#020208]/80" style={{ pointerEvents: 'none' }}>
                    <div className="w-full h-full border border-dashed border-cyan-500/50 rounded-full" />
                  </div>
                  <div className="absolute top-2 left-2 bg-black/70 text-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-mono border border-cyan-500/20">
                    🔴 WEBCAM ACTIVE
                  </div>
                </div>
              )}

              {/* Grid scanning effect on top */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent pointer-events-none" />
            </div>

            {/* Prompt display card */}
            <div className="w-full bg-white/5 p-4 rounded-xl border border-white/10 text-center font-sans text-xs font-semibold py-3 flex flex-col justify-center min-h-[70px]">
              <span className="text-[8px] font-mono tracking-widest text-white/40 block uppercase mb-1">Decentralized Directional Command</span>
              <AnimatePresence mode="wait">
                <motion.p
                  key={livenessIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-cyan-300 font-bold uppercase tracking-wider text-[10px]"
                >
                  {LIVENESS_STEPS[Math.min(livenessIndex, LIVENESS_STEPS.length - 1)].label}
                </motion.p>
              </AnimatePresence>
              
              {/* Little step indicator dots */}
              <div className="flex gap-1 justify-center mt-3">
                {LIVENESS_STEPS.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all ${
                      idx === livenessIndex ? 'w-4 bg-cyan-400' : idx < livenessIndex ? 'w-1.5 bg-cyan-800' : 'w-1.5 bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              id="cancel-liveness-btn"
              onClick={stopCamera}
              className="w-full py-2 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 border border-white/10 text-[9px] uppercase tracking-widest font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {kycDetails.status === 'none' && !cameraActive && !selfieCaptured && (
        /* Camera onboarding introductory banner */
        <div className="mt-4 bg-white/5 p-5 rounded-2xl border border-white/10 text-center flex flex-col items-center gap-4 relative z-10 backdrop-blur-sm">
          <div className="w-10 h-10 bg-cyan-950/20 text-cyan-400 border border-cyan-900 rounded-xl flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-[#67e8f9] uppercase tracking-widest">Webcam Liveness Check Instructions</h4>
            <p className="text-[11px] text-white/45 mt-1 leading-relaxed font-sans px-2">
              Our network registers consensus validity using a facial vector topology match to reject bot script clusters and maintain ledger token value representation.
            </p>
          </div>
          <button
            id="trigger-camera-scan"
            type="button"
            onClick={startCamera}
            className="w-full bg-[#020208]/60 hover:bg-white/5 border border-cyan-500/30 text-cyan-300 font-bold py-2 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer transition-all"
          >
            <Camera className="w-4 h-4 text-cyan-400" /> Start Calibration Scan
          </button>
        </div>
      )}

      {/* STEP 2: DETAILS SUBMITTED OR VERIFYING PIPELINE STATE */}
      {kycDetails.status === 'verifying' && (
        <div className="flex-1 flex flex-col justify-center py-4 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-6 items-center text-center">
            
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#67e8f9]">Parsing Asymmetric Identity Vectors</h3>
              <p className="text-[11px] text-white/55 mt-1 px-4 leading-relaxed font-sans">
                Consensus validators are checking structural parameters of the submitted identification credentials.
              </p>
            </div>

            {/* Terminal monitor screen */}
            <div className="w-full bg-[#020208]/80 border border-cyan-500/10 p-4 rounded-xl font-mono text-left select-none text-[9.5px] text-cyan-300 h-32 flex flex-col justify-between">
              <div>
                <p className="text-white/30 font-bold">// SECURE_CONSENSUS_OCR_GATEWAY</p>
                <div className="mt-2 text-white/80 flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                  <span className="text-cyan-400 font-mono tracking-wide">{pipelineLog}</span>
                </div>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between text-white/35 text-[8.5px] font-mono lowercase">
                <span>Stage: {pipelineStep + 1}/4</span>
                <span>Active Nodes: 256 Verify OK</span>
              </div>
            </div>

            {/* terminal progress index bar */}
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${(pipelineStep + 1) * 25}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: KYC COMPLETED AND APPROVED */}
      {kycDetails.status === 'approved' && (
        <div className="flex-1 flex flex-col justify-center py-4 relative z-10">
          <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-6 flex flex-col gap-5 items-center text-center backdrop-blur-sm">
            
            <div className="w-12 h-12 bg-cyan-950/40 border border-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <CheckCircle className="w-6 h-6 text-cyan-400" />
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#67e8f9]">Identity Node Validated</h3>
              <p className="text-[11px] text-white/50 mt-1 px-4 leading-relaxed font-sans">
                Network validation complete. Facial topology audits match corresponding issuer details on the Stellar protocol.
              </p>
            </div>

            <div className="w-full bg-[#020208]/60 p-4 rounded-xl border border-white/10 text-left text-[9.5px] gap-2 flex flex-col font-mono text-white/50">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-[8.5px] text-white/30 font-mono uppercase font-bold">Biometric Mesh Match</span>
                <span className="text-cyan-400 font-bold font-mono">100% SECURE_OK</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-[8.5px] text-white/30 font-mono uppercase font-bold">Consensus Issuer Key</span>
                <span className="text-white/80 font-mono">NODE_SIGNATURE_#X9023</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[8.5px] text-white/30 font-mono uppercase font-bold">Mainnet Migration Status</span>
                <span className="text-cyan-400 font-bold font-mono uppercase">UNLOCKED VECTOR</span>
              </div>
            </div>

            <p className="text-[11px] text-white/50 leading-relaxed bg-[#020208]/40 p-3 rounded-xl border border-cyan-500/10">
              Your self-mined balances are unlocked. Access your <strong>Simulated Node Wallet</strong> to migrate these coins directly to your live address ledger.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
