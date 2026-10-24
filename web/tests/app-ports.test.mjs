import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { appPorts, assertPortsAvailable } from '../../scripts/check-app-ports.mjs';

test('Startup rejects an occupied port and releases successful probes', async () => {
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  try {
    await assert.rejects(assertPortsAvailable([{ name: 'web', port, host: '127.0.0.1' }]), /đang được sử dụng/);
  } finally {
    await new Promise(resolve => listener.close(resolve));
  }
  const endpoints = [{ name: 'web', port, host: '127.0.0.1' }];
  await assertPortsAvailable(endpoints);
  await assertPortsAvailable(endpoints);
});

test('Startup checks all configured services and rejects conflicting configuration', async () => {
  assert.deepEqual(appPorts({ PORT: '4180', API_HOST: '127.0.0.2' }, true).map(item => [item.port, item.host]), [
    ['4180', '0.0.0.0'], [3001, '127.0.0.2'], [3002, '127.0.0.2'], [3003, '127.0.0.2'],
  ]);
  await assert.rejects(assertPortsAvailable([{ name: 'web', port: 'bad', host: '127.0.0.1' }]), /không hợp lệ/);
  // Validate the duplicate case before opening a second listener.
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  await assert.rejects(assertPortsAvailable([{ name: 'web', port, host: '127.0.0.1' }, { name: 'API', port, host: '127.0.0.1' }]), /trùng cổng/);
});
