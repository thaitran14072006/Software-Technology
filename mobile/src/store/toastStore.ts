import { create } from 'zustand';

let timer: ReturnType<typeof setTimeout> | undefined;
export const useToast = create<{ msg: string | null; show: (m: string, ms?: number) => void }>((set) => ({
  msg: null,
  show: (msg, ms = 3500) => { clearTimeout(timer); set({ msg }); timer = setTimeout(() => set({ msg: null }), ms); },
}));
