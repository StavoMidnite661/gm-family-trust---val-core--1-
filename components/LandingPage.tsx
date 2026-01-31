import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    Activity, 
    Zap, 
    ChevronRight, 
    Lock, 
    Globe, 
    Cpu, 
    Layers,
    ArrowRight
} from 'lucide-react';

interface LandingPageProps {
    onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className={`fixed inset-0 z-[200] bg-[#050810] text-white overflow-y-auto transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
                <div className="grid-overlay opacity-30" />
            </div>

            <main className="relative z-10 h-full flex flex-col items-center justify-center px-6">
                
                {/* Hero Section */}
                <div className="max-w-5xl mx-auto text-center space-y-12">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-fade-in">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">System Online</span>
                    </div>

                    {/* Main Title */}
                    <div className="space-y-4 animate-slide-up">
                        <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase">
                            <span className="text-white">SOVR</span>{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] via-[#47d1ff] to-[#ff6b35] drop-shadow-[0_0_30px_rgba(0,212,255,0.3)]">
                                ValCore
                            </span>
                        </h1>
                        <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-[0.4em] max-w-2xl mx-auto leading-relaxed">
                            Mechanical Truth & Sovereign Doctrine
                        </p>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto pt-8 stagger-children">
                        {[
                            { 
                                icon: ShieldCheck, 
                                title: "Zero-Debt", 
                                desc: "Atomic clearing with 100% reserve backing.",
                                color: "emerald" 
                            },
                            { 
                                icon: Cpu, 
                                title: "Hyper-Execution", 
                                desc: "TigerBeetle ledger with <10ms latency.",
                                color: "cyan" 
                            },
                            { 
                                icon: Lock, 
                                title: "Trust Governance", 
                                desc: "Cryptographic authn/z for all flows.",
                                color: "purple" 
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 hover:scale-105 animate-slide-up text-left">
                                <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`} />
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${feature.color}-500/10 to-${feature.color}-500/5 border border-${feature.color}-500/20 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-shadow`}>
                                    <feature.icon size={24} className={`text-${feature.color === 'cyan' ? '[#00d4ff]' : feature.color === 'emerald' ? '[#00ff88]' : '[#a855f7]'}`} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className="pt-12 animate-slide-up" style={{ animationDelay: '600ms' }}>
                        <button 
                            onClick={() => {
                                setIsVisible(false);
                                setTimeout(onEnter, 800);
                            }}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-cyan-50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,212,255,0.4)]"
                        >
                            <span>Initialize Terminal</span>
                            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                            <div className="absolute inset-0 rounded-full ring-2 ring-white/50 animate-ping opacity-20" />
                        </button>
                        <p className="mt-4 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                            Secure Connection &bull; v2.0.4
                        </p>
                    </div>

                </div>
            </main>

            {/* Footer / Tech Stack */}
            <footer className="absolute bottom-6 left-0 right-0 flex justify-center gap-8 text-slate-600 animate-fade-in delay-1000">
                {[Layers, Globe, Activity, Zap].map((Icon, i) => (
                    <Icon key={i} size={16} className="opacity-50 hover:opacity-100 transition-opacity" />
                ))}
            </footer>
        </div>
    );
};

export default LandingPage;
