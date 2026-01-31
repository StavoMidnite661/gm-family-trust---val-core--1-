import React, { useState } from 'react';
import { 
    Check, 
    ShoppingCart, 
    RefreshCw, 
    Zap, 
    CreditCard, 
    ArrowRight,
    Shield,
    Terminal
} from 'lucide-react';
import { 
    IMerchantValueAdapter, 
    MerchantType, 
    AnchorType, 
    SpendResult 
} from '../types';

interface HonoringTerminalProps {
    adapters: IMerchantValueAdapter[];
    isClearing: boolean;
    lastSpendResult: SpendResult | null;
    onSpend: (amount: string, merchant: MerchantType, anchor: AnchorType) => Promise<void>;
    onClearResult: () => void;
}

const ANCHOR_TYPES: AnchorType[] = ['GROCERY', 'FUEL', 'MOBILE', 'HOUSING', 'MEDICAL'];

const HonoringTerminal: React.FC<HonoringTerminalProps> = ({
    adapters,
    isClearing,
    lastSpendResult,
    onSpend,
    onClearResult
}) => {
    // Internal Form State
    const [selectedMerchant, setSelectedMerchant] = useState<MerchantType | null>(null);
    const [selectedAnchor, setSelectedAnchor] = useState<AnchorType>('GROCERY');
    const [unitAmount, setUnitAmount] = useState<string>('');

    const handleExecute = () => {
        if (!selectedMerchant) return;
        onSpend(unitAmount, selectedMerchant, selectedAnchor);
    };

    if (lastSpendResult) {
        return (
            <div className="max-w-3xl mx-auto animate-fade-in">
                <div className="glass-card p-8 md:p-10 border-gradient relative overflow-hidden">
                    {/* Success Background Effect */}
                    <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay" />
                    
                    <div className="flex flex-col items-center text-center space-y-8 animate-scale-in relative z-10 py-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-glow-pulse">
                            <Check size={48} className="text-white drop-shadow-md" />
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Flow Authorized</h2>
                            <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-[0.2em]">Settlement Verified via SOVR Authority</p>
                        </div>

                        <div className="w-full max-w-sm bg-black/40 border border-white/10 rounded-2xl p-6 space-y-6 backdrop-blur-md">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Units Consumed</span>
                                <span className="text-2xl font-black neon-text-emerald mono-value">${unitAmount}</span>
                            </div>
                            
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold text-orange-400 uppercase block tracking-widest text-left">Redemption Proof</span>
                                <div className="p-5 bg-white/5 rounded-xl text-center mono-value text-xl font-black text-white tracking-widest border border-dashed border-white/20 select-all font-mono">
                                    {lastSpendResult.value.code}
                                </div>
                                <p className="text-[11px] text-slate-400 text-left font-medium leading-relaxed">
                                    {lastSpendResult.value.redemptionInstructions}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={onClearResult} 
                            className="btn-primary min-w-[200px] mt-4 group"
                        >
                            <span className="flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                                New Intent <ArrowRight size={18} />
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in relative z-10">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-10 bg-cyan-500/10 blur-[100px] rounded-full opacity-20 pointer-events-none" />

            <div className="glass-card p-1 md:p-1 border-gradient-subtle">
                <div className="bg-[#050810]/90 backdrop-blur-xl rounded-[20px] p-8 md:p-12 border border-white/5">
                    
                    {/* Header */}
                    <div className="text-center mb-12 space-y-3">
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight flex items-center justify-center gap-4">
                            <span className="text-white">SOVR</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#ff6b35]">
                                ValCore Honoring
                            </span>
                        </h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">Mechanical Truth & Sovereign Doctrine</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        
                        {/* Left Column: Agent Selection */}
                        <div className="lg:col-span-5 space-y-4">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Shield size={12} /> Select Agent
                            </label>
                            <div className="space-y-2 max-h-[300px] lg:h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {adapters.map(m => {
                                    const isSelected = selectedMerchant === m.type;
                                    const isDisabled = !m.enabled;
                                    
                                    return (
                                        <button
                                            key={m.type}
                                            onClick={() => !isDisabled && setSelectedMerchant(m.type as MerchantType)}
                                            disabled={isDisabled}
                                            className={`w-full p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 text-left group
                                                ${isDisabled 
                                                    ? 'opacity-30 cursor-not-allowed border-transparent bg-white/2' 
                                                    : isSelected 
                                                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] translate-x-1' 
                                                        : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/8'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                                                ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'}
                                            `}>
                                                <ShoppingCart size={18} />
                                            </div>
                                            
                                            <div className="flex-1">
                                                <span className={`text-sm font-bold uppercase block transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                                    {m.name.split(' ')[0]}
                                                </span>
                                                {isDisabled && <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Offline</span>}
                                            </div>
                                            
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column: Controls */}
                        <div className="lg:col-span-7 flex flex-col gap-8">
                            
                            {/* Anchor Type Selector */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anchor Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {ANCHOR_TYPES.map(a => (
                                        <button 
                                            key={a} 
                                            onClick={() => setSelectedAnchor(a)} 
                                            className={`px-3 py-3 rounded-lg text-[10px] font-bold uppercase border transition-all duration-200
                                                ${selectedAnchor === a 
                                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                                    : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                                                }`}
                                        >
                                            {a.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Units (USD)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                        <span className="text-cyan-500 font-black text-3xl group-focus-within:text-cyan-400 transition-colors">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={unitAmount}
                                        onChange={(e) => setUnitAmount(e.target.value)}
                                        className="w-full bg-[#030508] border border-white/10 rounded-2xl py-4 md:py-6 pl-10 md:pl-14 pr-4 md:pr-6 text-2xl md:text-4xl font-black mono-value text-white 
                                            focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-right
                                            placeholder:text-white/10"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex-grow" />

                            {/* Execute Button */}
                            <button
                                onClick={handleExecute}
                                disabled={isClearing || !selectedMerchant || !adapters.find(a => a.type === selectedMerchant)?.enabled}
                                className={`
                                    relative w-full py-4 md:py-6 rounded-xl overflow-hidden group transition-all duration-300
                                    ${!selectedMerchant 
                                        ? 'bg-white/5 opacity-50 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-orange-500 to-rose-600 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] hover:scale-[1.02]'
                                    }
                                `}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-4 text-white font-black uppercase tracking-widest text-lg">
                                    {isClearing ? <RefreshCw className="animate-spin" size={24} /> : <Zap size={24} className={selectedMerchant ? "animate-pulse" : ""} />}
                                    <span>{isClearing ? 'Processing Trust Flow...' : 'Execute Trust Flow'}</span>
                                    {!isClearing && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />}
                                </div>
                                
                                {/* Button Shine Effect */}
                                {selectedMerchant && !isClearing && (
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HonoringTerminal;
