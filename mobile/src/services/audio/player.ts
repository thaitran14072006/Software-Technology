import TrackPlayer,{Capability} from 'react-native-track-player';
let ready:Promise<void>|null=null;
/** Call while foreground before background location is enabled (Android restriction). */
export function ensurePlayer(){
 if(!ready)ready=(async()=>{
  try{await TrackPlayer.setupPlayer();}catch(e:any){if(e?.code!=='player_already_initialized')throw e;}
  await TrackPlayer.updateOptions({capabilities:[Capability.Play,Capability.Pause,Capability.Stop]});
 })().catch(e=>{ready=null;throw e;});return ready;
}
