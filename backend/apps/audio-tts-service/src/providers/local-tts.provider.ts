import {SynthesizeInput,SynthesizeOutput,TtsProvider,TtsTransientError} from './tts-provider.interface';
import {validMp3} from '../util/mp3';
export class LocalTtsProvider implements TtsProvider {
 readonly name='LOCAL' as const;
 async synthesize(input:SynthesizeInput):Promise<SynthesizeOutput>{
  const base=process.env.LOCAL_TTS_URL??'http://127.0.0.1:3010';
  const response=await fetch(`${base.replace(/\/$/,'')}/synthesize`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(180000)}).catch(e=>{throw new TtsTransientError('Local TTS unavailable: '+e.message);});
  if(response.status>=500)throw new TtsTransientError('Local TTS busy or synthesis failed.');
  if(!response.ok)throw new Error(`Local TTS HTTP ${response.status}`);
  const audio=Buffer.from(await response.arrayBuffer());if(!validMp3(audio))throw new Error('Local TTS returned invalid MP3.');
  return {audio,mime:'audio/mpeg',voiceName:response.headers.get('x-voice')??input.locale,chars:input.text.length};
 }
}
