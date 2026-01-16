
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { id as ethersId, Wallet } from 'ethers';
import {
    MerchantType,
    NarrativeEntry,
    NARRATIVE_ACCOUNTS,
    AssetAllocation,
    AnchorType,
    SpendResult,
    IMerchantValueAdapter
} from './types';
import LedgerTable from './components/LedgerTable';
import AssetAllocationChart from './components/AssetAllocationChart';
import {
    LayoutDashboard,
    Database,
    ShieldCheck,
    Activity,
    RefreshCw,
    Coins,
    Wallet as WalletIcon,
    ArrowRightLeft,
    PieChart,
    ChevronRight,
    Zap,
    X,
    CheckCircle2,
    Fingerprint,
    Package,
    ShoppingCart,
    Search,
    Check,
    Activity as PulseIcon,
    Scale,
    Layers,
    Shield,
    Lock,
    Boxes,
    Sliders,
    Power,
    Calendar,
    FileSearch,
    Edit3,
    Save
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

// MOCK ADMIN KEY (For Demo Terminal Authority)
const MOCK_ADMIN_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Common dev test key

const App: React.FC = () => {
    // UI State
    const [view, setView] = useState<'dashboard' | 'ledger' | 'merchants' | 'vault' | 'adapters'>('dashboard');
    const [entries, setEntries] = useState<NarrativeEntry[]>([]);
    const [stableBalance, setStableBalance] = useState<bigint>(0n);
    const [odfiBalance, setOdfiBalance] = useState<bigint>(0n);
    const [mintBalance, setMintBalance] = useState<bigint>(0n);
    const [isClearing, setIsClearing] = useState(false);
    const [unitAmount, setUnitAmount] = useState('50.00');
    const [selectedMerchant, setSelectedMerchant] = useState<MerchantType>('instacart');
    const [selectedAnchor, setSelectedAnchor] = useState<AnchorType>('GROCERY');
    const [selectedEntry, setSelectedEntry] = useState<NarrativeEntry | null>(null);
    const [lastSpendResult, setLastSpendResult] = useState<SpendResult | null>(null);
    const [stateHash, setStateHash] = useState<string>('0x...');
    const [editingAdapter, setEditingAdapter] = useState<IMerchantValueAdapter | null>(null);
    const [adapters, setAdapters] = useState<IMerchantValueAdapter[]>([]);
    const [isValidating, setIsValidating] = useState<string | null>(null);

    // Account Introspection State
    const [monitorAccountId, setMonitorAccountId] = useState<number>(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN);
    const [monitorBalance, setMonitorBalance] = useState<bigint>(0n);

    // Derived Data
    const verifiedAttestationCount = useMemo(() => entries.filter(e => !!e.attestation).length, [entries]);

    const assetData: AssetAllocation[] = useMemo(() => {
        const total = stableBalance + odfiBalance;
        if (total === 0n) return [{ label: 'Initializing', percentage: 100, color: '#1e293b' }];
        const stableP = Number((stableBalance * 100n) / total);
        return [
            { label: 'sFIAT Liquid', percentage: stableP, color: '#f97316' },
            { label: 'Trust Reserve', percentage: 100 - stableP, color: '#10b981' }
        ];
    }, [stableBalance, odfiBalance]);

    // Data Synchronization
    const refreshData = useCallback(async () => {
        try {
            const fetchBalance = async (userId: string) => {
                const response = await fetch(`${API_BASE_URL}/balance/${userId}`);
                if (!response.ok) throw new Error(`Failed to fetch balance for ${userId}`);
                const data = await response.json();
                return BigInt(data.available);
            };

            const [
                narrativeRes,
                stableCoinBalance,
                odfiBalance,
                mintBalance,
                adaptersRes
            ] = await Promise.all([
                fetch(`${API_BASE_URL}/narrative`),
                fetchBalance('HONORING_ADAPTER_STABLECOIN'),
                fetchBalance('HONORING_ADAPTER_ODFI'),
                fetchBalance('MINT'),
                fetch(`${API_BASE_URL}/adapters`),
            ]);

            if (!narrativeRes.ok || !adaptersRes.ok) throw new Error('Failed to fetch initial data');

            const narrativeData = await narrativeRes.json();
            const adaptersData = await adaptersRes.json();

            setEntries(narrativeData);
            setStableBalance(stableCoinBalance);
            setOdfiBalance(odfiBalance);
            setMintBalance(mintBalance);
            setAdapters(adaptersData);

            const monitorAccountKey = Object.keys(NARRATIVE_ACCOUNTS).find(key => NARRATIVE_ACCOUNTS[key as any] === monitorAccountId) || 'UNKNOWN';
            const monitorAccountInfo = await fetchBalance(monitorAccountKey);
            setMonitorBalance(monitorAccountInfo);

            const currentHash = ethersId(`${stableCoinBalance}${odfiBalance}${mintBalance}${narrativeData.length}`);
            setStateHash(currentHash.slice(0, 16).toUpperCase());

        } catch (error) {
            console.error("[RefreshData] Failed to fetch system state:", error);
        }
    }, [monitorAccountId]);

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 3000);
        return () => clearInterval(interval);
    }, [refreshData]);

    // Spend Logic
    const handleSpendCredit = async () => {
        setIsClearing(true);
        try {
            // 1. Prepare Intent Payload
            const timestamp = Date.now();
            const intent = {
                userId: 'gm_trust_admin',
                amount: parseFloat(unitAmount),
                merchant: selectedMerchant,
                timestamp,
                metadata: { email: 'admin@gm-trust.family' }
            };

            // 2. Sign Intent (Client-Side Authority)
            // In a real app, this prompts Metamask. Here we use the terminal key.
            const wallet = new Wallet(MOCK_ADMIN_KEY);
            // We sign the deterministic JSON string of the critical fields
            const messageToSign = JSON.stringify({
                userId: intent.userId,
                amount: intent.amount,
                merchant: intent.merchant,
                timestamp: intent.timestamp
            });
            const signature = await wallet.signMessage(messageToSign);

            // 3. Submit Signed Intent
            const response = await fetch(`${API_BASE_URL}/spend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...intent,
                    signature // Attach proof of intent
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Spend operation failed');
            }

            setLastSpendResult(result);
            await refreshData(); // Refresh data to show the latest state

        } catch (e: any) {
            console.error(e);
            alert(`Flow Rejected: ${e.message}`);
        } finally {
            setIsClearing(false);
        }
    };

    const formatCurrency = (amount: bigint) => {
        const val = Number(amount) / 1_000_000;
        const formatted = Math.abs(val).toLocaleString('en-US', {
            style: 'currency', currency: 'USD'
        });
        return (val < 0 ? '-' : '') + formatted;
    };

    const navItems = [
        { id: 'dashboard', label: 'TERMINAL', icon: LayoutDashboard },
        { id: 'merchants', label: 'HONORING', icon: ArrowRightLeft },
        { id: 'ledger', label: 'NARRATIVE', icon: Activity },
        { id: 'vault', label: 'AUTH', icon: Database },
        { id: 'adapters', label: 'ADAPTERS', icon: Sliders }
    ];

    // NOTE: Adapter configuration functionality (toggle, update, validate) is stubbed
    // as it would require additional backend endpoints which are not part of this fix.
    const toggleAdapter = (type: MerchantType) => console.warn("toggleAdapter is not implemented");
    const updateConfig = (type: MerchantType, params: Record<string, string>) => console.warn("updateConfig is not implemented");
    const validateAdapter = (type: string) => console.warn("validateAdapter is not implemented");

    const ConfigModal = () => {
        const [localConfig, setLocalConfig] = useState<Record<string, string>>({});

        useEffect(() => {
            if (editingAdapter?.configParams) {
                setLocalConfig({ ...editingAdapter.configParams });
            }
        }, [editingAdapter]);

        if (!editingAdapter) return null;

        const handleSave = () => {
            updateConfig(editingAdapter.type, localConfig);
            setEditingAdapter(null);
        };

        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingAdapter(null)} />
                <div className="relative w-full max-w-md bg-[#090e1a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">HONORING AGENT PARAMS</span>
                                <h3 className="text-xl font-black text-white italic">{editingAdapter.name}</h3>
                            </div>
                            <button onClick={() => setEditingAdapter(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {Object.entries(localConfig).map(([key, val]) => (
                                <div key={key} className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{key.replace(/_/g, ' ')}</label>
                                    <input
                                        type="text"
                                        value={val}
                                        onChange={(e) => setLocalConfig(prev => ({ ...prev, [key]: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-medium text-slate-200 focus:outline-none focus:border-orange-500/50 transition-all"
                                    />
                                </div>
                            ))}
                            {Object.keys(localConfig).length === 0 && (
                                <p className="text-center text-slate-600 text-[12px] italic py-4">No configurable parameters for this agent.</p>
                            )}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={() => setEditingAdapter(null)}
                                className="flex-1 py-3 px-6 rounded-xl border border-white/5 text-[12px] font-black text-slate-400 hover:bg-white/5 transition-all uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 px-6 rounded-xl bg-orange-600 text-white text-[12px] font-black hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20 uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <Save size={14} /> Save Config
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const DetailModal = () => {
        if (!selectedEntry) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEntry(null)} />
                <div className="relative w-full max-w-lg bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">AUDIT INTROSPECTION</span>
                                </div>
                                <h3 className="text-xl font-black text-white leading-tight italic">{selectedEntry.description}</h3>
                            </div>
                            <button onClick={() => setSelectedEntry(null)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest block mb-1">Observation ID</span>
                                <span className="text-[12px] font-mono text-slate-200 truncate block">{selectedEntry.id}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest block mb-1">State</span>
                                <span className={`text-[12px] font-black uppercase tracking-tight ${selectedEntry.status === 'RECORDED' ? 'text-emerald-400' : 'text-orange-400'}`}>{selectedEntry.status}</span>
                            </div>
                        </div>

                        {selectedEntry.attestation && (
                            <div className="p-6 rounded-[1.5rem] bg-orange-500/5 border border-orange-500/10 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Fingerprint size={16} className="text-orange-400" />
                                    <span className="text-[12px] font-black text-orange-400 uppercase tracking-widest">TRUST ATTESTATION PROOF</span>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-[12px] font-black text-slate-500 uppercase block mb-1">MERKLE ROOT AUTHORITY</span>
                                        <div className="text-[11px] font-mono text-slate-300 bg-black/50 p-3 rounded-xl border border-white/5 break-all leading-relaxed">
                                            {selectedEntry.attestation.proof.merkleRoot}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[12px] font-black text-slate-500 uppercase block mb-1">ATTESTOR KEY</span>
                                        <div className="text-[11px] font-mono text-slate-400 truncate">{selectedEntry.attestation.attestor}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic">MECHANICAL IMPACT (ZERO OVERDRAFT)</h4>
                            <div className="space-y-2">
                                {selectedEntry.lines.map((line, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/[0.03]">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${line.type === 'DEBIT' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                            <span className="text-[13px] font-bold text-slate-300">Account::{line.accountId}</span>
                                        </div>
                                        <span className={`text-[14px] font-black mono ${line.type === 'DEBIT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {line.type === 'DEBIT' ? '-' : '+'}{formatCurrency(BigInt(line.amount))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#050914] text-slate-100 selection:bg-orange-500/30 overflow-hidden relative font-['Inter']">
            {/* Ambient Lighting */}
            <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-orange-600/5 rounded-full blur-[140px] pointer-events-none" />

            <nav className="hidden lg:flex w-64 border-r border-white/5 bg-[#050914] flex-col z-20 shrink-0">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xl border border-white/10">
                            <div className="w-3 h-3 bg-orange-600 rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-[12px] font-black tracking-widest text-white uppercase leading-tight">SOVR Development <br /> Holdings LLC</h1>
                            <p className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase mt-1">VAL CORE AUTHORITY</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 px-4 space-y-1">
                    {navItems.map(nav => (
                        <button
                            key={nav.id}
                            onClick={() => setView(nav.id as any)}
                            className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl text-[14px] font-black transition-all duration-200 uppercase tracking-widest ${view === nav.id ? 'bg-white/5 text-white border border-white/5 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <nav.icon size={18} /> {nav.label}
                        </button>
                    ))}
                </div>

                <div className="mt-auto p-6 space-y-4">
                    <div className="p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[11px] uppercase font-black text-slate-400 tracking-widest">PROTOCOL PULSE</span>
                            </div>
                            <CheckCircle2 size={12} className="text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">CURRENT STATE HASH</p>
                            <div className="bg-black/40 border border-white/5 rounded-lg p-2 text-[10px] font-mono text-slate-500 truncate">{stateHash}</div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col overflow-hidden z-10 relative">
                <header className="h-16 flex items-center justify-between px-10 bg-[#050914] shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">{view.toUpperCase()} <span className="text-orange-500">CONTROL</span></h2>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-3">
                            <PulseIcon size={12} className="text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AUTHORITY HEARTBEAT:</span>
                            <span className="text-white font-mono text-[10px] tracking-widest">{stateHash}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <WalletIcon size={14} className="text-orange-400" />
                            <span className="text-[16px] font-black text-white mono leading-none tracking-tighter">{formatCurrency(stableBalance)}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth custom-scrollbar pb-10">
                    {view === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
                            <div className="grid grid-cols-4 gap-6 shrink-0">
                                {[
                                    { label: 'SFIAT CAP', value: formatCurrency(stableBalance), icon: Coins },
                                    { label: 'OBSERVATIONS', value: entries.length, icon: Activity },
                                    { label: 'ATTESTED FLOWS', value: verifiedAttestationCount, icon: ShieldCheck },
                                    { label: 'TRUST RESERVE', value: formatCurrency(odfiBalance), icon: Scale }
                                ].map((m, idx) => (
                                    <div key={idx} className="p-6 rounded-2xl bg-[#090e1a] border border-white/[0.04] shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all transform scale-150 rotate-12 pointer-events-none">
                                            <m.icon size={64} />
                                        </div>
                                        <div className="flex items-center justify-between mb-3 relative z-10">
                                            <div className="p-2.5 bg-white/5 rounded-xl text-orange-400 border border-white/5">
                                                <m.icon size={18} />
                                            </div>
                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                                        </div>
                                        <div className="text-2xl font-black text-white mono tracking-tight relative z-10">{m.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
                                <div className="col-span-8 flex flex-col gap-6 overflow-hidden">
                                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group shadow-2xl shrink-0">
                                        <div className="flex items-center gap-5 mb-6">
                                            <div className="p-4 bg-orange-600/20 rounded-[1.2rem] text-orange-400 border border-orange-500/20 shadow-xl">
                                                <Layers size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">ZERO-DEBT DOCTRINE</h2>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">MECHANICAL SUSTAINABILITY PROTOCOL</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <h3 className="text-[11px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2"><Lock size={14} /> THE KERNEL</h3>
                                                <p className="text-[12px] text-slate-400 leading-relaxed">
                                                    TigerBeetle clears transactions atomically at the trust's request. No units are minted; we acknowledge <span className="text-white italic">attested input value</span>.
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2"><PulseIcon size={14} /> THE MIRROR</h3>
                                                <p className="text-[12px] text-slate-400 leading-relaxed">
                                                    The Narrative Mirror provides a human-readable audit trail of mechanical clearing. It enables verification without compromising speed.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                                        <div className="flex items-center justify-between px-1 shrink-0">
                                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                                                <PulseIcon size={16} className="text-orange-500" /> OBSERVATION FEED
                                            </h2>
                                            <button onClick={() => setView('ledger')} className="text-[10px] font-black text-orange-400 uppercase tracking-widest hover:text-white transition-all underline underline-offset-4">FULL AUDIT LOG</button>
                                        </div>
                                        <div className="space-y-2.5 overflow-y-auto flex-1 custom-scrollbar pr-2 pb-4">
                                            {entries.slice(0, 10).map((e) => (
                                                <div key={e.id} onClick={() => setSelectedEntry(e)} className="p-4 rounded-[1.5rem] bg-[#090e1a] border border-white/[0.04] hover:border-white/10 transition-all cursor-pointer group flex justify-between items-center shadow-md">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[14px] font-black text-white block italic tracking-tight group-hover:text-orange-400 transition-colors">{e.description}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">{e.source.replace(/_/g, ' ')}</span>
                                                            <span className="text-[9px] font-black text-slate-700">•</span>
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ID::{e.id.split('-').pop()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-white group-hover:bg-orange-600/20 transition-all">
                                                        <ChevronRight size={18} />
                                                    </div>
                                                </div>
                                            ))}
                                            {entries.length > 10 && (
                                                <div className="text-center pt-2">
                                                    <button onClick={() => setView('ledger')} className="text-[10px] font-black text-orange-400 uppercase tracking-widest hover:text-slate-300">View All {entries.length} Observations</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-4 h-full">
                                    <div className="p-8 bg-[#090e1a] border border-white/[0.04] rounded-[2rem] shadow-2xl h-full flex flex-col">
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2 mb-8">
                                            <PieChart size={16} className="text-orange-500" /> TRUST ALLOCATIONS
                                        </h2>
                                        <AssetAllocationChart data={assetData} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'ledger' && (
                        <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500 overflow-hidden">
                            <div className="flex items-center justify-between shrink-0">
                                <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic">LEDGER <span className="text-orange-500">CONTROL</span></h1>
                            </div>
                            <div className="flex-1 p-8 bg-[#090e1a] border border-white/[0.04] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                                <LedgerTable entries={entries} onSelectEntry={setSelectedEntry} />
                            </div>
                        </div>
                    )}

                    {view === 'vault' && (
                        <div className="flex flex-col space-y-8 animate-in fade-in duration-500 h-full overflow-hidden pb-4">
                            <div className="shrink-0 flex items-center justify-between">
                                <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">AUTHORITY <span className="text-orange-500">VAULT</span></h1>
                                <div className="flex items-center gap-5 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                    <span className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.2em]">DOUBLE-ENTRY VERIFIED</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-8 shrink-0">
                                {[
                                    { label: 'Genesis Mint', id: NARRATIVE_ACCOUNTS.MINT, balance: mintBalance, color: 'orange', sub: 'SYSTEM_GENESIS', icon: Boxes },
                                    { label: 'sFIAT Liquid', id: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, balance: stableBalance, color: 'white', sub: 'OPERATIONAL_POOL', icon: Database },
                                    { label: 'Family Reserve', id: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI, balance: odfiBalance, color: 'white', sub: 'ODFI_BACKSTOP', icon: Shield }
                                ].map((acc, i) => (
                                    <div key={i} className="p-8 rounded-[2.5rem] bg-[#090e1a] border border-white/[0.04] shadow-xl flex flex-col justify-between group h-48 relative overflow-hidden transition-all hover:bg-[#0c1221] hover:border-white/10">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-all transform scale-150 rotate-12 pointer-events-none">
                                            <acc.icon size={80} />
                                        </div>
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="space-y-0.5">
                                                <h3 className="text-xl font-black text-white tracking-tight leading-none italic">{acc.label}</h3>
                                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{acc.sub}</p>
                                            </div>
                                            <span className="text-[10px] mono font-bold text-slate-500 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 tracking-tighter">ACC::{acc.id}</span>
                                        </div>
                                        <div className="mt-auto relative z-10">
                                            <div className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1">MECHANICAL BALANCE</div>
                                            <div className={`text-3xl font-black mono tracking-tighter truncate ${Number(acc.balance) < 0 ? 'text-orange-400' : 'text-white'}`}>{formatCurrency(acc.balance)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
                                <div className="col-span-7 p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"><Shield size={160} /></div>
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-400 border border-orange-500/20"><ShieldCheck size={28} /></div>
                                        <h3 className="text-xl font-black text-white uppercase italic tracking-widest leading-none">TRUST GOVERNANCE</h3>
                                    </div>
                                    <p className="text-[15px] text-slate-400 leading-relaxed font-medium">
                                        The SOVR FAMILY TRUST enforces a strict <span className="text-white font-black italic underline decoration-orange-500/50 underline-offset-4">Zero Overdraft</span> protocol. Clearing capacity is directly bounded by physical sFIAT injected into the Authority Gate.
                                    </p>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="p-6 rounded-[2rem] bg-black/40 border border-white/[0.03] space-y-4">
                                            <div className="flex items-center gap-4">
                                                <Lock size={16} className="text-orange-400" />
                                                <h5 className="text-[12px] font-black text-orange-400 uppercase tracking-[0.2em] italic leading-none">INPUT CONTROL</h5>
                                            </div>
                                            <p className="text-[12px] text-slate-500 leading-snug">Value enters only via cryptographically signed attestations. No units exist without explicit funding.</p>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-black/40 border border-white/[0.03] space-y-4">
                                            <div className="flex items-center gap-4">
                                                <PulseIcon size={16} className="text-emerald-400" />
                                                <h5 className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.2em] italic leading-none">STATE INTEGRITY</h5>
                                            </div>
                                            <p className="text-[12px] text-slate-500 leading-snug">Global state is verified every 3 seconds via recursive hashing of the TigerBeetle-ready ledger.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-5 flex flex-col gap-8 overflow-hidden">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-400"><Search size={22} /></div>
                                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight leading-none">INTROSPECTION</h3>
                                        </div>
                                        <select
                                            value={monitorAccountId}
                                            onChange={(e) => setMonitorAccountId(Number(e.target.value))}
                                            className="bg-[#090e1a] border border-white/5 rounded-2xl py-3 px-6 text-[12px] font-black text-slate-400 focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer shadow-xl uppercase tracking-widest"
                                        >
                                            {Object.entries(NARRATIVE_ACCOUNTS).map(([key, val]) => (
                                                <option key={val} value={val} className="bg-slate-900">{key.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1 p-10 bg-[#090e1a] rounded-[3rem] border border-white/[0.04] flex flex-col justify-center items-center text-center shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-orange-500/[0.01] animate-pulse pointer-events-none" />
                                        <span className="text-[12px] font-black text-slate-600 uppercase tracking-[0.4em] mb-8">REAL-TIME READOUT</span>
                                        <div className="text-6xl font-black text-white mono tracking-tighter leading-none mb-10 w-full truncate">{formatCurrency(monitorBalance)}</div>
                                        <div className="flex gap-12 border-t border-white/5 pt-10 w-full justify-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.3em] mb-3">STATUS</span>
                                                <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-3 italic"><CheckCircle2 size={16} /> SYNC_OK</span>
                                            </div>
                                            <div className="w-px h-14 bg-white/5" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.3em] mb-3">STATE_HASH</span>
                                                <span className="text-[12px] font-mono text-slate-500 tracking-tighter">{stateHash.slice(0, 8).toLowerCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'adapters' && (
                        <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
                            <div className="shrink-0 flex justify-between items-end">
                                <div>
                                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic">HONORING <span className="text-orange-500">ADAPTERS</span></h1>
                                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-2 ml-1">MANAGE EXTERNAL FULFILLMENT AGENTS (PERSISTENT)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12 overflow-y-auto custom-scrollbar">
                                {adapters.map((adapter) => (
                                    <div key={adapter.type} className={`p-8 rounded-[2.5rem] border transition-all duration-300 group relative overflow-hidden flex flex-col ${adapter.enabled ? 'bg-[#090e1a] border-white/[0.04] shadow-xl' : 'bg-black/20 border-white/[0.02] opacity-60'}`}>
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-all transform scale-150 rotate-12 pointer-events-none">
                                            <Package size={80} />
                                        </div>

                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex flex-col">
                                                <h3 className="text-xl font-black text-white tracking-tight leading-none italic uppercase">{adapter.name}</h3>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">TYPE::{adapter.type}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingAdapter(adapter)}
                                                    className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:bg-orange-500/20 hover:text-orange-400 transition-all border border-white/5"
                                                    title="Configure"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => validateAdapter(adapter.type)}
                                                    className={`p-3 rounded-2xl transition-all ${isValidating === adapter.type ? 'bg-orange-500 text-white animate-spin' : 'bg-white/5 text-slate-400 hover:bg-orange-500/20 hover:text-orange-400'} border border-white/5`}
                                                    title="Re-validate"
                                                >
                                                    <RefreshCw size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4 mb-8">
                                            <div className="flex items-center justify-between">
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${adapter.enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${adapter.enabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    {adapter.enabled ? 'OPERATIONAL' : 'DEACTIVATED'}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={12} className="text-slate-600" />
                                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">LAST VALIDATION</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        {adapter.lastValidatedAt ? new Date(adapter.lastValidatedAt).toLocaleTimeString() : 'AWAITING'}
                                                    </span>
                                                </div>

                                                {adapter.configParams && Object.keys(adapter.configParams).length > 0 && (
                                                    <div className="space-y-2 mt-2">
                                                        <div className="flex items-center gap-2">
                                                            <FileSearch size={12} className="text-slate-600" />
                                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">LIVE CONFIG</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {Object.entries(adapter.configParams).map(([key, val]) => (
                                                                <div key={key} className="p-2 rounded-lg bg-black/40 border border-white/[0.03] flex flex-col">
                                                                    <span className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">{key}</span>
                                                                    <span className="text-[10px] font-mono text-slate-300 truncate max-w-[140px] leading-none">{val as string}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Shield size={14} className="text-emerald-500/40" />
                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">MECHANICAL TRUST</span>
                                            </div>
                                            <button
                                                onClick={() => toggleAdapter(adapter.type)}
                                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all ${adapter.enabled ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'}`}
                                            >
                                                <Power size={14} />
                                                {adapter.enabled ? 'DEACTIVATE' : 'ACTIVATE'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {view === 'merchants' && (
                        <div className="w-full max-w-[900px] mx-auto min-h-full flex flex-col justify-center animate-in slide-in-from-bottom-6 duration-500 pb-16 px-4">
                            <div className="p-8 lg:p-10 rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border border-white/[0.08] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                                {lastSpendResult ? (
                                    <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 space-y-8 p-4 text-center">
                                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] border-4 border-emerald-500/20 shrink-0">
                                            <Check size={32} className="text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Flow Authorized</h2>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Settlement Verified via SOVR Authority</p>
                                        </div>
                                        <div className="w-full max-w-sm bg-black/50 border border-white/10 rounded-[1.5rem] p-6 space-y-4 text-left shadow-inner">
                                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Units Consumed</span>
                                                <span className="text-xl font-black text-emerald-400 mono">${unitAmount}</span>
                                            </div>
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">Redemption Proof</span>
                                                <div className="p-4 bg-white/5 rounded-xl text-center mono text-lg font-black text-white tracking-[0.2em] border border-white/10 shadow-lg truncate">{lastSpendResult.value.code}</div>
                                                <p className="text-[11px] font-bold text-slate-400 italic leading-relaxed text-center px-4">{lastSpendResult.value.redemptionInstructions}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setLastSpendResult(null)} className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-sm rounded-xl transition-all uppercase tracking-[0.3em] active:scale-95">Initiate New Intent</button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="text-center">
                                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">Universal Honoring</h2>
                                            <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">Converting Attestation to Reality</p>
                                        </div>
                                        <div className="grid grid-cols-12 gap-8">
                                            <div className="col-span-12 lg:col-span-5 space-y-4">
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Select Agent</h3>
                                                <div className="flex flex-col gap-3">
                                                    {adapters.map(m => (
                                                        <button
                                                            key={m.type}
                                                            onClick={() => m.enabled && setSelectedMerchant(m.type as MerchantType)}
                                                            disabled={!m.enabled}
                                                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left relative overflow-hidden group ${!m.enabled ? 'opacity-30 grayscale cursor-not-allowed border-white/5' : selectedMerchant === m.type ? 'bg-orange-600 border-orange-400 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}
                                                        >
                                                            <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-[0.1] transition-all transform scale-125 rotate-6 pointer-events-none">
                                                                <ShoppingCart size={36} />
                                                            </div>
                                                            <div className={`p-2.5 rounded-lg relative z-10 ${selectedMerchant === m.type ? 'bg-white/20' : 'bg-white/5'}`}><ShoppingCart size={20} /></div>
                                                            <div className="relative z-10">
                                                                <span className="text-[14px] font-black uppercase tracking-widest block leading-none">{m.name.split(' ')[0]}</span>
                                                                {!m.enabled && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1 block">OFFLINE</span>}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                                                <div className="p-6 bg-black/40 border border-white/5 rounded-[2rem] shadow-inner space-y-6">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Consumption Anchor</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['GROCERY', 'FUEL', 'MOBILE', 'HOUSING', 'MEDICAL'].map(a => (
                                                                <button key={a} onClick={() => setSelectedAnchor(a as AnchorType)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${selectedAnchor === a ? 'bg-orange-500/20 border-orange-500 text-orange-300' : 'bg-white/5 border-transparent text-slate-600 hover:bg-white/10'}`}>{a}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Units (USD Equiv.)</label>
                                                        <div className="relative">
                                                            <span className="absolute inset-y-0 left-6 flex items-center text-orange-500 font-black text-3xl">$</span>
                                                            <input type="number" value={unitAmount} onChange={(e) => setUnitAmount(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-3xl font-black text-white focus:outline-none focus:border-orange-500/50 transition-all text-center mono shadow-inner" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={handleSpendCredit} disabled={isClearing || !adapters.find(a => a.type === selectedMerchant)?.enabled} className="group relative w-full py-6 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 disabled:opacity-20 text-white font-black text-xl rounded-2xl transition-all shadow-xl flex items-center justify-center gap-4 active:scale-[0.98] uppercase tracking-[0.2em] overflow-hidden">
                                                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                                                    {isClearing ? <RefreshCw className="animate-spin" size={24} /> : <Zap size={24} />}
                                                    <span>Execute Trust Flow</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {DetailModal()}
            {ConfigModal()}
        </div>
    );
};

export default App;
