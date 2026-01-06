
import React from 'react';
import { NarrativeEntry } from '../types';
import { CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react';

interface LedgerTableProps {
    entries: NarrativeEntry[];
    onSelectEntry: (entry: NarrativeEntry) => void;
}

const LedgerTable: React.FC<LedgerTableProps> = ({ entries, onSelectEntry }) => {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="overflow-y-auto custom-scrollbar flex-1">
                <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md text-slate-500 uppercase font-black tracking-widest border-b border-white/5">
                        <tr>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Audit Memo</th>
                            <th className="px-4 py-3">Rail</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {entries.map((entry) => (
                            <tr 
                                key={entry.id} 
                                onClick={() => onSelectEntry(entry)}
                                className="hover:bg-white/[0.03] transition-all cursor-pointer group animate-in fade-in duration-300"
                            >
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-black ${
                                        entry.status === 'RECORDED' ? 'text-emerald-500 bg-emerald-500/10' :
                                        entry.status === 'OBSERVED' ? 'text-orange-400 bg-orange-500/10' :
                                        'text-rose-500 bg-rose-500/10'
                                    }`}>
                                        {entry.status === 'RECORDED' ? <CheckCircle2 size={10} /> : 
                                         entry.status === 'OBSERVED' ? <Clock size={10} /> : <AlertCircle size={10} />}
                                        {entry.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-bold text-slate-200 group-hover:text-white transition-colors truncate max-w-[200px]">{entry.description}</p>
                                    <p className="text-[9px] text-slate-500 mono mt-0.5 opacity-60">ID: {entry.id.split('-').pop()}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-slate-400 font-bold opacity-60 uppercase tracking-tighter">
                                        {entry.source.split('_')[0]}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex p-1 rounded-lg bg-white/5 text-slate-500 group-hover:text-orange-400 group-hover:bg-orange-500/10 transition-all">
                                        <ChevronRight size={14} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-slate-600 font-bold uppercase tracking-widest italic opacity-30">
                                    Awaiting state observations...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LedgerTable;
