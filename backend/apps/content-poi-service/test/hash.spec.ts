import { sha256 } from '@app/common/hash';

test('hash ổn định và bỏ khoảng trắng đầu/cuối', () => {
  expect(sha256('abc')).toBe(sha256('  abc \n'));
  expect(sha256('abc')).not.toBe(sha256('abd'));
  expect(sha256('abc')).toHaveLength(64);
});
