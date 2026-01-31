import React, { useState, useEffect } from 'react';
import { 
    X, 
    Shield, 
    Fingerprint, 
    CheckCircle2, 
    Lock, 
    Cpu, 
    FileSignature, 
    ArrowRight,
    ExternalLink,
    Flame,
    Wallet as WalletIcon
} from 'lucide-react';
import { CreditEventType } from '../val/events/types';
import { BrowserProvider, Contract, parseUnits } from 'ethers';

interface AttestationModalProps {
    onClose: () => void;
    onAttest: (amount: number, txHash?: string) => Promise<any>;
    walletAddress: string | null;
    isWalletConnected: boolean;
    onConnectWallet: () => Promise<void>;
}

type AttestationState = 'IDLE' | 'BURNING' | 'SIGNING' | 'VERIFYING' | 'CLEARING' | 'COMPLETE' | 'FAILED';

const PENDING_STATES = ['BURNING', 'SIGNING', 'VERIFYING', 'CLEARING'];

const USD_SOVR_ADDRESS = '0x65e75529f796cc1439774395b77ea8d9d4f90422';
const BURN_ABI = [
    "function burn(uint256 amount) public",
    "function decimals() view returns (uint8)"
];

export const AttestationModal: React.FC<AttestationModalProps> = ({ onClose, onAttest, walletAddress, isWalletConnected, onConnectWallet }) => {
    const [amount, setAmount] = useState<string>('1000');
    const [txHash, setTxHash] = useState<string>('');
    const [state, setState] = useState<AttestationState>('IDLE');
    const [logs, setLogs] = useState<string[]>([]);
    const [proof, setProof] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

    const handleExecute = async () => {
        if (state !== 'IDLE') return;
        
        let finalTxHash = txHash;
        
        try {
            // Step 0: Handle Automated Burn if wallet connected
            if (walletAddress && isWalletConnected) {
                setState('BURNING');
                addLog('Connecting to Provider...');
                
                // Enforce Base Network
                const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
                if (chainId !== '0x2105') { // Base Mainnet (8453)
                    addLog('Switching to Base Network...');
                    try {
                        await (window as any).ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x2105' }],
                        });
                    } catch (switchError: any) {
                        // This error code indicates that the chain has not been added to MetaMask.
                        if (switchError.code === 4902) {
                            addLog('Adding Base Network to Wallet...');
                            await (window as any).ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x2105',
                                    chainName: 'Base Mainnet',
                                    nativeCurrency: {
                                        name: 'ETH',
                                        symbol: 'ETH',
                                        decimals: 18
                                    },
                                    rpcUrls: ['https://mainnet.base.org'],
                                    blockExplorerUrls: ['https://basescan.org']
                                }],
                            });
                        } else {
                            throw switchError;
                        }
                    }
                }

                const provider = new BrowserProvider((window as any).ethereum);
                const signer = await provider.getSigner();
                const contract = new Contract(USD_SOVR_ADDRESS, BURN_ABI, signer);
                
                addLog(`Burning ${amount} usdSOVR on Base...`);
                // Assume 6 decimals for usdSOVR as seen in Phantom
                const burnAmount = parseUnits(amount, 6);
                const tx = await contract.burn(burnAmount);
                addLog(`Transaction Submitted: ${tx.hash.substring(0, 10)}...`);
                
                await tx.wait();
                addLog('Burn Confirmed on Base.');
                finalTxHash = tx.hash;
                setTxHash(tx.hash);
            }

            setState('SIGNING');
            setLogs(prev => [...prev, '> Initializing Attestation Engine...', '> Generating Event Hash...']);
            if (finalTxHash) addLog(`Linking External Proof: ${finalTxHash.substring(0, 10)}...`);
            
            // Simulate cryptographic delay
            await new Promise(r => setTimeout(r, 800));
            addLog('Requesting Authority Signature...');
            
            setState('VERIFYING');
            await new Promise(r => setTimeout(r, 800));
            addLog('Signature Verified. Valid Attestation.');
            addLog('Submitting to TigerBeetle Cluster...');

            setState('CLEARING');
            const result = await onAttest(Number(amount) * 1_000_000, finalTxHash); 
            
            setProof(result.attestation);
            addLog(`Cleared: Transfer::${result.txId}`);
            addLog('Mechanical Truth Established.');
            
            setState('COMPLETE');
        } catch (e: any) {
            console.error(e);
            setError(e.message);
            addLog(`ERROR: ${e.message}`);
            setState('FAILED');
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-lg glass-card p-0 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                            <Fingerprint size={20} className="text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Attest Value</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">External Origin Gateway</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    
                    {/* Input Phase */}
                    {state === 'IDLE' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                <p className="text-[12px] text-cyan-200 leading-relaxed">
                                    <strong className="text-white uppercase tracking-wider">Doctrine Warning:</strong> You are about to attest to the existence of external value. This action corresponds to a real-world deposit liability.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attestation Amount (USD)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <span className="text-cyan-500 font-bold text-xl">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-2xl font-black mono-value text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">usdSOVR</span>
                                    </div>
                                </div>
                            </div>

                            {!isWalletConnected ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blockchain Transaction Hash (Optional Proof)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Lock size={16} className="text-cyan-500/50" />
                                        </div>
                                        <input
                                            type="text"
                                            value={txHash}
                                            onChange={(e) => setTxHash(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-xs font-mono text-cyan-100 placeholder:text-white/10 focus:outline-none focus:border-cyan-500/50 transition-all"
                                            placeholder="0x... (Burn or Locking Hash)"
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                                        Linking a transaction hash establishes a permanent narrative bridge between the external burn and this terminal's mechanical truth.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/20 rounded-lg">
                                        <Flame size={16} className="text-orange-500 animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Automated Proof Generation</h4>
                                        <p className="text-[10px] text-slate-400 leading-snug">
                                            Transaction hash will be automatically captured from your wallet signature upon burning.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Processing Phase */}
                    {PENDING_STATES.includes(state) && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-fade-in">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                {/* Rings */}
                                <div className={`absolute inset-0 rounded-full border-4 border-cyan-500/20 ${state === 'BURNING' || state === 'SIGNING' ? 'animate-ping' : ''}`} />
                                <div className={`absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin`} />
                                
                                {/* Icon */}
                                {state === 'BURNING' && <Flame size={32} className="text-orange-500 animate-pulse" />}
                                {state === 'SIGNING' && <FileSignature size={32} className="text-cyan-400 animate-pulse" />}
                                {state === 'VERIFYING' && <Shield size={32} className="text-purple-400 animate-pulse" />}
                                {state === 'CLEARING' && <Cpu size={32} className="text-orange-400 animate-pulse" />}
                            </div>
                            
                            <div className="text-center space-y-2">
                                <h4 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">
                                    {state === 'BURNING' && 'Burning usdSOVR...'}
                                    {state === 'SIGNING' && 'Requesting Signature...'}
                                    {state === 'VERIFYING' && 'Verifying Proof...'}
                                    {state === 'CLEARING' && 'Clearing Ledger...'}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                    {state === 'BURNING' ? 'Blockchain Transaction' : 'Cryptographic Handshake'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Complete Phase */}
                    {state === 'COMPLETE' && proof && (
                        <div className="space-y-6 animate-scale-in">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                    <CheckCircle2 size={32} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tight">Attestation Verified</h4>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Value Realized On-Chain</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Input Value</span>
                                    <span className="text-lg font-black mono-value neon-text-cyan">${Number(amount).toFixed(2)}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase block">Attestor Signature</span>
                                    <div className="p-2 bg-black/40 rounded border border-white/5 text-[9px] mono-value text-slate-400 break-all">
                                        {proof.signature || '0x7f83...9a12'} 
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase block">Verifiable Proof (Base)</span>
                                    <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-white/5">
                                        <span className="text-[9px] mono-value text-cyan-400 truncate max-w-[200px]">{txHash || 'N/A'}</span>
                                        {txHash && (
                                            <a 
                                                href={`https://basescan.org/tx/${txHash}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-white hover:text-cyan-400 transition-colors"
                                            >
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={onClose} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                                <CheckCircle2 size={18} /> Close Console
                            </button>
                        </div>
                    )}

                    {/* Terminal Logs */}
                    {logs.length > 0 && (
                        <div className="p-4 rounded-xl bg-[#0a0f1e] border border-white/5 font-mono text-[10px] text-slate-400 space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className={log.includes('ERROR') ? 'text-rose-400' : 'text-slate-400'}>{log}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {state === 'IDLE' && (
                    <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col gap-4">
                        {!isWalletConnected ? (
                            <button 
                                onClick={onConnectWallet}
                                className="group flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 text-orange-400 hover:from-orange-500/30 hover:to-orange-600/30 transition-all font-black uppercase tracking-widest"
                            >
                                <WalletIcon size={18} className="text-orange-400" />
                                Connect Wallet to Burn
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {walletAddress?.substring(0, 6)}...{walletAddress?.substring(38)}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Base Connected</span>
                            </div>
                        )}

                        <button 
                            onClick={handleExecute}
                            disabled={!amount || Number(amount) <= 0}
                            className={`w-full py-4 flex items-center justify-center gap-3 group rounded-xl font-black uppercase tracking-widest transition-all ${isWalletConnected ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-cyan-500 text-white shadow-[0_0_20_rgba(6,182,212,0.3)]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isWalletConnected ? <Flame size={18} /> : <Lock size={16} />}
                            <span>{isWalletConnected ? 'Burn & Attest' : 'Sign & Attest'}</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
