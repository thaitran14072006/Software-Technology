export type QuotaScope='minute'|'day'|'unknown';
export interface QuotaPause {
 scope:QuotaScope;
 until:string|null;
 requiresReview:boolean;
 quotaIds:string[];
 reason:string;
}

// Daily RPD resets at midnight Pacific, including daylight-saving transitions.
export function nextPacificQuotaReset(now:number):number {
 const clock=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hourCycle:'h23',hour:'2-digit',minute:'2-digit'});
 const first=Math.floor(now/60000)*60000+60000;
 for(let i=0;i<27*60;i++){
  const candidate=first+i*60000;
  const parts=Object.fromEntries(clock.formatToParts(candidate).map(p=>[p.type,p.value]));
  if(parts.hour==='00'&&parts.minute==='00')return candidate+60000;
 }
 throw new Error('Cannot determine Pacific quota reset');
}

export function geminiQuotaPause(body:any,retryAfter:string|null,now=Date.now()):QuotaPause {
 const details=Array.isArray(body?.error?.details)?body.error.details:[];
 const violations=details.filter((d:any)=>String(d?.['@type']||'').endsWith('google.rpc.QuotaFailure'))
  .flatMap((d:any)=>Array.isArray(d.violations)?d.violations:[]);
 const rawIds=violations.flatMap((v:any)=>[v?.quotaId,v?.quotaMetric]).filter((v:any)=>typeof v==='string');
 const words=[...rawIds,String(body?.error?.message||'')].map(s=>s.toLowerCase().replace(/[^a-z0-9]/g,''));
 const scope:QuotaScope=words.some(s=>/perday|daily|requestsday/.test(s))?'day'
  :words.some(s=>/perminute|requestsminute|tokensminute/.test(s))?'minute':'unknown';
 const delays=details.filter((d:any)=>String(d?.['@type']||'').endsWith('google.rpc.RetryInfo'))
  .map((d:any)=>/^\d+(?:\.\d+)?s$/.test(d.retryDelay)?Number(d.retryDelay.slice(0,-1))*1000:0);
 const seconds=retryAfter&&/^\d+(?:\.\d+)?$/.test(retryAfter.trim())?Number(retryAfter)*1000:0;
 const date=retryAfter&&!seconds?Date.parse(retryAfter):NaN;
 const hint=Math.max(0,...delays,seconds,Number.isFinite(date)?date-now:0);
 const until=scope==='day'?Math.max(nextPacificQuotaReset(now),now+hint+1000)
  :scope==='minute'?now+Math.max(60000,hint)+1000:hint>0?now+hint+1000:null;
 return {scope,until:until===null?null:new Date(until).toISOString(),requiresReview:until===null,
  // Keep only quota identifiers, never raw provider messages or credentials.
  quotaIds:rawIds.map(s=>s.replace(/[^a-zA-Z0-9_./:-]/g,'').slice(0,160)),
  reason:scope==='day'?'DAILY_QUOTA_EXHAUSTED':scope==='minute'?'MINUTE_RATE_LIMIT':'QUOTA_LIMIT_UNKNOWN'};
}
