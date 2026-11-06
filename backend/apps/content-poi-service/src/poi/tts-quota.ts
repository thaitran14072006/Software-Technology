export const isQuotaFailure=(message?:string|null)=>/^(GEMINI_QUOTA:|QUOTA_EXHAUSTED)/i.test(message??'');
