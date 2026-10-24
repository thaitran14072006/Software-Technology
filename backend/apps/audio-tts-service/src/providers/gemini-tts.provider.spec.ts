import {GeminiTtsProvider,geminiRequest} from './gemini-tts.provider';
import {TtsQuotaError} from './tts-provider.interface';
describe('Gemini AI Studio provider',()=>{
 const original=process.env.GEMINI_API_KEY;
 beforeEach(()=>{process.env.GEMINI_API_KEY='test-not-a-real-key';});
 afterAll(()=>{if(original)process.env.GEMINI_API_KEY=original;else delete process.env.GEMINI_API_KEY;});
 test('Transcript stays verbatim; style is metadata and never inserted into narration',()=>{
  const request=geminiRequest('Bàu Sấu','vi-VN','Kore');
  expect(request.contents[0].parts[0].text).toBe('Bàu Sấu');
  expect(request.generationConfig.speechConfig.voiceConfig.voice).toBe('Kore');
 });
 test('Successful WAV is converted to persistent MP3 with Gemini provenance',async()=>{
  const wav=Buffer.alloc(48);wav.write('RIFF',0);wav.write('WAVE',8);
  const request=jest.fn(async()=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{inlineData:{mimeType:'audio/wav',data:wav.toString('base64')}}]}}]})));
  const convert=jest.fn(async()=>Buffer.from('mp3-fixture'));
  const out=await new GeminiTtsProvider(request as any,convert).synthesize({text:'Bàu Sấu',locale:'vi-VN',gender:'FEMALE'});
  expect(out.mime).toBe('audio/mpeg');expect(out.voiceName).toContain('/Kore');expect(convert).toHaveBeenCalledWith(wav);
  const [url,options]=request.mock.calls[0] as any;
  expect(url).not.toContain('test-not-a-real-key');expect(options.headers['x-goog-api-key']).toBe('test-not-a-real-key');
 });
 test('Quota failure does not silently substitute a robot voice',async()=>{
  const convert=jest.fn();const p=new GeminiTtsProvider((async()=>new Response('{}',{status:429})) as any,convert);
  await expect(p.synthesize({text:'Hello',locale:'en-US',gender:'FEMALE'})).rejects.toBeInstanceOf(TtsQuotaError);expect(convert).not.toHaveBeenCalled();
 });
 test('Rejects truncated/non-WAV provider output before conversion',async()=>{
  const request=async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{inlineData:{mimeType:'audio/wav',data:Buffer.from('bad').toString('base64')}}]}}]}));
  await expect(new GeminiTtsProvider(request as any).synthesize({text:'Hello',locale:'en-US',gender:'FEMALE'})).rejects.toThrow('WAV');
 });
});
