import { create } from 'zustand';

export interface Coords { lat: number; lng: number; accuracy?: number | null; }

export const useLocationStore = create<{
  coords: Coords | null; lastFixAt: number; background: boolean;
  setFix: (c: Coords) => void; setBackground: (b: boolean) => void; clear: () => void;
}>((set) => ({
  coords: null, lastFixAt: 0, background: false,
  setFix: (coords) => set({ coords, lastFixAt: Date.now() }),
  setBackground: (background) => set({ background }),
  clear: () => set({ coords: null, lastFixAt: 0 }),
}));
