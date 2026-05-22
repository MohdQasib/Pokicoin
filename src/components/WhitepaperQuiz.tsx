import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  HelpCircle, 
  Award, 
  CheckCircle, 
  XCircle, 
  Shuffle, 
  BookOpen, 
  ChevronRight, 
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react';
import { QuizQuestion } from '../types';

interface WhitepaperQuizProps {
  quizPremiumBooster: boolean;
  onUnlockQuizBooster: () => void;
}

const QIUZ_DATA: QuizQuestion[] = [
  {
    id: 1,
    question: 'How does this crypto mining engine avoid battery and power draining on low-power devices?',
    options: [
      'By running high-count cryptographic proof-of-work on nodes.',
      'By utilizing Federated Byzantine Agreement (Stellar Consensus) based on trust circles.',
      'By running cloud computations and streaming results back to nodes.'
    ],
    correctAnswerIndex: 1,
    explanation: 'Federated Byzantine Agreement (FBA) allows decentralized consensus to be reached through local trusted quorums, removing the requirement for intensive Proof-of-Work hashing calculations.'
  },
  {
    id: 2,
    question: 'What is the cryptographic objective of the "Security Circle" comprising 3-5 users?',
    options: [
      'To build a global trust graph that nodes use to agree on valid ledger transactions.',
      'To establish encrypted chat tunnels for sharing multi-sig password hashes.',
      'To provide backup hosts in case you lose access to your private key.'
    ],
    correctAnswerIndex: 0,
    explanation: 'The Security Circle establishes trust graphs. Under SCP consensus mechanisms, nodes formulate quorums based on trusted relationships to sign blocks and prevent Sybil attacks.'
  },
  {
    id: 3,
    question: 'What is required to unlock your Transferable Balance into Migrated Ledger Balance?',
    options: [
      'A one-time staking fee in fiat currency.',
      'Undergoing automated biometric liveness and identity verification (KYC).',
      'Having your invitation node click the mine button 100 times.'
    ],
    correctAnswerIndex: 1,
    explanation: 'Identity Verification (KYC) protects the consensus. It confirms the owner is a real human, preventing robot farms from draining token supplies.'
  },
  {
    id: 4,
    question: 'What is the exact duration of each blockchain consensus mining session?',
    options: [
      '1 Hour',
      '24 Hours',
      '7 Days'
    ],
    correctAnswerIndex: 1,
    explanation: 'Mining sessions are scheduled for 24 hours. Clicking the lever refreshes your node presence, declaring your active participation in global consensus.'
  }
];

