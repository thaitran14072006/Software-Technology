import {createHash} from 'crypto';
/** The exact normalized text used for invalidating an audio narration. */
export const sha256=(s:string)=>createHash('sha256').update(s.trim()).digest('hex');
