import {geminiQuotaPause,nextPacificQuotaReset} from './gemini-quota';
const now=Date.parse('2026-11-10T15:00:00Z');
const quota=(id:string,delay?:string):any=>({error:{details:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaId:id}]},...(delay?[{'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay:delay}]:[])]}});
describe('Gemini quota pause policy',()=>{
 test('minute limit uses RetryInfo rather than pausing 24 hours',()=>{
  const p=geminiQuotaPause(quota('GenerateRequestsPerMinutePerProject','90s'),null,now);
  expect(p.scope).toBe('minute');expect(Date.parse(p.until!)-now).toBe(91000);expect(p.requiresReview).toBe(false);
 });
 test('Retry-After is honored as seconds or HTTP date',()=>{
  expect(Date.parse(geminiQuotaPause(quota('RequestsPerMinute'),'120',now).until!)-now).toBe(121000);
  const date=new Date(now+180000).toUTCString();
  expect(Date.parse(geminiQuotaPause(quota('RequestsPerMinute'),date,now).until!)-now).toBe(181000);
 });
 test('daily limits use Pacific midnight, even if a shorter retry hint exists',()=>{
  const p=geminiQuotaPause(quota('RequestsPerDay','30s'),null,now);
  expect(p.scope).toBe('day');expect(p.until).toBe('2026-11-11T08:01:00.000Z');
 });
 test('Pacific reset follows daylight saving time',()=>{
  expect(new Date(nextPacificQuotaReset(Date.parse('2026-07-01T15:00:00Z'))).toISOString()).toBe('2026-07-02T07:01:00.000Z');
 });
 test('unknown 429 is held for review without inventing a daily reset',()=>{
  const p=geminiQuotaPause({},null,now);expect(p.scope).toBe('unknown');expect(p.until).toBeNull();expect(p.requiresReview).toBe(true);
 });
 test('unknown limit with explicit retry hint respects that hint',()=>{
  const p=geminiQuotaPause({},'45',now);expect(p.scope).toBe('unknown');expect(p.until).toBe(new Date(now+46000).toISOString());expect(p.requiresReview).toBe(false);
 });
 test('daily constraint wins when both minute and daily quotas are reported',()=>{
  const body=quota('RequestsPerMinute');body.error.details[0].violations.push({quotaId:'RequestsPerDay'});
  expect(geminiQuotaPause(body,null,now).scope).toBe('day');
 });
 test('malformed retry hints are ignored; raw provider messages are not persisted',()=>{
  const body={error:{message:'sensitive provider text',details:[{'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay:'NaNs'}]}};
  const p=geminiQuotaPause(body,'invalid',now);expect(p.requiresReview).toBe(true);expect(JSON.stringify(p)).not.toContain('sensitive');
 });
});
