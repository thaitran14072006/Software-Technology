import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useNetwork() {
  const [s, setS] = useState({ online: true, wifi: false });
  useEffect(() => NetInfo.addEventListener((st) =>
    setS({ online: !!st.isConnected && st.isInternetReachable !== false, wifi: st.type === 'wifi' })), []);
  return s;
}
