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
  }), ['http://192.168.1.15:4173/?source=api','http://10.0.0.5:4173/?source=api']);
  assert.deepEqual(lanURLs(4173, {}), []);
});
