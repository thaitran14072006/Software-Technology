import {env} from '../../config/env';
import {kv} from '../storage/kv';
export function runtimeConfig(){try{return {default_trigger_radius_m:10,replay_audio_cooldown_min:30,...JSON.parse(kv.getString('runtime-config')??'{}')};}catch{return {default_trigger_radius_m:10,replay_audio_cooldown_min:30};}}
export async function loadRuntimeConfig(){try{const r=await fetch(`${env.API_BASE}/configs`,{signal:AbortSignal.timeout(8000)});if(r.ok)kv.set('runtime-config',JSON.stringify(await r.json()));}catch{} }
