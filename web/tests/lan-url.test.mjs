import test from 'node:test';
import assert from 'node:assert/strict';
import { lanURLs } from '../../scripts/lan-url.mjs';
test('Phone QR uses private physical LAN IPv4, excluding loopback and virtual adapters', () => {
  const addr = (address, internal=false) => ({address, internal, family:'IPv4'});
  assert.deepEqual(lanURLs(4173, {
    'Loopback': [addr('127.0.0.1',true)],
    'vEthernet (WSL)': [addr('172.20.16.1')],
    'Wi-Fi': [addr('192.168.1.15'),addr('192.168.1.15')],
    'Ethernet': [addr('10.0.0.5')],
    'Other': [addr('169.254.1.5'),addr('8.8.8.8')],
  }), ['http://192.168.1.15:4173/','http://10.0.0.5:4173/']);
  assert.deepEqual(lanURLs(4173, {}), []);
});


test('VPN adapters preceding Wi-Fi cannot become the phone QR address', () => {
  const addr = address => ({address, internal:false, family:'IPv4'});
  assert.deepEqual(lanURLs(4173, {
    CloudflareWARP: [addr('172.16.0.2')],
    'Cloudflare WARP': [addr('172.16.0.3')],
    WireGuard: [addr('10.0.0.2')],
    ZeroTier: [addr('10.0.0.3')],
    'Wi-Fi': [addr('192.168.1.36')],
  }), ['http://192.168.1.36:4173/']);
  assert.deepEqual(lanURLs(4173, {CloudflareWARP:[addr('172.16.0.2')]}), []);
});
