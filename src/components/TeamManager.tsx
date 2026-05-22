import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  PlusCircle, 
  BellRing, 
  Clock, 
  Trash2, 
  Search,
  UserCheck2,
  Info
} from 'lucide-react';
import { MiningTeamMember } from '../types';

interface TeamManagerProps {
  teamMembers: MiningTeamMember[];
  onAddMember: (name: string, isSecurity: boolean) => void;
  onRemoveMember: (id: string) => void;
  onPingMember: (id: string) => void;
}

export default function TeamManager({
  teamMembers,
  onAddMember,
  onRemoveMember,
  onPingMember,
}: TeamManagerProps) {
  const [newMemberName, setNewMemberName] = useState('');
  const [roleType, setRoleType] = useState<'referral' | 'security'>('referral');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Separate referrals from security circle
  const referrals = teamMembers.filter(m => !m.isSecurityCircle);
  const securityCircle = teamMembers.filter(m => m.isSecurityCircle);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    
    if (roleType === 'security' && securityCircle.length >= 5) {
      showNotification('Your Security Circle is full! (Max 5 members)');
      return;
    }
    
    onAddMember(newMemberName.trim(), roleType === 'security');
    setNewMemberName('');
    showNotification(`Added ${newMemberName} successfully!`);
  };

  const handlePing = (id: string, name: string) => {
    onPingMember(id);
    showNotification(`Pinged ${name}! They are now mining actively.`);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Filter members by search query
  const filteredReferrals = referrals.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredSecurity = securityCircle.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-transparent font-sans text-white overflow-y-auto no-scrollbar pb-6 p-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 sticky top-0 bg-[#0a0802]/40 backdrop-blur-md z-10">
        <div>
          <h2 className="text-base font-display font-bold text-white uppercase tracking-widest">Poki Security Circle</h2>
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">Secure the consensus ledger & accelerate speed</p>
        </div>
        <Users className="w-5 h-5 text-amber-500 animate-bounce" />
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-300 flex items-center justify-between backdrop-blur-md self-center w-full shadow-lg"
          >
            <span className="flex items-center gap-2">
              <UserCheck2 className="w-4 h-4 text-amber-400" />
              {notification}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-1 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-semibold font-mono">Security</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-light font-display mt-1 text-white">{securityCircle.length}<span className="text-xs font-normal text-white/35">/5</span></span>
          <span className="text-[9.5px] text-amber-300 mt-1 font-mono uppercase">+{ (securityCircle.length * 0.004).toFixed(3) } POKI/h boost</span>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-1 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-semibold font-mono font-sans">Referrals</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-2xl font-light font-display mt-1 text-white">
            {referrals.filter(r => r.isActive).length}<span className="text-xs font-normal text-white/35">/{referrals.length}</span>
          </span>
          <span className="text-[9.5px] text-amber-300 mt-1 font-mono uppercase">+{ (referrals.filter(r => r.isActive).length * 0.005).toFixed(3) } POKI/h boost</span>
        </div>
      </div>

      {/* Add Member Form */}
      <form onSubmit={handleAdd} className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6 relative z-10 backdrop-blur-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-amber-400" />
          Integrate Network Peer
        </h3>
        <div className="flex flex-col gap-3">
          <input
            id="member-name-input"
            type="text"
            placeholder="Peer Name (e.g. Satoshi, Grace)"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:border-amber-400 font-sans"
          />
          <div className="flex gap-2">
            <button
              id="role-referral-btn"
              type="button"
              onClick={() => setRoleType('referral')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] uppercase font-bold tracking-widest border transition-all ${
                roleType === 'referral'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 animate-pulse'
                  : 'bg-black/40 border-white/10 text-white/40'
              }`}
            >
              Referral
            </button>
            <button
              id="role-security-btn"
              type="button"
              onClick={() => setRoleType('security')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] uppercase font-bold tracking-widest border transition-all ${
                roleType === 'security'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                  : 'bg-black/40 border-white/10 text-white/40'
              }`}
            >
              Security Guardian
            </button>
          </div>
          <button
            id="add-team-member-btn"
            type="submit"
            className="w-full bg-gradient-to-tr from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold py-2 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer transition-all uppercase"
          >
            Add Peer Node
          </button>
        </div>
      </form>

      {/* Search Filter */}
      <div className="relative mb-4 z-10">
        <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-white/30" />
        <input
          id="search-team-members"
          type="text"
          placeholder="Search peers in consensus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs placeholder-white/25 focus:outline-none focus:border-amber-400 text-white"
        />
      </div>

      {/* Tabs list of members */}
      <div className="flex flex-col gap-5 relative z-10">
        
        {/* Security Circle */}
        <div>
          <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center justify-between leading-none">
            <span>Security Trust Circle ({securityCircle.length}/5)</span>
            <span className="text-[8px] uppercase text-white/30 font-bold font-mono">Quorum links</span>
          </h3>
          
          {filteredSecurity.length === 0 ? (
            <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-4 text-center text-xs text-white/30">
              {searchQuery ? "No matching peers found" : "No security guardians of trust linked."}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSecurity.map((member) => (
                <div key={member.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${member.avatarColor} bg-opacity-20 border border-opacity-35 flex items-center justify-center text-[10px] font-bold font-mono`}>
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white/90">{member.name}</div>
                      <div className="text-[8px] text-amber-400 font-bold tracking-widest uppercase flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> Core Gate Active
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-amber-400 font-semibold bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-500/20">
                      +0.004/hr
                    </span>
                    <button
                      id={`remove-sec-${member.id}`}
                      onClick={() => onRemoveMember(member.id)}
                      className="text-white/30 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/15 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referrals pool */}
        <div>
          <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center justify-between leading-none">
            <span>Referrals Pool ({referrals.length})</span>
            <span className="text-[8px] uppercase text-white/30 font-bold font-mono">Consensus peers</span>
          </h3>

          {filteredReferrals.length === 0 ? (
            <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-4 text-center text-xs text-white/30">
              {searchQuery ? "No matching peers found" : "No peer nodes linked to your domain invitation matrix."}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredReferrals.map((member) => (
                <div key={member.id} className={`border rounded-xl p-3 flex items-center justify-between transition-all ${
                  member.isActive 
                    ? 'bg-white/5 border-white/15' 
                    : 'bg-white/[0.01] border-white/5 opacity-60 hover:opacity-90'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${member.avatarColor} bg-opacity-20 border border-opacity-35 flex items-center justify-center text-[10px] font-bold font-mono`}>
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white/90">{member.name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-amber-400 animate-pulse' : 'bg-white/20'}`}></span>
                        <span className="text-[8px] text-white/40 uppercase tracking-wider font-bold font-mono">
                          {member.isActive ? 'Mining Active' : 'Offline Peer'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.isActive ? (
                      <span className="text-[9px] font-mono text-amber-400 font-semibold bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-500/20">
                        +0.005/hr
                      </span>
                    ) : (
                      <button
                        id={`ping-member-${member.id}`}
                        onClick={() => handlePing(member.id, member.name)}
                        className="text-amber-400 bg-amber-950/20 hover:bg-amber-900/30 px-2 py-1 rounded text-[8px] font-bold tracking-widest flex items-center gap-1 border border-amber-800/30 active:scale-95 transition-all uppercase cursor-pointer"
                      >
                        <BellRing className="w-2.5 h-2.5 animate-bounce" /> PING
                      </button>
                    )}
                    <button
                      id={`remove-ref-${member.id}`}
                      onClick={() => onRemoveMember(member.id)}
                      className="text-white/30 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/15 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="mt-6 bg-white/[0.02] rounded-xl p-4 border border-white/10 text-xs flex gap-3 text-white/50 relative z-10">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">
          Your <strong>Poki security circle</strong> safeguards you from bot accounts. This establishes trust quorums that validates transaction blocks so they are committed safely under Poki Koin consensus.
        </p>
      </div>

    </div>
  );
}
