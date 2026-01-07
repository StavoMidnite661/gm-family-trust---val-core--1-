
import { NarrativeEntry } from '../types';

const API_BASE = 'http://localhost:3001/api';

export interface NarrativeMirrorService {
    recordNarrativeEntry(entry: any): Promise<void>;
    getEntries(): Promise<NarrativeEntry[]>;
}

class NarrativeMirrorClient implements NarrativeMirrorService {
    
    // In API mode, we don't record directly from client.
    // The specific "Observer" role is now strictly server-side.
    async recordNarrativeEntry(entry: any): Promise<void> {
        console.warn('[NarrativeMirror] Client attempted to record entry. Ignored in API mode.');
    }

    async getEntries(): Promise<NarrativeEntry[]> {
        try {
            const response = await fetch(`${API_BASE}/narrative`);
            if (!response.ok) throw new Error('Failed to fetch narrative');
            return await response.json();
        } catch (error) {
            console.error('[NarrativeMirror] Fetch error:', error);
            return [];
        }
    }
}

let instance: NarrativeMirrorService | null = null;

export function getNarrativeMirror(): NarrativeMirrorService {
    if (!instance) {
        instance = new NarrativeMirrorClient();
    }
    return instance;
}
