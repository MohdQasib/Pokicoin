import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  MapPin, 
  Cpu, 
  Network, 
  Clock, 
  Database,
  ArrowUpRight,
  TrendingUp,
  BarChart2,
  ListFilter
} from 'lucide-react';
import { Block, Transaction } from '../types';

interface NetworkExplorerProps {
  blocks: Block[];
  activeBlockHeight: number;
}

// Global node coordinates for our map representation
const MOCK_MAP_NODES = [
  { id: 'london_node', name: 'Validator London', x: 230, y: 75, ip: '185.122.9.11', cpu: 22, ping: 12 },
  { id: 'singapore_node', name: 'Validator Singapore', x: 420, y: 190, ip: '54.254.120.44', cpu: 14, ping: 45 },
  { id: 'san_fran_node', name: 'Validator San Francisco', x: 80, y: 110, ip: '13.57.199.182', cpu: 31, ping: 28 },
  { id: 'sao_paulo_node', name: 'Validator Sao Paulo', x: 190, y: 220, ip: '200.141.22.9', cpu: 19, ping: 68 },
  { id: 'tokyo_node', name: 'Validator Tokyo', x: 450, y: 115, ip: '19.222.115.11', cpu: 25, ping: 35 },
  { id: 'sydney_node', name: 'Validator Sydney', x: 475, y: 250, ip: '122.13.4.99', cpu: 18, ping: 82 }
];