export default function WhitepaperQuiz({
  quizPremiumBooster,
  onUnlockQuizBooster,
}: WhitepaperQuizProps) {
  const [activeSegment, setActiveSegment] = useState<'whitepaper' | 'quiz'>('whitepaper');
  
  // Quiz working states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const activeQuestion = QIUZ_DATA[currentQuestionIndex];

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    
    setIsAnswered(true);
    setShowExplanation(true);
    
    if (selectedOption === activeQuestion.correctAnswerIndex) {
      setCorrectAnswersCount(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setShowExplanation(false);
    
    if (currentQuestionIndex < QIUZ_DATA.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
      // If they passed all correctly, trigger booster unlock
      if (correctAnswersCount + (selectedOption === activeQuestion.correctAnswerIndex ? 1 : 0) === QIUZ_DATA.length) {
        onUnlockQuizBooster();
      }
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectAnswersCount(0);
    setQuizFinished(false);
    setShowExplanation(false);
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white overflow-y-auto no-scrollbar pb-6 p-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 sticky top-0 bg-[#020208]/40 backdrop-blur-md z-10">
        <div>
          <h2 className="text-base font-display font-bold text-white uppercase tracking-widest font-sans">Learning & Academy</h2>
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Read the network whitepaper & pass quorums to boost power</p>
        </div>
        <BookOpen className="w-5 h-5 text-cyan-400" />
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-6 font-display font-medium backdrop-blur-sm">
        <button
          id="tab-whitepaper-btn"
          onClick={() => setActiveSegment('whitepaper')}
          className={`flex-1 py-2 px-3 rounded-lg text-[9px] uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
            activeSegment === 'whitepaper'
              ? 'bg-cyan-500/15 text-[#67e8f9] border border-cyan-500/20'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Whitepaper
        </button>
        <button
          id="tab-consensus-quiz-btn"
          onClick={() => setActiveSegment('quiz')}
          className={`flex-1 py-2 px-3 rounded-lg text-[9px] uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
            activeSegment === 'quiz'
              ? 'bg-cyan-500/15 text-[#67e8f9] border border-cyan-500/20'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> Consensus Quiz
          {quizPremiumBooster && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSegment === 'whitepaper' ? (
          /* WHITEPAPER VIEW */
          <motion.div
            key="whitepaper"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-5 relative z-10"
          >
            {/* Whitepaper Section 1 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 select-none leading-relaxed backdrop-blur-sm">
              <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-2">Chapter 1.0</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-2">
                The Smartphone Consensus Paradigm
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                In classic blockchain structures (e.g., Bitcoin), network synchronization relies on Proof-of-Work (PoW). PoW provides secure agreements but burns extreme values of thermal energy and electricity. It excludes average human actors, restricting execution to high-powered industrial mining facilities.
              </p>
              <p className="text-[11px] text-white/50 mt-2.5 leading-relaxed font-sans">
                Our network establishes a mobile-first paradigm where participants are allocated tokens by proving daily humanity and building security bonds. This virtual model simulates true token distributions with zero CPU overhead.
              </p>
            </div>

            {/* Whitepaper Section 2 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 select-none leading-relaxed backdrop-blur-sm">
              <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-2">Chapter 2.0</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-2">
                Stellar Consensus Protocol (SCP)
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                The network operates using the <strong>Stellar Consensus Protocol (SCP)</strong>. Instead of staking funds or hashing math blocks, agreement on transactional validity is executed by creating <strong>trust slices</strong>.
              </p>
              <p className="text-[11px] text-white/50 mt-2.5 leading-relaxed font-sans">
                Each member establishes a small network of 3 to 5 trusted friends called a <strong>Security Circle</strong>. This collective network forms a global graph validating transaction parameters. If malicious nodes attempt to introduce fraudulent blocks, the overlap of trusted quorums detects the divergence and rejects the block immediately.
              </p>
            </div>

            {/* Whitepaper Section 3 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 select-none leading-relaxed backdrop-blur-sm">
              <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-2">Chapter 3.0</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-2">
                Token Scarcity and Halvings
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                To reinforce long-term VMC purchasing power, supply generation matches strict geometric <strong>Halving Halos</strong>. When the simulated userbase reaches predetermined metrics (e.g., 100k nodes, 1M nodes), base mining speed is geometrically halved. This ensures that early adopters obtain superior velocity increments while preserving supply caps.
              </p>
            </div>

          </motion.div>
        ) : (
          /* CONSENSUS QUIZ VIEW */
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 flex flex-col justify-center py-4 relative z-10"
          >
            {quizFinished ? (
              /* QUIZ COMPLETED VIEW */
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center gap-5 backdrop-blur-sm shadow-xl">
                
                {correctAnswersCount === QIUZ_DATA.length ? (
                  <>
                    <div className="w-12 h-12 bg-cyan-950/40 text-cyan-400 border border-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.25)] animate-bounce">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white">Consensus Master 100% Passed</h3>
                      <p className="text-[11px] text-white/50 mt-1.5 px-4 leading-relaxed font-sans">
                        You have passed the consensus quiz. An active AI booster has been injected into your speed engine!
                      </p>
                    </div>
                    
                    <div className="w-full bg-[#020208]/60 border border-white/10 p-4 rounded-xl text-[9px] font-mono text-cyan-400 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Zap className="w-4 h-4 fill-cyan-400 text-cyan-400" /> Active Quiz Booster:</span>
                      <strong className="text-xs">+0.050 VMC/hr</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-red-950/40 text-red-400 border border-red-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                      <XCircle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white">Score: {correctAnswersCount} / {QIUZ_DATA.length}</h3>
                      <p className="text-[11px] text-white/50 mt-1.5 px-4 leading-relaxed font-sans">
                        An perfect score of {QIUZ_DATA.length} correct answers is required to activate the <strong>+0.05 VMC/hr booster</strong>. Re-evaluate the chapters first.
                      </p>
                    </div>
                  </>
                )}

                <button
                  id="reset-consensus-quiz-btn"
                  onClick={handleResetQuiz}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 mt-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  {correctAnswersCount === QIUZ_DATA.length ? 'Retake Quiz' : 'Try Again'}
                </button>
              </div>
            ) : (
              /* ACTIVE QUIZ QUESTION STAGES */
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-4 backdrop-blur-sm">
                <div className="flex justify-between text-[8px] text-white/40 font-mono tracking-widest font-bold">
                  <span>CONSENSUS AUDIT STAGE</span>
                  <span>QUESTION {currentQuestionIndex + 1} OF {QIUZ_DATA.length}</span>
                </div>

                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${((currentQuestionIndex + 1) / QIUZ_DATA.length) * 100}%` }} />
                </div>

                <h4 className="text-[11.5px] font-bold text-white mt-2 leading-relaxed select-none">
                  {activeQuestion.question}
                </h4>

                {/* Option buttons */}
                <div className="flex flex-col gap-2.5 mt-2">
                  {activeQuestion.options.map((opt, i) => {
                    const isSelected = selectedOption === i;
                    let optionStyle = 'bg-[#020208]/40 border-white/10 hover:border-white/25 text-white/70';
                    let statusIcon = null;

                    if (isSelected) {
                      optionStyle = 'bg-cyan-500/10 border-cyan-500/40 text-[#67e8f9]';
                    }

                    if (isAnswered) {
                      const isCorrect = i === activeQuestion.correctAnswerIndex;
                      if (isCorrect) {
                        optionStyle = 'bg-cyan-500/20 border-cyan-500/50 text-[#22d3ee] font-bold';
                        statusIcon = <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />;
                      } else if (isSelected) {
                        optionStyle = 'bg-red-500/20 border-red-500/30 text-red-300';
                        statusIcon = <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
                      } else {
                        optionStyle = 'bg-[#020208]/10 border-transparent text-white/20';
                      }
                    }

                    return (
                      <button
                        id={`option-${currentQuestionIndex}-${i}`}
                        key={i}
                        type="button"
                        onClick={() => handleOptionSelect(i)}
                        disabled={isAnswered}
                        className={`p-3 rounded-xl border text-left text-xs transition-all leading-relaxed flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                      >
                        <span className="font-sans leading-snug">{opt}</span>
                        {statusIcon}
                      </button>
                    );
                  })}
                </div>

                {/* Question explanation disclosure */}
                {showExplanation && (
                  <div className="bg-[#020208]/60 border border-white/10 rounded-xl p-4 mt-2 text-[10px] leading-relaxed text-white/50">
                    <strong className="text-[#67e8f9] flex items-center gap-1.5 uppercase tracking-widest font-mono text-[8px] mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Explanation Analysis:
                    </strong>
                    {activeQuestion.explanation}
                  </div>
                )}

                {/* Action footer */}
                {!isAnswered ? (
                  <button
                    id="submit-quiz-answer-btn"
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="w-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest mt-3 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Confirm Answer
                  </button>
                ) : (
                  <button
                    id="next-quiz-question-btn"
                    onClick={handleNextQuestion}
                    className="w-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest mt-3 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{currentQuestionIndex === QIUZ_DATA.length - 1 ? 'Finish Assessment' : 'Next Question'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
