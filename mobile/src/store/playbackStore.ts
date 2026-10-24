import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../services/storage/kv';

interface PlaybackState {
  auto: boolean; setAuto: (b: boolean) => void;
  playedAt: Record<string, number>; markPlayed: (id: string) => void;
  canAutoPlay: (id: string, cooldownMin?: number) => boolean;      // UC3-E2
  pendingPlayId: string | null; requestPlay: (id: string) => void; clearPending: () => void;   // kết quả quét QR (UC4)
}

export const usePlayback = create<PlaybackState>()(persist((set, get) => ({
  auto: true, setAuto: (auto) => set({ auto }),
  playedAt: {}, markPlayed: (id) => set((s) => ({ playedAt: { ...s.playedAt, [id]: Date.now() } })),
  canAutoPlay: (id, cooldownMin = 30) => Date.now() - (get().playedAt[id] ?? 0) > cooldownMin * 60_000,
  pendingPlayId: null, requestPlay: (id) => set({ pendingPlayId: id }), clearPending: () => set({ pendingPlayId: null }),
}), { name: 'playback', storage: createJSONStorage(() => zustandStorage), partialize: (s) => ({ auto: s.auto, playedAt: s.playedAt }) as any }));
