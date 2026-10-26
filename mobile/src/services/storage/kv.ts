import { MMKV } from 'react-native-mmkv';

export const kv = new MMKV({ id: 'sag' });
export const zustandStorage = {
  getItem: (k: string) => kv.getString(k) ?? null,
  setItem: (k: string, v: string) => kv.set(k, v),
  removeItem: (k: string) => kv.delete(k),
};