export default function NetworkExplorer({
  blocks,
  activeBlockHeight,
}: NetworkExplorerProps) {
  const [selectedNode, setSelectedNode] = useState<typeof MOCK_MAP_NODES[0] | null>(MOCK_MAP_NODES[1]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [pulseCount, setPulseCount] = useState(0);

  // Trigger global node packets animation
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Compute stats based on simulated data
  const totalTransactionsCount = useMemo(() => {
    return blocks.reduce((sum, block) => sum + block.transactionCount, 0);
  }, [blocks]);

  const averageBlockTimeSec = 5.2;

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white overflow-y-auto no-scrollbar pb-6 p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 sticky top-0 bg-[#0a0802]/40 backdrop-blur-md z-10">
        <div>
          <h2 className="text-base font-display font-bold text-white uppercase tracking-widest">Poki Block Explorer</h2>
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Decentralized stellar ledger peer validator</p>
        </div>
        <Network className="w-5 h-5 text-amber-400 animate-pulse" />
      </div>

      {/* Network Stats Bento Panels */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col justify-between backdrop-blur-sm">
          <span className="text-[8px] text-white/40 uppercase tracking-widest font-semibold font-mono flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> Height
          </span>
          <span className="text-sm font-bold font-mono text-amber-500 mt-1">#{activeBlockHeight}</span>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col justify-between backdrop-blur-sm">
          <span className="text-[8px] text-white/40 uppercase tracking-widest font-semibold font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Ledger Tx
          </span>
          <span className="text-sm font-bold font-mono text-amber-300 mt-1">{totalTransactionsCount}</span>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col justify-between backdrop-blur-sm">
          <span className="text-[8px] text-white/40 uppercase tracking-widest font-semibold font-mono flex items-center gap-1 flex-row">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Interval
          </span>
          <span className="text-sm font-bold font-mono text-amber-100 mt-1">~5.2s</span>
        </div>
      </div>

      {/* Interactive Global Consensus Map Canvas */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 flex flex-col gap-4 backdrop-blur-sm">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" /> Consensus Mesh Nodes
          </h3>
          <span className="text-[8px] bg-amber-950/20 px-2 py-0.5 border border-amber-500/20 text-amber-400 font-mono rounded">
            Decentralized Mesh
          </span>
        </div>

        {/* Vector SVG World map simulator with nodes connecting */}
        <div className="w-full h-44 bg-black/60 border border-white/10 rounded-xl relative overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 540 280">
            {/* Soft grid lines */}
            <path d="M0,70 L540,70 M0,140 L540,140 M0,210 L540,210 M135,0 L135,280 M270,0 L270,280 M405,0 L405,280" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            
            {/* Simulated background continent paths */}
            <path d="M80,80 Q100,50 140,40 T220,60 T250,90 T260,150 T200,210 T140,240 T80,180 Z" fill="rgba(245,158,11,0.02)" fillOpacity="0.05" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <path d="M350,50 Q410,40 450,70 T480,120 T520,180 T460,240 T380,210 T330,130 Z" fill="rgba(245,158,11,0.02)" fillOpacity="0.05" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            
            {/* Packet vectors animation lines */}
            {MOCK_MAP_NODES.map((node, i) => {
              const nextNode = MOCK_MAP_NODES[(i + 1) % MOCK_MAP_NODES.length];
              return (
                <g key={`path-${node.id}`}>
                  {/* Static trunk lines */}
                  <line 
                    x1={node.x} y1={node.y} 
                    x2={nextNode.x} y2={nextNode.y} 
                    stroke="rgba(245,158,11,0.05)" 
                    strokeWidth="1.5" 
                  />
                  {/* Glowing dynamic packet pulsing */}
                  <motion.circle
                    key={`packet-${node.id}-${pulseCount}`}
                    cx={node.x}
                    cy={node.y}
                    r="2"
                    fill="#f59e0b"
                    animate={{
                      cx: [node.x, nextNode.x],
                      cy: [node.y, nextNode.y],
                      opacity: [0, 0.9, 0]
                    }}
                    transition={{
                      duration: 2.2,
                      ease: "easeInOut",
                      delay: i * 0.3
                    }}
                  />
                </g>
              );
            })}

            {/* Interactive validator nodes */}
            {MOCK_MAP_NODES.map((node) => {
              const isActive = selectedNode?.id === node.id;
              return (
                <g 
                  key={node.id} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(node)}
                >
                  <circle 
                    cx={node.x} cy={node.y} 
                    r={isActive ? "9" : "4"} 
                    fill="#f59e0b" 
                    fillOpacity={isActive ? "0.2" : "0.1"} 
                    stroke={isActive ? "#facc15" : "#f59e0b"} 
                    strokeWidth={isActive ? "1.5" : "1"}
                    className="transition-all duration-300"
                  />
                  <circle 
                    cx={node.x} cy={node.y} 
                    r="2" 
                    fill={isActive ? "#facc15" : "#f59e0b"} 
                  />
                </g>
              );
            })}
          </svg>

          {/* Floater overlay displaying Node info */}
          <div className="absolute bottom-3 left-3 bg-[#0a0802]/90 border border-white/10 text-[9px] p-2.5 rounded-xl flex flex-col gap-1 backdrop-blur-md shadow-lg">
            {selectedNode ? (
              <>
                <p className="font-bold text-white/90 flex items-center gap-1.5 leading-none">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {selectedNode.name}
                </p>
                <div className="flex gap-4 text-white/50 font-mono text-[8px] mt-1 pr-1">
                  <span>Latency: <strong className="text-amber-400">{selectedNode.ping}ms</strong></span>
                  <span>IP: <strong className="text-white/70">{selectedNode.ip}</strong></span>
                  <span>CPU: <strong className="text-amber-300">{selectedNode.cpu}%</strong></span>
                </div>
              </>
            ) : (
              <p className="text-white/30 font-mono">Select a map node validator</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Ledger Blocks Columns */}
      <div className="flex flex-col gap-4 relative z-10 col-span-2">
        <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center justify-between leading-none">
          <span>Simulation Ledger Log Stream</span>
          <span className="text-[8px] text-white/30 font-normal font-sans">Synced minipocicoin.in</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Blocks log list */}
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto no-scrollbar">
            {blocks.map((block) => (
              <div 
                key={block.number}
                onClick={() => setSelectedBlock(block)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  selectedBlock?.number === block.number 
                    ? 'bg-white/15 border-amber-500/30 shadow-md' 
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#0a0802] p-2 border border-white/10 text-white/40 rounded-xl">
                    <Database className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-white/90">Block #{block.number}</h4>
                    <span className="text-[8.5px] text-white/40 font-mono mt-0.5 block truncate max-w-[130px]">
                      hash: {block.hash.substring(0, 16)}...
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[8px] font-mono text-amber-400 bg-amber-500/10 py-0.5 px-1.5 rounded border border-amber-500/20 uppercase tracking-wide">
                    {block.transactionCount} Tx
                  </span>
                  <span className="text-[8px] text-white/30 font-mono block mt-1">
                    {Math.round((Date.now() - block.timestamp) / 1000)}s ago
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Block Transaction Detail panel */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col justify-between max-h-80 overflow-y-auto no-scrollbar backdrop-blur-sm">
            {selectedBlock ? (
              <div className="flex flex-col gap-4 h-full">
                {/* Block general details */}
                <div className="border-b border-white/10 pb-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-widest">Metadata Block #{selectedBlock.number}</h4>
                    <span className="text-[8.5px] text-white/40 font-mono">{selectedBlock.sizeKb.toFixed(2)} KB</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[8px] text-white/40">
                    <div className="truncate">hash: <strong className="text-white/70 select-all">{selectedBlock.hash}</strong></div>
                    <div>validator: <strong className="text-white/70">{selectedBlock.validator}</strong></div>
                  </div>
                </div>

                {/* Simulated Ledger Logs inside block */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-44 pr-1 no-scrollbar-y">
                  <span className="text-[8px] font-mono uppercase text-white/40 block mb-1">Decentralized Transactions Ledger</span>
                  
                  {selectedBlock.transactions.length === 0 ? (
                    <div className="text-center text-[10px] text-white/30 py-6">
                      No verified transactions on this block. (Inflation reward minted)
                    </div>
                  ) : (
                    selectedBlock.transactions.map((tx) => (
                      <div key={tx.id} className="bg-black/60 p-2 px-2.5 rounded-xl border border-white/10 flex justify-between items-center text-[9.5px]">
                        <div className="flex flex-col gap-0.5 shrink">
                          <p className="font-mono text-white/80 truncate max-w-[125px]">
                            {tx.sender.startsWith('C_') ? tx.sender : `sender: ${tx.sender.substring(0, 10)}...`}
                          </p>
                          <p className="font-mono text-white/40 truncate max-w-[125px]">
                            recipient: {tx.recipient.substring(0, 10)}...
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-semibold text-amber-400">+{tx.amount.toFixed(2)} POKI</span>
                          <span className="text-[8px] text-white/30 block font-mono">gas: {tx.fee}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 gap-2">
                <Database className="w-7 h-7 text-white/20 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/70">No Block Selected</h3>
                  <p className="text-[10px] text-white/40 leading-normal max-w-[170px] mx-auto mt-1 font-sans">
                    Select a blockchain ledger height block from the list to display verified transactional hashes.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
