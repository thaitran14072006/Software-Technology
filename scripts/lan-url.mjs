import { networkInterfaces } from 'node:os';

// Only offer private addresses on physical adapters for the same-Wi-Fi demo.
export function lanURLs(port = 4173, interfaces = networkInterfaces()) {
  return [...new Set(Object.entries(interfaces)
    .filter(([name]) => !/loopback|vethernet|vmware|virtualbox|docker|wsl|tailscale|vpn/i.test(name))
    .flatMap(([, addresses]) => addresses || [])
    .filter(a => !a.internal && a.family === 'IPv4' && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address))
    .map(a => `http://${a.address}:${port}/?source=api`))];
}
