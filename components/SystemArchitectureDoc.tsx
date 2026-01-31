import React from 'react';
import {
    Layers,
    Database,
    ShieldCheck,
    ArrowRightLeft,
    Zap,
    Globe,
    Lock,
    Cpu,
    FileSearch
} from 'lucide-react';

const SystemArchitectureDoc: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-12">
            
            {/* Header Section */}
            <div className="text-center mb-10 space-y-2">
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-3">
                    <FileSearch className="text-cyan-400" size={32} />
                    System <span className="text-gradient">Architecture</span>
                </h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">
                    Mechanical Truth & Sovereign Doctrine
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Funding Sources (The Origin) */}
                <div className="lg:col-span-12 glass-card p-1 border-gradient-subtle">
                    <div className="bg-[#050810]/80 backdrop-blur-md rounded-[20px] p-6 md:p-8 border border-white/5">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                    <Database size={24} className="text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">1. Funding Sources</h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset Agnostic Liquidity</p>
                                </div>
                            </div>
                            <div className="badge badge-success">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 transition-colors">
                                <h3 className="text-[11px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ShieldCheck size={12} /> Primary Origins
                                </h3>
                                <ul className="space-y-3">
                                    {[
                                        { label: 'Crypto Assets', desc: 'USDC, ETH deposited into Authority Vaults.' },
                                        { label: 'Sovereign Grants', desc: 'UBI or Community Dividends.' },
                                        { label: 'Rights Assertions', desc: 'Claims on essential services.' }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[12px] text-slate-400 leading-snug">
                                            <div className="w-1 h-1 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                                            <span><strong className="text-slate-200">{item.label}:</strong> {item.desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Cpu size={64} className="text-white" />
                                </div>
                                <h3 className="text-[11px] font-black text-orange-400 uppercase tracking-widest mb-2">Mechanical Flow</h3>
                                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                                    When value is recognized, the Treasury Mint debits itself (creates liability) 
                                    and credits the User Vault (creates asset). This is the only way new "Sovereign Credit" enters the system.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. System Architecture */}
                <div className="lg:col-span-6 glass-card p-1">
                    <div className="bg-[#050810]/80 backdrop-blur-md rounded-[20px] p-6 h-full border border-white/5 flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                <Layers size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">2. Architecture</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Component Interaction</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 flex-1">
                            {[ 
                                { title: 'The Kernel', desc: 'Immutable ledger. Mechanical truth.', icon: Lock, color: 'text-rose-400' },
                                { title: 'The Mirror', desc: 'Audit trails. Human-readable history.', icon: Globe, color: 'text-cyan-400' },
                                { title: 'Spend Engine', desc: 'Validates attestations & clearing.', icon: Cpu, color: 'text-emerald-400' },
                                { title: 'Adapters', desc: 'Real-world bridges (Tillo/Stripe).', icon: Zap, color: 'text-orange-400' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-white/5 hover:bg-white/5 transition-colors group">
                                    <div className={`p-2 rounded-lg bg-white/5 ${item.color} group-hover:scale-110 transition-transform`}>
                                        <item.icon size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-wide">{item.title}</h4>
                                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Attestations */}
                <div className="lg:col-span-6 glass-card p-1">
                    <div className="bg-[#050810]/80 backdrop-blur-md rounded-[20px] p-6 h-full border border-white/5 flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <ShieldCheck size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">3. Attestations</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">The "Golden Ticket"</p>
                            </div>
                        </div>
                        
                        <div className="relative space-y-5 pl-2 flex-1 flex flex-col justify-center">
                            {/* Connector Line */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-emerald-500/50 via-cyan-500/30 to-transparent" />

                            {[ 
                                { step: '01', title: 'Intent', desc: 'User requests spend. CreditEvent generated.' },
                                { step: '02', title: 'Signing', desc: 'Attestor Key signs event hash.' },
                                { step: '03', title: 'Verification', desc: 'Signature verified. Ledger unlocked.' },
                                { step: '04', title: 'Execution', desc: 'Funds move. Value realized.' }
                            ].map((item, idx) => (
                                <div key={idx} className="relative flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-full bg-[#050810] border-2 border-white/10 flex items-center justify-center z-10 group-hover:border-emerald-500/50 transition-colors">
                                        <span className="text-[10px] font-black text-slate-500 group-hover:text-emerald-400">{item.step}</span>
                                    </div>
                                    <div className="flex-1 p-3 rounded-xl border border-transparent group-hover:bg-white/5 group-hover:border-white/5 transition-all">
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-wide mb-0.5">{item.title}</h4>
                                        <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Fund Flow Diagram */}
                <div className="lg:col-span-12 glass-card p-1">
                    <div className="bg-gradient-to-br from-[#050810] to-[#0a0f1e] rounded-[20px] p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                    <ArrowRightLeft size={24} className="text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">4. Lifecycle of Funds</h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ledgers Update, Money Does Not Move</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                            {/* Connectors for desktop */}
                            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />

                            {[ 
                                { 
                                    step: 'Phase I', 
                                    title: 'Minting', 
                                    desc: `Treasury Liability created.
User Asset created.`, 
                                    color: 'border-cyan-500/30' 
                                },
                                { 
                                    step: 'Phase II', 
                                    title: 'Spending', 
                                    desc: `User Asset destroyed.
System Buffer created.`, 
                                    color: 'border-orange-500/30' 
                                },
                                { 
                                    step: 'Phase III', 
                                    title: 'Settlement', 
                                    desc: `System Buffer cleared.
Vendor Paid.`, 
                                    color: 'border-emerald-500/30' 
                                }
                            ].map((item, i) => (
                                <div key={i} className={`relative z-10 bg-[#050810] p-6 rounded-2xl border ${item.color} shadow-lg group hover:-translate-y-1 transition-transform duration-300`}>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{item.step}</div>
                                    <h3 className="text-lg font-black text-white uppercase mb-2 group-hover:text-gradient transition-colors">{item.title}</h3>
                                    <div className="w-8 h-[2px] bg-white/10 mb-3 group-hover:w-full transition-all duration-500" />
                                    <p className="text-[11px] text-slate-400 whitespace-pre-line leading-relaxed font-mono">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 flex justify-center">
                            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-orange-500/5 border border-orange-500/20 backdrop-blur-sm">
                                <Zap size={16} className="text-orange-400 animate-pulse" />
                                <p className="text-[10px] text-orange-200/80 font-medium">
                                    <span className="font-black text-orange-400 uppercase tracking-wider">Honoring Guarantee:</span> If external delivery fails, the system owes a refund. No manual rollbacks.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SystemArchitectureDoc;
