import React, { useState, useEffect, useMemo, useCallback } from "react";
import { id as ethersId, Wallet } from "ethers";
import {
  MerchantType,
  NarrativeEntry,
  NARRATIVE_ACCOUNTS,
  AssetAllocation,
  AnchorType,
  SpendResult,
  IMerchantValueAdapter,
} from "./types";
import LedgerTable from "./components/LedgerTable";
import AssetAllocationChart from "./components/AssetAllocationChart";
import ToastController from "./components/ToastController";
import LandingPage from "./components/LandingPage";
import HonoringTerminal from "./components/HonoringTerminal";
import { AttestationModal } from "./components/AttestationModal";
import SystemArchitectureDoc from "./components/SystemArchitectureDoc";
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
  Check,
  Activity as PulseIcon,
  Scale,
  Layers,
  Shield,
  Lock,
  Sliders,
  Power,
  Calendar,
  FileSearch,
  Edit3,
  Save,
  Terminal,
  Cpu,
  Radio,
  History,
  ExternalLink,
} from "lucide-react";

// Environment-aware API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
const MOCK_ADMIN_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const App: React.FC = () => {
  // UI State
  const [view, setView] = useState<
    "dashboard" | "ledger" | "merchants" | "vault" | "adapters" | "about"
  >("dashboard");
  const [showLanding, setShowLanding] = useState(true);
  const [entries, setEntries] = useState<NarrativeEntry[]>([]);
  const [stableBalance, setStableBalance] = useState<bigint>(0n);
  const [odfiBalance, setOdfiBalance] = useState<bigint>(0n);
  const [mintBalance, setMintBalance] = useState<bigint>(0n);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<NarrativeEntry | null>(
    null,
  );
  const [lastSpendResult, setLastSpendResult] = useState<SpendResult | null>(
    null,
  );
  const [stateHash, setStateHash] = useState<string>("0x...");
  const [editingAdapter, setEditingAdapter] =
    useState<IMerchantValueAdapter | null>(null);
  const [adapters, setAdapters] = useState<IMerchantValueAdapter[]>([]);
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const [monitorAccountId, setMonitorAccountId] = useState<number>(
    NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN,
  );
  const [monitorBalance, setMonitorBalance] = useState<bigint>(0n);
  const [walletAddress, setWalletAddress] = useState<string | null>(
    localStorage.getItem("sovr_wallet_address"),
  );
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(
    !!localStorage.getItem("sovr_wallet_address"),
  );
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const connectWallet = useCallback(async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
          localStorage.setItem("sovr_wallet_address", accounts[0]);
        }
      } catch (err) {
        console.error("Wallet connection failed:", err);
      }
    } else {
      addToast({
        title: "Wallet Not Found",
        message: "Please install a Web3 wallet (MetaMask/Phantom) to continue.",
        type: "error",
      });
    }
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (
        typeof window !== "undefined" &&
        (window as any).ethereum &&
        localStorage.getItem("sovr_wallet_address")
      ) {
        const accounts = await (window as any).ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
        } else {
          localStorage.removeItem("sovr_wallet_address");
          setWalletAddress(null);
          setIsWalletConnected(false);
        }
      }
    };
    checkConnection();
  }, []);

  const verifiedAttestationCount = useMemo(
    () => entries.filter((e) => !!e.attestation).length,
    [entries],
  );

  const assetData: AssetAllocation[] = useMemo(() => {
    const total = stableBalance + odfiBalance;
    if (total === 0n)
      return [{ label: "Initializing", percentage: 100, color: "#1e293b" }];
    const stableP = Number((stableBalance * 100n) / total);
    return [
      { label: "sFIAT Liquid", percentage: stableP, color: "#00d4ff" },
      { label: "Trust Reserve", percentage: 100 - stableP, color: "#00ff88" },
    ];
  }, [stableBalance, odfiBalance]);

  const refreshData = useCallback(async () => {
    try {
      const fetchBalance = async (userId: string) => {
        const response = await fetch(`${API_BASE_URL}/balance/${userId}`);
        if (!response.ok)
          throw new Error(`Failed to fetch balance for ${userId}`);
        const data = await response.json();
        return BigInt(data.available);
      };

      const fetchLedgerBalance = async (accountId: number) => {
        const response = await fetch(
          `${API_BASE_URL}/tigerbeetle/balance/${accountId}`,
        );
        if (!response.ok)
          throw new Error(`Failed to fetch ledger balance for ${accountId}`);
        const data = await response.json();
        return BigInt(data.available);
      };

      const [
        narrativeRes,
        stableCoinBalance,
        odfiBalance,
        mintBalance,
        adaptersRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/narrative`),
        fetchBalance("HONORING_ADAPTER_STABLECOIN"),
        fetchBalance("HONORING_ADAPTER_ODFI"),
        fetchBalance("MINT"),
        fetch(`${API_BASE_URL}/adapters`),
      ]);

      if (!narrativeRes.ok || !adaptersRes.ok)
        throw new Error("Failed to fetch initial data");

      const narrativeData = await narrativeRes.json();
      const adaptersData = await adaptersRes.json();

      setEntries(narrativeData);
      setStableBalance(stableCoinBalance);
      setOdfiBalance(odfiBalance);
      setMintBalance(mintBalance);
      setAdapters(adaptersData);

      // Correctly fetch the raw ledger balance for the selected monitor account
      const monitorAccountInfo = await fetchLedgerBalance(monitorAccountId);
      setMonitorBalance(monitorAccountInfo);

      const currentHash = ethersId(
        `${stableCoinBalance}${odfiBalance}${mintBalance}${narrativeData.length}`,
      );
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

  const [isFunding, setIsFunding] = useState(false);
  const [showAttestationModal, setShowAttestationModal] = useState(false);

  // Helper to dispatch toast events
  const addToast = (detail: {
    title: string;
    message: string;
    type: "success" | "error" | "info";
    txHash?: string;
  }) => {
    const event = new CustomEvent("jh-create-toast", {
      detail: {
        message: detail.message,
        appearance:
          detail.type === "error"
            ? "negative"
            : detail.type === "success"
              ? "positive"
              : "neutral",
        timeout: 5000,
        action: detail.txHash ? (
          <a href={`/tx/${detail.txHash}`} className="text-[10px] underline">
            View TX
          </a>
        ) : undefined,
      },
    });
    window.dispatchEvent(event);
  };

  const handleFunding = async (amountMicroUnits: number, txHash?: string) => {
    setIsFunding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "gm_trust_admin",
          amount: amountMicroUnits,
          txHash,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addToast({
        title: "Attestation Verified",
        message: `External value cleared: $${(amountMicroUnits / 1_000_000).toFixed(2)}`,
        type: "success",
        txHash: data.txId,
      });

      // Refresh Data
      const [balanceRes, mirrorRes] = await Promise.all([
        fetch(`${API_BASE_URL}/balance/gm_trust_admin`),
        fetch(`${API_BASE_URL}/narrative`), // Refresh feed
      ]);

      const balanceData = await balanceRes.json();
      setStableBalance(BigInt(balanceData.available));

      const feedData = await mirrorRes.json();
      setEntries(feedData);

      return data; // Return full data including proof for the modal
    } catch (err: any) {
      console.error("Funding failed:", err);
      addToast({
        title: "Attestation Failed",
        message: err.message,
        type: "error",
      });
      throw err;
    } finally {
      setIsFunding(false);
    }
  };

  const handleSpendCredit = async (
    amount: string,
    merchant: MerchantType,
    anchor: AnchorType,
  ) => {
    setIsClearing(true);
    try {
      const timestamp = Date.now();
      const intent = {
        userId: "gm_trust_admin",
        amount: parseFloat(amount),
        merchant: merchant,
        timestamp,
        metadata: { email: "admin@gm-trust.family" },
      };

      const wallet = new Wallet(MOCK_ADMIN_KEY);
      const messageToSign = JSON.stringify({
        userId: intent.userId,
        amount: intent.amount,
        merchant: intent.merchant,
        timestamp: intent.timestamp,
      });
      const signature = await wallet.signMessage(messageToSign);

      const response = await fetch(`${API_BASE_URL}/spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...intent, signature }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Spend operation failed");
      }

      setLastSpendResult(result);
      await refreshData();

      window.dispatchEvent(
        new CustomEvent("jh-create-toast", {
          detail: {
            message: `Clearing Finalized: $${intent.amount} @ ${intent.merchant}`,
            appearance: "positive",
          },
        }),
      );
    } catch (e: any) {
      console.error(e);
      window.dispatchEvent(
        new CustomEvent("jh-create-toast", {
          detail: {
            message: `Flow Rejected: ${e.message}`,
            appearance: "negative",
          },
        }),
      );
    } finally {
      setIsClearing(false);
    }
  };

  const formatCurrency = (amount: bigint) => {
    const val = Number(amount) / 1_000_000;
    const formatted = Math.abs(val).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    return (val < 0 ? "-" : "") + formatted;
  };

  const navItems = [
    { id: "dashboard", label: "Terminal", icon: Terminal },
    { id: "merchants", label: "Honoring", icon: Zap },
    { id: "ledger", label: "Narrative", icon: Activity },
    { id: "vault", label: "Authority", icon: Shield },
    { id: "adapters", label: "Adapters", icon: Cpu },
    { id: "about", label: "System", icon: FileSearch },
  ];

  const toggleAdapter = (type: MerchantType) =>
    console.warn("toggleAdapter is not implemented");
  const updateConfig = (type: MerchantType, params: Record<string, string>) =>
    console.warn("updateConfig is not implemented");
  const validateAdapter = (type: string) =>
    console.warn("validateAdapter is not implemented");

  // Modal Components
  const ConfigModal = () => {
    const [localConfig, setLocalConfig] = useState<Record<string, string>>({});
    useEffect(() => {
      if (editingAdapter?.configParams)
        setLocalConfig({ ...editingAdapter.configParams });
    }, [editingAdapter]);
    if (!editingAdapter) return null;

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={() => setEditingAdapter(null)}
        />
        <div className="relative w-full max-w-md glass-card p-8 space-y-6 animate-scale-in">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black neon-text-orange uppercase tracking-widest">
                Agent Config
              </span>
              <h3 className="text-xl font-black text-white">
                {editingAdapter.name}
              </h3>
            </div>
            <button
              onClick={() => setEditingAdapter(null)}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {Object.entries(localConfig).map(([key, val]) => (
              <div key={key} className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  {key.replace(/_/g, " ")}
                </label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-medium text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            ))}
            {Object.keys(localConfig).length === 0 && (
              <p className="text-center text-slate-600 text-[12px] italic py-4">
                No configurable parameters.
              </p>
            )}
          </div>
          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setEditingAdapter(null)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                updateConfig(editingAdapter.type, localConfig);
                setEditingAdapter(null);
              }}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save size={14} /> Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const HistoryModal = ({
    onClose,
    userId,
  }: {
    onClose: () => void;
    userId: string;
  }) => {
    const [history, setHistory] = useState<NarrativeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetch(`${API_BASE_URL}/history/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setHistory(data);
          setLoading(false);
        })
        .catch((err) => console.error("History fetch failed:", err));
    }, [userId]);

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl glass-card flex flex-col max-h-[85vh] overflow-hidden border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
                <Activity size={20} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Vault Transaction History
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  6-Month Permanent Audit Trail
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3">
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-cyan-400 rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm font-bold text-slate-500 uppercase">
                  No records found for this account
                </p>
              </div>
            ) : (
              history.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">
                        {entry.description}
                      </h4>
                    </div>
                    {entry.txHash && (
                      <a
                        href={`https://basescan.org/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 px-2 rounded bg-cyan-500/10 text-[9px] font-black text-cyan-400 hover:bg-cyan-500/20 flex items-center gap-1 uppercase tracking-widest transition-all"
                      >
                        Verifiable Proof <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {entry.lines.map((line, lid) => (
                      <div
                        key={lid}
                        className="px-2 py-1 rounded-md bg-black/40 border border-white/5 text-[10px] flex items-center gap-x-1.5"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${line.type === "DEBIT" ? "bg-rose-500" : "bg-emerald-500"}`}
                        />
                        <span className="text-slate-500 font-bold">
                          Acct::{line.accountId}
                        </span>
                        <span
                          className={`font-black ${line.type === "DEBIT" ? "text-rose-400" : "text-emerald-400"}`}
                        >
                          {line.type === "DEBIT" ? "-" : "+"}
                          {formatCurrency(BigInt(line.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-black/40 border-t border-white/10 flex justify-center">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Shield size={10} /> Authorized Perspective :: Mechanical Truth
              Cluster :: 0X-NMM-AUTH
            </p>
          </div>
        </div>
      </div>
    );
  };

  const DetailModal = () => {
    if (!selectedEntry) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedEntry(null)}
        />
        <div className="relative w-full max-w-lg glass-card p-8 space-y-6 animate-scale-in">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="pulse-dot pulse-dot-emerald" />
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">
                  Audit Introspection
                </span>
              </div>
              <h3 className="text-xl font-black text-white leading-tight">
                {selectedEntry.description}
              </h3>
            </div>
            <button
              onClick={() => setSelectedEntry(null)}
              className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                Observation ID
              </span>
              <span className="text-[12px] mono-value text-slate-200 truncate block">
                {selectedEntry.id}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                State
              </span>
              <span
                className={`text-[12px] font-black uppercase tracking-tight ${selectedEntry.status === "RECORDED" ? "neon-text-emerald" : "neon-text-orange"}`}
              >
                {selectedEntry.status}
              </span>
            </div>
          </div>

          {selectedEntry.attestation && (
            <div className="p-6 rounded-[1.5rem] bg-cyan-500/5 border border-cyan-500/10 space-y-4">
              <div className="flex items-center gap-2">
                <Fingerprint size={16} className="text-cyan-400" />
                <span className="text-[12px] font-black neon-text-cyan uppercase tracking-widest">
                  Trust Attestation Proof
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[12px] font-black text-slate-500 uppercase block mb-1">
                    Merkle Root
                  </span>
                  <div className="text-[11px] mono-value text-slate-300 bg-black/50 p-3 rounded-xl border border-white/5 break-all leading-relaxed">
                    {selectedEntry.attestation.proof.merkleRoot}
                  </div>
                </div>
                <div>
                  <span className="text-[12px] font-black text-slate-500 uppercase block mb-1">
                    Attestor
                  </span>
                  <div className="text-[11px] mono-value text-slate-400 truncate">
                    {selectedEntry.attestation.attestor}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
              Mechanical Impact
            </h4>
            <div className="space-y-2">
              {selectedEntry.lines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/[0.03]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${line.type === "DEBIT" ? "bg-rose-500" : "bg-emerald-500"}`}
                    />
                    <span className="text-[13px] font-bold text-slate-300">
                      Account::{line.accountId}
                    </span>
                  </div>
                  <span
                    className={`text-[14px] font-black mono-value ${line.type === "DEBIT" ? "text-rose-400" : "neon-text-emerald"}`}
                  >
                    {line.type === "DEBIT" ? "-" : "+"}
                    {formatCurrency(BigInt(line.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-black/40 border-t border-white/10 flex justify-center">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Shield size={10} /> Authorized Perspective :: Mechanical Truth
              Cluster :: 0X-NMM-AUTH
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050810] text-slate-100 selection:bg-cyan-500/30 overflow-hidden font-['Inter'] flex flex-col">
      {showLanding && <LandingPage onEnter={() => setShowLanding(false)} />}

      <ToastController />

      {/* Animated Background */}
      <div className="mesh-gradient absolute inset-0 pointer-events-none" />
      <div className="grid-overlay absolute inset-0 pointer-events-none" />

      {/* Floating Navigation */}
      <nav className="relative z-50 p-2 md:p-4">
        <div className="max-w-7xl mx-auto glass-card px-4 py-3 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
              <Radio size={20} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black uppercase tracking-widest text-white">
                SOVR ValCore
              </h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                SOVR Authority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 px-2 -mx-2 flex-1 sm:flex-none justify-start sm:justify-center mask-fade-edges sm:mask-none">
            {navItems.map((nav) => (
              <button
                key={nav.id}
                onClick={() => setView(nav.id as any)}
                className={`nav-pill flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0 ${
                  view === nav.id
                    ? "bg-white/10 text-white shadow-[0_0_15px_-3px_rgba(255,255,255,0.2)] border border-white/20"
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <nav.icon
                  size={16}
                  className={view === nav.id ? "text-cyan-400" : ""}
                />
                <span className="hidden md:inline text-[11px] font-bold uppercase tracking-wider">
                  {nav.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="pulse-dot pulse-dot-emerald" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:inline">
                Live
              </span>
            </div>
            <button
              onClick={() => setShowAttestationModal(true)}
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              <WalletIcon
                size={14}
                className={`text-cyan-400 ${isFunding ? "animate-pulse" : ""}`}
              />
              <span className="text-sm font-black mono-value text-white group-hover:neon-text-cyan transition-all">
                {isFunding ? "Attesting..." : formatCurrency(stableBalance)}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pb-12 px-4 md:px-8 flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard View */}
          {view === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
                {[
                  {
                    label: "sFIAT Cap",
                    value: formatCurrency(stableBalance),
                    sub: "SYSTEM_CAP",
                    icon: Coins,
                    color: "cyan",
                  },
                  {
                    label: "Observations",
                    value: entries.length,
                    sub: "AUDIT_LOGS",
                    icon: Activity,
                    color: "orange",
                  },
                  {
                    label: "Attested",
                    value: verifiedAttestationCount,
                    sub: "VERIFIED_PROOFS",
                    icon: ShieldCheck,
                    color: "emerald",
                  },
                  {
                    label: "Reserve",
                    value: formatCurrency(odfiBalance),
                    sub: "ODFI_BACKING",
                    icon: Scale,
                    color: "purple",
                  },
                ].map((m, idx) => (
                  <div
                    key={idx}
                    className="glass-card p-6 md:p-8 group hover-lift animate-slide-up relative overflow-hidden"
                  >
                    {/* Background Gradient & Glow - Subtle Vault Feel */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-all duration-500" />

                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex items-start justify-between mb-4 md:mb-6">
                        <div>
                          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-1">
                            {m.label}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {m.sub}
                          </p>
                        </div>
                        <div
                          className={`p-2 rounded-xl md:p-2.5 bg-${m.color === "cyan" ? "cyan" : m.color === "orange" ? "orange" : m.color === "emerald" ? "emerald" : "purple"}-500/10 border border-${m.color}-500/20 shadow-[0_0_15px_-3px_rgba(0,0,0,0.3)] shrink-0`}
                        >
                          <m.icon
                            size={18}
                            className={`text-${m.color === "cyan" ? "[#00d4ff]" : m.color === "orange" ? "[#ff6b35]" : m.color === "emerald" ? "[#00ff88]" : "[#a855f7]"}`}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 opacity-70">
                          Current Value
                        </div>
                        <div
                          className={`text-2xl md:text-3xl font-black mono-value ${m.color === "cyan" ? "neon-text-cyan" : "text-white"} drop-shadow-lg`}
                        >
                          {m.value}
                        </div>
                      </div>
                    </div>

                    {/* Micro-accent line */}
                    <div
                      className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-${m.color}-500/50 to-transparent w-0 group-hover:w-full transition-all duration-700 ease-out`}
                    />
                  </div>
                ))}
              </div>

              {/* Main Grid - Single Column for Readability */}
              <div className="flex flex-col gap-6 items-center stagger-children">
                {/* Doctrine Panel */}
                <div className="w-full">
                  <div className="glass-card p-8 h-full relative overflow-hidden group">
                    {/* Subtle Background Accent */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="flex items-center gap-5 mb-8 relative z-10">
                      <div className="p-4 bg-cyan-950/30 rounded-2xl border border-cyan-500/10 shadow-[0_0_20px_-5px_rgba(8,145,178,0.2)]">
                        <Layers
                          size={28}
                          className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                        />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                          Zero-Debt Doctrine
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Mechanical Sustainability Protocol
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      <div className="p-6 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/20 transition-colors group/card">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded bg-cyan-500/10">
                            <Lock size={14} className="text-cyan-400" />
                          </div>
                          <h3 className="text-[12px] font-black text-white uppercase tracking-widest group-hover/card:text-cyan-400 transition-colors">
                            The Kernel
                          </h3>
                        </div>
                        <p className="text-[13px] text-slate-400 leading-relaxed font-medium">
                          TigerBeetle clears transactions atomically. No units
                          are minted; we acknowledge{" "}
                          <span className="text-white font-bold drop-shadow-md">
                            attested input value
                          </span>
                          .
                        </p>
                      </div>

                      <div className="p-6 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/20 transition-colors group/card">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded bg-emerald-500/10">
                            <PulseIcon size={14} className="text-emerald-400" />
                          </div>
                          <h3 className="text-[12px] font-black text-white uppercase tracking-widest group-hover/card:text-emerald-400 transition-colors">
                            The Mirror
                          </h3>
                        </div>
                        <p className="text-[13px] text-slate-400 leading-relaxed font-medium">
                          The Narrative Mirror provides a human-readable audit
                          trail of mechanical clearing without compromising
                          speed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allocation Chart */}
                <div className="w-full">
                  <div className="glass-card p-8 h-full relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-[12px] font-black uppercase tracking-widest text-white flex items-center gap-3 mb-8">
                        <div className="p-1.5 bg-cyan-500/10 rounded-lg">
                          <PieChart size={16} className="text-cyan-400" />
                        </div>
                        Allocations
                      </h2>
                      <div className="transform scale-110 mt-4">
                        <AssetAllocationChart data={assetData} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observation Feed */}
              <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[100px] bg-gradient-to-b from-orange-900/10 to-transparent blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-white flex items-center gap-3">
                    <div className="p-1.5 bg-orange-500/10 rounded-lg">
                      <PulseIcon size={16} className="text-orange-500" />
                    </div>
                    Live Observation Feed
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowHistoryModal(true)}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 hover:border-white/10 transition-all flex items-center gap-2 group"
                    >
                      History <History size={12} />
                    </button>
                    <button
                      onClick={() => setView("ledger")}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 hover:border-white/10 transition-all flex items-center gap-2 group"
                    >
                      Full Audit{" "}
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                  {entries.slice(0, 6).map((e) => (
                    <div
                      key={e.id}
                      onClick={() => setSelectedEntry(e)}
                      className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all cursor-pointer group flex flex-col justify-between h-[100px] shadow-sm hover:shadow-cyan-900/20 relative overflow-hidden"
                    >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex justify-between items-start relative z-10">
                        <span
                          className={`badge ${e.source === "ATTESTATION" ? "badge-success" : "badge-neutral"} text-[9px] py-0.5`}
                        >
                          {e.source.replace(/_/g, " ")}
                        </span>
                        <ChevronRight
                          size={14}
                          className="text-slate-600 group-hover:text-cyan-400 transition-colors transform group-hover:translate-x-1"
                        />
                      </div>

                      <div className="relative z-10">
                        <span className="text-[13px] font-bold text-slate-200 block truncate mb-1 group-hover:text-white transition-colors">
                          {e.description}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ID::{e.id.split("-").pop()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ledger View */}
          {view === "ledger" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                  Narrative <span className="text-gradient">Control</span>
                </h1>
              </div>
              <div className="glass-card p-6 md:p-8 scan-lines">
                <LedgerTable
                  entries={entries}
                  onSelectEntry={setSelectedEntry}
                />
              </div>
            </div>
          )}

          {/* Vault View */}
          {view === "vault" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                  Authority <span className="text-gradient">Vault</span>
                </h1>
                <div className="badge badge-success px-4 py-2">
                  <CheckCircle2 size={14} /> Double-Entry Verified
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
                {[
                  {
                    label: "Genesis Mint",
                    id: NARRATIVE_ACCOUNTS.MINT,
                    balance: mintBalance,
                    sub: "SYSTEM_GENESIS",
                    icon: Database,
                  },
                  {
                    label: "sFIAT Liquid",
                    id: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN,
                    balance: stableBalance,
                    sub: "OPERATIONAL_POOL",
                    icon: Coins,
                  },
                  {
                    label: "Family Reserve",
                    id: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI,
                    balance: odfiBalance,
                    sub: "ODFI_BACKSTOP",
                    icon: Shield,
                  },
                ].map((acc, i) => (
                  <div
                    key={i}
                    className="glass-card p-8 group hover-lift animate-slide-up"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-black text-white">
                          {acc.label}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          {acc.sub}
                        </p>
                      </div>
                      <span className="text-[10px] mono-value text-slate-500 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5">
                        ACC::{acc.id}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2">
                      Mechanical Balance
                    </div>
                    <div
                      className={`text-3xl font-black mono-value ${Number(acc.balance) < 0 ? "text-rose-400" : "neon-text-cyan"}`}
                    >
                      {formatCurrency(acc.balance)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-7 glass-card p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                      <ShieldCheck size={24} className="text-orange-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      Trust Governance
                    </h3>
                  </div>
                  <p className="text-[14px] text-slate-400 leading-relaxed mb-6">
                    The SOVR FAMILY TRUST enforces a strict{" "}
                    <span className="text-white font-bold neon-text-orange">
                      Zero Overdraft
                    </span>{" "}
                    protocol. Clearing capacity is directly bounded by physical
                    sFIAT injected into the Authority Gate.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-black/30 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Lock size={14} className="text-cyan-400" />
                        <h5 className="text-[11px] font-black neon-text-cyan uppercase">
                          Input Control
                        </h5>
                      </div>
                      <p className="text-[12px] text-slate-500 leading-snug">
                        Value enters only via cryptographically signed
                        attestations.
                      </p>
                    </div>
                    <div className="p-5 rounded-xl bg-black/30 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <PulseIcon size={14} className="text-emerald-400" />
                        <h5 className="text-[11px] font-black neon-text-emerald uppercase">
                          State Integrity
                        </h5>
                      </div>
                      <p className="text-[12px] text-slate-500 leading-snug">
                        Global state verified every 3 seconds via recursive
                        hashing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      Introspection
                    </h3>
                    <select
                      value={monitorAccountId}
                      onChange={(e) =>
                        setMonitorAccountId(Number(e.target.value))
                      }
                      className="bg-[#0a0f1e] border border-white/10 rounded-xl py-2 px-4 text-[11px] font-bold text-slate-400 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                    >
                      {Object.entries(NARRATIVE_ACCOUNTS).map(([key, val]) => (
                        <option key={val} value={val} className="bg-slate-900">
                          {key.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="glass-card p-8 text-center animate-glow-pulse">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block mb-4">
                      Real-Time Readout
                    </span>
                    <div className="text-4xl md:text-5xl font-black mono-value neon-text-cyan mb-6">
                      {formatCurrency(monitorBalance)}
                    </div>
                    <div className="flex justify-center gap-8 border-t border-white/5 pt-6">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                          Status
                        </span>
                        <span className="text-[11px] font-black neon-text-emerald flex items-center gap-1">
                          <CheckCircle2 size={12} /> SYNC
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                          Hash
                        </span>
                        <span className="text-[11px] mono-value text-slate-500">
                          {stateHash.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Adapters View */}
          {view === "adapters" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                  Honoring <span className="text-gradient">Adapters</span>
                </h1>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-2">
                  External Fulfillment Agents
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {adapters.map((adapter) => (
                  <div
                    key={adapter.type}
                    className={`glass-card p-6 group animate-slide-up ${!adapter.enabled ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-black text-white uppercase">
                          {adapter.name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          TYPE::{adapter.type}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingAdapter(adapter)}
                          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-400 transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => validateAdapter(adapter.type)}
                          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-orange-500/20 hover:text-orange-400 transition-all"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`badge ${adapter.enabled ? "badge-success" : "badge-error"} mb-4`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${adapter.enabled ? "bg-emerald-500" : "bg-rose-500"}`}
                      />
                      {adapter.enabled ? "Operational" : "Offline"}
                    </div>

                    {adapter.configParams &&
                      Object.keys(adapter.configParams).length > 0 && (
                        <div className="space-y-2 mb-4">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            Config
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(adapter.configParams)
                              .slice(0, 2)
                              .map(([key, val]) => (
                                <div
                                  key={key}
                                  className="p-2 rounded-lg bg-black/30 border border-white/5"
                                >
                                  <span className="text-[8px] font-bold text-slate-500 uppercase block">
                                    {key}
                                  </span>
                                  <span className="text-[10px] mono-value text-slate-300 truncate block max-w-[100px]">
                                    {val as string}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">
                        Last:{" "}
                        {adapter.lastValidatedAt
                          ? new Date(
                              adapter.lastValidatedAt,
                            ).toLocaleTimeString()
                          : "Never"}
                      </span>
                      <button
                        onClick={() => toggleAdapter(adapter.type)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase transition-all ${adapter.enabled ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}
                      >
                        <Power size={12} />
                        {adapter.enabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merchants/Honoring View */}
          {view === "merchants" && (
            <HonoringTerminal
              adapters={adapters}
              isClearing={isClearing}
              lastSpendResult={lastSpendResult}
              onSpend={handleSpendCredit}
              onClearResult={() => setLastSpendResult(null)}
            />
          )}

          {/* About/System View */}
          {view === "about" && <SystemArchitectureDoc />}
        </div>
      </main>

      {DetailModal()}
      {ConfigModal()}
      {showHistoryModal && (
        <HistoryModal
          onClose={() => setShowHistoryModal(false)}
          userId="user_demo"
        />
      )}
      {showAttestationModal && (
        <AttestationModal
          onClose={() => setShowAttestationModal(false)}
          onAttest={handleFunding}
          walletAddress={walletAddress}
          isWalletConnected={isWalletConnected}
          onConnectWallet={connectWallet}
        />
      )}
    </div>
  );
};

export default App;
